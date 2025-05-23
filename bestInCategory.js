// bestInCategory.js
const { ipcRenderer } = require('electron');
const { createTextPopup } = require("./textPopup");

function loadBestInCategory(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    // Set default dates (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);
    
    mainContent.innerHTML = `
        <div class="section-title">
            <h2>Best Selling Items in Each Category</h2>
            <div class="controls">
                <div class="date-range">
                    <label for="startDate">From:</label>
                    <input type="date" id="startDate" value="${startDate.toISOString().split('T')[0]}">
                    <label for="endDate">To:</label>
                    <input type="date" id="endDate" value="${endDate.toISOString().split('T')[0]}">
                    <button id="refreshBtn" class="refresh-btn" style="background-color: #104475;">
                        <i class="fas fa-sync-alt"></i> Generate Report
                    </button>
                </div>
            </div>
        </div>
        <div class="table-container">
            <table id="bestInCategoryTable">
                <thead>
                    <tr>
                        <th onclick="sortTable('category')">Category <span id="categorySortIcon"></span></th>
                        <th onclick="sortTable('items')">Top Selling Item(s) <span id="itemsSortIcon"></span></th>
                    </tr>
                </thead>
                <tbody id="tableBody">
                    <tr><td colspan="2">Loading data...</td></tr>
                </tbody>
            </table>
        </div>
        <style>
            .controls {
                margin: 15px 0;
            }
            
            .date-range {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .date-range input {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            .refresh-btn {
                background-color: #1DB954;
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .table-container {
                margin-top: 20px;
                overflow-x: auto;
            }
            
            #bestInCategoryTable {
                width: 100%;
                border-collapse: collapse;
            }
            
            #bestInCategoryTable th {
                background-color: #0D3B66;
                color: white;
                padding: 12px;
                text-align: left;
                cursor: pointer;
                position: relative;
            }
            
            #bestInCategoryTable th:hover {
                background-color: #1a5276;
            }
            
            #bestInCategoryTable td {
                padding: 10px;
                border-bottom: 1px solid #ddd;
            }
            
            #bestInCategoryTable tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            
            #bestInCategoryTable tr:hover {
                background-color: #f1f1f1;
            }
        </style>
    `;

    // Load initial data
    fetchData(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);

    // Set up event listeners
    document.getElementById('refreshBtn').addEventListener('click', () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            createTextPopup("Please select both start and end dates");
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            createTextPopup("Start date cannot be after end date");
            return;
        }
        
        fetchData(startDate, endDate);
    });
}

function fetchData(startDate, endDate) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '<tr><td colspan="2">Loading data...</td></tr>';
    
    ipcRenderer.send('get-best-in-category', { startDate, endDate });
}

ipcRenderer.on('best-in-category-response', (event, data) => {
    const tableBody = document.getElementById('tableBody');
    
    if (!data.success) {
        tableBody.innerHTML = `<tr><td colspan="2" style="color: red;">Error: ${data.error || 'Failed to load data'}</td></tr>`;
        return;
    }

    if (data.categories.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="2">No data available for selected date range</td></tr>';
        return;
    }

    let html = '';
    data.categories.forEach(category => {
        html += `
            <tr>
                <td data-sort-value="${category.catname.toLowerCase()}">${category.catname}</td>
                <td data-sort-value="${category.top_items.join(', ').toLowerCase()}">${category.top_items.join(', ')}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
});

// Sorting functionality
let currentSort = { column: null, direction: 'asc' };

window.sortTable = function(column) {
    const table = document.getElementById('bestInCategoryTable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.rows);
    const iconId = `${column}SortIcon`;
    const otherColumn = column === 'category' ? 'items' : 'category';
    const otherIconId = `${otherColumn}SortIcon`;
    
    // Reset other column's sort icon
    document.getElementById(otherIconId).textContent = '';
    
    // Determine new sort direction
    const newDirection = currentSort.column === column && currentSort.direction === 'asc' ? 'desc' : 'asc';
    currentSort = { column, direction: newDirection };
    
    // Update sort icon
    document.getElementById(iconId).textContent = newDirection === 'asc' ? '▲' : '▼';
    
    // Sort rows
    rows.sort((a, b) => {
        const aValue = a.cells[column === 'category' ? 0 : 1].getAttribute('data-sort-value');
        const bValue = b.cells[column === 'category' ? 0 : 1].getAttribute('data-sort-value');
        
        return newDirection === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
    });
    
    // Rebuild table
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
};

module.exports = { loadBestInCategory };