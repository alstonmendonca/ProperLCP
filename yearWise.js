// yearWise.js
const { ipcRenderer } = require('electron');

function loadYearWiseAnalysis(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    mainContent.innerHTML = `
        <div class="section-title">
            <h2>Year-Wise Sales Report</h2>
        </div>
        <div id="yearWiseDiv" style="margin-top: 20px;"></div>
    `;

    fetchYearWiseData();
}

function fetchYearWiseData() {
    const container = document.getElementById("yearWiseDiv");
    container.innerHTML = "<p>Loading year-wise data...</p>";
    
    ipcRenderer.send("get-year-wise-data");
}

ipcRenderer.on("year-wise-data-response", (event, data) => {
    const container = document.getElementById("yearWiseDiv");
    container.innerHTML = "";

    if (!data.success) {
        container.innerHTML = `<p class="error">Error: ${data.error || 'Unknown error'}</p>`;
        return;
    }

    if (!data.years || data.years.length === 0) {
        container.innerHTML = "<p>No sales data found.</p>";
        return;
    }

    let tableHTML = `
        <table class="year-wise-table" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background-color: #0D3B66; color: white;">
                    <th onclick="sortYearWiseTable('year')">Year <span id="yearSortIndicator">▼</span></th>
                    <th onclick="sortYearWiseTable('orders')">Total Orders <span id="ordersSortIndicator"></span></th>
                    <th onclick="sortYearWiseTable('units')">Units Sold <span id="unitsSortIndicator"></span></th>
                    <th onclick="sortYearWiseTable('revenue')">Revenue (₹) <span id="revenueSortIndicator"></span></th>
                </tr>
            </thead>
            <tbody>
    `;

    data.years.forEach(year => {
        tableHTML += `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${year.year}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${year.order_count}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${year.total_units}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${year.total_revenue.toFixed(2)}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;

    // Initialize with year sorted in descending order (most recent first)
    currentYearSort = { column: 'year', order: 'desc' };
    updateYearSortIndicators();
});

let currentYearSort = { column: 'year', order: 'desc' };

function sortYearWiseTable(column) {
    const table = document.querySelector(".year-wise-table tbody");
    if (!table) return;

    const rows = Array.from(table.rows);
    
    // Toggle order if same column
    if (currentYearSort.column === column) {
        currentYearSort.order = currentYearSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentYearSort = { column, order: 'asc' };
    }

    rows.sort((a, b) => {
        const cellIndex = column === 'year' ? 0 : 
                         column === 'orders' ? 1 : 
                         column === 'units' ? 2 : 3;
        
        const aVal = a.cells[cellIndex].innerText;
        const bVal = b.cells[cellIndex].innerText;
        
        if (column === 'year') {
            return currentYearSort.order === 'asc' ? parseInt(aVal) - parseInt(bVal) : parseInt(bVal) - parseInt(aVal);
        } else {
            const numA = parseFloat(aVal.replace(/,/g, ''));
            const numB = parseFloat(bVal.replace(/,/g, ''));
            return currentYearSort.order === 'asc' ? numA - numB : numB - numA;
        }
    });

    // Rebuild table
    table.innerHTML = '';
    rows.forEach(row => table.appendChild(row));
    
    // Update indicators
    updateYearSortIndicators();
}

function updateYearSortIndicators() {
    ['year', 'orders', 'units', 'revenue'].forEach(col => {
        const indicator = document.getElementById(`${col}SortIndicator`);
        if (indicator) {
            indicator.textContent = currentYearSort.column === col 
                ? (currentYearSort.order === 'asc' ? '▲' : '▼')
                : '';
        }
    });
}

// Make sort function available globally
window.sortYearWiseTable = sortYearWiseTable;

module.exports = { loadYearWiseAnalysis };