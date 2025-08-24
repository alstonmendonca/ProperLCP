// taxOnItems.js
const { ipcRenderer } = require("electron");
const { createTextPopup } = require("./textPopup");
const { exportTableToExcel } = require("./export");

function loadTaxOnItems(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    // Create the HTML structure
    mainContent.innerHTML = `
        <div class="section-title">
            <h2>Tax On Items</h2>
            <div class="date-filters">
                <label for="startDate">Start Date:</label>
                <input type="date" id="startDate">
                
                <label for="endDate">End Date:</label>
                <input type="date" id="endDate">
                
                <button class="showTaxButton">Generate Report</button>
                <button id="exportExcelButton">Export to Excel</button>
            </div>
        </div>
        <div id="taxOnItemsDiv"></div>
        <style>
            .date-filters {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 15px;
            }
            
            .date-filters label {
                font-weight: bold;
            }
            
            .date-filters input {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            .showTaxButton {
                background-color: #1DB954;
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .showTaxButton:hover {
                background-color: #169c46;
            }
            
            .tax-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            
            .tax-table th {
                background-color: #0D3B66;
                color: white;
                padding: 12px;
                text-align: left;
                cursor: pointer;
            }
            
            .tax-table th:hover {
                background-color: #1a5276;
            }
            
            .tax-table td {
                padding: 10px;
                border-bottom: 1px solid #ddd;
            }
            
            .tax-table tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            
            .tax-table tr:hover {
                background-color: #f1f1f1;
            }
        </style>
    `;

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];
    
    // Retrieve stored dates from sessionStorage or use default dates
    const startDate = sessionStorage.getItem("taxItemsStartDate") || today;
    const endDate = sessionStorage.getItem("taxItemsEndDate") || today;

    // Set the date inputs
    document.getElementById("startDate").value = startDate;
    document.getElementById("endDate").value = endDate;

    // Automatically fetch tax data using the dates
    fetchTaxData(startDate, endDate);

    // Set up event listener
    document.querySelector(".showTaxButton").addEventListener("click", () => {
        const newStartDate = document.getElementById("startDate").value;
        const newEndDate = document.getElementById("endDate").value;
        
        if (!newStartDate || !newEndDate) {
            createTextPopup("Please select both start and end dates");
            return;
        }
        
        if (new Date(newStartDate) > new Date(newEndDate)) {
            createTextPopup("Start date cannot be after end date");
            return;
        }
        
        // Store dates in sessionStorage
        sessionStorage.setItem("taxItemsStartDate", newStartDate);
        sessionStorage.setItem("taxItemsEndDate", newEndDate);
        
        fetchTaxData(newStartDate, newEndDate);
    });
}

function fetchTaxData(startDate, endDate) {
    const container = document.getElementById("taxOnItemsDiv");
    container.innerHTML = "<p>Loading tax data...</p>";
    
    ipcRenderer.send("get-tax-on-items", { startDate, endDate });
}

ipcRenderer.on("tax-on-items-response", (event, data) => {
    const container = document.getElementById("taxOnItemsDiv");
    
    if (!data.success) {
        container.innerHTML = `<p class="error">Error: ${data.error || 'Failed to load tax data'}</p>`;
        return;
    }

    if (data.items.length === 0) {
        container.innerHTML = "<p>No tax data found for the selected date range.</p>";
        return;
    }

    let tableHTML = `
        <table class="tax-table">
            <thead>
                <tr>
                    <th onclick="sortTaxTable('name')">Food Item <span id="nameSortIndicator"></span></th>
                    <th onclick="sortTaxTable('quantity')">Quantity <span id="quantitySortIndicator"></span></th>
                    <th onclick="sortTaxTable('sgst')">SGST (₹) <span id="sgstSortIndicator"></span></th>
                    <th onclick="sortTaxTable('cgst')">CGST (₹) <span id="cgstSortIndicator"></span></th>
                    <th onclick="sortTaxTable('tax')">Tax (₹) <span id="taxSortIndicator"></span></th>
                </tr>
            </thead>
            <tbody>
    `;

    data.items.forEach(item => {
        tableHTML += `
            <tr>
                <td data-sort-value="${item.fname.toLowerCase()}">${item.fname}</td>
                <td data-sort-value="${item.total_quantity}">${item.total_quantity}</td>
                <td data-sort-value="${item.total_sgst}">${item.total_sgst.toFixed(2)}</td>
                <td data-sort-value="${item.total_cgst}">${item.total_cgst.toFixed(2)}</td>
                <td data-sort-value="${item.total_tax}">${item.total_tax.toFixed(2)}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;

    // Initialize sorting
    window.sortTaxTable = sortTaxTable;

    setTimeout(() => {
        document.getElementById("exportExcelButton").addEventListener("click", () => {
            exportTableToExcel(".tax-table");
        });
    }, 100);
});

let currentTaxSort = { column: null, direction: 'asc' };

function sortTaxTable(column) {
    const table = document.querySelector(".tax-table tbody");
    if (!table) return;

    const rows = Array.from(table.rows);
    const indicatorId = `${column}SortIndicator`;
    const otherColumns = ['name', 'quantity', 'sgst', 'cgst', 'tax'].filter(col => col !== column);
    
    // Reset other indicators
    otherColumns.forEach(col => {
        const indicator = document.getElementById(`${col}SortIndicator`);
        if (indicator) indicator.textContent = '';
    });
    
    // Determine new sort direction
    const newDirection = currentTaxSort.column === column && currentTaxSort.direction === 'asc' ? 'desc' : 'asc';
    currentTaxSort = { column, direction: newDirection };
    
    // Update sort indicator
    const currentIndicator = document.getElementById(indicatorId);
    if (currentIndicator) currentIndicator.textContent = newDirection === 'asc' ? '▲' : '▼';
    
    // Sort rows
    rows.sort((a, b) => {
        const aValue = a.querySelector(`td:nth-child(${getColumnIndex(column)})`).getAttribute('data-sort-value');
        const bValue = b.querySelector(`td:nth-child(${getColumnIndex(column)})`).getAttribute('data-sort-value');
        
        // Handle numeric comparison for all columns except name
        if (column !== 'name') {
            const numA = parseFloat(aValue);
            const numB = parseFloat(bValue);
            return newDirection === 'asc' ? numA - numB : numB - numA;
        }
        // Handle text comparison for name column
        return newDirection === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
    });
    
    // Rebuild table
    table.innerHTML = '';
    rows.forEach(row => table.appendChild(row));
}

function getColumnIndex(column) {
    const columns = ['name', 'quantity', 'sgst', 'cgst', 'tax'];
    return columns.indexOf(column) + 1;
}

module.exports = { loadTaxOnItems };