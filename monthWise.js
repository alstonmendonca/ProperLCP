const { ipcRenderer } = require('electron');

function loadMonthWiseAnalysis(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    const currentYear = new Date().getFullYear();
    
    mainContent.innerHTML = `
        <div class="section-title">
            <h2>Month-Wise Sales Report</h2>
            <div class="year-filter">
                <label for="yearSelect">Select Year:</label>
                <input type="number" id="yearSelect" min="2000" max="2100" value="${currentYear}">
                <button class="showMonthWiseButton">Generate Report</button>
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
        if (!year || year < 2000 || year > 2100) {
            alert("Please enter a valid year between 2000 and 2100");
            return;
        }

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
                <td style="border: 1px solid #ddd; padding: 8px;">${getMonthName(month.month)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${month.order_count}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${month.total_units}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${month.total_revenue.toFixed(2)}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
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
        const aVal = a.cells[
            column === 'month' ? 0 : 
            column === 'orders' ? 1 : 
            column === 'units' ? 2 : 3
        ].innerText;
        
        const bVal = b.cells[
            column === 'month' ? 0 : 
            column === 'orders' ? 1 : 
            column === 'units' ? 2 : 3
        ].innerText;

        if (column === 'month') {
            // Sort by month number (hidden in data attribute)
            const aMonth = a.cells[0].getAttribute('data-month');
            const bMonth = b.cells[0].getAttribute('data-month');
            return currentMonthSort.order === 'asc' ? aMonth - bMonth : bMonth - aMonth;
        } else {
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