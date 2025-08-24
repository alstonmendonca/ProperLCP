const { ipcRenderer } = require('electron');
const  {createTextPopup} = require("./textPopup");
const { exportTableToExcel } = require("./export");

function loadDayWiseAnalysis(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    const today = new Date().toISOString().split('T')[0];
    
    mainContent.innerHTML = `
        <div class="section-title">
            <h2>Day-Wise Sales Report</h2>
            <div class="date-filters">
                <label for="dayStartDate">Start Date:</label>
                <input type="date" id="dayStartDate" value="${today}">
                
                <label for="dayEndDate">End Date:</label>
                <input type="date" id="dayEndDate" value="${today}">
                
                <button class="showDayWiseButton">Generate Report</button>
                <button id="exportExcelButton">Export to Excel</button>
            </div>
        </div>
        <div id="dayWiseDiv"></div>
    `;

    // Load saved dates if they exist
    const savedStartDate = sessionStorage.getItem("dayWiseStartDate");
    const savedEndDate = sessionStorage.getItem("dayWiseEndDate");

    if (savedStartDate && savedEndDate) {
        document.getElementById("dayStartDate").value = savedStartDate;
        document.getElementById("dayEndDate").value = savedEndDate;
        fetchDayWiseData(savedStartDate, savedEndDate);
    } else {
        fetchDayWiseData(today, today);
    }

    document.querySelector(".showDayWiseButton").addEventListener("click", () => {
        const startDate = document.getElementById("dayStartDate").value;
        const endDate = document.getElementById("dayEndDate").value;

        sessionStorage.setItem("dayWiseStartDate", startDate);
        sessionStorage.setItem("dayWiseEndDate", endDate);

        fetchDayWiseData(startDate, endDate);
    });
}

function fetchDayWiseData(startDate, endDate) {
    if (!startDate || !endDate) {
        createTextPopup("Please select both start and end dates.");
        return;
    }

    const container = document.getElementById("dayWiseDiv");
    container.innerHTML = "<p>Loading day-wise data...</p>";
    
    ipcRenderer.send("get-day-wise-data", { startDate, endDate });
}

ipcRenderer.on("day-wise-data-response", (event, data) => {
    const container = document.getElementById("dayWiseDiv");
    container.innerHTML = "";

    if (!data.success) {
        container.innerHTML = `<p class="error">Error: ${data.error || 'Unknown error'}</p>`;
        return;
    }

    if (!data.days || data.days.length === 0) {
        container.innerHTML = "<p>No sales data found for the selected period.</p>";
        return;
    }

    let tableHTML = `
        <table class="day-wise-table" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
                <tr style="background-color: #0D3B66; color: white;">
                    <th onclick="sortDayWiseTable('date')">Date <span id="dateSortIndicator">▼</span></th>
                    <th onclick="sortDayWiseTable('orders')">Total Orders <span id="ordersSortIndicator"></span></th>
                    <th onclick="sortDayWiseTable('units')">Units Sold <span id="unitsSortIndicator"></span></th>
                    <th onclick="sortDayWiseTable('revenue')">Revenue (₹) <span id="revenueSortIndicator"></span></th>
                </tr>
            </thead>
            <tbody>
    `;

    data.days.forEach(day => {
        tableHTML += `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${formatDate(day.date)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${day.order_count}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${day.total_units}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${day.total_revenue.toFixed(2)}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;

    setTimeout(() => {
        document.getElementById("exportExcelButton").addEventListener("click", () => {
            exportTableToExcel(".day-wise-table");
        });
    }, 100);
});

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
}

let currentDaySort = { column: 'date', order: 'desc' };

function sortDayWiseTable(column) {
    const table = document.querySelector(".day-wise-table tbody");
    if (!table) return;

    const rows = Array.from(table.rows);
    
    // Toggle order if same column
    if (currentDaySort.column === column) {
        currentDaySort.order = currentDaySort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentDaySort = { column, order: 'asc' };
    }

    rows.sort((a, b) => {
        const aVal = a.cells[
            column === 'date' ? 0 : 
            column === 'orders' ? 1 : 
            column === 'units' ? 2 : 3
        ].innerText;
        
        const bVal = b.cells[
            column === 'date' ? 0 : 
            column === 'orders' ? 1 : 
            column === 'units' ? 2 : 3
        ].innerText;

        if (column === 'date') {
            const [aDay, aMonth, aYear] = aVal.split('-');
            const [bDay, bMonth, bYear] = bVal.split('-');
            const aDate = new Date(`${aYear}-${aMonth}-${aDay}`);
            const bDate = new Date(`${bYear}-${bMonth}-${bDay}`);
            return currentDaySort.order === 'asc' ? aDate - bDate : bDate - aDate;
        } else {
            const numA = parseFloat(aVal.replace(/,/g, ''));
            const numB = parseFloat(bVal.replace(/,/g, ''));
            return currentDaySort.order === 'asc' ? numA - numB : numB - numA;
        }
    });

    // Rebuild table
    table.innerHTML = '';
    rows.forEach(row => table.appendChild(row));
    
    // Update indicators
    updateDaySortIndicators();
}

function updateDaySortIndicators() {
    ['date', 'orders', 'units', 'revenue'].forEach(col => {
        const indicator = document.getElementById(`${col}SortIndicator`);
        if (indicator) {
            indicator.textContent = currentDaySort.column === col 
                ? (currentDaySort.order === 'asc' ? '▲' : '▼')
                : '';
        }
    });
}

// Make sort function available globally
window.sortDayWiseTable = sortDayWiseTable;

module.exports = { loadDayWiseAnalysis };