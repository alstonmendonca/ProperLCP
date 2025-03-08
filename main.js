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

// New function to fetch categories for Category Wise Sales
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
                COUNT(Orders.billno) AS totalSales,
                SUM(Orders.price) AS totalRevenue
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
//----------------------------------------------ANALYTICS ENDS HERE--------------------------------------------------------------

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
//Billing
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
                    'quantity', HeldOrderDetails.quantity
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
        event.sender.send("bill-saved", { kot });

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

        // ✅ Notify the renderer process about the deletion
        mainWindow.webContents.send("order-deleted", { source: "todaysOrders" });
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

ipcMain.on("get-discounted-orders", (event) => {
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
        GROUP BY d.billno, o.kot, o.date, d.Initial_price, d.discount_percentage, d.discount_amount
    `;

    db.all(query, [], (err, rows) => {
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
            OrderDetails.quantity, 
            FoodItem.fid AS foodId, 
            FoodItem.fname AS foodName, 
            FoodItem.cost AS price  -- Change 'price' to 'cost'
        FROM OrderDetails
        JOIN FoodItem ON OrderDetails.foodid = FoodItem.fid
        WHERE OrderDetails.orderid = ?;
    `;

    db.all(query, [billno], (err, rows) => {
        if (err) {
            console.error("Error fetching order details:", err);
            event.reply("order-details-response", { success: false, food_items: [] });
            return;
        }
        event.reply("order-details-response", { success: true, food_items: rows });
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
//-----------HOME TAB----------------
ipcMain.handle("get-all-food-items", async () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT f.fid, f.fname, f.cost, f.veg 
            FROM FoodItem f 
            WHERE f.active = 1 AND f.is_on = 1
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
//-0-----------HOME TAB ENDS HERE-----------

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