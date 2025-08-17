const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const sqlite3 = require('sqlite3').verbose();
const escpos = require("escpos");
const fs = require('fs');
const { backupLCdb } = require("./backup");
escpos.USB = require("escpos-usb");
const RECEIPT_FORMAT_PATH = path.join(app.getPath('userData'), 'receiptFormat.json');
const { fork, spawn } = require('child_process');
let mainWindow;
let splash;
let userRole = null;
let store; // Will be initialized after dynamic import
let onlineProcess;
const axios = require('axios');
const basePath = app.isPackaged ? process.resourcesPath : __dirname;
const dotenv = require('dotenv');
// Determine env file path based on dev vs packaged
const envPath = app.isPackaged
  ? path.join(process.resourcesPath, ".env") // packaged location
  : path.join(__dirname, ".env");           // dev location

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`✅ Loaded env from: ${envPath}`);
} else {
  console.warn(`⚠️ .env file not found at: ${envPath}`);
}
// Connect to the SQLite database
const db = new sqlite3.Database("LC.db", (err) => {
    if (err) {
      console.error("❌ Failed to connect to the database:", err.message);
    } else {
      console.log("✅ Connected to the SQLite database.");
      initializeSchema();
    }
  });


async function initStore() {
    let Store;
    try {
    Store = require('electron-store'); // CommonJS
    } catch (err) {
    console.error("Failed to require electron-store:", err);
    }
    store = new Store({
        defaults: {
            printerConfig: {
                vendorId: '0x0525',
                productId: '0xA700'
            },
            lastOpenedDate: null
        }
    });
    return store;
}

async function checkAndResetFoodItems() {
    await initStore(); // Ensure store is initialized
    const lastOpenedDate = store.get("lastOpenedDate");
    const currentDate = new Date().toISOString().split("T")[0];

    if (lastOpenedDate !== currentDate) {
        console.log("New day detected, resetting is_on column...");
        db.run("UPDATE FoodItem SET is_on = 1", (err) => {
            if (err) {
                console.error("Failed to reset is_on:", err.message);
            } else {
                console.log("Successfully reset is_on for new day.");
                store.set("lastOpenedDate", currentDate);
            }
        });
    }
}

