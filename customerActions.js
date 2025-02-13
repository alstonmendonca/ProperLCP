const { ipcMain } = require('electron');
const sqlite3 = require('sqlite3').verbose();

// Fetch all customers
ipcMain.handle('get-customers', async () => {
    const db = new sqlite3.Database('your-database.db');
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM Customer", [], (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
        db.close();
    });
});

// Add a new customer
ipcMain.handle('add-customer', async (event, customer) => {
    const { cname, phone, address } = customer;
    const db = new sqlite3.Database('your-database.db');

    return new Promise((resolve, reject) => {
        db.run("INSERT INTO Customer (cname, phone, address) VALUES (?, ?, ?)", 
            [cname, phone, address || null], 
            function (err) {
                if (err) reject(err);
                resolve();
            }
        );
        db.close();
    });
});
