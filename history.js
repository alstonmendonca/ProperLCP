const { ipcRenderer } = require("electron");
const { attachContextMenu } = require("./contextMenu");
const { deleteOrder } = require("./deleteOrder");

let currentSortBy = null;
let currentSortOrder = 'asc'; // Default sort order

function fetchOrderHistory(startDate = null, endDate = null) {
    // Use function parameters if available; otherwise, get from input fields
    if (!startDate) startDate = document.getElementById("startDate").value;
    if (!endDate) endDate = document.getElementById("endDate").value;

    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    // Store dates in sessionStorage
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
                    <th class="sortable" onclick="sortOrderHistoryTable('billno')">Bill No ${getSortIndicator('billno')}</th>
                    <th class="date-column sortable" onclick="sortOrderHistoryTable('date')">Date ${getSortIndicator('date')}</th>
                    <th class="sortable" onclick="sortOrderHistoryTable('cashier_name')">Cashier ${getSortIndicator('cashier_name')}</th>
                    <th class="sortable" onclick="sortOrderHistoryTable('kot')">KOT ${getSortIndicator('kot')}</th>
                    <th class="sortable" onclick="sortOrderHistoryTable('price')">Price (₹) ${getSortIndicator('price')}</th>
                    <th class="sortable" onclick="sortOrderHistoryTable('sgst')">SGST (₹) ${getSortIndicator('sgst')}</th>
                    <th class="sortable" onclick="sortOrderHistoryTable('cgst')">CGST (₹) ${getSortIndicator('cgst')}</th>
                    <th class="sortable" onclick="sortOrderHistoryTable('tax')">Tax (₹) ${getSortIndicator('tax')}</th>
                    <th>Food Items</th>
                </tr>
            </thead>
            <tbody>
    `;

    orders.forEach(order => {
        tableHTML += `
            <tr data-billno="${order.billno}">
                <td>${order.billno}</td>
                <td class="date-column">${order.date}</td>
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

// Function to sort order history table
function sortOrderHistoryTable(column) {
    const orderHistoryDiv = document.getElementById("orderHistoryDiv");
    const orders = Array.from(orderHistoryDiv.querySelectorAll("tbody tr")).map(row => {
        return {
            billno: row.cells[0].innerText,
            date: row.cells[1].innerText,
            cashier_name: row.cells[2].innerText,
            kot: row.cells[3].innerText,
            price: parseFloat(row.cells[4].innerText),
            sgst: parseFloat(row.cells[5].innerText),
            cgst: parseFloat(row.cells[6].innerText),
            tax: parseFloat(row.cells[7].innerText),
            food_items: row.cells[8].innerText
        };
    });

    // Determine sort order
    if (currentSortBy === column) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc'; // Toggle sort order
    } else {
        currentSortOrder = 'asc'; // Reset to ascending if a new column is sorted
    }
    currentSortBy = column;

    // Sort the orders
    orders.sort((a, b) => {
        let comparison = 0;
        if (column === 'billno') {
            comparison = a.billno - b.billno;
        } else if (column === 'date') {
            comparison = new Date(a.date) - new Date(b.date); // Sort by date
        } else if (column === 'cashier_name') {
            comparison = a.cashier_name.localeCompare(b.cashier_name);
        } else if (column === 'kot') {
            comparison = a.kot - b.kot;
        } else if (column === 'price') {
            comparison = a.price - b.price;
        } else if (column === 'sgst') {
            comparison = a.sgst - b.sgst;
        } else if (column === 'cgst') {
            comparison = a.cgst - b.cgst;
        } else if (column === 'tax') {
            comparison = a.tax - b.tax;
        }

        return currentSortOrder === 'asc' ? comparison : -comparison;
    });

    // Rebuild the table with sorted data
    let sortedTableHTML = `
        <table class="order-history-table">
            <thead>
                <tr>
                    <th class="sortable" onclick="sortOrderHistoryTable('billno')">Bill No ${getSortIndicator('billno')}</th>
                    <th class="date-column sortable" onclick="sortOrderHistoryTable('date')">Date ${getSortIndicator('date')}</th>
                    <th class="sortable" onclick="sortOrderHistoryTable('cashier_name')">Cashier ${getSortIndicator('cashier_name')}</th>
                    <th class="sortable" onclick="sortOrderHistoryTable('kot')">KOT ${getSortIndicator('kot')}</th>
                    <th class="sortable" onclick="sortOrderHistoryTable('price')">Price (₹) ${getSortIndicator('price')}</th>
                    <th class="sortable" onclick="sortOrderHistoryTable('sgst')">SGST (₹) ${getSortIndicator('sgst')}</th>
                    <th class="sortable" onclick="sortOrderHistoryTable('cgst')">CGST (₹) ${getSortIndicator('cgst')}</th>
                    <th class="sortable" onclick="sortOrderHistoryTable('tax')">Tax (₹) ${getSortIndicator('tax')}</th>
                    <th>Food Items</th>
                </tr>
            </thead>
            <tbody>
    `;

    orders.forEach(order => {
        sortedTableHTML += `
            <tr data-billno="${order.billno}">
                <td>${order.billno}</td>
                <td class="date-column">${order.date}</td>
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

    sortedTableHTML += `</tbody></table>`;
    orderHistoryDiv.innerHTML = sortedTableHTML;

    // Reattach the context menu to the new rows
    attachContextMenu(".order-history-table", "orderHistory");
}

// Function to get the sort indicator (▲ or ▼) for a column
function getSortIndicator(sortBy) {
    if (currentSortBy === sortBy) {
        return currentSortOrder === 'asc' ? '▲' : '▼';
    }
    return ''; // No indicator if the column is not sorted
}

module.exports = { fetchOrderHistory, sortOrderHistoryTable };