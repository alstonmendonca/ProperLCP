const { ipcRenderer } = require("electron");
const  {createTextPopup} = require("./textPopup");

// Function to fetch discounted orders
function fetchDiscountedOrders(startDate, endDate) {
    ipcRenderer.send("get-discounted-orders", { startDate, endDate });
}

// Receive discounted orders from the main process and update the UI
ipcRenderer.on("discounted-orders-response", (event, data) => {
    const orders = data.orders;
    const discountedOrdersDiv = document.getElementById("discountedOrdersDiv");
    discountedOrdersDiv.innerHTML = ""; // Clear previous content

    if (orders.length === 0) {
        discountedOrdersDiv.innerHTML = `
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
                <td class="date-column">${formatDate(order.date)}</td>
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
            // Parse the formatted date (dd-mm-yy) for sorting
            const dateA = parseFormattedDate(a.date);
            const dateB = parseFormattedDate(b.date);
            comparison = dateA - dateB;
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
                createTextPopup("All discounted orders have been cleared.");
            } else {
                createTextPopup("Failed to clear discounted orders.");
            }
            resolve();
        });
    });
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
// Export functions
module.exports = { fetchDiscountedOrders, sortDiscountedOrdersTable, clearDiscountedOrders };