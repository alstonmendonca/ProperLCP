const { ipcRenderer } = require("electron");

// Function to fetch discounted orders
function fetchDiscountedOrders() {
    ipcRenderer.send("get-discounted-orders");
}

// Receive discounted orders from the main process and update the UI
ipcRenderer.on("discounted-orders-response", (event, data) => {
    const orders = data.orders;
    const discountedOrdersDiv = document.getElementById("discountedOrdersDiv");
    discountedOrdersDiv.innerHTML = ""; // Clear previous content

    if (orders.length === 0) {
        discountedOrdersDiv.innerHTML = "<p>No discounted orders found.</p>";
        return;
    }

    // Create a table for discounted orders
    let tableHTML = `
        <table class="order-history-table">
            <thead>
                <tr>
                    <th class="sortable" onclick="sortDiscountedOrdersTable('billno')">Bill No ${getSortIndicator('billno')}</th>
                    <th class="sortable" onclick="sortDiscountedOrdersTable('discount_percentage')">Discount (%) ${getSortIndicator('discount_percentage')}</th>
                    <th class="sortable" onclick="sortDiscountedOrdersTable('discount_amount')">Discount (₹) ${getSortIndicator('discount_amount')}</th>
                </tr>
            </thead>
            <tbody>
    `;

    orders.forEach(order => {
        tableHTML += `
            <tr>
                <td>${order.billno}</td>
                <td>${order.discount_percentage.toFixed(2)}</td>
                <td>₹${order.discount_amount.toFixed(2)}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    discountedOrdersDiv.innerHTML = tableHTML;

    // Attach sorting functionality
    setTimeout(() => {
        document.getElementById("exportExcelButton").addEventListener("click", () => {
            exportTableToExcel(".order-history-table");
        });
    }, 100);
});

// Function to sort discounted orders table
let currentSortBy = null;
let currentSortOrder = 'asc'; // Default sort order

function sortDiscountedOrdersTable(column) {
    const discountedOrdersDiv = document.getElementById("discountedOrdersDiv");
    const orders = Array.from(discountedOrdersDiv.querySelectorAll("tbody tr")).map(row => {
        return {
            billno: row.cells[0].innerText,
            discount_percentage: parseFloat(row.cells[1].innerText),
            discount_amount: parseFloat(row.cells[2].innerText.replace('₹', '').trim())
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
        } else if (column === 'discount_percentage') {
            comparison = a.discount_percentage - b.discount_percentage;
        } else if (column === 'discount_amount') {
            comparison = a.discount_amount - b.discount_amount;
        }

        return currentSortOrder === 'asc' ? comparison : -comparison;
    });

    // Rebuild the table with sorted data
    let sortedTableHTML = `
        <table class="order-history-table">
            <thead>
                <tr>
                    <th class="sortable" onclick="sortDiscountedOrdersTable('billno')">Bill No ${getSortIndicator('billno')}</th>
                    <th class="sortable" onclick="sortDiscountedOrdersTable('discount_percentage')">Discount (%) ${getSortIndicator('discount_percentage')}</th>
                    <th class="sortable" onclick="sortDiscountedOrdersTable('discount_amount')">Discount (₹) ${getSortIndicator('discount_amount')}</th>
                </tr>
            </thead>
            <tbody>
    `;

    orders.forEach(order => {
        sortedTableHTML += `
            <tr>
                <td>${order.billno}</td>
                <td>${order.discount_percentage.toFixed(2)}</td>
                <td>₹${order.discount_amount.toFixed(2)}</td>
            </tr>
        `;
    });

    sortedTableHTML += `</tbody></table>`;
    discountedOrdersDiv.innerHTML = sortedTableHTML;
}

// Function to get the sort indicator (▲ or ▼) for a column
function getSortIndicator(sortBy) {
    if (currentSortBy === sortBy) {
        return currentSortOrder === 'asc' ? '▲' : '▼';
    }
    return ''; // No indicator if the column is not sorted
}

// Export functions
module.exports = { fetchDiscountedOrders, sortDiscountedOrdersTable };