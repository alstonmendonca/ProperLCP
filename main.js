const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

let mainWindow;
let userRole = null;
let store; // Variable to hold electron-store instance
// Function to initialize electron-store dynamically
async function initStore() {
    const { default: Store } = await import("electron-store");
    store = new Store();
}
// Handle login logic and return user role
ipcMain.handle('login', (event, password) => {
    if (password === '1212') {
        userRole = 'admin'; // Set role for admin
    } else if (password === '1000') {
        userRole = 'staff'; // Set role for staff
    } else {
        userRole = null; // Invalid password
    }
    return userRole; // Return the role (or null if invalid)
});

// Connect to the SQLite database
const db = new sqlite3.Database('LC.db', (err) => {
    if (err) {
        console.error("Failed to connect to the database:", err.message);
    } else {
        console.log("Connected to the SQLite database.");
        checkAndResetFoodItems();
    }
});
// Function to check and reset `is_on`
async function checkAndResetFoodItems() {
    await initStore(); // Ensure electron-store is initialized

    const lastOpenedDate = store.get("lastOpenedDate", null);
    const currentDate = new Date().toISOString().split("T")[0]; // Get current date (YYYY-MM-DD)

    if (lastOpenedDate !== currentDate) {
        console.log("New day detected, resetting is_on column...");

        db.run("UPDATE FoodItem SET is_on = 1", (err) => {
            if (err) {
                console.error("Failed to reset is_on:", err.message);
            } else {
                console.log("Successfully reset is_on for new day.");
                store.set("lastOpenedDate", currentDate); // Update last opened date
            }
        });
    } else {
        console.log("Same day detected, no reset needed.");
    }
}
//Close database connection
// Function to close the database connection gracefully
function closeDatabase() {
    if (db) {
        db.close((err) => {
            if (err) {
                console.error("Error closing database", err);
            } else {
                console.log("Database connection closed");
            }
        });
    }
}


app.on("ready", () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false, // Initially hidden until ready-to-show
        fullscreen: false,
        webPreferences: {
            nodeIntegration: true, // Allow Node.js in the renderer process
            contextIsolation: false, // Optional: enable or disable context isolation
        },
    });

    // Maximize the window after creation
    mainWindow.maximize();

    // Show window once it's ready
    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    });

    Menu.setApplicationMenu(null);

    // Skip the login process and directly load index.html for testing
    mainWindow.loadFile('index.html').catch(err => {
        console.error("Failed to load index.html:", err);
    });

    // Send the user role after loading index.html
    mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('set-user-role', userRole);
    });

    // Handle the user role request
    ipcMain.handle('get-user-role', async () => {
        return userRole;
    });

    // Handle database queries
});

app.on("activate", () => {
    if (mainWindow === null) {
        mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                preload: path.join(__dirname, 'renderer.js'),
                contextIsolation: true,
            }
        });

        // Skip login and load index.html directly
        mainWindow.loadFile('index.html').catch(err => {
            console.error("Failed to load index.html:", err);
        });
    }
});
//------------------------------ CATEGORIES TAB --------------------------------
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

// Open Add Category Window
let addCategoryWin; // Store the window globally

