const { ipcRenderer } = require("electron");
const { attachTodaysOrdersContextMenu } = require("./todaysOrdersContextMenu");
const { deleteOrder } = require("./deleteOrder");
const { exportTableToExcel } = require("./export");

function fetchTodaysOrders() {
    ipcRenderer.send("get-todays-orders");
}

// Receive today's orders from the main process and update the UI
ipcRenderer.on("todays-orders-response", (event, data) => {
    const orders = data.orders;
    const todaysOrdersDiv = document.getElementById("todaysOrdersDiv");
    todaysOrdersDiv.innerHTML = ""; // Clear previous content

    if (orders.length === 0) {
        todaysOrdersDiv.innerHTML = `
            <div style="text-align: center; font-family: 'Arial', sans-serif; background-color: #f5f5f5; color: #333; display: flex; justify-content: center; align-items: center; height: 78vh; margin: 0;">
                <div>
                    <div style="font-size: 72px; font-weight: bold; margin-bottom: 20px;">
                        No Orders For Today
                    </div>
                    <div style="font-size: 24px; margin-bottom: 40px;">
                        Come back after placing an order!
                    </div>
                    <button id='goHomeButton' style="font-size: 18px; color: #fff; background-color: #1DB954; padding: 10px 20px; border: none; border-radius: 25px; text-decoration: none; cursor: pointer;">
                        Place an Order
                    </button>
                </div>
            </div>
        `;
        document.getElementById('goHomeButton').addEventListener('click', function () {
            document.getElementById('Home').click();
        });
        return;
    }

    // Create a grid layout for today's orders
    let gridHTML = `<div class="todays-orders-grid">`;

    orders.forEach(order => {
        gridHTML += `
            <div class="todays-order-box" data-billno="${order.billno}">
                <div class="todays-orders-edit-button" onclick="openTodayEditOrder(${order.billno})">✏️</div>
                <h3>Bill No: ${order.billno}</h3>
                <p>Cashier: ${order.cashier_name}</p>
                <p>KOT: ${order.kot}</p>
                <p>Price: ₹${order.price.toFixed(2)}</p>
                <p>SGST: ₹${order.sgst.toFixed(2)}</p>
                <p>CGST: ₹${order.cgst.toFixed(2)}</p>
                <p>Tax: ₹${order.tax.toFixed(2)}</p>
                <p>Food Items: ${order.food_items || "No items"}</p>
            </div>
        `;
    });

    gridHTML += `</div>`;
    todaysOrdersDiv.innerHTML = gridHTML;

    // Attach context menu to each order box
    attachTodaysOrdersContextMenu(".todays-order-box", "todaysOrders");

    // Add event listener for the export button
    setTimeout(() => {
        document.getElementById("exportExcelButton").addEventListener("click", () => {
            exportTodaysOrdersToExcel(orders);
        });
    }, 100);
});

// Function to export today's orders to Excel
function exportTodaysOrdersToExcel(orders) {
    // Create a table element
    const table = document.createElement("table");
    table.classList.add("order-history-table");

    // Create the table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const headers = ["Bill No", "Date", "Cashier", "KOT", "Price (₹)", "SGST (₹)", "CGST (₹)", "Tax (₹)", "Food Items"];

    headers.forEach(headerText => {
        const th = document.createElement("th");
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create the table body
    const tbody = document.createElement("tbody");

    orders.forEach(order => {
        const row = document.createElement("tr");
        const date = new Date().toISOString().split("T")[0]; // Today's date

        const cells = [
            order.billno,
            date,
            order.cashier_name,
            order.kot,
            order.price.toFixed(2),
            order.sgst.toFixed(2),
            order.cgst.toFixed(2),
            order.tax.toFixed(2),
            order.food_items || "No items"
        ];

        cells.forEach(cellText => {
            const td = document.createElement("td");
            td.textContent = cellText;
            row.appendChild(td);
        });

        tbody.appendChild(row);
    });

    table.appendChild(tbody);

    // Append the table to the body (temporarily) to export it
    document.body.appendChild(table);
    exportTableToExcel(".order-history-table", "todays_orders.xlsx");
    document.body.removeChild(table); // Remove the table after export
}

// Function to open edit order and populate the bill panel
function openTodayEditOrder(billno) {
    console.log("Edit order for Bill No:", billno);

    // Store the bill number in sessionStorage
    sessionStorage.setItem("editingBillNo", billno);

    // Change the content type to Home
    updateMainContent('Home');

    // Enable edit mode in the bill panel
    displayEditMode();

    // Send a request to get the food items for the selected order
    ipcRenderer.send("get-order-details", billno);
}

// Listen for the response with order details
// Listen for the response with order details
ipcRenderer.on("order-details-response", (event, orderDetails) => {
    // Clear the bill panel before adding items
    resetBill();

    // Add each item to the bill panel
    orderDetails.food_items.forEach(item => {
        addToBill(item.foodId, item.foodName, item.price, item.quantity);
    });

    // Update the total amount
    updateBillTotal();
});

// Refresh "Today's Orders" after deletion
ipcRenderer.on("refresh-order-history", () => {
    fetchTodaysOrders(); // Re-fetch the orders
});

// Ensure that today's orders refresh when an order is deleted
ipcRenderer.on("order-deleted", (event, { source }) => {
    if (source === "todaysOrders") {
        fetchTodaysOrders();
    }
});

// Export function so it can be used in `renderer.js`
module.exports = { fetchTodaysOrders, openTodayEditOrder };