function saveOrderToDatabase(order) {
    const {
        orderId,
        name,
        phone,
        datetime,
        paymentId,
        paymentMethod,
        totalPrice,
        source,
        cartItems
    } = order;

    db.serialize(() => {
        db.run(
            `INSERT INTO OnlineOrders (
                orderId, customerName, phone, datetime, paymentId, 
                paymentMethod, totalPrice, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                orderId,
                name,
                phone,
                datetime,
                paymentId,
                paymentMethod,
                totalPrice,
                source
            ],
            function (err) {
                if (err) {
                    return console.error("Failed to insert order:", err.message);
                }

                console.log(`Inserted order ${orderId} successfully`);

                const insertItemStmt = db.prepare(
                    `INSERT INTO OnlineOrderItems (
                        orderId, fid, quantity, price
                    ) VALUES (?, ?, ?, ?)`
                );

                cartItems.forEach(item => {
                    insertItemStmt.run(
                        orderId,
                        item.fid,
                        item.quantity,
                        item.price
                    );
                });

                insertItemStmt.finalize((err) => {
                    if (err) {
                        console.error("Failed to insert order items:", err.message);
                    } else {
                        console.log(`Inserted ${cartItems.length} items for order ${orderId}`);
                    }
                });
            }
        );
    });
}
// Spawn getOnline.js as a background process
function startGetOnlineServer() {
  const scriptPath = path.join(basePath, "getOnline.js");

  onlineProcess = fork(scriptPath, {
    env: { ...process.env, APP_ENV_PATH: envPath },
  });

  // Listen for messages from getOnline.js
  onlineProcess.on('message', (message) => {
    if (message.type === 'newOrder') {
      console.log('New order received in main process:', message.data);

      // Save to DB here or forward to renderer with BrowserWindow.webContents.send()
      saveOrderToDatabase(message.data); // ← Replace with your DB logic
    }
  });

  onlineProcess.on('error', (err) => {
    console.error('Error from getOnline.js:', err);
  });

  onlineProcess.on('exit', (code, signal) => {
    console.log(`getOnline.js exited with code ${code}, signal ${signal}`);
  });
}
let expressProcess = null;

function startExpressServer() {
  const scriptPath = path.join(basePath, "startMongoExpress.js");

  const child = spawn('node', [scriptPath], {
    detached: true,
    stdio: 'ignore', // fully detached, no stdio inherited
    env: { ...process.env, APP_ENV_PATH: envPath },
    shell: false, // Use shell to allow environment variables
  });

  child.unref(); // So Electron can quit independently if needed

  expressProcess = child; // Store reference for kill()

  console.log(`✅ Started detached Express server (PID: ${child.pid})`);

  return child;
}

// 1. Read all items from SQLite:
function fetchAllFoodItems() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database('LC.db');
    db.all(`SELECT fid, fname, category, cost, sgst, cgst, tax, active, is_on, veg, depend_inv FROM FoodItem`, [], (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// 2. POST them to your Express route:
async function syncFoodItemsToMongo() {
  try {
    const items = await fetchAllFoodItems();
    const resp = await axios.post(`http://localhost:${process.env.MONGO_PORT}/sync/fooditems`, items);
    console.log(resp.data.message);
  } catch (err) {
    console.error('Sync failed:', err);
  }
}
async function syncUsersFromMongo() {
  try {
    // 1. Fetch users from Mongo via the /users endpoint
    const resp = await axios.get(`http://localhost:${process.env.MONGO_PORT}/users`);
    
    if (!resp.data.success || !Array.isArray(resp.data.users)) {
      throw new Error('Invalid data from Mongo /users endpoint');
    }
    
    const users = resp.data.users;

    // 2. Clear the SQLite User table
    await new Promise((resolve, reject) => {
      db.run(`DELETE FROM User`, function (err) {
        if (err) return reject(err);
        resolve();
      });
    });

    // 3. Insert each user into SQLite User table
    const insertStmt = db.prepare(`
      INSERT INTO User (userid, uname, isadmin, username, email)
      VALUES (?, ?, ?, ?, ?)
    `);

    await new Promise((resolve, reject) => {
      db.serialize(() => {
        for (const u of users) {
          insertStmt.run(u.userid, u.uname, u.isadmin, u.username, u.email, err => {
            if (err) return reject(err);
          });
        }
        insertStmt.finalize(err => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    console.log(`Synced ${users.length} users from Mongo to SQLite.`);
  } catch (err) {
    console.error('Error syncing users from Mongo:', err.message);
  }
}

async function waitForServerReady(retries = 20, delay = 500) {
  const url = `http://localhost:${process.env.MONGO_PORT}/ping`;

  for (let i = 0; i < retries; i++) {
    console.log(`⏳ Waiting for Express server... (${i + 1}/${retries})`);
    try {
      const res = await axios.get(url);
      if (res.status === 200) {
        console.log('✅ Express server is ready');
        return;
      }
    } catch (err) {
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('❌ Express server did not become ready in time.');
}

// === Create splash window ===
function createSplash() {
  splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    show: true,
  });

  splash.loadFile(path.join(__dirname, "splash.html"));
}

// === Create main window ===
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "assets/images", "lassicorner.ico"),
    show: false,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadFile("login.html").catch(console.error);

  mainWindow.once("ready-to-show", () => {
      // Tell splash to fade out
    if (splash && !splash.isDestroyed()) {
        splash.webContents.executeJavaScript("window.fadeOutSplash()");
        setTimeout(() => {
        if (!splash.isDestroyed()) splash.close();
        }, 700); // Allow time for fade before closing
    }

    mainWindow.show();
  });
}

// === Do startup tasks (Express, DB, etc.) ===
async function runStartupTasks() {
  await startExpressServer();
  await waitForServerReady();
  await initStore();
}

// === Setup IPC handlers ===
function setupIPC() {
  ipcMain.handle("login", async (event, { username, password }) => {
    try {
      const response = await axios.post(`http://localhost:${MONGO_PORT}/login`, {
        username,
        password,
      });

      if (response.data.success) {
        const user = response.data.user;
        console.log("Login successful:", user);
        await startGetOnlineServer();
        await checkAndResetFoodItems();
        await syncFoodItemsToMongo();
        await syncUsersFromMongo();
        store.set("sessionUser", user);
        return user;
      } else {
        return null;
      }
    } catch (err) {
      console.error("Login API error:", err.message);
      return null;
    }
  });

  ipcMain.handle("get-session-user", () => {
    return store.get("sessionUser") || null;
  });

  ipcMain.handle("logout", () => {
    store.delete("sessionUser");
    return true;
  });

  ipcMain.handle("get-user-role", () => userRole);

  ipcMain.handle("get-printer-config", () => {
    const config = store.get("printerConfig", {
      vendorId: "0x0525",
      productId: "0xA700",
    });

    return {
      vendorId: config.vendorId,
      productId: config.productId,
      vendorIdDec: parseInt(config.vendorId, 16),
      productIdDec: parseInt(config.productId, 16),
    };
  });

  ipcMain.handle("save-printer-config", (event, config) => {
    try {
      if (!config || !config.vendorId || !config.productId) {
        throw new Error("Both Vendor ID and Product ID are required");
      }

      const hexRegex = /^0x[0-9a-fA-F]{4}$/;
      if (!hexRegex.test(config.vendorId) || !hexRegex.test(config.productId)) {
        throw new Error("Invalid hexadecimal format");
      }

      const vendorId = parseInt(config.vendorId, 16);
      const productId = parseInt(config.productId, 16);
      if (isNaN(vendorId) || isNaN(productId)) {
        throw new Error("Invalid hexadecimal values");
      }

      store.set("printerConfig", config);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

// === App lifecycle ===
app.whenReady().then(async () => {
  createSplash();

  try {
    await runStartupTasks();
    createMainWindow();
    setupIPC();
  } catch (err) {
    console.error("Startup error:", err);
    if (splash) splash.close();
  }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        closeDatabase();
        app.quit();
    }
});

function closeDatabase() {
    if (db) {
        db.close((err) => {
            if (err) console.error("Error closing database", err);
            else console.log("Database connection closed");
        });
    }
}

app.on('will-quit', () => {
  console.log("App is quitting. Cleaning up...");

  if (onlineProcess) {
    onlineProcess.kill('SIGTERM');
  }

  if (expressProcess && expressProcess.pid) {
    try {
      process.kill(expressProcess.pid, 'SIGTERM');
      console.log(`🛑 Killed Express server (PID: ${expressProcess.pid})`);
    } catch (err) {
      console.error(`❌ Failed to kill Express server:`, err);
    }
  }
});


//----------------------------------------------ANALYTICS STARTS HERE--------------------------------------------------------------
// Fetch Today's Items for Item Summary
// Item Summary
ipcMain.on("get-item-summary", (event, { startDate, endDate }) => {
    const query = `
        SELECT 
            FoodItem.fname AS item, 
            SUM(OrderDetails.quantity) AS quantity, 
            SUM(OrderDetails.quantity * FoodItem.cost) AS revenue,
            FoodItem.category,
            Category.catname AS categoryName
        FROM Orders
        JOIN OrderDetails ON Orders.billno = OrderDetails.orderid
        JOIN FoodItem ON OrderDetails.foodid = FoodItem.fid
        JOIN Category ON FoodItem.category = Category.catid
        WHERE date(Orders.date) BETWEEN date(?) AND date(?)
        GROUP BY FoodItem.fid
        ORDER BY Category.catname, FoodItem.fname
    `;

    db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
            console.error("Error fetching item summary:", err);
            event.reply("item-summary-response", { success: false, items: [] });
            return;
        }
        event.reply("item-summary-response", { success: true, items: rows });
    });
});
ipcMain.on("get-todays-items", (event) => {
    const query = `
        SELECT 
            Category.catname AS category,
            FoodItem.fname AS item,
            SUM(OrderDetails.quantity) AS quantity,
            SUM(OrderDetails.quantity * FoodItem.cost) AS revenue
        FROM Orders
        JOIN OrderDetails ON Orders.billno = OrderDetails.orderid
        JOIN FoodItem ON OrderDetails.foodid = FoodItem.fid
        JOIN Category ON FoodItem.category = Category.catid
        WHERE Orders.date = date('now', 'localtime')
        GROUP BY Category.catname, FoodItem.fname
        ORDER BY Category.catname ASC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching today's items:", err);
            event.reply("todays-items-response", { success: false, items: [] });
            return;
        }
        event.reply("todays-items-response", { success: true, items: rows });
    });
});

// IPC handler to get today's revenue
ipcMain.handle('get-todays-revenue', (event) => {
    return new Promise((resolve, reject) => {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const query = `SELECT SUM(price) AS totalRevenue FROM Orders WHERE date LIKE ?`;
        
        db.get(query, [`${today}%`], (err, row) => {
            if (err) {
                console.error("Error fetching today's revenue:", err);
                reject(err);
            } else {
                resolve(row.totalRevenue || 0); // Return total revenue or 0 if null
            }
        });
    });
});

// IPC handler to get today's sales count
ipcMain.handle('get-todays-sales', (event) => {
    return new Promise((resolve, reject) => {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const query = `SELECT COUNT(*) AS totalSales FROM Orders WHERE date LIKE ?`;
        
        db.get(query, [`${today}%`], (err, row) => {
            if (err) {
                console.error("Error fetching today's sales count:", err);
                reject(err);
            } else {
                resolve(row.totalSales || 0); // Return total sales count or 0 if null
            }
        });
    });
});

// IPC handler to get today's tax amount
ipcMain.handle('get-todays-tax', (event) => {
    return new Promise((resolve, reject) => {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const query = `SELECT SUM(tax) AS totalTax FROM Orders WHERE date LIKE ?`;
        
        db.get(query, [`${today}%`], (err, row) => {
            if (err) {
                console.error("Error fetching today's tax amount:", err);
                reject(err);
            } else {
                resolve(row.totalTax || 0); // Return total tax amount or 0 if null
            }
        });
    });
});

// IPC handler to get today's discounted orders count
ipcMain.handle('get-todays-discounted-orders', (event) => {
    return new Promise((resolve, reject) => {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const query = `SELECT COUNT(*) AS discountedCount FROM DiscountedOrders WHERE billno IN (SELECT billno FROM Orders WHERE date LIKE ?)`;
        
        db.get(query, [`${today}%`], (err, row) => {
            if (err) {
                console.error("Error fetching today's discounted orders count:", err);
                reject(err);
            } else {
                resolve(row.discountedCount || 0); // Return discounted orders count or 0 if null
            }
        });
    });
});

// IPC handler to get today's deleted orders count
ipcMain.handle('get-todays-deleted-orders', (event) => {
    return new Promise((resolve, reject) => {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const query = `SELECT COUNT(*) AS deletedCount FROM DeletedOrders WHERE date LIKE ?`;
        
        db.get(query, [`${today}%`], (err, row) => {
            if (err) {
                console.error("Error fetching today's deleted orders count:", err);
                reject(err);
            } else {
                resolve(row.deletedCount || 0); // Return deleted orders count or 0 if null
            }
        });
    });
});

// IPC handler to get yesterday's revenue
ipcMain.handle('get-yesterdays-revenue', (event) => {
    return new Promise((resolve, reject) => {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0]; // Get yesterday's date in YYYY-MM-DD format
        const query = `SELECT SUM(price) AS totalRevenue FROM Orders WHERE date LIKE ?`;
        
        db.get(query, [`${yesterdayDate}%`], (err, row) => {
            if (err) {
                console.error("Error fetching yesterday's revenue:", err);
                reject(err);
            } else {
                resolve(row.totalRevenue || 0); // Return total revenue or 0 if null
            }
        });
    });
});

// IPC handler to get today's most sold items
ipcMain.handle('get-most-sold-items', (event) => {
    return new Promise((resolve, reject) => {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const query = `
            SELECT f.fname, SUM(od.quantity) AS totalQuantity
            FROM OrderDetails od
            JOIN Orders o ON od.orderid = o.billno
            JOIN FoodItem f ON od.foodid = f.fid
            WHERE o.date LIKE ?
            GROUP BY f.fid
            ORDER BY totalQuantity DESC
            LIMIT 2
        `;
        
        db.all(query, [`${today}%`], (err, rows) => {
            if (err) {
                console.error("Error fetching today's most sold items:", err);
                reject(err);
            } else {
                const items = rows.map(row => row.fname); // Extract food names
                resolve(items); // Return the list of most sold items
            }
        });
    });
});

// IPC handler to get today's most sold categories
ipcMain.handle('get-most-sold-categories', (event) => {
    return new Promise((resolve, reject) => {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const query = `
            SELECT c.catname, SUM(od.quantity) AS totalQuantity
            FROM OrderDetails od
            JOIN Orders o ON od.orderid = o.billno
            JOIN FoodItem f ON od.foodid = f.fid
            JOIN Category c ON f.category = c.catid
            WHERE o.date LIKE ?
            GROUP BY c.catid
            ORDER BY totalQuantity DESC
            LIMIT 2
        `;
        
        db.all(query, [`${today}%`], (err, rows) => {
            if (err) {
                console.error("Error fetching today's most sold categories:", err);
                reject(err);
            } else {
                const categories = rows.map(row => row.catname); // Extract category names
                resolve(categories); // Return the list of most sold categories
            }
        });
    });
});

// IPC handler to get today's highest revenue items
ipcMain.handle('get-highest-revenue-items', (event) => {
    return new Promise((resolve, reject) => {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const query = `
            SELECT f.fname, SUM(od.quantity * f.cost) AS totalRevenue
            FROM OrderDetails od
            JOIN Orders o ON od.orderid = o.billno
            JOIN FoodItem f ON od.foodid = f.fid
            WHERE o.date LIKE ?
            GROUP BY f.fid
            ORDER BY totalRevenue DESC
            LIMIT 2
        `;
        
        db.all(query, [`${today}%`], (err, rows) => {
            if (err) {
                console.error("Error fetching today's highest revenue items:", err);
                reject(err);
            } else {
                const items = rows.map(row => row.fname); // Extract food names
                resolve(items); // Return the list of highest revenue items
            }
        });
    });
});

// IPC handler to get today's highest revenue category
ipcMain.handle('get-highest-revenue-category', (event) => {
    return new Promise((resolve, reject) => {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const query = `
            SELECT c.catname, SUM(od.quantity * f.cost) AS totalRevenue
            FROM OrderDetails od
            JOIN Orders o ON od.orderid = o.billno
            JOIN FoodItem f ON od.foodid = f.fid
            JOIN Category c ON f.category = c.catid
            WHERE o.date LIKE ?
            GROUP BY c.catid
            ORDER BY totalRevenue DESC
        `;
        
        db.all(query, [`${today}%`], (err, rows) => {
            if (err) {
                console.error("Error fetching today's highest revenue category:", err);
                reject(err);
            } else {
                const highestRevenue = rows.length > 0 ? rows[0].totalRevenue : 0; // Get the highest revenue
                const categories = rows.filter(row => row.totalRevenue === highestRevenue).map(row => row.catname); // Get all categories with the highest revenue
                resolve(categories); // Return the list of highest revenue categories
            }
        });
    });
});

// Fetch categories for Category Wise Sales
ipcMain.on("get-category-wise-sales-categories", (event) => {
    const query = `SELECT catid, catname FROM Category WHERE active = 1`;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching categories for Category Wise Sales:", err);
            event.reply("category-wise-sales-categories-response", { success: false, categories: [] });
            return;
        }
        event.reply("category-wise-sales-categories-response", { success: true, categories: rows });
    });
});

// Function to fetch category-wise sales and revenue
ipcMain.handle('get-category-wise-sales-data', (event, startDate, endDate) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                Category.catid,
                Category.catname,
                SUM(OrderDetails.quantity) AS totalSales,
                SUM(OrderDetails.quantity * FoodItem.cost) AS totalRevenue
            FROM 
                Orders
            INNER JOIN 
                OrderDetails ON Orders.billno = OrderDetails.orderid
            INNER JOIN 
                FoodItem ON OrderDetails.foodid = FoodItem.fid
            INNER JOIN 
                Category ON FoodItem.category = Category.catid
            WHERE 
                Orders.date BETWEEN ? AND ?
            GROUP BY 
                Category.catid
        `;

        db.all(query, [startDate, endDate], (err, rows) => {
            if (err) {
                console.error("Error fetching category-wise sales data:", err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

// Function to fetch sales overview data
ipcMain.handle('get-sales-overview-data', (event, startDate, endDate) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                date,
                COUNT(billno) AS totalSales,
                SUM(price) AS totalRevenue
            FROM 
                Orders
            WHERE 
                date BETWEEN ? AND ?
            GROUP BY 
                date
            ORDER BY 
                date ASC
        `;

        db.all(query, [startDate, endDate], (err, rows) => {
            if (err) {
                console.error("Error fetching sales overview data:", err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

// Fetch top selling categories for a specific date range
ipcMain.on("get-top-selling-categories", async (event, { startDate, endDate }) => {
    const query = `
        SELECT 
            Orders.date,
            Category.catname AS category_name,
            SUM(OrderDetails.quantity) AS total_quantity
        FROM Orders
        JOIN OrderDetails ON Orders.billno = OrderDetails.orderid
        JOIN FoodItem ON OrderDetails.foodid = FoodItem.fid
        JOIN Category ON FoodItem.category = Category.catid
        WHERE date(Orders.date) BETWEEN date(?) AND date(?)
        GROUP BY Orders.date, Category.catid
        ORDER BY Orders.date, total_quantity DESC
    `;

    db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
            console.error("Error fetching top selling categories:", err);
            event.reply("top-selling-categories-response", { success: false, categories: [] });
            return;
        }

        // Process the results to get the top-selling category for each date
        const topSellingCategories = {};
        rows.forEach(row => {
            if (!topSellingCategories[row.date]) {
                topSellingCategories[row.date] = {
                    category_name: row.category_name,
                    total_quantity: row.total_quantity,
                };
            } else if (row.total_quantity > topSellingCategories[row.date].total_quantity) {
                topSellingCategories[row.date] = {
                    category_name: row.category_name,
                    total_quantity: row.total_quantity,
                };
            }
        });

        // Convert the object to an array for easier processing
        const categoriesArray = Object.keys(topSellingCategories).map(date => ({
            date,
            category_name: topSellingCategories[date].category_name,
            total_quantity: topSellingCategories[date].total_quantity,
        }));

        // Send the top selling categories to the renderer process
        event.reply("top-selling-categories-response", { success: true, categories: categoriesArray });
    });
});

ipcMain.on('get-employee-analysis', (event, { startDate, endDate }) => {

    const query = `
        SELECT 
            u.userid,
            u.uname as name,
            COUNT(DISTINCT o.billno) as order_count,
            COALESCE(SUM(od.quantity), 0) as total_units,
            COALESCE(SUM(od.quantity * fi.cost), 0) as total_revenue
        FROM 
            User u
        LEFT JOIN Orders o ON u.userid = o.cashier 
            AND date(o.date) BETWEEN date(?) AND date(?)
        LEFT JOIN OrderDetails od ON o.billno = od.orderid
        LEFT JOIN FoodItem fi ON od.foodid = fi.fid
        GROUP BY u.userid
        ORDER BY total_revenue DESC
    `;

    db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
            console.error('Query error:', err);
            event.reply('employee-analysis-response', {
                success: false,
                error: err.message
            });
        } else {
            event.reply('employee-analysis-response', {
                success: true,
                employees: rows || []
            });
        }
    });
});

ipcMain.on('get-food-pairings', (event) => {
    const query = `
        SELECT 
            a.fname as item1, 
            b.fname as item2,
            COUNT(*) as times_ordered_together
        FROM OrderDetails od1
        JOIN OrderDetails od2 ON od1.orderid = od2.orderid AND od1.foodid < od2.foodid
        JOIN FoodItem a ON od1.foodid = a.fid
        JOIN FoodItem b ON od2.foodid = b.fid
        GROUP BY od1.foodid, od2.foodid
        ORDER BY times_ordered_together DESC
        LIMIT 50
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching food pairings:', err);
            event.reply('food-pairings-response', { 
                success: false, 
                error: err.message 
            });
        } else {
            event.reply('food-pairings-response', {
                success: true,
                pairings: rows
            });
        }
    });
});

ipcMain.on('get-menu-profitability', (event, { startDate, endDate }) => {
    const query = `
        WITH OrderTotals AS (
            SELECT 
                o.billno,
                SUM(od.quantity) as total_quantity,
                o.price as order_total
            FROM Orders o
            JOIN OrderDetails od ON o.billno = od.orderid
            WHERE o.date BETWEEN ? AND ?
            GROUP BY o.billno
        )
        SELECT 
            f.fname,
            c.catname,
            SUM(od.quantity) as total_units_sold,
            SUM(od.quantity * f.cost) as total_cost,
            SUM(od.quantity * (ot.order_total / ot.total_quantity)) as total_revenue,
            SUM(od.quantity * ((ot.order_total / ot.total_quantity) - f.cost)) as total_profit,
            ROUND(
                SUM(od.quantity * ((ot.order_total / ot.total_quantity) - f.cost)) * 100.0 / 
                SUM(od.quantity * (ot.order_total / ot.total_quantity)), 
                2
            ) as profit_margin
        FROM Orders o
        JOIN OrderDetails od ON o.billno = od.orderid
        JOIN FoodItem f ON od.foodid = f.fid
        JOIN Category c ON f.category = c.catid
        JOIN OrderTotals ot ON o.billno = ot.billno
        WHERE o.date BETWEEN ? AND ?
        GROUP BY od.foodid
        ORDER BY total_profit DESC
    `;

    db.all(query, [startDate, endDate, startDate, endDate], (err, rows) => {
        if (err) {
            console.error('Error fetching menu profitability data:', err);
            event.reply('menu-profitability-response', { 
                success: false, 
                error: err.message 
            });
        } else {
            event.reply('menu-profitability-response', {
                success: true,
                items: rows
            });
        }
    });
});

ipcMain.on('get-seven-day-sales', (event) => {
    // Calculate date range (past 7 days including today)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // 7 days total
    
    // Format dates as YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split('T')[0];
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    
    // First get all dates in the range to ensure we have entries for all days
    const dateQuery = `
        WITH RECURSIVE dates(date) AS (
            VALUES(?)
            UNION ALL
            SELECT date(date, '+1 day')
            FROM dates
            WHERE date < ?
        )
        SELECT date FROM dates;
    `;
    
    db.all(dateQuery, [startDateStr, endDateStr], (err, dateRows) => {
        if (err) {
            console.error('Error getting date range:', err);
            event.reply('seven-day-sales-response', { 
                success: false, 
                error: err.message 
            });
            return;
        }
        
        // Now get sales counts and revenue for each date
        const salesQuery = `
            SELECT 
                date,
                COUNT(billno) as salesCount,
                COALESCE(SUM(price), 0) as totalRevenue
            FROM Orders
            WHERE date BETWEEN ? AND ?
            GROUP BY date
            ORDER BY date;
        `;
        
        // Get units sold separately since it requires joining with OrderDetails
        const unitsQuery = `
            SELECT 
                o.date,
                COALESCE(SUM(od.quantity), 0) as unitsSold
            FROM Orders o
            LEFT JOIN OrderDetails od ON o.billno = od.orderid
            WHERE o.date BETWEEN ? AND ?
            GROUP BY o.date
            ORDER BY o.date;
        `;
        
        // Execute both queries in parallel
        Promise.all([
            new Promise((resolve, reject) => {
                db.all(salesQuery, [startDateStr, endDateStr], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            }),
            new Promise((resolve, reject) => {
                db.all(unitsQuery, [startDateStr, endDateStr], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            })
        ]).then(([salesRows, unitsRows]) => {
            // Create maps for each metric
            const salesMap = {};
            const revenueMap = {};
            const unitsMap = {};
            
            // Process sales and revenue data
            salesRows.forEach(row => {
                salesMap[row.date] = row.salesCount;
                revenueMap[row.date] = row.totalRevenue;
            });
            
            // Process units sold data
            unitsRows.forEach(row => {
                unitsMap[row.date] = row.unitsSold;
            });
            
            // Prepare response with all dates in order
            const response = {
                success: true,
                dates: dateRows.map(row => row.date),
                salesCounts: dateRows.map(row => salesMap[row.date] || 0),
                totalRevenues: dateRows.map(row => revenueMap[row.date] || 0),
                unitsSold: dateRows.map(row => unitsMap[row.date] || 0)
            };
            
            event.reply('seven-day-sales-response', response);
        }).catch(err => {
            console.error('Error getting sales data:', err);
            event.reply('seven-day-sales-response', { 
                success: false, 
                error: err.message 
            });
        });
    });
});

// In your main.js file, add this to the IPC handlers section:
// In your main.js file, add/update this IPC handler:
ipcMain.on('get-best-in-category', (event, { startDate, endDate }) => {
    const query = `
        WITH RankedItems AS (
            SELECT 
                c.catid,
                c.catname,
                f.fname,
                SUM(od.quantity) AS total_quantity,
                RANK() OVER (PARTITION BY c.catid ORDER BY SUM(od.quantity) DESC) AS rank
            FROM Orders o
            JOIN OrderDetails od ON o.billno = od.orderid
            JOIN FoodItem f ON od.foodid = f.fid
            JOIN Category c ON f.category = c.catid
            WHERE o.date BETWEEN ? AND ?
            GROUP BY c.catid, f.fid
        )
        SELECT 
            catid,
            catname,
            GROUP_CONCAT(fname, ', ') AS top_items
        FROM RankedItems
        WHERE rank = 1
        GROUP BY catid
        ORDER BY catname;
    `;

    db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
            console.error('Error fetching best in category data:', err);
            event.reply('best-in-category-response', { 
                success: false, 
                error: err.message 
            });
        } else {
            const processedRows = rows.map(row => ({
                ...row,
                top_items: row.top_items ? row.top_items.split(', ') : []
            }));
            
            event.reply('best-in-category-response', {
                success: true,
                categories: processedRows
            });
        }
    });
});

ipcMain.on('get-tax-on-items', (event, { startDate, endDate }) => {
    const query = `
        SELECT 
            f.fname,
            SUM(od.quantity) as total_quantity,
            SUM(od.quantity) * f.sgst as total_sgst,
            SUM(od.quantity) * f.cgst as total_cgst,
            SUM(od.quantity) * f.tax as total_tax
        FROM Orders o
        JOIN OrderDetails od ON o.billno = od.orderid
        JOIN FoodItem f ON od.foodid = f.fid
        WHERE o.date BETWEEN ? AND ?
        GROUP BY f.fid
        ORDER BY f.fname;
    `;

    db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
            console.error('Error fetching tax data:', err);
            event.reply('tax-on-items-response', { 
                success: false, 
                error: err.message 
            });
        } else {
            event.reply('tax-on-items-response', {
                success: true,
                items: rows
            });
        }
    });
});
//----------------------------------------------ANALYTICS ENDS HERE--------------------------------------------------------------

//------------------------------ CATEGORIES STARTS HERE --------------------------------
// Listen for request to get categories
ipcMain.on("get-categories-list", (event) => {
    const query = "SELECT catid, catname, active FROM Category";
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching categories:", err.message);
            event.reply("categories-list-response", { success: false, categories: [] });
            return;
        }

        event.reply("categories-list-response", { success: true, categories: rows });
    });
});

