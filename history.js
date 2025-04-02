const { ipcRenderer } = require("electron");
const { attachContextMenu } = require("./contextMenu");
const { deleteOrder } = require("./deleteOrder");
const { exportTableToExcel } = require("./export");

let currentSortBy = null;
let currentSortOrder = 'asc'; // Default sort order

// New function to load the Order History UI
function loadOrderHistory(mainContent, billPanel) {
    // Apply margins and hide bill panel
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    const today = new Date().toISOString().split("T")[0];

    mainContent.innerHTML = `
        <div class="order-history-header">
            <h1>Order History</h1>
            <div class="date-filters">
                <label for="startDate">Start Date:</label>
                <input type="date" id="startDate" value="${today}">
                
                <label for="endDate">End Date:</label>
                <input type="date" id="endDate" value="${today}">
                
                <button class="showHistoryButton">Show History</button>
                <button id="exportExcelButton">Export to Excel</button>
            </div>
        </div>
        <div id="orderHistoryDiv"></div>
    `;

    // Load saved dates from sessionStorage
    const savedStartDate = sessionStorage.getItem("orderHistoryStartDate");
    const savedEndDate = sessionStorage.getItem("orderHistoryEndDate");

    if (savedStartDate) document.getElementById("startDate").value = savedStartDate;
    if (savedEndDate) document.getElementById("endDate").value = savedEndDate;

    // Set up event listeners
    document.querySelector(".showHistoryButton").addEventListener("click", () => {
        fetchOrderHistory();
    });

    // Initial fetch
    if (savedStartDate && savedEndDate) {
        fetchOrderHistory(savedStartDate, savedEndDate);
    } else {
        fetchOrderHistory(today, today);
    }
}

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
        orderHistoryDiv.innerHTML = `
            <div style="text-align: center; font-family: 'Arial', sans-serif; background-color: #f5f5f5; color: #333; display: flex; justify-content: center; align-items: center; height: 78vh; margin: 0;">
                <div>
                    <div style="font-size: 72px; font-weight: bold; margin-bottom: 20px;">
                        No Orders Found!
                    </div>
                </div>
            </div>
        `;
        document.getElementById('goHomeButton').addEventListener('click', function () {
            document.getElementById('Home').click();
        });
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
                <td class="date-column">${formatDate(order.date)}</td>
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
            // Parse the formatted date (dd-mm-yy) for sorting
            const dateA = parseFormattedDate(a.date);
            const dateB = parseFormattedDate(b.date);
            comparison = dateA - dateB;
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

// Function to parse a formatted date (dd-mm-yy) into a Date object
function parseFormattedDate(dateString) {
    const [day, month, year] = dateString.split('-');
    return new Date(`20${year}-${month}-${day}`); // Convert to yyyy-mm-dd format
}

// Function to get the sort indicator (▲ or ▼) for a column
function getSortIndicator(sortBy) {
    if (currentSortBy === sortBy) {
        return currentSortOrder === 'asc' ? '▲' : '▼';
    }
    return ''; // No indicator if the column is not sorted
}

// Function to format date from yyyy-mm-dd to dd-mm-yy
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0'); // Ensure 2 digits
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = String(date.getFullYear()).slice(-2); // Get last 2 digits of the year
    return `${day}-${month}-${year}`;
}

module.exports = { fetchOrderHistory, sortOrderHistoryTable, loadOrderHistory };