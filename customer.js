// customers.js

const { ipcRenderer } = require("electron");

let currentSortBy = null; // Track the current sorted column
let currentSortOrder = 'asc'; // Default sort order

// Function to fetch customers
function fetchCustomers() {
    console.log("Fetching customers..."); // Debugging statement
    ipcRenderer.send("get-customers");

    ipcRenderer.once("customers-response", (event, data) => { // Use 'once' to avoid multiple listeners
        if (data.success) {
            const customers = data.customers;
            displayCustomers(customers);
        } else {
            console.error("Failed to fetch customers.");
        }
    });
}

// Function to display customers in a table
function displayCustomers(customers) {
    const customersDiv = document.getElementById("customersDiv");
    customersDiv.innerHTML = ""; // Clear previous content

    if (customers.length === 0) {
        customersDiv.innerHTML = "<p>No customers found.</p>";
        return;
    }

    // Create a table for customers
    let tableHTML = `
        <table class="order-history-table">
            <thead>
                <tr>
                    <th class="sortable" onclick="sortCustomersTable('cid')">Customer ID ${getCustomerSortIndicator('cid')}</th>
                    <th class="sortable" onclick="sortCustomersTable('cname')">Name ${getCustomerSortIndicator('cname')}</th>
                    <th class="sortable" onclick="sortCustomersTable('phone')">Phone ${getCustomerSortIndicator('phone')}</th>
                    <th class="sortable" onclick="sortCustomersTable('address')">Address ${getCustomerSortIndicator('address')}</th>
                </tr>
            </thead>
            <tbody>
    `;

    customers.forEach(customer => {
        tableHTML += `
            <tr data-cid="${customer.cid}">
                <td>${customer.cid}</td>
                <td>${customer.cname}</td>
                <td>${customer.phone}</td>
                <td>${customer.address || "N/A"}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    customersDiv.innerHTML = tableHTML;

    // Attach event listeners for sorting
    setTimeout(() => {
        attachContextMenu(".order-history-table", "customer"); // Re-attach menu if needed
    }, 100);
}

// Function to sort customers by a specific column
function sortCustomersTable(column) {
    const customersDiv = document.getElementById("customersDiv");
    const customers = Array.from(customersDiv.querySelectorAll("tbody tr")).map(row => {
        return {
            cid: row.dataset.cid,
            cname: row.cells[1].innerText,
            phone: row.cells[2].innerText,
            address: row.cells[3].innerText
        };
    });

    // Determine sort order
    if (currentSortBy === column) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc'; // Toggle sort order
    } else {
        currentSortOrder = 'asc'; // Reset to ascending if a new column is sorted
    }
    currentSortBy = column;

    // Sort the customers
    customers.sort((a, b) => {
        let comparison = 0;
        if (column === 'cid') {
            comparison = a.cid - b.cid; // Sort by Customer ID
        } else if (column === 'cname') {
            comparison = a.cname.localeCompare(b.cname); // Sort by Name
        } else if (column === 'phone') {
            comparison = a.phone.localeCompare(b.phone); // Sort by Phone
        } else if (column === 'address') {
            comparison = a.address.localeCompare(b.address); // Sort by Address
        }

        return currentSortOrder === 'asc' ? comparison : -comparison;
    });

    // Rebuild the table with sorted data
    displayCustomers(customers);
}

// Function to get the sort indicator (▲ or ▼) for a column
function getCustomerSortIndicator(sortBy) {
    if (currentSortBy === sortBy) {
        return currentSortOrder === 'asc' ? '▲' : '▼';
    }
    return ''; // No indicator if the column is not sorted
}

// Export function so it can be used in `renderer.js`
module.exports = { fetchCustomers, displayCustomers, sortCustomersTable };