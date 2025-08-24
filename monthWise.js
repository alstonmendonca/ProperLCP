const { ipcRenderer } = require('electron');
const { exportTableToExcel } = require("./export");

function loadMonthWiseAnalysis(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    const currentYear = new Date().getFullYear();
    const startYear = 2000;
    const endYear = currentYear + 5; // Show 5 years into the future
    
    // Generate year options for select dropdown
    let yearOptions = '';
    for (let year = endYear; year >= startYear; year--) {
        yearOptions += `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`;
    }
    
    mainContent.innerHTML = `
        <style>
            .year-filter {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .year-filter label {
                font-size: 16px;
                color: #333;
                font-weight: 500;
            }
            
            #yearSelect {
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                background-color: white;
                font-size: 15px;
                color: #333;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
                appearance: none;
                background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
                background-repeat: no-repeat;
                background-position: right 10px center;
                background-size: 15px;
                padding-right: 30px;
                min-width: 100px;
                cursor: pointer;
            }
            
            #yearSelect:focus {
                outline: none;
                border-color: #0D3B66;
                box-shadow: 0 0 0 2px rgba(13, 59, 102, 0.2);
            }
            
            #yearSelect:hover {
                border-color: #aaa;
            }
            
            .showMonthWiseButton {
                padding: 8px 16px;
                background-color: #0D3B66;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 15px;
                cursor: pointer;
                transition: background-color 0.3s;
            }
            
            .showMonthWiseButton:hover {
                background-color: #1a5276;
            }
        </style>
        
        <div class="section-title">
            <h2>Month-Wise Sales Report</h2>
            <div class="year-filter">
                <label for="yearSelect">Select Year:</label>
                <select id="yearSelect">
                    ${yearOptions}
                </select>
                <button class="showMonthWiseButton">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 5px;">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    Generate Report
                </button>
                <button id="exportExcelButton">Export to Excel</button>
            </div>
        </div>
        <div id="monthWiseDiv"></div>
    `;

    // Load saved year if it exists
    const savedYear = sessionStorage.getItem("monthWiseYear");
    if (savedYear) {
        document.getElementById("yearSelect").value = savedYear;
        fetchMonthWiseData(savedYear);
    } else {
        fetchMonthWiseData(currentYear);
    }

    document.querySelector(".showMonthWiseButton").addEventListener("click", () => {
        const year = document.getElementById("yearSelect").value;
        sessionStorage.setItem("monthWiseYear", year);
        fetchMonthWiseData(year);
    });
}

function fetchMonthWiseData(year) {
    const container = document.getElementById("monthWiseDiv");
    container.innerHTML = "<p>Loading month-wise data...</p>";
    
    ipcRenderer.send("get-month-wise-data", { year });
}

ipcRenderer.on("month-wise-data-response", (event, data) => {
    const container = document.getElementById("monthWiseDiv");
    container.innerHTML = "";

    if (!data.success) {
        container.innerHTML = `<p class="error">Error: ${data.error || 'Unknown error'}</p>`;
        return;
    }

    if (!data.months || data.months.length === 0) {
        container.innerHTML = "<p>No sales data found for the selected year.</p>";
        return;
    }

    let tableHTML = `
        <table class="month-wise-table" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
                <tr style="background-color: #0D3B66; color: white;">
                    <th onclick="sortMonthWiseTable('month')">Month <span id="monthSortIndicator">▼</span></th>
                    <th onclick="sortMonthWiseTable('orders')">Total Orders <span id="ordersSortIndicator"></span></th>
                    <th onclick="sortMonthWiseTable('units')">Units Sold <span id="unitsSortIndicator"></span></th>
                    <th onclick="sortMonthWiseTable('revenue')">Revenue (₹) <span id="revenueSortIndicator"></span></th>
                </tr>
            </thead>
            <tbody>
    `;

    data.months.forEach(month => {
        tableHTML += `
            <tr>
                <td data-month="${month.month}" style="border: 1px solid #ddd; padding: 8px;">${getMonthName(month.month)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${month.order_count}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${month.total_units}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${month.total_revenue.toFixed(2)}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
    
    // Initialize with month sorted in ascending order
    currentMonthSort = { column: 'month', order: 'asc' };
    updateMonthSortIndicators();

    setTimeout(() => {
        document.getElementById("exportExcelButton").addEventListener("click", () => {
            exportTableToExcel(".month-wise-table");
        });
    }, 100);
});

function getMonthName(monthNumber) {
    const months = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ];
    return months[monthNumber - 1] || monthNumber;
}

let currentMonthSort = { column: 'month', order: 'asc' };

function sortMonthWiseTable(column) {
    const table = document.querySelector(".month-wise-table tbody");
    if (!table) return;

    const rows = Array.from(table.rows);
    
    // Toggle order if same column
    if (currentMonthSort.column === column) {
        currentMonthSort.order = currentMonthSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentMonthSort = { column, order: 'asc' };
    }

    rows.sort((a, b) => {
        if (column === 'month') {
            // Sort by month number (stored in data attribute)
            const aMonth = parseInt(a.cells[0].getAttribute('data-month'));
            const bMonth = parseInt(b.cells[0].getAttribute('data-month'));
            return currentMonthSort.order === 'asc' ? aMonth - bMonth : bMonth - aMonth;
        } else {
            const cellIndex = column === 'orders' ? 1 : column === 'units' ? 2 : 3;
            const aVal = a.cells[cellIndex].innerText;
            const bVal = b.cells[cellIndex].innerText;
            const numA = parseFloat(aVal.replace(/,/g, ''));
            const numB = parseFloat(bVal.replace(/,/g, ''));
            return currentMonthSort.order === 'asc' ? numA - numB : numB - numA;
        }
    });

    // Rebuild table
    table.innerHTML = '';
    rows.forEach(row => table.appendChild(row));
    
    // Update indicators
    updateMonthSortIndicators();
}

function updateMonthSortIndicators() {
    ['month', 'orders', 'units', 'revenue'].forEach(col => {
        const indicator = document.getElementById(`${col}SortIndicator`);
        if (indicator) {
            indicator.textContent = currentMonthSort.column === col 
                ? (currentMonthSort.order === 'asc' ? '▲' : '▼')
                : '';
        }
    });
}

// Make sort function available globally
window.sortMonthWiseTable = sortMonthWiseTable;

module.exports = { loadMonthWiseAnalysis };