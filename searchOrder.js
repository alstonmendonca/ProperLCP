// searchOrder.js
const { ipcRenderer } = require("electron");
const { attachContextMenu } = require("./contextMenu");
const { exportTableToExcel } = require("./export");
const { createTextPopup } = require("./textPopup");

let currentSortBy = null;
let currentSortOrder = 'asc';

// Load the Search Order UI
function loadSearchOrder(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    const today = new Date().toISOString().split("T")[0];

    mainContent.innerHTML = `
        <style>
            .search-order-container {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                padding: 20px;
                background: #f8fafc;
                min-height: 100vh;
            }
            
            .search-order-header {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .search-order-header h2 {
                color: #0D3B66;
                font-size: 28px;
                font-weight: 700;
                margin: 0;
                letter-spacing: -0.02em;
            }
            
            .filters-card {
                background: white;
                border-radius: 16px;
                padding: 30px;
                box-shadow: 0 4px 16px rgba(13, 59, 102, 0.1);
                margin-bottom: 30px;
                border: 1px solid #e2e8f0;
            }
            
            .filters-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                align-items: end;
            }
            
            .form-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .form-group label {
                color: #0D3B66;
                font-weight: 500;
                font-size: 14px;
                margin: 0;
            }
            
            .form-group input,
            .form-group select {
                padding: 12px 16px;
                border: 2px solid #cbd5e1;
                border-radius: 8px;
                font-size: 14px;
                background: #f8fafc;
                color: #1e293b;
                transition: all 0.2s ease;
                font-family: inherit;
            }
            
            .form-group input:focus,
            .form-group select:focus {
                outline: none;
                border-color: #0D3B66;
                box-shadow: 0 0 0 3px rgba(13, 59, 102, 0.1);
                background: white;
            }
            
            .actions-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                flex-wrap: wrap;
                gap: 15px;
            }
            
            .btn-primary {
                background: #0D3B66;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .btn-primary:hover {
                background: #11487b;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(13, 59, 102, 0.3);
            }
            
            .btn-secondary {
                background: white;
                color: #0D3B66;
                border: 2px solid #0D3B66;
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                margin-left: 10px;
            }
            
            .btn-secondary:hover {
                background: #0D3B66;
                color: white;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(13, 59, 102, 0.2);
            }
            
            .results-container {
                background: white;
                border-radius: 16px;
                padding: 20px;
                box-shadow: 0 4px 16px rgba(13, 59, 102, 0.1);
                border: 1px solid #e2e8f0;
            }
            
            .order-history-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 14px;
            }
            
            .order-history-table th {
                background: #0D3B66;
                color: white;
                padding: 16px 12px;
                text-align: left;
                font-weight: 600;
                border: none;
                font-size: 13px;
                letter-spacing: 0.02em;
            }
            
            .order-history-table th:first-child {
                border-top-left-radius: 8px;
            }
            
            .order-history-table th:last-child {
                border-top-right-radius: 8px;
            }
            
            .order-history-table td {
                padding: 12px;
                border-bottom: 1px solid #e2e8f0;
                color: #1e293b;
            }
            
            .order-history-table tr:hover {
                background: #f8fafc;
            }
            
            .order-history-table tr:last-child td {
                border-bottom: none;
            }
            
            .sortable {
                cursor: pointer;
                user-select: none;
                position: relative;
                transition: background-color 0.2s ease;
            }
            
            .sortable:hover {
                background: #11487b;
            }
            
            .no-results {
                text-align: center;
                padding: 60px 20px;
                color: #64748b;
                background: white;
                border-radius: 16px;
                box-shadow: 0 4px 16px rgba(13, 59, 102, 0.1);
                border: 1px solid #e2e8f0;
            }
            
            .no-results-icon {
                font-size: 48px;
                margin-bottom: 20px;
                color: #cbd5e1;
            }
            
            .no-results-title {
                font-size: 24px;
                font-weight: 600;
                color: #0D3B66;
                margin-bottom: 10px;
            }
            
            .no-results-text {
                font-size: 16px;
                color: #64748b;
            }
        </style>
        
        <div class="search-order-container">
            <div class="search-order-header">
                <h2>Search Order</h2>
            </div>

            <div class="filters-card">
                <div class="filters-grid">
                    <!-- Bill No Range -->
                    <div class="form-group">
                        <label>Bill No From:</label>
                        <input type="number" id="billNoFrom" placeholder="Enter bill number..." min="1">
                    </div>
                    <div class="form-group">
                        <label>Bill No To:</label>
                        <input type="number" id="billNoTo" placeholder="Enter bill number..." min="1">
                    </div>

                    <!-- KOT Range -->
                    <div class="form-group">
                        <label>KOT From:</label>
                        <input type="number" id="kotFrom" placeholder="Enter KOT number..." min="1">
                    </div>
                    <div class="form-group">
                        <label>KOT To:</label>
                        <input type="number" id="kotTo" placeholder="Enter KOT number..." min="1">
                    </div>

                    <!-- Price Range -->
                    <div class="form-group">
                        <label>Min Price (₹):</label>
                        <input type="number" id="minPrice" placeholder="0.00" step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label>Max Price (₹):</label>
                        <input type="number" id="maxPrice" placeholder="0.00" step="0.01" min="0">
                    </div>

                    <!-- Cashier Filter -->
                    <div class="form-group">
                        <label>Cashier:</label>
                        <select id="cashierSelect">
                            <option value="">All Cashiers</option>
                            <!-- Filled dynamically -->
                        </select>
                    </div>

                    <!-- Date Range -->
                    <div class="form-group">
                        <label>Start Date:</label>
                        <input type="date" id="startDate" value="${today}">
                    </div>
                    <div class="form-group">
                        <label>End Date:</label>
                        <input type="date" id="endDate" value="${today}">
                    </div>
                </div>
            </div>

            <div class="actions-row">
                <button id="searchOrdersBtn" class="btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    Search Orders
                </button>
                <div>
                    <button id="clearFiltersBtn" class="btn-secondary">Clear Filters</button>
                    <button id="exportExcelBtn" class="btn-secondary">Export to Excel</button>
                </div>
            </div>
            
            <div id="searchResults"></div>
        </div>
    `;

    // Load saved filters from sessionStorage
    restoreFilters();

    // Fetch cashiers list
    populateCashiers();

    // Event listeners
    document.getElementById("searchOrdersBtn").addEventListener("click", searchOrders);
    document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters);
    document.getElementById("exportExcelBtn").addEventListener("click", () => {
        const table = document.querySelector(".order-history-table");
        if (table) exportTableToExcel(table, "Search_Results");
        else createTextPopup("No data to export.");
    });

    // Initial search with default date
    searchOrders();
}