ipcMain.on("open-add-category-window", () => {
    const addCategoryWindow = new BrowserWindow({
        width: 400,
        height: 300,
        modal: true,
        parent: BrowserWindow.getFocusedWindow(),
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    addCategoryWindow.loadFile("addCategory.html");
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

let editCategoryWin;

ipcMain.on("open-edit-category-window", (event, categoryData) => {
    const editWindow = new BrowserWindow({
        width: 400,
        height: 300,
        modal: true,
        parent: BrowserWindow.getFocusedWindow(),
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    editWindow.loadFile("editCategory.html");

    editWindow.webContents.once("did-finish-load", () => {
        editWindow.webContents.send("edit-category-data", categoryData);
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
        if (mainWindow) {
            mainWindow.webContents.send("category-updated"); // Refresh main UI
        }
    });
});

ipcMain.on("refresh-categories", (event) => {
    if (mainWindow) {
        mainWindow.webContents.send("category-updated");
    }
    
});
//Billing
ipcMain.on("save-bill", async (event, orderData) => {
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

            let itemTotal = row.cost * quantity;
            totalPrice += itemTotal;
            totalSGST += (itemTotal * row.sgst) / 100;
            totalCGST += (itemTotal * row.cgst) / 100;
            totalTax += (itemTotal * row.tax) / 100;
        }

        // Step 1: Get the latest KOT number for the current date
        const kotRow = await new Promise((resolve, reject) => {
            db.get(`SELECT kot FROM Orders WHERE date = ? ORDER BY kot DESC LIMIT 1`, [date], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        let kot = kotRow ? kotRow.kot + 1 : 1; // Reset if new day, else increment

        // Step 2: Insert the new order
        const orderId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO Orders (kot, price, sgst, cgst, tax, cashier, date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [kot, totalPrice.toFixed(2), totalSGST.toFixed(2), totalCGST.toFixed(2), totalTax.toFixed(2), cashier, date],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        // Step 3: Insert items into OrderDetails
        const stmt = db.prepare(`INSERT INTO OrderDetails (orderid, foodid, quantity) VALUES (?, ?, ?)`);
        orderItems.forEach(({ foodId, quantity }) => stmt.run(orderId, foodId, quantity));
        stmt.finalize();

        console.log(`Order ${orderId} saved successfully with KOT ${kot}.`);

        // Step 4: Send success response and KOT number to renderer
        event.sender.send("bill-saved", { kot });

    } catch (error) {
        console.error("Error processing order:", error.message);
        event.sender.send("bill-error", { error: error.message });
    }
});
//---------------------------------HISTORY TAB-------------------------------------
// Fetch Today's Orders
ipcMain.on("get-todays-orders", (event) => {
    
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
        ORDER BY Orders.date DESC
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
        JOIN User ON Orders.cashier = User.userid
        JOIN OrderDetails ON Orders.billno = OrderDetails.orderid
        JOIN FoodItem ON OrderDetails.foodid = FoodItem.fid
        WHERE date(Orders.date) BETWEEN date(?) AND date(?)
        GROUP BY Orders.billno
        ORDER BY Orders.date DESC
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

ipcMain.on("open-delete-order-window", (event, data) => {
    const deleteWindow = new BrowserWindow({
        width: 400,
        height: 250,
        modal: true,
        parent: BrowserWindow.getFocusedWindow(),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    deleteWindow.loadFile("deleteOrder.html");

    deleteWindow.webContents.once("did-finish-load", () => {
        deleteWindow.webContents.send("populate-delete-window", data);
    });
});

ipcMain.on("confirm-delete-order", async (event, { billNo, reason }) => {

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
    //console.log("Fetching order history...");

    const query = `
        SELECT 
            Orders.*, 
            User.uname AS cashier_name, 
            GROUP_CONCAT(FoodItem.fname || ' (x' || OrderDetails.quantity || ')', ', ') AS food_items
        FROM Orders
        JOIN User ON Orders.cashier = User.userid
        JOIN OrderDetails ON Orders.billno = OrderDetails.orderid
        JOIN FoodItem ON OrderDetails.foodid = FoodItem.fid
        WHERE date(Orders.date) BETWEEN date(?) AND date(?)
        AND Orders.billno IN (
            SELECT DISTINCT OrderDetails.orderid 
            FROM OrderDetails
            JOIN FoodItem ON OrderDetails.foodid = FoodItem.fid
            WHERE FoodItem.category = ?
        )
        GROUP BY Orders.billno
        ORDER BY Orders.date DESC
    `;

    db.all(query, [startDate, endDate, category], (err, rows) => {
        if (err) {
            console.error("Error fetching order history:", err);
            event.reply("category-wise-response", { success: false, orders: [] });
            return;
        }
        //console.log("Category wise fetched:", rows); 
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

//---------------------------------------HISTORY TAB ENDS HERE--------------------------------------------
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

let addUserWindow = null; // Keep track of the window

ipcMain.on("open-add-user-window", () => {
    if (addUserWindow) {
        return; // Prevent opening multiple windows
    }

    addUserWindow = new BrowserWindow({
        width: 400,
        height: 300,
        title: "Add User",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    addUserWindow.loadFile(path.join(__dirname, "addUser.html")); // Create a new HTML file for it

    addUserWindow.on("closed", () => {
        addUserWindow = null; // Reset when closed
    });
});

let removeUserWindow = null;

ipcMain.on("open-remove-user-window", () => {
    if (removeUserWindow) return; // Prevent multiple windows

    removeUserWindow = new BrowserWindow({
        width: 400,
        height: 500,
        title: "Remove Users",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    removeUserWindow.loadFile(path.join(__dirname, "removeUser.html"));

    removeUserWindow.on("closed", () => {
        removeUserWindow = null; // Reset when closed
    });
});

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
    const query = `
        SELECT 
            FoodItem.fid, FoodItem.fname, FoodItem.category, FoodItem.cost, 
            FoodItem.sgst, FoodItem.cgst, FoodItem.veg, FoodItem.is_on, FoodItem.active,
            Category.catname AS category_name
        FROM FoodItem
        JOIN Category ON FoodItem.category = Category.catid;
    `;

    try {
        const rows = await new Promise((resolve, reject) => {
            db.all(query, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        return rows;
    } catch (err) {
        console.error("Error fetching food items:", err);
        return [];
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
ipcMain.handle("update-food-item", async (event, { fid, fname, category, cost, sgst, cgst, veg }) => {
    try {
        const query = `UPDATE FoodItem SET fname = ?, cost = ?, category = ?, sgst = ?, cgst = ?, veg = ? WHERE fid = ?`;
        await db.run(query, [fname, cost, category, sgst, cgst, veg, fid]);
        return { success: true };
    } catch (error) {
        console.error("Error updating food item:", error);
        return { success: false, error: error.message };
    }
});

//-------------------

ipcMain.handle("get-food-items", async (event, categoryName) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT f.fid,f.fname, f.cost, f.veg 
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
            `INSERT INTO FoodItem (fname, category, cost, sgst, cgst, tax, active, is_on, veg)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [item.fname, item.category, item.cost, item.sgst, item.cgst, item.tax, item.active, item.is_on, item.veg],
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
ipcMain.on("exit-app", (event) => {
    // Show a confirmation dialog
    const choice = dialog.showMessageBoxSync({
        type: "question",
        buttons: ["Cancel", "Exit"],
        defaultId: 1,
        title: "Confirm Exit",
        message: "Are you sure you want to exit?",
    });

    if (choice === 1) {
        // Close the database connection before quitting
        closeDatabase();
        app.quit(); // Close the app
    }
});

app.commandLine.appendSwitch('ignore-certificate-errors');