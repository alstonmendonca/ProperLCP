const { ipcRenderer } = require("electron");

let currentSortBy = null;
let currentSortOrder = 'asc';

// Main function to load customers content
function loadCustomers(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';
    // Set up the HTML structure
    mainContent.innerHTML = `
        <div class="customer-header">
            <h2>Customers</h2>
            <button id="addCustomerBtn">Add Customer</button>
            <button id="clearCustomerDataBtn">Clear Customer Data</button>
        </div>
        <div id="customersDiv"></div>
    `;

    // Fetch and display customers
    fetchCustomers();

    // Add event listeners
    setupCustomerEventListeners();
}

function setupCustomerEventListeners() {
    // Add Customer button
    const addCustomerBtn = document.getElementById("addCustomerBtn");
    addCustomerBtn.addEventListener("click", showAddCustomerPopup);

    // Clear Customer Data button
    document.getElementById("clearCustomerDataBtn").addEventListener("click", async () => {
        showConfirmPopup("Are you sure you want to permanently delete all customer data?", async () => {
            await clearCustomerData();
            fetchCustomers(); // Refresh customer list
        });
    });
}

// Function to fetch customers
function fetchCustomers() {
    ipcRenderer.send("get-customers");
    ipcRenderer.once("customers-response", (event, data) => {
        if (data.success) {
            displayCustomers(data.customers);
        } else {
            console.error("Failed to fetch customers.");
        }
    });
}

// Function to display customers in a table
function displayCustomers(customers) {
    const customersDiv = document.getElementById("customersDiv");
    customersDiv.innerHTML = "";

    if (customers.length === 0) {
        customersDiv.innerHTML = `
            <div class="no-customers">
                <img src="sadErrorFace.png" alt="No Customers Found" class="no-customers-img">
                <p>No customers found.</p>
            </div>
        `;
        return;
    }

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

    setTimeout(() => {
        attachContextMenu(".order-history-table", "customer");
    }, 100);
}

// Function to sort customers by a specific column
function sortCustomersTable(column) {
    const customersDiv = document.getElementById("customersDiv");
    const customers = Array.from(customersDiv.querySelectorAll("tbody tr")).map(row => ({
        cid: row.dataset.cid,
        cname: row.cells[1].innerText,
        phone: row.cells[2].innerText,
        address: row.cells[3].innerText
    }));

    if (currentSortBy === column) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortOrder = 'asc';
    }
    currentSortBy = column;

    customers.sort((a, b) => {
        let comparison = 0;
        if (column === 'cid') {
            comparison = a.cid - b.cid;
        } else if (column === 'cname') {
            comparison = a.cname.localeCompare(b.cname);
        } else if (column === 'phone') {
            comparison = a.phone.localeCompare(b.phone);
        } else if (column === 'address') {
            comparison = (a.address || "").localeCompare(b.address || "");
        }

        return currentSortOrder === 'asc' ? comparison : -comparison;
    });

    displayCustomers(customers);
}

function getCustomerSortIndicator(sortBy) {
    if (currentSortBy === sortBy) {
        return currentSortOrder === 'asc' ? '▲' : '▼';
    }
    return '';
}

// Function to clear customer data
async function clearCustomerData() {
    return new Promise((resolve) => {
        ipcRenderer.send("clear-customer-data");
        ipcRenderer.once("clear-customer-data-response", (event, response) => {
            if (response.success) {
                showMessagePopup("Success", "All customer data has been cleared.");
            } else {
                showMessagePopup("Error", "Failed to clear customer data.");
            }
            resolve();
        });
    });
}

function showMessagePopup(title, message) {
    if (document.getElementById("messagePopup")) {
        document.getElementById("messagePopup").remove();
    }

    const popup = document.createElement("div");
    popup.id = "messagePopup";
    popup.innerHTML = `
        <div class="popup-content">
            <h2>${title}</h2>
            <p>${message}</p>
            <button id="closeMessagePopup">OK</button>
        </div>
    `;

    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.backgroundColor = "white";
    popup.style.padding = "20px";
    popup.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
    popup.style.borderRadius = "8px";
    popup.style.zIndex = "1001";
    popup.style.textAlign = "center";

    document.body.appendChild(popup);

    document.getElementById("closeMessagePopup").addEventListener("click", () => {
        popup.remove();
    });
}

// IPC event listeners
ipcRenderer.on("customer-added-response", (event, data) => {
    if (data.success) {
        fetchCustomers();
    } else {
        alert("Failed to add customer.");
    }
});

ipcRenderer.on("customer-delete-response", (event, data) => {
    if (data.success) {
        fetchCustomers();
    } else {
        alert("Failed to delete customer: " + data.error);
    }
});

ipcRenderer.on("update-customer-response", (event, data) => {
    if (data.success) {
        fetchCustomers();
    } else {
        alert("Failed to update customer: " + data.error);
    }
});

// Export functions
module.exports = { 
    loadCustomers,
    fetchCustomers, 
    displayCustomers, 
    sortCustomersTable, 
    clearCustomerData 
};