// Populate cashier dropdown
function populateCashiers() {
    ipcRenderer.send("get-all-cashiers");
}

ipcRenderer.on("all-cashiers-response", (event, cashiers) => {
    const select = document.getElementById("cashierSelect");
    cashiers.forEach(cashier => {
        const option = document.createElement("option");
        option.value = cashier.userid;
        option.textContent = cashier.uname;
        select.appendChild(option);
    });

    // Restore saved selection
    const savedCashier = sessionStorage.getItem("searchOrderCashier");
    if (savedCashier) select.value = savedCashier;
});

// Capture all filter values
function getFilters() {
    return {
        billNoFrom: document.getElementById("billNoFrom").value || null,
        billNoTo: document.getElementById("billNoTo").value || null,
        kotFrom: document.getElementById("kotFrom").value || null,
        kotTo: document.getElementById("kotTo").value || null,
        startDate: document.getElementById("startDate").value || null,
        endDate: document.getElementById("endDate").value || null,
        cashier: document.getElementById("cashierSelect").value || null,
        minPrice: document.getElementById("minPrice").value || null,
        maxPrice: document.getElementById("maxPrice").value || null,
    };
}

// Save filters to sessionStorage
function saveFilters() {
    const filters = getFilters();
    Object.keys(filters).forEach(key => {
        if (filters[key] !== null) {
            sessionStorage.setItem(`searchOrder_${key}`, filters[key]);
        } else {
            sessionStorage.removeItem(`searchOrder_${key}`);
        }
    });
}

