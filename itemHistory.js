const { ipcRenderer } = require("electron");


let currentSortByItemHistory = null;
let currentSortOrderItemHistory = "asc";

function fetchItemHistory(startDate = null, endDate = null, foodItem = null) {
    if (!startDate) startDate = document.getElementById("itemStartDate").value;
    if (!endDate) endDate = document.getElementById("itemEndDate").value;
    if (!foodItem) foodItem = document.getElementById("foodItemDropdown").value;

    if (!startDate || !endDate) {
        showPopupMessage("Please select both start and end dates.");
        return;
    }

    if (!foodItem) {
        showPopupMessage("Please select a food item.");
        return;
    }

    sessionStorage.setItem("itemHistoryStartDate", startDate);
    sessionStorage.setItem("itemHistoryEndDate", endDate);
    sessionStorage.setItem("itemHistoryFood", foodItem);

    ipcRenderer.send("get-item-history", { startDate, endDate, foodItem });
}

ipcRenderer.on("item-history-response", (event, data) => {
    displayItemHistory(data.orders);
});

function displayItemHistory(orders) {
    const itemHistoryDiv = document.getElementById("itemHistoryDiv");
    itemHistoryDiv.innerHTML = "";

    if (orders.length === 0) {
        itemHistoryDiv.innerHTML = `
            <div style="text-align: center; font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333; display: flex; justify-content: center; align-items: center; height: 78vh; margin: 0;">
                <div>
                    <div style="font-size: 72px; font-weight: bold; margin-bottom: 20px;">
                        No Orders Found!
                    </div>
                </div>
            </div>
        `;
        return;
    }

    if (currentSortByItemHistory) {
        orders = sortOrders(orders, currentSortByItemHistory);
    }

    let tableHTML = `
        <table class="order-history-table">
            <thead>
                <tr>
                    <th class="sortable" onclick="sortItemHistoryTable('billno')">Bill No ${getSortIndicatorItemHistory('billno')}</th>
                    <th class="date-column sortable" onclick="sortItemHistoryTable('date')">Date ${getSortIndicatorItemHistory('date')}</th>
                    <th class="sortable" onclick="sortItemHistoryTable('cashier_name')">Cashier ${getSortIndicatorItemHistory('cashier_name')}</th>
                    <th class="sortable" onclick="sortItemHistoryTable('kot')">KOT ${getSortIndicatorItemHistory('kot')}</th>
                    <th class="sortable" onclick="sortItemHistoryTable('price')">Price (₹) ${getSortIndicatorItemHistory('price')}</th>
                    <th class="sortable" onclick="sortItemHistoryTable('sgst')">SGST (₹) ${getSortIndicatorItemHistory('sgst')}</th>
                    <th class="sortable" onclick="sortItemHistoryTable('cgst')">CGST (₹) ${getSortIndicatorItemHistory('cgst')}</th>
                    <th class="sortable" onclick="sortItemHistoryTable('tax')">Tax (₹) ${getSortIndicatorItemHistory('tax')}</th>
                    <th>Food Items</th>
                </tr>
            </thead>
            <tbody>
    `;

    orders.forEach(order => {
        tableHTML += `
            <tr>
                <td>${order.billno}</td>
                <td class="date-column">${formatDate(order.date)}</td>
                <td>${order.cashier_name || "N/A"}</td>
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
    itemHistoryDiv.innerHTML = tableHTML;

    setTimeout(() => {
        document.getElementById("exportExcelButton").addEventListener("click", () => {
            exportTableToExcel(".order-history-table");
        });
    }, 100);
}

function sortOrders(orders, column) {
    return orders.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return currentSortOrderItemHistory === "asc" ? -1 : 1;
        if (valA > valB) return currentSortOrderItemHistory === "asc" ? 1 : -1;
        return 0;
    });
}

function sortItemHistoryTable(column) {
    if (currentSortByItemHistory === column) {
        currentSortOrderItemHistory = currentSortOrderItemHistory === "asc" ? "desc" : "asc";
    } else {
        currentSortByItemHistory = column;
        currentSortOrderItemHistory = "asc";
    }
    fetchItemHistory();
}

function getSortIndicatorItemHistory(column) {
    if (currentSortByItemHistory === column) {
        return currentSortOrderItemHistory === "asc" ? "▲" : "▼";
    }
    return "";
}

// Function to format date from yyyy-mm-dd to dd-mm-yy
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0'); // Ensure 2 digits
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = String(date.getFullYear()).slice(-2); // Get last 2 digits of the year
    return `${day}-${month}-${year}`;
}

// Function to parse a formatted date (dd-mm-yy) into a Date object
function parseFormattedDate(dateString) {
    const [day, month, year] = dateString.split('-');
    return new Date(`20${year}-${month}-${day}`); // Convert to yyyy-mm-dd format
}

module.exports = { fetchItemHistory, displayItemHistory, sortItemHistoryTable };
