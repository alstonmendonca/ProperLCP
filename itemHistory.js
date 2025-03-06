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
                <td class="date-column">${order.date}</td>
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

module.exports = { fetchItemHistory, displayItemHistory, sortItemHistoryTable };
