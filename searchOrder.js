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
        <div>
            <div class="search-order-header">
                <h2>Search Order</h2>
            </div>

            <div class="date-filters" 
            style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin: 20px 0; 
            background-color:#8cbbe8; padding:10px; border-radius:14px;">
                <!-- Bill No Range -->
                <div>
                    <label>Bill No From:</label>
                    <input type="number" id="billNoFrom" placeholder="..." min="1">
                </div>
                <div>
                    <label>Bill No To:</label>
                    <input type="number" id="billNoTo" placeholder="..." min="1">
                </div>

                <!-- KOT Range -->
                <div>
                    <label>KOT From:</label>
                    <input type="number" id="kotFrom" placeholder="..." min="1">
                </div>
                <div>
                    <label>KOT To:</label>
                    <input type="number" id="kotTo" placeholder="..." min="1">
                </div>

                <!-- Price Range -->
                <div>
                    <label>Min Price (₹):</label>
                    <input type="number" id="minPrice" placeholder="..." step="0.01" min="0">
                </div>
                <div>
                    <label>Max Price (₹):</label>
                    <input type="number" id="maxPrice" placeholder="..." step="0.01" min="0">
                </div>

                <!-- Cashier Filter -->
                <div>
                    <label>Cashier:</label>
                    <select id="cashierSelect">
                        <option value="">All Cashiers</option>
                        <!-- Filled dynamically -->
                    </select>
                </div>

                <!-- Date Range -->
                <div>
                    <label>Start Date:</label>
                    <input type="date" id="startDate" value="${today}">
                </div>
                <div>
                    <label>End Date:</label>
                    <input type="date" id="endDate" value="${today}">
                </div>
            </div>

            <div style="margin-bottom: 20px; display:flex; justify-content:space-between;">
                <button id="searchOrdersBtn" class="btn-primary">Search Order</button>
                <div>
                    <button id="clearFiltersBtn" class="btn-secondary">Clear Filters</button>
                    <button id="exportExcelBtn" class="btn-secondary">Export to Excel</button>
                </div>
            </div>
        </div>
        <div id="searchResults"></div>
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
            <div style="text-align: center; font-family: 'Arial', sans-serif; background-color: #f5f5f5; color: #333; display: flex; justify-content: center; align-items: center; height: 70vh; margin: 0;">
                <div>
                    <div style="font-size: 72px; font-weight: bold; margin-bottom: 20px;">
                        No Orders Found!
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Build table
    let tableHTML = `
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

    tableHTML += `</tbody></table>`;
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

    sortedHTML += `</tbody></table>`;
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