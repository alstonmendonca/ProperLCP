const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

let mainWindow;
let userRole = null;

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
    }
});

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
//MENU TAB FOOD ITEMS:
// Fetch Food Items when requested from the renderer process
ipcMain.handle("get-menu-items", async (event) => {
    const query = `
        SELECT FoodItem.fid, FoodItem.fname, FoodItem.category, FoodItem.cost, FoodItem.sgst, FoodItem.cgst, 
               FoodItem.veg, FoodItem.is_on, Category.catname AS category_name
        FROM FoodItem
        JOIN Category ON FoodItem.category = Category.catid
        WHERE FoodItem.active = 1
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
        console.error('Error fetching food items:', err);
        return [];
    }
});
//toggle menu items:
ipcMain.handle("toggle-menu-item", async (event, fid) => {
    return new Promise((resolve, reject) => {
        db.run(`
            UPDATE FoodItem 
            SET is_on = CASE WHEN is_on = 1 THEN 0 ELSE 1 END
            WHERE fid = ?`, 
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
});


//DELETING MENU ITEM
// IPC Event to Delete an Item
ipcMain.handle("delete-menu-item", async (event, fid) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM FoodItem WHERE fid = ?", [fid], function (err) {
            if (err) {
                console.error("Error deleting item:", err);
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
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