ipcMain.on("delete-category", (event, categoryId) => {
    const query = "DELETE FROM Category WHERE catid = ?";
    
    db.run(query, [categoryId], function (err) {
        if (err) {
            console.error("Error deleting category:", err.message);
            return;
        }

        console.log(`Category ID ${categoryId} deleted successfully.`);
        event.reply("category-deleted"); // Notify renderer to refresh UI
    });
});

// Handle Adding Category
ipcMain.on("add-category", (event, categoryData) => {
    const { catname, active } = categoryData;

    // Insert category into the database
    const sql = "INSERT INTO Category (catname, active) VALUES (?, ?)";
    db.run(sql, [catname, active], function (err) {
        if (err) {
            console.error("Error adding category:", err.message);
            return;
        }

        // Notify the renderer process that the category has been added
        event.sender.send("category-added");

        // Optionally, refresh the categories list in the main window
        if (mainWindow) {
            mainWindow.webContents.send("category-updated");
        }
    });
});

// Handle Category Update
ipcMain.on("update-category", (event, updatedData) => {
    const query = "UPDATE Category SET catname = ?, active = ? WHERE catid = ?";

    db.run(query, [updatedData.catname, updatedData.active, updatedData.catid], function (err) {
        if (err) {
            console.error("Error updating category:", err.message);
            return;
        }

        console.log(`Category ID ${updatedData.catid} updated successfully.`);
        event.sender.send("category-updated"); // Notify edit window
    });
});

ipcMain.on("refresh-categories", (event) => {
    if (mainWindow) {
        mainWindow.webContents.send("category-updated");
    }
    
});
//----------------------------------------------------BILLING----------------------------------------------------------
let isPrinting = false;
ipcMain.on("print-bill", (event, { billItems, totalAmount, kot, orderId }) => {
    if (isPrinting) {
        event.sender.send('print-error', 'Printer is busy');
        return;
    }
    isPrinting = true;

    try {
        const config = store.get('printerConfig', {
            vendorId: '0x0525',
            productId: '0xA700'
        });

        const vendorId = parseInt(config.vendorId, 16);
        const productId = parseInt(config.productId, 16);

        if (isNaN(vendorId) || isNaN(productId)) {
            throw new Error('Invalid printer configuration - please check Vendor/Product IDs');
        }

        const device = new escpos.USB(vendorId, productId);
        const printer = new escpos.Printer(device, { encoding: 'UTF-8' });

        device.open((err) => {
            if (err) {
                event.sender.send('print-error', `Printer connection failed: ${err.message}`);
                return;
            }

            const commands = generateHardcodedReceipt(billItems, totalAmount, kot, orderId);
            
            printer
                .raw(Buffer.from(commands, 'utf8'))
                .close((err) => {
                    if (err) {
                        event.sender.send('print-error', `Print failed: ${err.message}`);
                    } else {
                        // Return kot and orderId for saving
                        event.sender.send('print-success-with-data', { kot, orderId });
                    }
                });
        });
    } catch (error) {
        event.sender.send('print-error', `System error: ${error.message}`);
    } finally {
        isPrinting = false;
    }
});

ipcMain.on('update-receipt-template', (event, updates) => {
    try {
        store.set('receiptTemplate', {
            ...updates,
            lastUpdated: new Date().toISOString()
        });
        event.reply('receipt-template-updated', { success: true });
    } catch (error) {
        event.reply('receipt-template-updated', { 
            success: false,
            error: error.message 
        });
    }
});

function generateHardcodedReceipt(items, totalAmount, kot, orderId) {
    const template = store.get('receiptTemplate', {
        title: 'THE LASSI CORNER',
        subtitle: 'SJEC, VAMANJOOR',
        footer: 'Thank you for visiting!',
        itemHeader: 'ITEM',
        qtyHeader: 'QTY',
        priceHeader: 'PRICE',
        totalText: 'TOTAL: Rs.',
        kotItemHeader: 'ITEM',
        kotQtyHeader: 'QTY'
    });

    // Adjusted for 80mm paper (~42-48 chars per line)
    const itemWidth = 35;  // More space for food names
    const qtyWidth = 5;    // Right-aligned
    const priceWidth = 5;  // Right-aligned (for decimals)
    
    // Format items with better spacing
    const formattedItems = items.map(item => 
        `${item.name.substring(0, itemWidth).padEnd(itemWidth)}` +
        `${item.quantity.toString().padStart(qtyWidth)}` +
        `${item.price.toFixed(2).padStart(priceWidth)}`
    ).join('\n');
    
    const kotItems = items.map(item => 
        `${item.name.substring(0, itemWidth).padEnd(itemWidth)}` +
        `${item.quantity.toString().padStart(qtyWidth)}`
    ).join('\n');
    
    // Customer receipt (optimized for 80mm)
    const customerReceipt = `
\x1B\x40\x1B\x61\x01\x1D\x21\x11
${template.title}
\x1D\x21\x00\x1B\x61\x01  // Center align subtitle
${template.subtitle}
\x1B\x61\x01\x1D\x21\x11\x1B\x45\x01
TOKEN: ${kot}
\x1D\x21\x00\x1B\x45\x00\x1B\x61\x00
Date: ${new Date().toLocaleString()}
Bill #: ${orderId}
${'-'.repeat(32)}  // Standard width for 80mm paper
\x1B\x45\x01
ITEM                              QTY     PRICE 
\x1B\x45\x00
${formattedItems}
${'-'.repeat(32)}
\x1B\x45\x01
TOTAL: Rs. ${totalAmount.toFixed(2).padStart(8)}
\x1B\x45\x00\x1B\x61\x01
${template.footer}
\x1D\x56\x41\x00`;  // Partial cut

// KOT receipt (larger KOT #)
const kotReceipt = `\x1B\x61\x01\x1D\x21\x11\x1B\x45\x01\x1B\x2D\x00${kot}
\x1B\x33\x03
\x1D\x21\x00\x1B\x45\x00\x1B\x2D\x00
Time: ${new Date().toLocaleTimeString()}
\x1B\x61\x00\x1B\x45\x01\x1B\x2D\x00
------------------------------------------
ITEM                                   QTY
------------------------------------------
\x1B\x45\x00\x1B\x2D\x00
${kotItems}
\x1D\x56\x41\x00`;  // Partial cut

return kotReceipt;
}

ipcMain.on('get-receipt-template', (event, defaults) => {
    const template = store.get('receiptTemplate', defaults);
    event.returnValue = template;
});

ipcMain.on('get-order-for-printing', (event, billno) => {
    // First get the order header
    const orderQuery = `
        SELECT * FROM Orders WHERE billno = ?;
    `;
    
    // Updated query to calculate item price based on order total and quantities
    const itemsQuery = `
        SELECT 
            f.fname,
            od.quantity,
            (o.price / (SELECT SUM(quantity) FROM OrderDetails WHERE orderid = o.billno)) as item_price
        FROM OrderDetails od
        JOIN FoodItem f ON od.foodid = f.fid
        JOIN Orders o ON od.orderid = o.billno
        WHERE od.orderid = ?;
    `;
    
    db.get(orderQuery, [billno], (err, order) => {
        if (err) {
            console.error('Error fetching order:', err);
            event.reply('order-for-printing-response', { error: err.message });
            return;
        }
        
        if (!order) {
            event.reply('order-for-printing-response', { error: 'Order not found' });
            return;
        }
        
        db.all(itemsQuery, [billno], (err, items) => {
            if (err) {
                console.error('Error fetching order items:', err);
                event.reply('order-for-printing-response', { error: err.message });
                return;
            }
            
            // Calculate total price for each item (quantity * item_price)
            const processedItems = items.map(item => ({
                ...item,
                price: item.quantity * item.item_price
            }));
            
            event.reply('order-for-printing-response', { 
                order, 
                items: processedItems 
            });
        });
    });
});

