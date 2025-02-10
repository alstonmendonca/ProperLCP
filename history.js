const { ipcRenderer } = require("electron");
const { attachContextMenu } = require("./contextMenu");
const { deleteOrder } = require("./deleteOrder");

function fetchOrderHistory(startDate = null, endDate = null) {
    // Use function parameters if available; otherwise, get from input fields
    if (!startDate) startDate = document.getElementById("startDate").value;
    if (!endDate) endDate = document.getElementById("endDate").value;

    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    // ✅ Store dates in sessionStorage
    sessionStorage.setItem("orderHistoryStartDate", startDate);
    sessionStorage.setItem("orderHistoryEndDate", endDate);

    ipcRenderer.send("get-order-history", { startDate, endDate });
}

ipcRenderer.on("order-history-response", (event, data) => {
    const orders = data.orders;
    const orderHistoryDiv = document.getElementById("orderHistoryDiv");
    orderHistoryDiv.innerHTML = "";

    if (orders.length === 0) {
        orderHistoryDiv.innerHTML = "<p>No orders found for the selected date range.</p>";
        return;
    }

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
    orderHistoryDiv.innerHTML = tableHTML;

    attachContextMenu(".order-history-table");

    setTimeout(() => {
        document.getElementById("exportExcelButton").addEventListener("click", () => {
            exportTableToExcel(".order-history-table");
        });
    }, 100);
});


function displayOrderHistory(orders) {
    const orderHistoryDiv = document.getElementById("orderHistoryDiv");
    orderHistoryDiv.innerHTML = "";

    if (orders.length === 0) {
        orderHistoryDiv.innerHTML = "<p>No orders found for the selected date range.</p>";
        return;
    }

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
    orderHistoryDiv.innerHTML = tableHTML;

    attachContextMenu(".order-history-table");

    setTimeout(() => {
        document.getElementById("exportExcelButton").addEventListener("click", () => {
            exportTableToExcel(".order-history-table");
        });
    }, 100);
}

ipcRenderer.on("refresh-order-history", () => {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    // ✅ If inputs are empty, use stored values
    if (!startDate) startDate = sessionStorage.getItem("orderHistoryStartDate");
    if (!endDate) endDate = sessionStorage.getItem("orderHistoryEndDate");
    
    if (startDate && endDate) {
        document.getElementById("startDate").value = startDate;
        document.getElementById("endDate").value = endDate;
        fetchOrderHistory();
    }
});

module.exports = { fetchOrderHistory, displayOrderHistory };
