const { ipcRenderer } = require("electron");

function fetchTodaysOrders() {
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
            <tr>
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
    }, 100);
});

// Export function so it can be used in `renderer.js`
module.exports = { fetchTodaysOrders };