// Add this to your main.js IPC handlers
ipcMain.handle('test-printer', async (event, { printerName, testData }) => {
    if (isPrinting) {
        throw new Error('Printer is busy with another job');
    }
    isPrinting = true;

    try {
        // Get printer config
        const config = store.get('printerConfig', {
            vendorId: '0x0525',
            productId: '0xA700'
        });

        // Convert hex strings to numbers
        const vendorId = parseInt(config.vendorId, 16);
        const productId = parseInt(config.productId, 16);

        // Validate IDs
        if (isNaN(vendorId)) throw new Error('Invalid Vendor ID');
        if (isNaN(productId)) throw new Error('Invalid Product ID');

        const device = new escpos.USB(vendorId, productId);
        const printer = new escpos.Printer(device, { encoding: 'UTF-8' });

        // Generate test receipt
        const commands = generateTestReceipt(testData);

        return await new Promise((resolve, reject) => {
            device.open((error) => {
                if (error) {
                    reject(new Error(`Printer connection failed: ${error.message}`));
                    return;
                }

                printer
                    .raw(Buffer.from(commands, 'utf8'))
                    .cut()
                    .close((err) => {
                        if (err) {
                            reject(new Error(`Print failed: ${err.message}`));
                        } else {
                            resolve(true);
                        }
                    });
            });
        });
    } catch (error) {
        event.sender.send('print-error', `System error: ${error.message}`);
    } finally {
        isPrinting = false;
    }
});

// Add this function to main.js
function generateTestReceipt(testData) {
    const template = store.get('receiptTemplate', {
        title: 'THE LASSI CORNER',
        subtitle: 'SJEC, VAMANJOOR',
        footer: 'Thank you for visiting!',
        kotTitle: 'KITCHEN ORDER',
        itemHeader: 'ITEM',
        qtyHeader: 'QTY',
        priceHeader: 'PRICE',
        totalText: 'TOTAL: Rs.',
        kotItemHeader: 'ITEM',
        kotQtyHeader: 'QTY'
    });

    // Format test items
    const formattedItems = testData.items.map(item => 
        `${item.name.substring(0, 14).padEnd(14)}${item.quantity.toString().padStart(3)}${item.price.toFixed(2).padStart(8)}`
    ).join('\n');
    
    const kotItems = testData.items.map(item => 
        `${item.name.substring(0, 14).padEnd(14)}${item.quantity.toString().padStart(3)}`
    ).join('\n');
    
    // Test customer receipt
    const customerReceipt = `
\x1B\x40\x1B\x61\x01\x1D\x21\x11
TEST PRINT
\x1D\x21\x00
${template.title}
\x1B\x45\x01
Token No: ${testData.kot}
\x1B\x45\x00\x1B\x61\x00
Date: ${new Date().toLocaleString()}
BILL NUMBER: ${testData.orderId}
${'-'.repeat(32)}
\x1B\x45\x01
${template.itemHeader.padEnd(14)}${template.qtyHeader.padStart(3)}${template.priceHeader.padStart(8)}
\x1B\x45\x00
${formattedItems}
${'-'.repeat(32)}
\x1B\x45\x01
${template.totalText} ${testData.totalAmount.toFixed(2)}
\x1B\x45\x00\x1B\x61\x01
This is a test print
${template.footer}
\x1D\x56\x41\x10`;

    // Test KOT receipt
    const kotReceipt = `
\x1B\x61\x01\x1D\x21\x11
TEST KOT PRINT
\x1D\x21\x00
KOT #: ${testData.kot}
Time: ${new Date().toLocaleTimeString()}
${'-'.repeat(32)}
\x1B\x61\x00\x1B\x45\x01
${template.kotItemHeader.padEnd(14)}${template.kotQtyHeader.padStart(3)}
\x1B\x45\x00
${kotItems}
${'-'.repeat(32)}
\x1D\x56\x41\x10`;

    return customerReceipt + kotReceipt;
}


//------------------------------------------------Bill Printing Ends Here--------------------------------------------------
//-----------------HELD ORDERS-----------------
//DISPLAY HELD ORDERS
ipcMain.on('get-held-orders', (event) => {
    const heldOrdersQuery = `
        SELECT 
            HeldOrders.heldid, 
            User.uname AS cashier_name, 
            HeldOrders.price, 
            HeldOrders.sgst, 
            HeldOrders.cgst, 
            HeldOrders.tax, 
            GROUP_CONCAT(FoodItem.fname || ' (x' || HeldOrderDetails.quantity || ')', ', ') AS food_items
        FROM HeldOrders
        JOIN User ON HeldOrders.cashier = User.userid
        JOIN HeldOrderDetails ON HeldOrders.heldid = HeldOrderDetails.heldid
        JOIN FoodItem ON HeldOrderDetails.foodid = FoodItem.fid
        GROUP BY HeldOrders.heldid
        ORDER BY HeldOrders.heldid DESC
    `;

    db.all(heldOrdersQuery, [], (err, heldOrders) => {
        if (err) {
            console.error("Error fetching held orders:", err);
            event.reply('held-orders-data', []);
            return;
        }

        event.reply('held-orders-data', heldOrders);
    });
});
//regarding held orders:
// Fetch held order details
ipcMain.on('get-held-order-details', (event, heldId) => {
    const query = `
        SELECT 
            GROUP_CONCAT(
                FoodItem.fname || ' (x' || HeldOrderDetails.quantity || ')', ', '
            ) AS food_items,
            json_group_array(
                json_object(
                    'foodid', FoodItem.fid,
                    'fname', FoodItem.fname,
                    'price', FoodItem.cost,
                    'quantity', HeldOrderDetails.quantity,
                    'category', FoodItem.category
                )
            ) AS food_details
        FROM HeldOrderDetails
        JOIN FoodItem ON HeldOrderDetails.foodid = FoodItem.fid
        WHERE HeldOrderDetails.heldid = ?
    `;

    db.get(query, [heldId], (err, orderDetails) => {
        if (err) {
            console.error("Error fetching held order details:", err);
            event.reply('held-order-details-data', [], heldId);
            return;
        }

        // Parse JSON string from SQLite JSON functions
        let foodDetails = orderDetails.food_details ? JSON.parse(orderDetails.food_details) : [];

        event.reply('held-order-details-data', foodDetails, heldId); // Pass `heldId` back
    });
});


// Delete a held order
ipcMain.on('delete-held-order', (event, heldId) => {
    const deleteOrderDetailsQuery = `DELETE FROM HeldOrderDetails WHERE heldid = ?`;
    const deleteOrderQuery = `DELETE FROM HeldOrders WHERE heldid = ?`;

    db.run(deleteOrderDetailsQuery, [heldId], function (err) {
        if (err) {
            console.error("Error deleting held order details:", err);
            return;
        }

        db.run(deleteOrderQuery, [heldId], function (err) {
            if (err) {
                console.error("Error deleting held order:", err);
                return;
            }

            event.reply('held-order-deleted', heldId);
        });
    });
});



