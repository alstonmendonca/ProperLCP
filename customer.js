// customers.js

const { ipcRenderer } = require("electron");

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
                    <th class="sortable" onclick="sortCustomersTable('cid')">Customer ID ${getSortIndicator('cid')}</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Address</th>
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
        attachContextMenu(".order-history-table", "customers"); // Re-attach menu if needed
    }, 100);
}

// Function to get the sort indicator (▲ or ▼) for a column
function getSortIndicator(sortBy) {
    if (currentSortBy === sortBy) {
        return currentSortOrder === 'asc' ? '▲' : '▼';
    }
    return ''; // No indicator if the column is not sorted
}

// Export function so it can be used in `renderer.js`
module.exports = { fetchCustomers, displayCustomers };