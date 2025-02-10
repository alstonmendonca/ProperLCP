const { ipcRenderer } = require("electron");
const { attachContextMenu } = require("./contextMenu");
const { deleteOrder } = require("./deleteOrder");

function fetchTodaysOrders() {
    // sessionStorage.removeItem("todaysOrdersData"); // Clear old data
    ipcRenderer.send("get-todays-orders");
}

// Receive today's orders from the main process and update the UI
ipcRenderer.on("todays-orders-response", (event, data) => {
    //console.log("Received today's orders:", data);
    const orders = data.orders;
    const todaysOrdersDiv = document.getElementById("todaysOrdersDiv");
    todaysOrdersDiv.innerHTML = ""; // Clear previous content

    if (orders.length === 0) {
        todaysOrdersDiv.innerHTML = "<p>No orders found for today.</p>";
        return;
    }

    // Create a table (same layout as order history)
    let tableHTML = `
        <table class="order-history-table">
            <thead>
                <tr>
                    <th>Bill No</th>
                    <th>Date</th>
                    <th>Cashier</th>
                    <th>KOT</th>
                    <th>Price (₹)</th>
                    <th>SGST (₹)</th>
                    <th>CGST (₹)</th>
                    <th>Tax (₹)</th>
                    <th>Food Items</th>
                </tr>
            </thead>
            <tbody>
    `;

    orders.forEach(order => {
        tableHTML += `
            <tr data-billno="${order.billno}">
                <td>${order.billno}</td>
                <td>${order.date}</td>
                <td>${order.cashier_name}</td>
                <td>${order.kot}</td>
                <td>${order.price.toFixed(2)}</td>
                <td>${order.sgst.toFixed(2)}</td>
                <td>${order.cgst.toFixed(2)}</td>
                <td>${order.tax.toFixed(2)}</td>
                <td>${order.food_items || "No items"}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    todaysOrdersDiv.innerHTML = tableHTML;

    // Attach export button functionality
    setTimeout(() => {
        document.getElementById("exportExcelButton").addEventListener("click", () => {
            exportTableToExcel(".order-history-table");
        });
        attachContextMenu(".order-history-table", "todaysOrders"); // Re-attach menu
    }, 100);
});

// ✅ Refresh "Today's Orders" after deletion
ipcRenderer.on("refresh-order-history", () => {
    console.log("Refreshing today's orders after deletion...");
    fetchTodaysOrders(); // Re-fetch the orders
});

// ✅ Ensure that today's orders refresh when an order is deleted
ipcRenderer.on("order-deleted", (event, { source }) => {
    if (source === "todaysOrders") {
        console.log("Refreshing today's orders after order deletion...");
        fetchTodaysOrders();
    }
});

// Export function so it can be used in `renderer.js`
module.exports = { fetchTodaysOrders };
