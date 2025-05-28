const { ipcRenderer } = require("electron");
const  {createTextPopup} = require("./textPopup");

function loadEmployeeAnalysis(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    mainContent.innerHTML = `
        <div class="section-title">
            <h2>Employee Analysis</h2>
            <div class="date-filters">
                <label for="empStartDate">Start Date:</label>
                <input type="date" id="empStartDate">
                
                <label for="empEndDate">End Date:</label>
                <input type="date" id="empEndDate">
                
                <button class="showEmployeeAnalysis">Generate Report</button>
            </div>
        </div>
        <div id="employeeAnalysisDiv"></div>
    `;

    // Set default dates to today
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("empStartDate").value = today;
    document.getElementById("empEndDate").value = today;

    // Load saved dates if they exist
    const savedStartDate = sessionStorage.getItem("empStartDate");
    const savedEndDate = sessionStorage.getItem("empEndDate");

    if (savedStartDate && savedEndDate) {
        document.getElementById("empStartDate").value = savedStartDate;
        document.getElementById("empEndDate").value = savedEndDate;
        fetchEmployeeAnalysis(savedStartDate, savedEndDate);
    } else {
        fetchEmployeeAnalysis(today, today);
    }

    document.querySelector(".showEmployeeAnalysis").addEventListener("click", () => {
        const startDate = document.getElementById("empStartDate").value;
        const endDate = document.getElementById("empEndDate").value;

        sessionStorage.setItem("empStartDate", startDate);
        sessionStorage.setItem("empEndDate", endDate);

        fetchEmployeeAnalysis(startDate, endDate);
    });
}

function fetchEmployeeAnalysis(startDate, endDate) {
    if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
        createTextPopup("Please select both start and end dates.");
        return;
    }

    ipcRenderer.send("get-employee-analysis", { startDate, endDate });
}

ipcRenderer.on("employee-analysis-response", (event, data) => {
    const container = document.getElementById("employeeAnalysisDiv");
    container.innerHTML = "";

    if (!data.success || data.employees.length === 0) {
        container.innerHTML = "<p>No employee data found for the selected period.</p>";
        return;
    }

    let tableHTML = `
        <table class="employee-table" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
                <tr style="background-color: #0D3B66; color: white;">
                    <th onclick="sortEmployeeTable('name')">Employee <span id="nameSortIndicator">▲</span></th>
                    <th onclick="sortEmployeeTable('orders')">Orders <span id="ordersSortIndicator"></span></th>
                    <th onclick="sortEmployeeTable('units')">Units Sold <span id="unitsSortIndicator"></span></th>
                    <th onclick="sortEmployeeTable('revenue')">Revenue (₹) <span id="revenueSortIndicator"></span></th>
                </tr>
            </thead>
            <tbody>
    `;

    data.employees.forEach(emp => {
        tableHTML += `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${emp.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${emp.order_count}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${emp.total_units}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${emp.total_revenue.toFixed(2)}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
});

let currentEmpSort = { column: 'name', order: 'asc' };

function sortEmployeeTable(column) {
    const table = document.querySelector(".employee-table tbody");
    if (!table) return;

    const rows = Array.from(table.rows);
    
    // Toggle order if same column
    if (currentEmpSort.column === column) {
        currentEmpSort.order = currentEmpSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentEmpSort = { column, order: 'asc' };
    }

    rows.sort((a, b) => {
        const aVal = a.cells[
            column === 'name' ? 0 : 
            column === 'orders' ? 1 : 
            column === 'units' ? 2 : 3
        ].innerText;
        
        const bVal = b.cells[
            column === 'name' ? 0 : 
            column === 'orders' ? 1 : 
            column === 'units' ? 2 : 3
        ].innerText;

        if (column === 'name') {
            return currentEmpSort.order === 'asc' 
                ? aVal.localeCompare(bVal) 
                : bVal.localeCompare(aVal);
        } else {
            const numA = parseFloat(aVal.replace(/,/g, ''));
            const numB = parseFloat(bVal.replace(/,/g, ''));
            return currentEmpSort.order === 'asc' ? numA - numB : numB - numA;
        }
    });

    // Rebuild table
    table.innerHTML = '';
    rows.forEach(row => table.appendChild(row));
    
    // Update indicators
    updateEmpSortIndicators();
}

function updateEmpSortIndicators() {
    ['name', 'orders', 'units', 'revenue'].forEach(col => {
        const indicator = document.getElementById(`${col}SortIndicator`);
        if (indicator) {
            indicator.textContent = currentEmpSort.column === col 
                ? (currentEmpSort.order === 'asc' ? '▲' : '▼')
                : '';
        }
    });
}

module.exports = { loadEmployeeAnalysis, sortEmployeeTable };