// save bill
ipcMain.on("save-bill", async (event, orderData) => {
    const { cashier, date, orderItems, totalAmount } = orderData;

    try {
        let totalSGST = 0, totalCGST = 0, totalTax = 0, calculatedTotalAmount = 0;

        // Fetch tax details and calculate actual total
        for (const { foodId, quantity } of orderItems) {
            const row = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT cost, sgst, cgst, tax FROM FoodItem WHERE fid = ?`,
                    [foodId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!row) {
                throw new Error(`Food item with ID ${foodId} not found.`);
            }

            let itemTotal = row.cost * quantity; // Get correct item total from DB
            calculatedTotalAmount += itemTotal; // Accumulate correct total

            totalSGST += (itemTotal * row.sgst) / 100;
            totalCGST += (itemTotal * row.cgst) / 100;
            totalTax += (itemTotal * row.tax) / 100;
        }

        // If totalAmount is 0, use calculatedTotalAmount instead
        const finalTotalAmount = totalAmount > 0 ? totalAmount : calculatedTotalAmount;

        // Get the latest KOT number for the current date
        const kotRow = await new Promise((resolve, reject) => {
            db.get(
                `SELECT kot FROM Orders WHERE date = ? ORDER BY kot DESC LIMIT 1`,
                [date],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        let kot = kotRow ? kotRow.kot + 1 : 1; // Increment KOT or reset if new day

        // Insert the new order with correct total
        const orderId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO Orders (kot, price, sgst, cgst, tax, cashier, date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [kot, finalTotalAmount.toFixed(2), totalSGST.toFixed(2), totalCGST.toFixed(2), totalTax.toFixed(2), cashier, date],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        // Insert items into OrderDetails
        const stmt = db.prepare(
            `INSERT INTO OrderDetails (orderid, foodid, quantity) VALUES (?, ?, ?)`
        );
        orderItems.forEach(({ foodId, quantity }) => stmt.run(orderId, foodId, quantity));
        stmt.finalize();

        // Check if a discount was applied and insert into DiscountedOrders
        if (calculatedTotalAmount > finalTotalAmount) {
            const discountAmount = (calculatedTotalAmount - finalTotalAmount).toFixed(2);
            const discountPercentage = ((discountAmount / calculatedTotalAmount) * 100).toFixed(2);

            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO DiscountedOrders (billno, Initial_price, discount_percentage, discount_amount) VALUES (?, ?, ?, ?)`,
                    [orderId, calculatedTotalAmount.toFixed(2), discountPercentage, discountAmount],
                    function (err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        console.log(`Order ${orderId} saved successfully with KOT ${kot}.`);

        // Send success response and KOT number to renderer
        event.sender.send("bill-saved", { kot,orderId });

    } catch (error) {
        console.error("Error processing order:", error.message);
        event.sender.send("bill-error", { error: error.message });
    }
});


ipcMain.on("hold-bill", async (event, orderData) => {
    const { cashier, date, orderItems } = orderData;

    try {
        let totalPrice = 0, totalSGST = 0, totalCGST = 0, totalTax = 0;

        // Fetch food item data and calculate totals
        for (const { foodId, quantity } of orderItems) {
            const row = await new Promise((resolve, reject) => {
                db.get(`SELECT cost, sgst, cgst, tax FROM FoodItem WHERE fid = ?`, [foodId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!row) {
                throw new Error(`Food item with ID ${foodId} not found.`);
            }

            let itemTotal = row.cost * quantity;
            totalPrice += itemTotal;
            totalSGST += (itemTotal * row.sgst) / 100;
            totalCGST += (itemTotal * row.cgst) / 100;
            totalTax += (itemTotal * row.tax) / 100;
        }

        // Insert the new order
        const orderId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO HeldOrders (price, sgst, cgst, tax, cashier) VALUES (?, ?, ?, ?, ?)`,
                [totalPrice.toFixed(2), totalSGST.toFixed(2), totalCGST.toFixed(2), totalTax.toFixed(2), cashier], // Keeping .toFixed(2)
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        // Insert items into HeldOrderDetails
        const stmt = db.prepare(`INSERT INTO HeldOrderDetails (heldid, foodid, quantity) VALUES (?, ?, ?)`);

        for (const { foodId, quantity } of orderItems) {
            await new Promise((resolve, reject) => {
                stmt.run(orderId, foodId, quantity, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        stmt.finalize();

        console.log(`Order Held Successfully`);

        // Send success response
        event.sender.send("bill-held");

    } catch (error) {
        console.error("Error processing order:", error.message);
        event.sender.send("bill-error", { error: error.message });
    }
});
// SAVE TO EXISTING ORDER
// Fetch Today's Orders
ipcMain.on("get-todays-orders-for-save-to-orders", (event) => {
    
    const query = `
        SELECT 
            Orders.*, 
            User.uname AS cashier_name, 
            GROUP_CONCAT(FoodItem.fname || ' (x' || OrderDetails.quantity || ')', ', ') AS food_items
        FROM Orders
        JOIN User ON Orders.cashier = User.userid
        JOIN OrderDetails ON Orders.billno = OrderDetails.orderid
        JOIN FoodItem ON OrderDetails.foodid = FoodItem.fid
        WHERE Orders.date = date('now', 'localtime')  -- Ensure correct format match
        GROUP BY Orders.billno
        ORDER BY Orders.billno DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching today's orders:", err);
            event.reply("todays-orders-response-for-save-to-orders", { success: false, orders: [] });
            return;
        }
        event.reply("todays-orders-response-for-save-to-orders", { success: true, orders: rows });
    });
});
// Add items to an existing order
ipcMain.on("add-to-existing-order", async (event, data) => {
    const { orderId, orderItems } = data;

    try {
        let totalPrice = 0, totalSGST = 0, totalCGST = 0, totalTax = 0;

        // Fetch food item data and calculate totals
        for (const { foodId, quantity } of orderItems) {
            const row = await new Promise((resolve, reject) => {
                db.get(`SELECT cost, sgst, cgst, tax FROM FoodItem WHERE fid = ?`, [foodId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            let itemTotal = row.cost * quantity;
            totalPrice += itemTotal;
            totalSGST += (itemTotal * row.sgst) / 100;
            totalCGST += (itemTotal * row.cgst) / 100;
            totalTax += (itemTotal * row.tax) / 100;

            // Insert into OrderDetails if it doesn't exist, otherwise update quantity
            db.run(
                `INSERT INTO OrderDetails (orderid, foodid, quantity) 
                 VALUES (?, ?, ?) 
                 ON CONFLICT(orderid, foodid) 
                 DO UPDATE SET quantity = quantity + ?`,
                [orderId, foodId, quantity, quantity]
            );
        }

        // Update the order totals
        db.run(
            `UPDATE Orders SET 
             price = price + ?, 
             sgst = sgst + ?, 
             cgst = cgst + ?, 
             tax = tax + ? 
             WHERE billno = ?`,
            [totalPrice.toFixed(2), totalSGST.toFixed(2), totalCGST.toFixed(2), totalTax.toFixed(2), orderId]
        );

        //console.log(`Order ${orderId} updated successfully with new items.`);
        event.sender.send("order-updated", { success: true, orderId });

    } catch (error) {
        console.error("Error updating order:", error.message);
        event.sender.send("order-update-error", { error: error.message });
    }
});

// Fetch top selling items for a specific date range
ipcMain.on("get-top-selling-items", async (event, { startDate, endDate }) => {
    const query = `
        SELECT 
            Orders.date, 
            FoodItem.fname AS most_sold_item,
            SUM(OrderDetails.quantity) AS total_quantity
        FROM Orders
        JOIN OrderDetails ON Orders.billno = OrderDetails.orderid
        JOIN FoodItem ON OrderDetails.foodid = FoodItem.fid
        WHERE date(Orders.date) BETWEEN date(?) AND date(?)
        GROUP BY Orders.date, OrderDetails.foodid
        ORDER BY Orders.date, total_quantity DESC
    `;

    db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
            console.error("Error fetching top selling items:", err);
            event.reply("top-selling-items-response", { success: false, items: [] });
            return;
        }

        // Process the results to get the most sold item(s) for each date
        const topSellingItems = {};
        rows.forEach(row => {
            if (!topSellingItems[row.date]) {
                topSellingItems[row.date] = { most_sold_items: [row.most_sold_item], total_quantity: row.total_quantity };
            } else if (row.total_quantity === topSellingItems[row.date].total_quantity) {
                topSellingItems[row.date].most_sold_items.push(row.most_sold_item); // Add to the list of most sold items
            } else if (row.total_quantity > topSellingItems[row.date].total_quantity) {
                topSellingItems[row.date] = { most_sold_items: [row.most_sold_item], total_quantity: row.total_quantity };
            }
        });

        // Convert the object to an array for easier processing
        const itemsArray = Object.keys(topSellingItems).map(date => ({
            date,
            most_sold_item: topSellingItems[date].most_sold_items.join(", ") // Join items with commas
        }));

        event.reply("top-selling-items-response", { success: true, items: itemsArray });
    });
});

//------------------------------BILLING ENDS HERE--------------------------------
//---------------------------------HISTORY TAB-------------------------------------
// Fetch Today's Orders
ipcMain.on("get-todays-orders", (event) => {
    
    const query = `
        SELECT 
            Orders.*, 
            User.uname AS cashier_name, 
            GROUP_CONCAT(FoodItem.fname || ' (x' || OrderDetails.quantity || ')', ', ') AS food_items
        FROM Orders
        LEFT JOIN User ON Orders.cashier = User.userid
        LEFT JOIN OrderDetails ON Orders.billno = OrderDetails.orderid
        LEFT JOIN FoodItem ON OrderDetails.foodid = FoodItem.fid
        WHERE date(Orders.date) = date('now', 'localtime')
        GROUP BY Orders.billno
        ORDER BY Orders.billno DESC;

    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching today's orders:", err);
            event.reply("todays-orders-response", { success: false, orders: [] });
            return;
        }
        event.reply("todays-orders-response", { success: true, orders: rows });
    });
});

// Listen for order history requests
ipcMain.on("get-order-history", (event, { startDate, endDate }) => {
    //console.log("Fetching order history...");
    
    const query = `
        SELECT 
            Orders.*, 
            User.uname AS cashier_name, 
            GROUP_CONCAT(FoodItem.fname || ' (x' || OrderDetails.quantity || ')', ', ') AS food_items
        FROM Orders
        LEFT JOIN User ON Orders.cashier = User.userid
        LEFT JOIN OrderDetails ON Orders.billno = OrderDetails.orderid
        LEFT JOIN FoodItem ON OrderDetails.foodid = FoodItem.fid
        WHERE date(Orders.date) BETWEEN date(?) AND date(?)
        GROUP BY Orders.billno
        ORDER BY Orders.date DESC;
    `;

    db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
            console.error("Error fetching order history:", err);
            event.reply("fetchOrderHistoryResponse", { success: false, orders: [] });
            return;
        }
        //console.log("Order history fetched:", rows); 
        event.reply("order-history-response", { success: true, orders: rows });
    });
});

ipcMain.on("confirm-delete-order", async (event, { billNo, reason, source }) => {
    try {
        // Convert db.get and db.all into Promises
        const getAsync = (query, params) => {
            return new Promise((resolve, reject) => {
                db.get(query, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        };

        const allAsync = (query, params) => {
            return new Promise((resolve, reject) => {
                db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        };

        // Fetch order and order details using Promises
        const order = await getAsync("SELECT * FROM Orders WHERE billno = ?", [billNo]);
        const orderDetails = await allAsync("SELECT * FROM OrderDetails WHERE orderid = ?", [billNo]);

        if (!order) {
            event.reply("delete-order-response", { success: false, message: "Order not found!" });
            return;
        }

        // Insert into DeletedOrders
        await db.run(
            "INSERT INTO DeletedOrders (billno, date, cashier, kot, price, sgst, cgst, tax, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [order.billno, order.date, order.cashier, order.kot, order.price, order.sgst, order.cgst, order.tax, reason]
        );

        // Insert into DeletedOrderDetails
        for (const detail of orderDetails) {
            await db.run(
                "INSERT INTO DeletedOrderDetails (orderid, foodid, quantity) VALUES (?, ?, ?)",
                [detail.orderid, detail.foodid, detail.quantity]
            );
        }

        // Delete from Orders and OrderDetails
        await db.run("DELETE FROM Orders WHERE billno = ?", [billNo]);
        await db.run("DELETE FROM OrderDetails WHERE orderid = ?", [billNo]);

        event.reply("delete-order-response", { success: true, message: "Order deleted successfully!" });

        // ✅ Notify the renderer process about the deletion
        mainWindow.webContents.send("order-deleted", { source });
        mainWindow.webContents.send("refresh-order-history");

    } catch (error) {
        console.error("Error deleting order:", error);
        event.reply("delete-order-response", { success: false, message: "Failed to delete order." });
    }
});

ipcMain.on("get-categories-event", (event) => {

    const query = `SELECT catid, catname FROM Category WHERE active = 1`;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching categories:", err);
            event.reply("categories-response", { success: false, categories: [] });
            return;
        }
        event.reply("categories-response", { success: true, categories: rows });
    });
});

ipcMain.on("get-category-wise", (event, { startDate, endDate, category }) => {
    const query = `
        SELECT 
            Orders.*, 
            User.uname AS cashier_name, 
            GROUP_CONCAT(FoodItem.fname || ' (x' || OrderDetails.quantity || ')', ', ') AS food_items
        FROM Orders
        JOIN User ON Orders.cashier = User.userid
        JOIN OrderDetails ON Orders.billno = OrderDetails.orderid
        JOIN FoodItem ON OrderDetails.foodid = FoodItem.fid
        WHERE DATE(TRIM(Orders.date)) BETWEEN DATE(?) AND DATE(?)
        AND Orders.billno IN (
            SELECT DISTINCT OrderDetails.orderid 
            FROM OrderDetails
            JOIN FoodItem ON OrderDetails.foodid = FoodItem.fid
            WHERE FoodItem.category = ?
        )
        GROUP BY Orders.billno
        ORDER BY DATE(TRIM(Orders.date)) DESC
    `;

    db.all(query, [startDate, endDate, category], (err, rows) => {
        if (err) {
            console.error("Error fetching order history:", err);
            event.reply("category-wise-response", { success: false, orders: [] });
            return;
        }
        event.reply("category-wise-response", { success: true, orders: rows });
    });
});




// Listens for deleted order requests, retrieves the deleted orders from the DeletedOrders table and sends records back in response
ipcMain.on("get-deleted-orders", (event, { startDate, endDate }) => {

    const query = `
        SELECT 
            DeletedOrders.*, 
            User.uname AS cashier_name, 
            GROUP_CONCAT(FoodItem.fname || ' (x' || DeletedOrderDetails.quantity || ')', ', ') AS food_items
        FROM DeletedOrders
        JOIN User ON DeletedOrders.cashier = User.userid
        JOIN DeletedOrderDetails ON DeletedOrders.billno = DeletedOrderDetails.orderid
        JOIN FoodItem ON DeletedOrderDetails.foodid = FoodItem.fid
        WHERE date(DeletedOrders.date) BETWEEN date(?) AND date(?)
        GROUP BY DeletedOrders.billno
        ORDER BY DeletedOrders.date DESC
    `;

    db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
            console.error("Error fetching deleted orders:", err);
            event.reply("fetchDeletedOrdersResponse", { success: false, orders: [] });
            return;
        }
        event.reply("deleted-orders-response", { success: true, orders: rows });
    });
});

ipcMain.on("show-excel-export-message", (event, options) => {
    dialog.showMessageBox({
        type: options.type || "info",
        title: options.title || "Notification",
        message: options.message || "Operation completed.",
    });
});

ipcMain.handle("show-save-dialog", async (event, defaultFilename) => {
    const result = await dialog.showSaveDialog({
        title: "Save Excel File",
        defaultPath: defaultFilename,
        filters: [
            { name: "Excel Files", extensions: ["xlsx"] },
            { name: "All Files", extensions: ["*"] },
        ],
    });

    // result.filePath is null if the user cancels the dialog
    return result.canceled ? null : result.filePath;
});
// Fetch Customers
ipcMain.on("get-customers", (event) => {
    const query = `
        SELECT * FROM Customer
        ORDER BY cid ASC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching customers:", err);
            event.reply("customers-response", { success: false, customers: [] });
            return;
        }
        event.reply("customers-response", { success: true, customers: rows });
    });
});

// Clear Deleted Orders
ipcMain.on("clear-deleted-orders", (event) => {
    const deleteOrdersQuery = `DELETE FROM DeletedOrders`;
    const deleteOrderDetailsQuery = `DELETE FROM DeletedOrderDetails`;

    db.serialize(() => {
        db.run(deleteOrderDetailsQuery, [], (err) => {
            if (err) {
                console.error("Error clearing DeletedOrderDetails:", err);
                event.reply("clear-deleted-orders-response", { success: false });
                return;
            }
            db.run(deleteOrdersQuery, [], (err) => {
                if (err) {
                    console.error("Error clearing DeletedOrders:", err);
                    event.reply("clear-deleted-orders-response", { success: false });
                    return;
                }
                event.reply("clear-deleted-orders-response", { success: true });
            });
        });
    });
});

ipcMain.on("get-discounted-orders", (event, { startDate, endDate }) => {
    const query = `
        SELECT 
            d.billno, 
            o.kot, 
            o.date,
            d.Initial_price, 
            d.discount_percentage, 
            d.discount_amount, 
            o.price AS Final_Price,
            GROUP_CONCAT(f.fname, ', ') AS food_items
        FROM DiscountedOrders d
        JOIN Orders o ON d.billno = o.billno
        LEFT JOIN OrderDetails od ON d.billno = od.orderid
        LEFT JOIN FoodItem f ON od.foodid = f.fid
        WHERE date(o.date) BETWEEN date(?) AND date(?)
        GROUP BY d.billno, o.kot, o.date, d.Initial_price, d.discount_percentage, d.discount_amount
    `;

    db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
            console.error("Error fetching discounted orders:", err);
            event.reply("discounted-orders-response", { success: false, orders: [] });
            return;
        }
        event.reply("discounted-orders-response", { success: true, orders: rows });
    });
});

// Clear Discounted Orders
ipcMain.on("clear-discounted-orders", (event) => {
    const deleteDiscountedOrdersQuery = `DELETE FROM DiscountedOrders`;

    db.run(deleteDiscountedOrdersQuery, [], (err) => {
        if (err) {
            console.error("Error clearing DiscountedOrders:", err);
            event.reply("clear-discounted-orders-response", { success: false });
            return;
        }
        event.reply("clear-discounted-orders-response", { success: true });
    });
});

