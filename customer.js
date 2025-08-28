const { ipcRenderer } = require("electron");
const { createTextPopup, createConfirmPopup } = require("./textPopup");
const { exportTableToExcel } = require("./export");

let currentSortBy = null;
let currentSortOrder = 'asc';

// Main function to load customers content
function loadCustomers(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';
    // Set up the HTML structure
    mainContent.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            .customer-container {
                padding: 2rem;
                background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
                min-height: 100vh;
                font-family: 'Inter', sans-serif;
            }
            
            .customer-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                padding: 2rem;
                background: white;
                border-radius: 16px;
                box-shadow: 0 8px 25px rgba(13, 59, 102, 0.12);
                border: 1px solid rgba(13, 59, 102, 0.1);
            }
            
            .customer-header h2 {
                color: #0D3B66;
                font-size: 2rem;
                font-weight: 700;
                margin: 0;
                position: relative;
            }
            
            .customer-header h2::after {
                content: '';
                position: absolute;
                bottom: -8px;
                left: 0;
                width: 60px;
                height: 4px;
                background: linear-gradient(90deg, #0D3B66, rgba(13, 59, 102, 0.6));
                border-radius: 2px;
            }
            
            .customer-header-buttons {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }
            
            .customer-header button {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 12px;
                font-size: 0.9rem;
                font-weight: 600;
                font-family: 'Inter', sans-serif;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                position: relative;
                overflow: hidden;
            }
            
            #addCustomerBtn {
                background: linear-gradient(135deg, #0D3B66 0%, rgba(13, 59, 102, 0.9) 100%);
                color: white;
                box-shadow: 0 6px 16px rgba(13, 59, 102, 0.3);
            }
            
            #addCustomerBtn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: left 0.5s;
            }
            
            #addCustomerBtn:hover::before {
                left: 100%;
            }
            
            #addCustomerBtn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(13, 59, 102, 0.4);
            }
            
            #clearCustomerDataBtn {
                background: white;
                color: #dc3545;
                border: 2px solid #dc3545;
                box-shadow: 0 4px 12px rgba(220, 53, 69, 0.15);
            }
            
            #clearCustomerDataBtn:hover {
                background: #dc3545;
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(220, 53, 69, 0.3);
            }
            
            #exportExcelButton {
                background: white;
                color: #0D3B66;
                border: 2px solid #0D3B66;
                box-shadow: 0 4px 12px rgba(13, 59, 102, 0.15);
            }
            
            #exportExcelButton:hover {
                background: #0D3B66;
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(13, 59, 102, 0.3);
            }
            
            #customersDiv {
                background: white;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 8px 25px rgba(13, 59, 102, 0.12);
                border: 1px solid rgba(13, 59, 102, 0.1);
            }
            
            .order-history-table {
                width: 100%;
                border-collapse: collapse;
                font-family: 'Inter', sans-serif;
                background: white;
            }
            
            .order-history-table thead th {
                background: linear-gradient(135deg, #0D3B66 0%, rgba(13, 59, 102, 0.9) 100%);
                color: white;
                padding: 1.5rem 1.25rem;
                text-align: left;
                font-weight: 600;
                font-size: 0.9rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border: none;
                position: relative;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .order-history-table thead th:hover {
                background: linear-gradient(135deg, rgba(13, 59, 102, 0.9) 0%, #0D3B66 100%);
            }
            
            .order-history-table thead th.sortable:after {
                content: '';
                position: absolute;
                right: 15px;
                top: 50%;
                transform: translateY(-50%);
                width: 0;
                height: 0;
                border-left: 4px solid transparent;
                border-right: 4px solid transparent;
                border-bottom: 4px solid rgba(255, 255, 255, 0.6);
                transition: all 0.3s ease;
            }
            
            .order-history-table thead th.sortable:hover:after {
                border-bottom-color: white;
            }
            
            .order-history-table tbody tr {
                transition: all 0.3s ease;
                border-bottom: 1px solid rgba(13, 59, 102, 0.1);
            }
            
            .order-history-table tbody tr:hover {
                background: linear-gradient(135deg, rgba(13, 59, 102, 0.03) 0%, rgba(13, 59, 102, 0.08) 100%);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(13, 59, 102, 0.1);
            }
            
            .order-history-table tbody tr:last-child {
                border-bottom: none;
            }
            
            .order-history-table tbody td {
                padding: 1.25rem;
                color: #0D3B66;
                font-weight: 500;
                border: none;
                position: relative;
            }
            
            .order-history-table tbody td:first-child {
                font-weight: 700;
                color: #0D3B66;
            }
            
            .no-customers {
                text-align: center;
                padding: 4rem 2rem;
                color: #0D3B66;
            }
            
            .no-customers-img {
                width: 120px;
                height: 120px;
                opacity: 0.6;
                margin-bottom: 1.5rem;
                filter: sepia(1) hue-rotate(200deg) saturate(0.8);
            }
            
            .no-customers p {
                font-size: 1.5rem;
                font-weight: 600;
                margin: 0;
                color: rgba(13, 59, 102, 0.7);
            }
            
            /* Responsive design */
            @media (max-width: 768px) {
                .customer-header {
                    flex-direction: column;
                    gap: 1rem;
                    align-items: stretch;
                }
                
                .customer-header-buttons {
                    justify-content: center;
                }
                
                .order-history-table {
                    font-size: 0.9rem;
                }
                
                .order-history-table thead th,
                .order-history-table tbody td {
                    padding: 1rem 0.75rem;
                }
            }
            
            /* Animation for table rows */
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .order-history-table tbody tr {
                animation: fadeInUp 0.3s ease-out;
                animation-fill-mode: both;
            }
            
            .order-history-table tbody tr:nth-child(1) { animation-delay: 0.1s; }
            .order-history-table tbody tr:nth-child(2) { animation-delay: 0.15s; }
            .order-history-table tbody tr:nth-child(3) { animation-delay: 0.2s; }
            .order-history-table tbody tr:nth-child(4) { animation-delay: 0.25s; }
            .order-history-table tbody tr:nth-child(5) { animation-delay: 0.3s; }
        </style>
        <div class="customer-container">
            <div class="customer-header">
                <h2>Customers</h2>
                <div class="customer-header-buttons">
                    <button id="addCustomerBtn">Add Customer</button>
                    <button id="clearCustomerDataBtn">Clear Customer Data</button>
                    <button id="exportExcelButton">Export to Excel</button>
                </div>
            </div>
            <div id="customersDiv"></div>
        </div>
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
        createConfirmPopup("Are you sure you want to permanently delete all customer data?", async (confirmed) => {
            if (confirmed) {
                await clearCustomerData();
                fetchCustomers(); // Refresh customer list
            }
        });
    });

    setTimeout(() => {
        document.getElementById("exportExcelButton").addEventListener("click", () => {
            exportTableToExcel(".order-history-table");
        });
    }, 100);
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
    if (document.getElementById("modernMessageModal")) {
        document.getElementById("modernMessageModal").remove();
    }

    const popup = document.createElement("div");
    popup.id = "modernMessageModal";
    popup.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            #modernMessageModal {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(13, 59, 102, 0.15) !important;
                backdrop-filter: blur(12px) !important;
                z-index: 10000 !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                animation: overlayFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                font-family: 'Inter', sans-serif !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
            }
            
            @keyframes overlayFadeIn {
                from { 
                    opacity: 0; 
                    backdrop-filter: blur(0px); 
                }
                to { 
                    opacity: 1; 
                    backdrop-filter: blur(12px); 
                }
            }
            
            .modern-message-modal-content {
                background: white !important;
                border-radius: 20px !important;
                padding: 2.5rem !important;
                width: 90% !important;
                max-width: 450px !important;
                position: relative !important;
                box-shadow: 
                    0 25px 50px rgba(13, 59, 102, 0.25),
                    0 10px 25px rgba(13, 59, 102, 0.15),
                    0 0 0 1px rgba(13, 59, 102, 0.1) !important;
                animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
                overflow: hidden !important;
                margin: 0 !important;
                box-sizing: border-box !important;
                text-align: center !important;
            }
            
            .modern-message-modal-content::before {
                content: '' !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                height: 6px !important;
                background: linear-gradient(90deg, #0D3B66, rgba(13, 59, 102, 0.8), #0D3B66) !important;
                animation: shimmer 3s infinite !important;
            }
            
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            @keyframes modalSlideIn {
                0% { 
                    opacity: 0; 
                    transform: translateY(-30px) scale(0.9); 
                }
                100% { 
                    opacity: 1; 
                    transform: translateY(0) scale(1); 
                }
            }
            
            .modern-message-modal-content h2 {
                margin: 0 0 1.5rem 0 !important;
                color: #0D3B66 !important;
                font-size: 1.75rem !important;
                font-weight: 700 !important;
                text-align: center !important;
                position: relative !important;
                padding-bottom: 1rem !important;
            }
            
            .modern-message-modal-content h2::after {
                content: '' !important;
                position: absolute !important;
                bottom: 0 !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                width: 60px !important;
                height: 3px !important;
                background: linear-gradient(90deg, transparent, #0D3B66, transparent) !important;
                border-radius: 2px !important;
            }
            
            .modern-message-modal-content p {
                margin: 0 0 2rem 0 !important;
                color: #0D3B66 !important;
                font-size: 1.1rem !important;
                line-height: 1.6 !important;
                opacity: 0.8 !important;
            }
            
            .modern-message-modal-content button {
                padding: 1rem 2.5rem !important;
                border: none !important;
                border-radius: 12px !important;
                font-size: 1rem !important;
                font-weight: 600 !important;
                font-family: 'Inter', sans-serif !important;
                cursor: pointer !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                position: relative !important;
                overflow: hidden !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                background: linear-gradient(135deg, #0D3B66 0%, rgba(13, 59, 102, 0.9) 100%) !important;
                color: white !important;
                box-shadow: 0 8px 20px rgba(13, 59, 102, 0.3) !important;
                min-width: 120px !important;
            }
            
            .modern-message-modal-content button::before {
                content: '' !important;
                position: absolute !important;
                top: 0 !important;
                left: -100% !important;
                width: 100% !important;
                height: 100% !important;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent) !important;
                transition: left 0.5s !important;
            }
            
            .modern-message-modal-content button:hover::before {
                left: 100% !important;
            }
            
            .modern-message-modal-content button:hover {
                transform: translateY(-3px) !important;
                box-shadow: 0 12px 28px rgba(13, 59, 102, 0.4) !important;
            }
            
            .modern-message-modal-content button:active {
                transform: translateY(-1px) !important;
            }
            
            /* Responsive design */
            @media (max-width: 600px) {
                .modern-message-modal-content {
                    margin: 1rem !important;
                    padding: 2rem !important;
                }
            }
        </style>
        <div class="modern-message-modal-content">
            <h2>${title}</h2>
            <p>${message}</p>
            <button id="closeModernMessagePopup">OK</button>
        </div>
    `;

    document.body.appendChild(popup);

    document.getElementById("closeModernMessagePopup").addEventListener("click", () => {
        popup.remove();
    });
}

// IPC event listeners
ipcRenderer.on("customer-added-response", (event, data) => {
    if (data.success) {
        fetchCustomers();
    } else {
        createTextPopup("Failed to add customer.");
    }
});

ipcRenderer.on("customer-delete-response", (event, data) => {
    if (data.success) {
        fetchCustomers();
    } else {
        createTextPopup("Failed to delete customer: " + data.error);
    }
});

ipcRenderer.on("update-customer-response", (event, data) => {
    if (data.success) {
        fetchCustomers();
    } else {
        createTextPopup("Failed to update customer: " + data.error);
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