const { ipcRenderer, contextBridge } = require("electron");
const { updateCategoryPanel } = require("./categoryHandler");
const { fetchCategories } = require("./categoryDropDown");
const { fetchCategoryWise } = require("./categoryWiseTable");
const { fetchDeletedOrders } = require("./deletedOrdersTable");
//const { fetchTodaysOrders } = require("./todaysOrders");
const { fetchOrderHistory, exportToExcel } = require("./history");
// Expose functions to the global scope
window.fetchOrderHistory = fetchOrderHistory;
window.exportToExcel = exportToExcel;
window.fetchDeletedOrders = fetchDeletedOrders;
//window.fetchTodaysOrders = fetchTodaysOrders;
window.fetchCategories = fetchCategories;
window.fetchCategoryWise = fetchCategoryWise;
window.updateCategoryPanel = updateCategoryPanel;

// Order history functions (via ipcRenderer)
window.fetchOrderHistory = (startDate, endDate) => ipcRenderer.send("get-order-history", { startDate, endDate });
window.exportToExcel = () => ipcRenderer.send("export-excel");

// Listen for order history response
ipcRenderer.on("order-history-response", (event, data) => {
    const orders = data.orders;
    const orderHistoryDiv = document.getElementById("orderHistoryDiv");
    orderHistoryDiv.innerHTML = "";

    if (orders.length === 0) {
        orderHistoryDiv.innerHTML = "<p>No orders found for the selected date range.</p>";
        return;
    }

    let tableHTML = `<table class="order-history-table">
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
            <tbody>`;

    orders.forEach(order => {
        tableHTML += `<tr>
                <td>${order.billno}</td>
                <td>${order.date}</td>
                <td>${order.cashier_name}</td>
                <td>${order.kot}</td>
                <td>${order.price.toFixed(2)}</td>
                <td>${order.sgst.toFixed(2)}</td>
                <td>${order.cgst.toFixed(2)}</td>
                <td>${order.tax.toFixed(2)}</td>
                <td>${order.food_items || "No items"}</td>
            </tr>`;
    });

    tableHTML += `</tbody></table>`;
    orderHistoryDiv.innerHTML = tableHTML;
});

// Listen for export completion message
ipcRenderer.on("show-excel-export-message", (event, message) => {
    alert(message.message);
});

console.log("Renderer.js loaded");

// Listen for the 'set-user-role' message from the main process
ipcRenderer.on("set-user-role", (event, role) => {
    const content = document.getElementById("content"); // Assuming this is the main container
    if (content) {
        content.classList.add("fade-in");
        console.log(`Received role: ${role}`);
        const billPanel = document.getElementById("bill-panel");
        billPanel.style.display = "none";
        if (role === "staff") {
            console.log("Hiding buttons for staff via 'set-user-role'");
            document.getElementById("Analytics").style.display = "none";
            document.getElementById("History").style.display = "none";
        }
    }
});

// Listen for category addition success
ipcRenderer.on("category-added-success", () => {
    alert("Category added successfully!");
});