// IPC Listener to add a new customer
ipcMain.on("add-customer", (event, customerData) => {
    const { cname, phone, address } = customerData;

    const query = `INSERT INTO Customer (cname, phone, address) VALUES (?, ?, ?)`;
    db.run(query, [cname, phone, address], function (err) {
        if (err) {
            console.error("Error adding customer:", err);
            event.reply("customer-added-response", { success: false });
        } else {
            console.log("Customer added successfully");
            event.reply("customer-added-response", { success: true });
        }
    });
});

// Handle Delete Customer
ipcMain.on("delete-customer", (event, { customerId }) => {
    db.run("DELETE FROM Customer WHERE cid = ?", [customerId], function (err) {
        if (err) {
            console.error("Error deleting customer:", err);
            event.reply("customer-delete-response", { success: false });
        } else {
            console.log("Customer deleted successfully");
            event.reply("customer-delete-response", { success: true });
        }
    });
});

// Handle Edit Customer
ipcMain.on("edit-customer", (event, { customerId }) => {
    db.get("SELECT * FROM Customer WHERE cid = ?", [customerId], (err, customer) => {
        if (err) {
            console.error("Error fetching customer:", err);
            return;
        }
        event.reply("edit-customer-data", customer);
    });
});

// Handle Update Customer
ipcMain.on("update-customer", (event, updatedCustomer) => {
    const { cid, cname, phone, address } = updatedCustomer;
    db.run(
        "UPDATE Customer SET cname = ?, phone = ?, address = ? WHERE cid = ?",
        [cname, phone, address, cid],
        function (err) {
            if (err) {
                console.error("Error updating customer:", err);
                event.reply("update-customer-response", { success: false, error: err.message });
                return;
            }
            event.reply("update-customer-response", { success: true });
        }
    );
});
// Clear customer Data
ipcMain.on("clear-customer-data", (event) => {
    const deleteDiscountedOrdersQuery = `DELETE FROM Customer`;

    db.run(deleteDiscountedOrdersQuery, [], (err) => {
        if (err) {
            console.error("Error clearing customer data:", err);
            event.reply("clear-customer-data-response", { success: false });
            return;
        }
        event.reply("clear-customer-data-response", { success: true });
    });
});

// Fetch order details for a specific bill number
ipcMain.on("get-order-details", (event, billno) => {
    const query = `
        SELECT 
            OrderDetails.foodid AS foodId,
            FoodItem.fname AS foodName,
            FoodItem.cost AS price,
            OrderDetails.quantity AS quantity
        FROM OrderDetails
        JOIN FoodItem ON OrderDetails.foodid = FoodItem.fid
        WHERE OrderDetails.orderid = ?
    `;

    db.all(query, [billno], (err, rows) => {
        if (err) {
            console.error("Error fetching order details:", err);
            event.reply("order-details-response", { food_items: [] });
            return;
        }
        event.reply("order-details-response", { food_items: rows });
    });
});

//ItemHistory
ipcMain.on("get-food-items-for-item-history", (event, { categoryId }) => {
    const query = `SELECT fid, fname FROM FoodItem WHERE category = ? AND active = 1`;
    db.all(query, [categoryId], (err, rows) => {
        if (err) {
            console.error("Error fetching food items:", err);
            event.reply("food-items-response-for-item-history", { success: false, foodItems: [] });
            return;
        }
        event.reply("food-items-response-for-item-history", { success: true, foodItems: rows });
    });
});

// Item History
ipcMain.on("get-item-history", (event, { startDate, endDate, foodItem }) => {
    const query = `
        SELECT 
            Orders.billno, 
            Orders.date, 
            User.uname AS cashier_name,  -- Corrected column name
            Orders.kot, 
            Orders.price, 
            Orders.sgst,
            Orders.cgst,
            Orders.tax,
            GROUP_CONCAT(FoodItem.fname || ' (x' || OrderDetails.quantity || ')', ', ') AS food_items
        FROM Orders
        JOIN OrderDetails ON Orders.billno = OrderDetails.orderid
        JOIN FoodItem ON OrderDetails.foodid = FoodItem.fid
        JOIN User ON Orders.cashier = User.userid  -- Correct join condition
        WHERE FoodItem.fid = ? AND date(Orders.date) BETWEEN date(?) AND date(?)
        GROUP BY Orders.billno
        ORDER BY Orders.date DESC;
    `;

    db.all(query, [foodItem, startDate, endDate], (err, rows) => {
        if (err) {
            console.error("Error fetching item history:", err);
            event.reply("item-history-response", { success: false, orders: [] });
            return;
        }
        event.reply("item-history-response", { success: true, orders: rows });
    });
});

ipcMain.on("update-order", (event, { billno, orderItems }) => {
    // Delete existing order details for the bill
    const deleteQuery = `DELETE FROM OrderDetails WHERE orderid = ?`;
    db.run(deleteQuery, [billno], (err) => {
        if (err) {
            console.error("Error deleting existing order details:", err);
            event.reply("update-order-response", { success: false });
            return;
        }

        // Insert the updated order details
        const insertQuery = `INSERT INTO OrderDetails (orderid, foodid, quantity) VALUES (?, ?, ?)`;
        const statements = orderItems.map(item => {
            return new Promise((resolve, reject) => {
                db.run(insertQuery, [billno, item.foodId, item.quantity], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });

        // Execute all insert statements
        // Execute all insert statements
        Promise.all(statements)
            .then(() => {
                console.log("Order items updated successfully.");

                // Recalculate the total price, SGST, CGST, and tax
                const totalQuery = `
                    SELECT 
                        SUM(f.cost * od.quantity) AS total_price,
                        SUM(f.sgst * od.quantity) AS total_sgst,
                        SUM(f.cgst * od.quantity) AS total_cgst
                    FROM OrderDetails od
                    JOIN FoodItem f ON od.foodid = f.fid
                    WHERE od.orderid = ?;
                `;

                db.get(totalQuery, [billno], (err, row) => {
                    if (err) {
                        console.error("Error calculating total price:", err);
                        event.reply("update-order-response", { success: false });
                        return;
                    }

                    if (row) {
                        const { total_price, total_sgst, total_cgst } = row;
                        const total_tax = total_sgst + total_cgst;

                        // Update the Orders table with the new price, sgst, cgst, and tax
                        const updateOrderQuery = `
                            UPDATE Orders
                            SET price = ?, sgst = ?, cgst = ?, tax = ?
                            WHERE billno = ?;
                        `;
                        db.run(updateOrderQuery, [total_price, total_sgst, total_cgst, total_tax, billno], (err) => {
                            if (err) {
                                console.error("Error updating order totals:", err);
                                event.reply("update-order-response", { success: false });
                            } else {
                                console.log("Order totals updated successfully.");
                                event.reply("update-order-response", { success: true });

                                // Refresh the "Today's Orders" section
                                event.sender.send("refresh-order-history");
                            }
                        });
                    }
                });
            })
            .catch((err) => {
                console.error("Error updating order details:", err);
                event.reply("update-order-response", { success: false });
            });
    });
});

// Day-Wise Data Handler
ipcMain.on('get-day-wise-data', (event, { startDate, endDate }) => {
    const query = `
        SELECT 
            date,
            COUNT(DISTINCT billno) as order_count,
            COALESCE(SUM(
                (SELECT SUM(quantity) 
                 FROM OrderDetails 
                 WHERE orderid = Orders.billno)
            ), 0) as total_units,
            COALESCE(SUM(price), 0) as total_revenue
        FROM Orders
        WHERE date BETWEEN ? AND ?
        GROUP BY date
        ORDER BY date DESC
    `;

    db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
            console.error('Error fetching day-wise data:', err);
            event.reply('day-wise-data-response', { 
                success: false, 
                error: err.message 
            });
        } else {
            event.reply('day-wise-data-response', {
                success: true,
                days: rows
            });
        }
    });
});

// Month-Wise Data Handler
ipcMain.on('get-month-wise-data', (event, { year }) => {
    const query = `
        SELECT 
            CAST(strftime('%m', date) AS INTEGER) as month,
            COUNT(DISTINCT billno) as order_count,
            COALESCE(SUM(
                (SELECT SUM(quantity) 
                 FROM OrderDetails 
                 WHERE orderid = Orders.billno)
            ), 0) as total_units,
            COALESCE(SUM(price), 0) as total_revenue
        FROM Orders
        WHERE strftime('%Y', date) = ?
        GROUP BY month
        ORDER BY month ASC
    `;

    db.all(query, [year.toString()], (err, rows) => {
        if (err) {
            console.error('Error fetching month-wise data:', err);
            event.reply('month-wise-data-response', { 
                success: false, 
                error: err.message 
            });
        } else {
            event.reply('month-wise-data-response', {
                success: true,
                months: rows
            });
        }
    });
});