// Restore filters from sessionStorage
function restoreFilters() {
    const keys = ['billNoFrom', 'billNoTo', 'kotFrom', 'kotTo', 'startDate', 'endDate', 'minPrice', 'maxPrice'];
    keys.forEach(key => {
        const saved = sessionStorage.getItem(`searchOrder_${key}`);
        if (saved) document.getElementById(key).value = saved;
    });
}

// Clear all filters
function clearFilters() {
    document.getElementById("billNoFrom").value = "";
    document.getElementById("billNoTo").value = "";
    document.getElementById("kotFrom").value = "";
    document.getElementById("kotTo").value = "";
    document.getElementById("minPrice").value = "";
    document.getElementById("maxPrice").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    document.getElementById("cashierSelect").value = "";

    sessionStorage.removeItem("searchOrder_startDate");
    sessionStorage.removeItem("searchOrder_endDate");
    Object.keys(getFilters()).forEach(key => {
        sessionStorage.removeItem(`searchOrder_${key}`);
    });

    searchOrders(); // Refresh results
}

// Main search function
function searchOrders() {
    const filters = getFilters();

    // Validate date range
    if ((filters.startDate && !filters.endDate) || (!filters.startDate && filters.endDate)) {
        createTextPopup("Please select both start and end dates.");
        return;
    }

    // Save current filters
    saveFilters();

    ipcRenderer.send("search-orders", filters);
}

