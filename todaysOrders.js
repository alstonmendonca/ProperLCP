const { ipcRenderer } = require("electron");
const { attachContextMenu } = require("./contextMenu");
const { deleteOrder } = require("./deleteOrder");

function fetchTodaysOrders() {
    ipcRenderer.send("get-todays-orders");
}

// Receive today's orders from the main process and update the UI
ipcRenderer.on("todays-orders-response", (event, data) => {
    //console.log("Received today's orders:", data);
    const orders = data.orders;
    const todaysOrdersDiv = document.getElementById("todaysOrdersDiv");
    todaysOrdersDiv.innerHTML = ""; // Clear previous content

    if (orders.length === 0) {
        todaysOrdersDiv.innerHTML = "<p>No orders found for today.</p>";
        return;
    }

    // Create a table (same layout as order history)
    let tableHTML = `
        <table class="order-history-table">
            <thead>
                <tr>
                    <th class="sortable" onclick="sortTodaysOrdersTable('billno')">Bill No ${getSortIndicator('billno')}</th>
                    <th class="-todays-date-column">Date</th>
                    <th class="sortable" onclick="sortTodaysOrdersTable('cashier')">Cashier ${getSortIndicator('cashier')}</th>
                    <th class="sortable" onclick="sortTodaysOrdersTable('kot')">KOT ${getSortIndicator('kot')}</th>
                    <th class="sortable" onclick="sortTodaysOrdersTable('price')">Price (₹) ${getSortIndicator('price')}</th>
                    <th class="sortable" onclick="sortTodaysOrdersTable('sgst')">SGST (₹) ${getSortIndicator('sgst')}</th>
                    <th class="sortable" onclick="sortTodaysOrdersTable('cgst')">CGST (₹) ${getSortIndicator('cgst')}</th>
                    <th class="sortable" onclick="sortTodaysOrdersTable('tax')">Tax (₹) ${getSortIndicator('tax')}</th>
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
    todaysOrdersDiv.innerHTML = tableHTML;

    // Attach export button functionality
    setTimeout(() => {
        document.getElementById("exportExcelButton").addEventListener("click", () => {
            exportTableToExcel(".order-history-table");
        });
        attachContextMenu(".order-history-table", "todaysOrders"); // Re-attach menu
    }, 100);
});

// ✅ Refresh "Today's Orders" after deletion
ipcRenderer.on("refresh-order-history", () => {
    console.log("Refreshing today's orders after deletion...");
    fetchTodaysOrders(); // Re-fetch the orders
});

// ✅ Ensure that today's orders refresh when an order is deleted
ipcRenderer.on("order-deleted", (event, { source }) => {
    if (source === "todaysOrders") {
        console.log("Refreshing today's orders after order deletion...");
        fetchTodaysOrders();
    }
});

//------------------------------------------------------------
let currentSortBy = null;
let currentSortOrder = 'asc'; // Default sort order

function sortTodaysOrdersTable(column) {
    const todaysOrdersDiv = document.getElementById("todaysOrdersDiv");
    const orders = Array.from(todaysOrdersDiv.querySelectorAll("tbody tr")).map(row => {
        return {
            billno: row.dataset.billno,
            date: row.cells[1].innerText,
            cashier: row.cells[2].innerText,
            kot: row.cells[3].innerText,
            price: parseFloat(row.cells[4].innerText.replace('₹', '').trim()),
            sgst: parseFloat(row.cells[5].innerText.replace('₹', '').trim()),
            cgst: parseFloat(row.cells[6].innerText.replace('₹', '').trim()),
            tax: parseFloat(row.cells[7].innerText.replace('₹', '').trim()),
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
        } else if (column === 'cashier') {
            comparison = a.cashier.localeCompare(b.cashier);
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
        } else {
            return 0; // Skip sorting for date 
        }

        return currentSortOrder === 'asc' ? comparison : -comparison;
    });

    // Rebuild the table with sorted data
    // Rebuild the table with sorted data
    let sortedTableHTML = `
    <table class="order-history-table">
        <thead>
            <tr>
                <th class="sortable" onclick="sortTodaysOrdersTable('billno')">Bill No ${getSortIndicator('billno')}</th>
                <th class="date-column">Date</th>
                <th class="sortable" onclick="sortTodaysOrdersTable('cashier')">Cashier ${getSortIndicator('cashier')}</th>
                <th class="sortable" onclick="sortTodaysOrdersTable('kot')">KOT ${getSortIndicator('kot')}</th>
                <th class="sortable" onclick="sortTodaysOrdersTable('price')">Price (₹) ${getSortIndicator('price')}</th>
                <th class="sortable" onclick="sortTodaysOrdersTable('sgst')">SGST (₹) ${getSortIndicator('sgst')}</th>
                <th class="sortable" onclick="sortTodaysOrdersTable('cgst')">CGST (₹) ${getSortIndicator('cgst')}</th>
                <th class="sortable" onclick="sortTodaysOrdersTable('tax')">Tax (₹) ${getSortIndicator('tax')}</th>
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
            <td>${order.cashier}</td>
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
    todaysOrdersDiv.innerHTML = sortedTableHTML;

    // Re-attach event listeners for sorting
    setTimeout(() => {
        attachContextMenu(".order-history-table", "todaysOrders"); // Re-attach menu
    }, 100);
}

// Function to get the sort indicator (▲ or ▼) for a column
function getSortIndicator(sortBy) {
    if (currentSortBy === sortBy) {
        return currentSortOrder === 'asc' ? '▲' : '▼';
    }
    return ''; // No indicator if the column is not sorted
}

//------------------------------------------------------------

// Export function so it can be used in `renderer.js`
module.exports = { fetchTodaysOrders, sortTodaysOrdersTable };