// Year-Wise Data Handler
ipcMain.on('get-year-wise-data', (event) => {
    const query = `
        SELECT 
            strftime('%Y', date) as year,
            COUNT(DISTINCT billno) as order_count,
            COALESCE(SUM(
                (SELECT SUM(quantity) 
                 FROM OrderDetails 
                 WHERE orderid = Orders.billno)
            ), 0) as total_units,
            COALESCE(SUM(price), 0) as total_revenue
        FROM Orders
        GROUP BY year
        ORDER BY year DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching year-wise data:', err);
            event.reply('year-wise-data-response', { 
                success: false, 
                error: err.message 
            });
        } else {
            event.reply('year-wise-data-response', {
                success: true,
                years: rows
            });
        }
    });
});
//---------------------------------------HISTORY TAB ENDS HERE--------------------------------------------

//--------------------------------------- INVENTORY TAB STARTS HERE--------------------------------------------
// Inventory database operations
// Get Inventory List
ipcMain.on("get-inventory-list", (event) => {
    const query = "SELECT inv_no, inv_item, current_stock FROM Inventory ORDER BY inv_item COLLATE NOCASE";
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching inventory:", err.message);
            event.reply("inventory-list-response", { success: false, inventory: [] });
            return;
        }

        event.reply("inventory-list-response", { success: true, inventory: rows });
    });
});

// Delete Inventory Item
ipcMain.on("delete-inventory-item", (event, inv_no) => {
    const query = "DELETE FROM Inventory WHERE inv_no = ?";
    
    db.run(query, [inv_no], function (err) {
        if (err) {
            console.error("Error deleting inventory item:", err.message);
            return;
        }

        console.log(`Inventory Item ID ${inv_no} deleted successfully.`);
        event.reply("inventory-item-deleted"); // Notify renderer to refresh UI
    });
});

// Add New Inventory Item
ipcMain.on("add-inventory-item", (event, itemData) => {
    const { inv_item, current_stock } = itemData;

    const sql = "INSERT INTO Inventory (inv_item, current_stock) VALUES (?, ?)";
    db.run(sql, [inv_item, current_stock], function (err) {
        if (err) {
            console.error("Error adding inventory item:", err.message);
            return;
        }

        event.sender.send("inventory-item-added");

        if (mainWindow) {
            mainWindow.webContents.send("inventory-item-updated");
        }
    });
});

// Update Inventory Item
ipcMain.on("update-inventory-item", (event, updatedData) => {
    const query = "UPDATE Inventory SET inv_item = ?, current_stock = ? WHERE inv_no = ?";

    db.run(query, [updatedData.inv_item, updatedData.current_stock, updatedData.inv_no], function (err) {
        if (err) {
            console.error("Error updating inventory item:", err.message);
            return;
        }

        console.log(`Inventory Item ID ${updatedData.inv_no} updated successfully.`);
        event.sender.send("inventory-item-updated");
    });
});

// Restock Inventory Item
ipcMain.on("restock-inventory-item", (event, restockData) => {
    const { inv_no, quantity } = restockData;
    
    // First get current stock
    db.get("SELECT current_stock FROM Inventory WHERE inv_no = ?", [inv_no], (err, row) => {
        if (err) {
            console.error("Error fetching current stock:", err.message);
            return;
        }

        if (row) {
            const newStock = row.current_stock + quantity;
            db.run("UPDATE Inventory SET current_stock = ? WHERE inv_no = ?", 
                [newStock, inv_no], 
                function(err) {
                    if (err) {
                        console.error("Error updating inventory stock:", err.message);
                        return;
                    }

                    console.log(`Inventory Item ID ${inv_no} restocked (added ${quantity}). New stock: ${newStock}`);
                    event.sender.send("inventory-item-restocked");
                }
            );
        }
    });
});

// Refresh Inventory List
ipcMain.on("refresh-inventory", (event) => {
    if (mainWindow) {
        mainWindow.webContents.send("inventory-item-updated");
    }
});
//---------------------------------------- INVENTORY TAB ENDS HERE --------------------------------------------
//---------------------------------------SETTINGS TAB STARTS HERE--------------------------------------------

ipcMain.on("get-users", (event) => {
    const query = `SELECT * FROM User`;  
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Database Error:", err);
            event.reply("users-response", []);
            return;
        }
        event.reply("users-response", rows);
    });
});

// Handle user updates
ipcMain.on("update-user", (event, data) => {
    const { userid, uname, password } = data;
    const query = `UPDATE User SET uname = ?, password = ? WHERE userid = ?`;

    db.run(query, [uname, password, userid], function (err) {
        if (err) {
            console.error("Update Error:", err);
            event.reply("user-update-failed");
            return;
        }
        console.log(`User ${userid} updated successfully.`);
        event.reply("user-updated"); // Notify renderer process to refresh the page
    });
});

// Get current user
ipcMain.on('get-current-user', (event) => {
    event.reply('current-user-response', currentUser);
});

// Switch user
ipcMain.on("switch-user", (event, userId) => {
    const query = `SELECT * FROM User WHERE userid = ?`;
    db.get(query, [userId], (err, user) => {
        if (err) {
            console.error("Database Error:", err);
            event.reply("user-switch-failed", { error: "Database error" });
            return;
        }
        if (user) {
            currentUser = user;
            event.reply("user-switched", user);
        } else {
            event.reply("user-switch-failed", { error: "User not found" });
        }
    });
});

// Handle request to add a new user
ipcMain.on("add-user", (event, { uname, password, isadmin }) => {
    const query = `INSERT INTO User (uname, password, isadmin) VALUES (?, ?, ?)`;

    db.run(query, [uname, password, isadmin], function (err) {
        if (err) {
            console.error("Error adding user:", err.message);
            event.reply("user-add-failed", { error: err.message });
        } else {
            console.log(`User added successfully with ID ${this.lastID}`);
            event.reply("user-added"); // Notify the frontend to refresh the user list

            // **Broadcast event to refresh users in the main window**
            mainWindow.webContents.send("get-users"); 
        }
    });
});

// Handle request to remove users
ipcMain.on("remove-users", (event, userIds) => {
    if (userIds.length === 0) return;

    const placeholders = userIds.map(() => "?").join(",");
    const query = `DELETE FROM User WHERE userid IN (${placeholders})`;

    db.run(query, userIds, function (err) {
        if (err) {
            console.error("Error deleting users:", err.message);
            return;
        }
        console.log(`${this.changes} users deleted successfully.`);

        // Notify the renderer process to refresh the list
        event.reply("users-deleted");
        mainWindow.webContents.send("get-users"); // Refresh user list in main UI
    });
});

// Printer Configuration
const Store = require('electron-store');
const printerStore = new Store({ name: 'printer-config' });

// Get available printers
ipcMain.handle('get-available-printers', async () => {
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers.map(printer => ({
        name: printer.name,
        displayName: printer.displayName,
        status: printer.status === 0 ? 'Ready' : 'Offline'
    }));
});

// Get saved printer
ipcMain.handle('get-saved-printer', () => {
    return printerStore.get('selectedPrinter', null);
});

// Save printer config
ipcMain.handle('save-printer-configuration', (event, printerName) => {
    printerStore.set('selectedPrinter', printerName);
    return true;
});

//----------------------------------------------SETTINGS TAB ENDS HERE--------------------------------------------

ipcMain.handle("get-categories", async () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT catname FROM Category WHERE active = 1", [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});
//----------------------------------------------MENU TAB--------------------------------------------
// Fetch Food Items when requested from the renderer process
ipcMain.handle("get-menu-items", async () => {
    const foodQuery = `
        SELECT 
            FoodItem.fid, FoodItem.fname, FoodItem.category, FoodItem.cost, 
            FoodItem.sgst, FoodItem.cgst, FoodItem.veg, FoodItem.is_on, FoodItem.active,
            FoodItem.depend_inv,
            Category.catname AS category_name
        FROM FoodItem
        JOIN Category ON FoodItem.category = Category.catid;
    `;

    const inventoryQuery = `
        SELECT inv_no, inv_item FROM Inventory;
    `;

    try {
        const foodItems = await new Promise((resolve, reject) => {
            db.all(foodQuery, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const inventoryItems = await new Promise((resolve, reject) => {
            db.all(inventoryQuery, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // Create a map from inv_no to inv_item
        const invMap = {};
        inventoryItems.forEach(item => {
            invMap[item.inv_no] = item.inv_item;
        });

        // Add `depend_inv_names` to each food item
        const enrichedFoodItems = foodItems.map(item => {
            const dependInvIds = (item.depend_inv || "").split(",").map(i => i.trim()).filter(i => i);
            const dependNames = dependInvIds.map(id => invMap[id]).filter(Boolean); // filter out nulls
            return {
                ...item,
                depend_inv_names: dependNames.join(", ")
            };
        });

        return enrichedFoodItems;
    } catch (err) {
        console.error("Error fetching food or inventory items:", err);
        return [];
    }
});

ipcMain.handle('get-all-inventory-items', async () => {
    try {
        const query = `SELECT inv_no, inv_item FROM Inventory ORDER BY inv_item ASC`;
        const items = await new Promise((resolve, reject) => {
            db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        return items;
    } catch (error) {
        console.error("Error fetching inventory items:", error);
        return []; // return empty array on error
    }
});
// Toggle menu items - DAILY TOGGLE ON/OFF:
ipcMain.handle("toggle-menu-item", async (event, fid) => {
    try {
        await new Promise((resolve, reject) => {
            db.run(
                `
                UPDATE FoodItem 
                SET is_on = CASE WHEN is_on = 1 THEN 0 ELSE 1 END
                WHERE fid = ?
                `,
                [fid],
                function (err) {
                    if (err) {
                        console.error("Error toggling item:", err);
                        reject(err);
                    } else {
                        resolve(true);
                    }
                }
            );
        });

        // Fetch updated value
        const updatedItem = await new Promise((resolve, reject) => {
            db.get("SELECT is_on FROM FoodItem WHERE fid = ?", [fid], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        return updatedItem ? updatedItem.is_on : null;
    } catch (err) {
        console.error("Error toggling menu item:", err);
        return null;
    }
});

// Toggle menu items - ACTIVE TOGGLE:
ipcMain.handle("toggle-menu-item-active", async (event, fid) => {
    try {
        await new Promise((resolve, reject) => {
            db.run(
                `
                UPDATE FoodItem 
                SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END
                WHERE fid = ?
                `,
                [fid],
                function (err) {
                    if (err) {
                        console.error("Error toggling active state:", err);
                        reject(err);
                    } else {
                        resolve(true);
                    }
                }
            );
        });

        // Fetch updated value
        const updatedItem = await new Promise((resolve, reject) => {
            db.get("SELECT active FROM FoodItem WHERE fid = ?", [fid], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        return updatedItem ? updatedItem.active : null;
    } catch (err) {
        console.error("Error toggling active state:", err);
        return null;
    }
});

// Delete Menu Item
ipcMain.handle("delete-menu-item", async (event, fid) => {
    try {
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM FoodItem WHERE fid = ?", [fid], function (err) {
                if (err) {
                    console.error("Error deleting item:", err);
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });

        return true;
    } catch (err) {
        console.error("Error deleting menu item:", err);
        return false;
    }
});
//Edit Menu ITems
ipcMain.handle("update-food-item", async (event, { fid, fname, category, cost, sgst, cgst, veg, depend_inv }) => {
    try {
        const query = `
            UPDATE FoodItem 
            SET fname = ?, cost = ?, category = ?, sgst = ?, cgst = ?, veg = ?, depend_inv = ?
            WHERE fid = ?
        `;
        await db.run(query, [fname, cost, category, sgst, cgst, veg, depend_inv, fid]);
        return { success: true };
    } catch (error) {
        console.error("Error updating food item:", error);
        return { success: false, error: error.message };
    }
});


//-------------------
//-----------HOME TAB----------------
ipcMain.handle("get-all-food-items", async () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT f.fid, f.fname, f.cost, f.veg, f.category 
            FROM FoodItem f 
            JOIN Category c ON f.category = c.catid
            WHERE f.active = 1 
            AND f.is_on = 1 
            AND c.active = 1;

        `;
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

// Fetch inventory items for a given food item
ipcMain.handle("get-inventory-for-food", async (event, foodId) => {
    const query = `
        SELECT depend_inv
        FROM FoodItem
        WHERE fid = ?;
    `;

    try {
        // Get the depend_inv value (comma-separated inventory IDs)
        const rows = await new Promise((resolve, reject) => {
            db.all(query, [foodId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (rows.length === 0 || !rows[0].depend_inv) {
            return []; // No inventory dependencies for this food item
        }

        // Parse the depend_inv field to get inventory IDs
        const inventoryIds = rows[0].depend_inv.split(',').map(id => id.trim());

        // Now fetch the inventory details for each inventory ID
        const inventoryQuery = `
            SELECT inv_no, inv_item, current_stock
            FROM Inventory
            WHERE inv_no IN (${inventoryIds.map(() => '?').join(', ')});
        `;
        
        const inventoryItems = await new Promise((resolve, reject) => {
            db.all(inventoryQuery, inventoryIds, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        return inventoryItems; // Return the inventory details
    } catch (err) {
        console.error("Error fetching inventory for food item:", err);
        return [];
    }
});


// Deduct stock for an inventory item (stock will not go below zero)
ipcMain.handle("deduct-inventory-stock", async (event, { foodId, quantity }) => {
    const getDependInvQuery = `
        SELECT depend_inv FROM FoodItem WHERE fid = ?;
    `;

    try {
        // Step 1: Fetch the depend_inv (comma-separated list of inventory IDs) for the given food item
        const dependInvResult = await new Promise((resolve, reject) => {
            db.get(getDependInvQuery, [foodId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        // If depend_inv is null or empty, no dependencies to process
        if (!dependInvResult || !dependInvResult.depend_inv) {
            return { success: true };
        }

        // Step 2: Split the depend_inv string into an array of inventory IDs
        const dependInvIds = dependInvResult.depend_inv.split(',').map(id => id.trim());

        // Step 3: Loop through each inventory item in depend_inv and update their stock
        for (let invIdStr of dependInvIds) {
            const invIdInt = parseInt(invIdStr); // Ensure we have a valid integer inventory ID

            if (isNaN(invIdInt)) continue; // Skip invalid inventory IDs

            const query = `
                UPDATE Inventory
                SET current_stock = CASE
                    WHEN current_stock - ? < 0 THEN 0
                    ELSE current_stock - ?
                END
                WHERE inv_no = ?;
            `;

            // Deduct stock for each item in the depend_inv list
            await new Promise((resolve, reject) => {
                db.run(query, [quantity, quantity, invIdInt], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ success: true });
                    }
                });
            });
        }

        return { success: true };

    } catch (err) {
        console.error("Error deducting inventory:", err);
        return { success: false, message: "An error occurred while deducting stock." };
    }
});




//-0-----------HOME TAB ENDS HERE-----------

ipcMain.handle("get-food-items", async (event, categoryName) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT f.fid,f.fname, f.cost, f.veg, f.category 
            FROM FoodItem f 
            JOIN Category c ON f.category = c.catid 
            WHERE c.catname = ? AND f.active = 1 AND f.is_on = 1
        `;
        db.all(query, [categoryName], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});
// ADD FOOD ITEM IN MENU APP
// Fetch categories for dropdown
let addItemWindow;
ipcMain.on("open-add-item-window", () => {
    if (!addItemWindow) {
        addItemWindow = new BrowserWindow({
            width: 500,
            height: 600,
            modal: true, // Keeps it on top
            parent: mainWindow, // Assuming mainWindow is your main app window
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false // Ensure IPC works properly
            }
        });

        addItemWindow.loadFile(path.join(__dirname, "AddItem.html"));

        addItemWindow.on("closed", () => {
            addItemWindow = null;
        });
    }
});

ipcMain.handle("get-categories-for-additem", async () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT catid, catname FROM Category", [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

// Add new food item
ipcMain.handle("add-food-item", async (event, item) => {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO FoodItem (fname, category, cost, sgst, cgst, tax, active, is_on, veg, depend_inv)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                item.fname,
                item.category,
                item.cost,
                item.sgst,
                item.cgst,
                item.tax,
                item.active,
                item.is_on,
                item.veg,
                item.depend_inv || "" // Fallback to empty string if undefined
            ],
            function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ success: true, fid: this.lastID });
                }
            }
        );
    });
});


//refresh menu
// In main.js

// Add the listener for 'refresh-menu'
ipcMain.on('refresh-menu', (event) => {
    // You can trigger the 'displayMenu' function in the main window
    // Here you will call a function in your main window or refresh its content.
    mainWindow.webContents.send('refresh-menu'); // This sends a message to the renderer to trigger menu refresh
});
//EXIT THE APP
// Event listener to handle exit request
// Event listener to handle exit request
ipcMain.on("exit-app", (event) => {
    // Close the database connection before quitting
      closeDatabase();
      // Clear Session Storage
      store.clear();
       app.quit(); // Close the app
  });

// --------------------------------- BUSINESS INFO SECTION -----------------------------
const savePath = path.join(__dirname, 'businessInfo.json');

ipcMain.on('save-business-info', (event, businessData) => {
    fs.writeFile(savePath, JSON.stringify(businessData, null, 4), 'utf-8', (err) => {
        if (err) {
            console.error('Error saving business info:', err);
            event.reply('save-business-info-response', { success: false, message: err.message });
        } else {
            console.log('Business info saved to:', savePath);
            event.reply('save-business-info-response', { success: true });
        }
    });
});

const dataPath = path.join(__dirname, 'businessInfo.json');

ipcMain.handle('load-business-info', async () => {
    try {
        const fileData = await fs.promises.readFile(dataPath, 'utf-8');
        return JSON.parse(fileData);
    } catch (err) {
        console.error('Failed to load business info:', err);
        return null; // or return default data if file is missing
    }
});

// ------------------------------- BUSINESS INFO SECTION ENDS HERE ------------------------
//----------------------------------- BACKUP AND RESTORE SECTION STARTS HERE -------------------
// main.js
ipcMain.on('backup-database', async (event) => {
    const { backupLCdb } = require('./backup');
    
    try {
        const success = await backupLCdb(); // Wait for the backup operation to finish
        event.reply('backup-completed', success); // Reply with the success value
    } catch (error) {
        event.reply('backup-completed', false); // If an error occurs, send failure
    }
});


// main.js
ipcMain.on('restore-database', async (event) => {
    const { restoreLCdb } = require('./restore'); // Assuming restoreLCdb is the restore function

    try {
        const success = await restoreLCdb(); // Wait for the restore operation to finish
        // Reply to renderer process with the success status
        event.reply('restore-completed', success);
    } catch (error) {
        console.error('Restore failed:', error);
        // If an error occurs, send failure status to renderer
        event.reply('restore-completed', false);
    }
});


// ---------------------------------- BACKUP AND RESTORE SECTION ENDS HERE -------------------

//---------------------------------- ONLINE ORDERS SECTION STARTS HERE -------------------
// In Electron renderer or main, using fetch or axios
const MONGO_PORT = process.env.MONGO_PORT;
async function updateOrderStatus(orderId, status) {
  const response = await fetch(`http://localhost:${MONGO_PORT}/order/${orderId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });

  const data = await response.json();
  if (data.success) {
    console.log('Status updated:', data.message);
  } else {
    console.error('Failed to update:', data.message);
  }
}
ipcMain.handle("getOnlineOrderCount", async () => {
  return new Promise((resolve, reject) => {
    db.get("SELECT COUNT(*) as cnt FROM OnlineOrders", (err, row) => {
      if (err) reject(err);
      else resolve(row?.cnt || 0);
    });
  });
});
// Assuming 'db' is your sqlite3 database instance
ipcMain.on("get-food-name", (event, fid) => {
    db.get("SELECT fname FROM FoodItem WHERE fid = ?", [fid], (err, row) => {
        event.reply(`food-name-${fid}`, row?.fname);
    });
});


ipcMain.on('get-online-orders', (event) => {
    db.all(`SELECT * FROM OnlineOrders`, [], (err, orders) => {
        if (err) {
            console.error('Error fetching online orders:', err);
            event.reply('online-orders-response', { error: true, message: err.message });
            return;
        }

        // Now fetch items for each order
        const orderIds = orders.map(o => o.orderId);
        const placeholders = orderIds.map(() => '?').join(',');

        db.all(
            `SELECT * FROM OnlineOrderItems WHERE orderId IN (${placeholders})`,
            orderIds,
            (err, items) => {
                if (err) {
                    console.error('Error fetching order items:', err);
                    event.reply('online-orders-response', { error: true, message: err.message });
                    return;
                }

                // Group items by orderId
                const groupedItems = {};
                items.forEach(item => {
                    if (!groupedItems[item.orderId]) groupedItems[item.orderId] = [];
                    groupedItems[item.orderId].push(item);
                });

                // Attach items to orders
                const result = orders.map(order => ({
                    ...order,
                    items: groupedItems[order.orderId] || []
                }));

                event.reply('online-orders-response', { error: false, orders: result });
            }
        );
    });
});
ipcMain.on("cancel-online-order", (event, orderId) => {
    db.serialize(() => {
        db.run("DELETE FROM OnlineOrderItems WHERE orderId = ?", [orderId]);
        db.run("DELETE FROM OnlineOrders WHERE orderId = ?", [orderId], function (err) {
            if (err) {
                console.error("Failed to delete order:", err.message);
            } else {
                console.log(`Order ${orderId} cancelled successfully`);
            }
        });
    });
});

ipcMain.handle('update-online-order', async (event, { orderId, status }) => {
  try {
    await updateOrderStatus(orderId, status);
    return { success: true, message: 'Order status updated' };
  } catch (err) {
    console.error('Failed to update order status:', err);
    return { success: false, message: err.message };
  }
});
//----------------------------------- ONLINE ORDERS SECTION ENDS HERE -------------------
app.commandLine.appendSwitch('ignore-certificate-errors');

//----------------------------------- Packaging Code --------------------------------------
function initializeSchema() {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS Category (
        catid INTEGER PRIMARY KEY AUTOINCREMENT,
        catname TEXT NOT NULL,
        active INTEGER NOT NULL
      )`);
  
      db.run(`CREATE TABLE IF NOT EXISTS Customer (
        cid INTEGER PRIMARY KEY AUTOINCREMENT,
        cname TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT
      )`);
  
      db.run(`CREATE TABLE IF NOT EXISTS User (
        userid INTEGER PRIMARY KEY AUTOINCREMENT,
        uname TEXT NOT NULL,
        isadmin INTEGER NOT NULL,
        username TEXT NOT NULL,
        email TEXT NOT NULL
      )`);
  
      db.run(`CREATE TABLE IF NOT EXISTS FoodItem (
        fid INTEGER PRIMARY KEY AUTOINCREMENT,
        fname TEXT NOT NULL,
        category INTEGER NOT NULL,
        cost NUMERIC NOT NULL,
        sgst NUMERIC NOT NULL DEFAULT 0,
        cgst NUMERIC NOT NULL DEFAULT 0,
        tax NUMERIC NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        is_on INTEGER NOT NULL DEFAULT 1,
        veg INTEGER NOT NULL DEFAULT 0,
        depend_inv TEXT DEFAULT NULL,
        FOREIGN KEY (category) REFERENCES Category(catid)
      )`);
  
      db.run(`CREATE TABLE IF NOT EXISTS Orders (
        billno INTEGER PRIMARY KEY AUTOINCREMENT,
        kot INTEGER NOT NULL,
        price NUMERIC NOT NULL,
        sgst NUMERIC NOT NULL,
        cgst NUMERIC NOT NULL,
        tax NUMERIC NOT NULL,
        cashier INTEGER NOT NULL,
        date TEXT NOT NULL,
        is_offline INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (cashier) REFERENCES User(userid)
      )`);
  
      db.run(`CREATE TABLE IF NOT EXISTS OrderDetails (
        orderid INTEGER NOT NULL,
        foodid INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        PRIMARY KEY(orderid, foodid),
        FOREIGN KEY (orderid) REFERENCES Orders(billno),
        FOREIGN KEY (foodid) REFERENCES FoodItem(fid)
      )`);
  
      db.run(`CREATE TABLE IF NOT EXISTS DiscountedOrders (
        billno INTEGER PRIMARY KEY,
        Initial_price NUMERIC NOT NULL,
        discount_percentage NUMERIC NOT NULL,
        discount_amount NUMERIC NOT NULL,
        FOREIGN KEY (billno) REFERENCES Orders(billno) ON DELETE CASCADE
      )`);
  
      db.run(`CREATE TABLE IF NOT EXISTS HeldOrders (
        heldid INTEGER PRIMARY KEY AUTOINCREMENT,
        price NUMERIC NOT NULL,
        sgst NUMERIC NOT NULL,
        cgst NUMERIC NOT NULL,
        tax NUMERIC NOT NULL,
        cashier INTEGER NOT NULL,
        FOREIGN KEY (cashier) REFERENCES User(userid)
      )`);
  
      db.run(`CREATE TABLE IF NOT EXISTS HeldOrderDetails (
        heldid INTEGER NOT NULL,
        foodid INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        PRIMARY KEY(heldid, foodid),
        FOREIGN KEY (heldid) REFERENCES HeldOrders(heldid),
        FOREIGN KEY (foodid) REFERENCES FoodItem(fid)
      )`);
  
      db.run(`CREATE TABLE IF NOT EXISTS DeletedOrders (
        billno INTEGER PRIMARY KEY,
        kot INTEGER NOT NULL,
        price NUMERIC NOT NULL,
        sgst NUMERIC NOT NULL,
        cgst NUMERIC NOT NULL,
        tax NUMERIC NOT NULL,
        cashier INTEGER NOT NULL,
        date TEXT NOT NULL,
        reason TEXT NOT NULL,
        is_offline INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (cashier) REFERENCES User(userid)
      )`);
  
      db.run(`CREATE TABLE IF NOT EXISTS DeletedOrderDetails (
        orderid INTEGER NOT NULL,
        foodid INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        PRIMARY KEY(orderid, foodid),
        FOREIGN KEY (orderid) REFERENCES DeletedOrders(billno),
        FOREIGN KEY (foodid) REFERENCES FoodItem(fid)
      )`);
  
      db.run(`CREATE TABLE IF NOT EXISTS Inventory (
        inv_no INTEGER PRIMARY KEY AUTOINCREMENT,
        inv_item TEXT NOT NULL,
        current_stock INTEGER NOT NULL
      )`);
  
      db.run(`CREATE TABLE IF NOT EXISTS OnlineOrders (
        orderId TEXT PRIMARY KEY,
        customerName TEXT NOT NULL,
        phone TEXT NOT NULL,
        datetime TEXT NOT NULL,
        paymentId TEXT,
        paymentMethod TEXT NOT NULL,
        totalPrice NUMERIC NOT NULL,
        source TEXT NOT NULL
      )`);
  
      db.run(`CREATE TABLE IF NOT EXISTS OnlineOrderItems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId TEXT NOT NULL,
        fid INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price NUMERIC NOT NULL,
        FOREIGN KEY (orderId) REFERENCES OnlineOrders(orderId) ON DELETE CASCADE,
        FOREIGN KEY (fid) REFERENCES FoodItem(fid)
      )`);
  
      console.log("📦 Database schema ensured (tables created if missing).");
    });
  }



//-------------------------------- Search Order (in History Section) Starts Here-------------------------------------
ipcMain.on("search-orders", (event, filters) => {
    let query = `
        SELECT 
            o.billno,
            o.kot,
            o.price,
            o.sgst,
            o.cgst,
            o.tax,
            o.date,
            u.uname AS cashier_name,
            GROUP_CONCAT(fi.fname || ' (x' || od.quantity || ')', ', ') AS food_items
        FROM Orders o
        JOIN User u ON o.cashier = u.userid
        JOIN OrderDetails od ON o.billno = od.orderid
        JOIN FoodItem fi ON od.foodid = fi.fid
    `;

    const conditions = [];
    const params = [];

    // Bill No range
    if (filters.billNoFrom) {
        conditions.push("o.billno >= ?");
        params.push(parseInt(filters.billNoFrom));
    }
    if (filters.billNoTo) {
        conditions.push("o.billno <= ?");
        params.push(parseInt(filters.billNoTo));
    }

    // KOT range
    if (filters.kotFrom) {
        conditions.push("o.kot >= ?");
        params.push(parseInt(filters.kotFrom));
    }
    if (filters.kotTo) {
        conditions.push("o.kot <= ?");
        params.push(parseInt(filters.kotTo));
    }

    // Date range
    if (filters.startDate && filters.endDate) {
        conditions.push("o.date BETWEEN ? AND ?");
        params.push(filters.startDate, filters.endDate);
    }

    // Cashier
    if (filters.cashier) {
        conditions.push("o.cashier = ?");
        params.push(parseInt(filters.cashier));
    }

    // Price range
    if (filters.minPrice) {
        conditions.push("o.price >= ?");
        params.push(parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
        conditions.push("o.price <= ?");
        params.push(parseFloat(filters.maxPrice));
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += " GROUP BY o.billno ORDER BY o.billno DESC";

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error(err);
            event.sender.send("search-orders-response", { orders: [] });
        } else {
            event.sender.send("search-orders-response", { orders: rows });
        }
    });
});

// Handle fetching all cashiers
ipcMain.on("get-all-cashiers", (event) => {
    db.all("SELECT userid, uname FROM User WHERE isadmin = 0 OR isadmin = 1", [], (err, rows) => {
        if (err) {
            console.error(err);
            event.sender.send("all-cashiers-response", []);
        } else {
            event.sender.send("all-cashiers-response", rows);
        }
    });
});

//-------------------------------- Search Order (in History Section) Ends Here-------------------------------------