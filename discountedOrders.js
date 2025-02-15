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
                    <th class="sortable" onclick="sortDiscountedOrdersTable('kot')">KOT ${getSortIndicator('kot')}</th>
                    <th class="date-column" onclick="sortDiscountedOrdersTable('date')">Date ${getSortIndicator('date')}</th>
                    <th class="sortable" onclick="sortDiscountedOrdersTable('Initial_price')">Initial Price (₹) ${getSortIndicator('Initial_price')}</th>
                    <th class="sortable" onclick="sortDiscountedOrdersTable('discount_percentage')">Discount (%) ${getSortIndicator('discount_percentage')}</th>
                    <th class="sortable" onclick="sortDiscountedOrdersTable('discount_amount')">Discount (₹) ${getSortIndicator('discount_amount')}</th>
                    <th class="sortable" onclick="sortDiscountedOrdersTable('Final_Price')">Final Price (₹) ${getSortIndicator('Final_Price')}</th>
                    <th>Food Items</th>
                </tr>
            </thead>
            <tbody>
    `;

    orders.forEach(order => {
        tableHTML += `
            <tr>
                <td>${order.billno}</td>
                <td>${order.kot}</td>
                <td class="date-column">${order.date}</td>
                <td>₹${order.Initial_price.toFixed(2)}</td>
                <td>${order.discount_percentage.toFixed(2)}</td>
                <td>₹${order.discount_amount.toFixed(2)}</td>
                <td>₹${order.Final_Price.toFixed(2)}</td>
                <td>${order.food_items || "No items"}</td>
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
            kot: row.cells[1].innerText,
            date: row.cells[2].innerText,
            Initial_price: parseFloat(row.cells[3].innerText.replace('₹', '').trim()),
            discount_percentage: parseFloat(row.cells[4].innerText),
            discount_amount: parseFloat(row.cells[5].innerText.replace('₹', '').trim()),
            Final_Price: parseFloat(row.cells[6].innerText.replace('₹', '').trim()),
            food_items: row.cells[7].innerText
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
        } else if (column === 'kot') {
            comparison = a.kot - b.kot;
        } else if (column === 'date') {
            comparison = new Date(a.date) - new Date(b.date); // Sort by date
        } else if (column === 'Initial_price') {
            comparison = a.Initial_price - b.Initial_price;
        } else if (column === 'discount_percentage') {
            comparison = a.discount_percentage - b.discount_percentage;
        } else if (column === 'discount_amount') {
            comparison = a.discount_amount - b.discount_amount;
        } else if (column === 'Final_Price') {
            comparison = a.Final_Price - b.Final_Price;
        }

        return currentSortOrder === 'asc' ? comparison : -comparison;
    });

    // Rebuild the table with sorted data
    let sortedTableHTML = `
        <table class="order-history-table">
            <thead>
                <tr>
                    <th class="sortable" onclick="sortDiscountedOrdersTable('billno')">Bill No ${getSortIndicator('billno')}</th>
                    <th class="sortable" onclick="sortDiscountedOrdersTable('kot')">KOT ${getSortIndicator('kot')}</th>
                    <th class="date-column" onclick="sortDiscountedOrdersTable('date')">Date ${getSortIndicator('date')}</th>
                    <th class="sortable" onclick="sortDiscountedOrdersTable('Initial_price')">Initial Price (₹) ${getSortIndicator('Initial_price')}</th>
                    <th class="sortable" onclick="sortDiscountedOrdersTable('discount_percentage')">Discount (%) ${getSortIndicator('discount_percentage')}</th>
                    <th class="sortable" onclick="sortDiscountedOrdersTable('discount_amount')">Discount (₹) ${getSortIndicator('discount_amount')}</th>
                    <th class="sortable" onclick="sortDiscountedOrdersTable('Final_Price')">Final Price (₹) ${getSortIndicator('Final_Price')}</th>
                    <th>Food Items</th>
                </tr>
            </thead>
            <tbody>
    `;

    orders.forEach(order => {
        sortedTableHTML += `
            <tr>
                <td>${order.billno}</td>
                <td>${order.kot}</td>
                <td class="date-column">${order.date}</td>
                <td>₹${order.Initial_price.toFixed(2)}</td>
                <td>${order.discount_percentage.toFixed(2)}</td>
                <td>₹${order.discount_amount.toFixed(2)}</td>
                <td>₹${order.Final_Price.toFixed(2)}</td>
                <td>${order.food_items || "No items"}</td>
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

// Function to clear discounted orders
async function clearDiscountedOrders() {
    return new Promise((resolve) => {
        ipcRenderer.send("clear-discounted-orders");

        ipcRenderer.once("clear-discounted-orders-response", (event, response) => {
            if (response.success) {
                alert("All discounted orders have been cleared.");
            } else {
                alert("Failed to clear discounted orders.");
            }
            resolve();
        });
    });
}
// Export functions
module.exports = { fetchDiscountedOrders, sortDiscountedOrdersTable, clearDiscountedOrders };