// Handle response from main process
ipcRenderer.on("search-orders-response", (event, data) => {
    const orders = data.orders;
    const searchResults = document.getElementById("searchResults");
    searchResults.innerHTML = "";

    if (orders.length === 0) {
        searchResults.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">📋</div>
                <div class="no-results-title">No Orders Found</div>
                <div class="no-results-text">Try adjusting your search criteria to find more results.</div>
            </div>
        `;
        return;
    }

    // Build table
    let tableHTML = `
        <div class="results-container">
            <table class="order-history-table">
                <thead>
                    <tr>
                        <th class="sortable" onclick="sortSearchResults('billno')">Bill No ${getSortIndicator('billno')}</th>
                        <th class="date-column sortable" onclick="sortSearchResults('date')">Date ${getSortIndicator('date')}</th>
                        <th class="sortable" onclick="sortSearchResults('cashier_name')">Cashier ${getSortIndicator('cashier_name')}</th>
                        <th class="sortable" onclick="sortSearchResults('kot')">KOT ${getSortIndicator('kot')}</th>
                        <th class="sortable" onclick="sortSearchResults('price')">Price (₹) ${getSortIndicator('price')}</th>
                        <th class="sortable" onclick="sortSearchResults('sgst')">SGST (₹) ${getSortIndicator('sgst')}</th>
                        <th class="sortable" onclick="sortSearchResults('cgst')">CGST (₹) ${getSortIndicator('cgst')}</th>
                        <th class="sortable" onclick="sortSearchResults('tax')">Tax (₹) ${getSortIndicator('tax')}</th>
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

    tableHTML += `</tbody></table></div>`;
    searchResults.innerHTML = tableHTML;

    // Attach context menu (e.g., for re-print, view details)
    attachContextMenu(".search-results-table");

    // Export button listener
    document.getElementById("exportExcelBtn").onclick = () => {
        exportTableToExcel(".order-history-table", `Search_Results_${Date.now()}`);
    };
});

// Sorting logic
function sortSearchResults(column) {
    const resultsDiv = document.getElementById("searchResults");
    const rows = Array.from(resultsDiv.querySelectorAll("tbody tr")).map(row => {
        return {
            billno: parseInt(row.cells[0].innerText),
            date: row.cells[1].innerText,
            cashier_name: row.cells[2].innerText,
            kot: parseInt(row.cells[3].innerText),
            price: parseFloat(row.cells[4].innerText),
            sgst: parseFloat(row.cells[5].innerText),
            cgst: parseFloat(row.cells[6].innerText),
            tax: parseFloat(row.cells[7].innerText),
            food_items: row.cells[8].innerText
        };
    });

    if (currentSortBy === column) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortOrder = 'asc';
    }
    currentSortBy = column;

    rows.sort((a, b) => {
        let comparison = 0;
        if (column === 'billno') comparison = a.billno - b.billno;
        else if (column === 'date') comparison = parseFormattedDate(a.date) - parseFormattedDate(b.date);
        else if (column === 'cashier_name') comparison = a.cashier_name.localeCompare(b.cashier_name);
        else if (column === 'kot') comparison = a.kot - b.kot;
        else if (column === 'price') comparison = a.price - b.price;
        else if (column === 'sgst') comparison = a.sgst - b.sgst;
        else if (column === 'cgst') comparison = a.cgst - b.cgst;
        else if (column === 'tax') comparison = a.tax - b.tax;

        return currentSortOrder === 'asc' ? comparison : -comparison;
    });

    let sortedHTML = `
        <div class="results-container">
            <table class="order-history-table">
                <thead>
                    <tr>
                        <th class="sortable" onclick="sortSearchResults('billno')">Bill No ${getSortIndicator('billno')}</th>
                        <th class="date-column sortable" onclick="sortSearchResults('date')">Date ${getSortIndicator('date')}</th>
                        <th class="sortable" onclick="sortSearchResults('cashier_name')">Cashier ${getSortIndicator('cashier_name')}</th>
                        <th class="sortable" onclick="sortSearchResults('kot')">KOT ${getSortIndicator('kot')}</th>
                        <th class="sortable" onclick="sortSearchResults('price')">Price (₹) ${getSortIndicator('price')}</th>
                        <th class="sortable" onclick="sortSearchResults('sgst')">SGST (₹) ${getSortIndicator('sgst')}</th>
                        <th class="sortable" onclick="sortSearchResults('cgst')">CGST (₹) ${getSortIndicator('cgst')}</th>
                        <th class="sortable" onclick="sortSearchResults('tax')">Tax (₹) ${getSortIndicator('tax')}</th>
                        <th>Food Items</th>
                    </tr>
                </thead>
                <tbody>
    `;

    rows.forEach(row => {
        sortedHTML += `
            <tr data-billno="${row.billno}">
                <td>${row.billno}</td>
                <td class="date-column">${row.date}</td>
                <td>${row.cashier_name}</td>
                <td>${row.kot}</td>
                <td>${row.price.toFixed(2)}</td>
                <td>${row.sgst.toFixed(2)}</td>
                <td>${row.cgst.toFixed(2)}</td>
                <td>${row.tax.toFixed(2)}</td>
                <td>${row.food_items || "No items"}</td>
            </tr>
        `;
    });

    sortedHTML += `</tbody></table></div>`;
    resultsDiv.innerHTML = sortedHTML;
    attachContextMenu(".search-results-table");
}

// Utility: Format date from YYYY-MM-DD to DD-MM-YY
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
}

// Utility: Parse formatted date (DD-MM-YY) to Date object
function parseFormattedDate(dateString) {
    const [day, month, year] = dateString.split('-');
    return new Date(`20${year}-${month}-${day}`);
}

// Utility: Sort indicator (▲/▼)
function getSortIndicator(sortBy) {
    if (currentSortBy === sortBy) {
        return currentSortOrder === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
}

module.exports = { loadSearchOrder, searchOrders, sortSearchResults };