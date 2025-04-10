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
        orderHistoryDiv.innerHTML = `
            <div style="text-align: center; font-family: 'Arial', sans-serif; background-color:rgb(232, 232, 232); color: #333; display: flex; justify-content: center; align-items: center; height: 78vh; margin: 0;">
                <div>
                    <div style="font-size: 72px; font-weight: bold; margin-bottom: 20px;">
                        No Orders Found!
                    </div>
                    <img src="sadErrorFace.png" alt="No Customers Found" class="no-customers-img">  
                </div>
            </div>
        `;
        document.getElementById('goHomeButton').addEventListener('click', function () {
            document.getElementById('Home').click();
        });
        return;
    }

    // Create a table
    let tableHTML = `
        <table class="order-history-table">
            <thead>
                <tr>
                    <th class="sortable" onclick="sortDeletedOrdersTable('billno')">Bill No ${getSortIndicator('billno')}</th>
                    <th class="sortable date-column" onclick="sortDeletedOrdersTable('date')">Date ${getSortIndicator('date')}</th>
                    <th class="sortable" onclick="sortDeletedOrdersTable('cashier_name')">Cashier ${getSortIndicator('cashier_name')}</th>
                    <th class="sortable" onclick="sortDeletedOrdersTable('kot')">KOT ${getSortIndicator('kot')}</th>
                    <th class="sortable" onclick="sortDeletedOrdersTable('price')">Price (₹) ${getSortIndicator('price')}</th>
                    <th class="sortable" onclick="sortDeletedOrdersTable('sgst')">SGST (₹) ${getSortIndicator('sgst')}</th>
                    <th class="sortable" onclick="sortDeletedOrdersTable('cgst')">CGST (₹) ${getSortIndicator('cgst')}</th>
                    <th class="sortable" onclick="sortDeletedOrdersTable('tax')">Tax (₹) ${getSortIndicator('tax')}</th>
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
                <td class="date-column">${formatDate(order.date)}</td>
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

// Function to sort deleted orders table
let currentSortBy = null;
let currentSortOrder = 'asc'; // Default sort order

function sortDeletedOrdersTable(column) {
    const deletedOrdersDiv = document.getElementById("deletedOrdersDiv");
    const orders = Array.from(deletedOrdersDiv.querySelectorAll("tbody tr")).map(row => {
        return {
            billno: row.cells[0].innerText,
            date: row.cells[1].innerText,
            cashier_name: row.cells[2].innerText,
            kot: row.cells[3].innerText,
            price: parseFloat(row.cells[4].innerText),
            sgst: parseFloat(row.cells[5].innerText),
            cgst: parseFloat(row.cells[6].innerText),
            tax: parseFloat(row.cells[7].innerText),
            reason: row.cells[8].innerText,
            food_items: row.cells[9].innerText
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
                    <th class="sortable" onclick="sortDeletedOrdersTable('billno')">Bill No ${getSortIndicator('billno')}</th>
                    <th class="sortable date-column" onclick="sortDeletedOrdersTable('date')">Date ${getSortIndicator('date')}</th>
                    <th class="sortable" onclick="sortDeletedOrdersTable('cashier_name')">Cashier ${getSortIndicator('cashier_name')}</th>
                    <th class="sortable" onclick="sortDeletedOrdersTable('kot')">KOT ${getSortIndicator('kot')}</th>
                    <th class="sortable" onclick="sortDeletedOrdersTable('price')">Price (₹) ${getSortIndicator('price')}</th>
                    <th class="sortable" onclick="sortDeletedOrdersTable('sgst')">SGST (₹) ${getSortIndicator('sgst')}</th>
                    <th class="sortable" onclick="sortDeletedOrdersTable('cgst')">CGST (₹) ${getSortIndicator('cgst')}</th>
                    <th class="sortable" onclick="sortDeletedOrdersTable('tax')">Tax (₹) ${getSortIndicator('tax')}</th>
                    <th>Reason</th>
                    <th>Food Items</th>
                </tr>
            </thead>
            <tbody>
    `;

    orders.forEach(order => {
        sortedTableHTML += `
            <tr>
                <td>${order.billno}</td>
                <td class="date-column">${order.date}</td>
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

    sortedTableHTML += `</tbody></table>`;
    deletedOrdersDiv.innerHTML = sortedTableHTML;
}

// Function to get the sort indicator (▲ or ▼) for a column
function getSortIndicator(sortBy) {
    if (currentSortBy === sortBy) {
        return currentSortOrder === 'asc' ? '▲' : '▼';
    }
    return ''; // No indicator if the column is not sorted
}

// Export functions
module.exports = { fetchDeletedOrders, displayDeletedOrders, sortDeletedOrdersTable };