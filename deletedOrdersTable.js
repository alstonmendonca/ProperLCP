const { ipcRenderer } = require("electron");

function fetchDeletedOrders() {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    // Store the selected dates in sessionStorage
    sessionStorage.setItem("deletedOrdersStartDate", startDate);
    sessionStorage.setItem("deletedOrdersEndDate", endDate);

    ipcRenderer.send("get-deleted-orders", { startDate, endDate });
}

// Function to display deleted orders table
function displayDeletedOrders(orders) {
    const orderHistoryDiv = document.getElementById("deletedOrdersDiv");
    orderHistoryDiv.innerHTML = ""; // Clear previous content

    if (orders.length === 0) {
        orderHistoryDiv.innerHTML = "<p>No deleted orders found for the selected date range.</p>";
        return;
    }

    // Create a table
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
                    <th>Reason</th>
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
                <td>${order.reason}</td>
                <td>${order.food_items || "No items"}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    orderHistoryDiv.innerHTML = tableHTML;

    setTimeout(() => {
        document.getElementById("exportExcelButton").addEventListener("click", () => {
            exportTableToExcel(".order-history-table");
        });
    }, 100);
}

// ✅ Store deleted orders data and display it
ipcRenderer.on("deleted-orders-response", (event, data) => {
    displayDeletedOrders(data.orders);
});

// Export functions
module.exports = { fetchDeletedOrders, displayDeletedOrders };
