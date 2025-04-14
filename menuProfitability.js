// menuProfitability.js
const { ipcRenderer } = require('electron');

function loadMenuProfitability(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    mainContent.innerHTML = `
        <div class="section-title">
            <h2>Menu Item Profitability Ranking</h2>
            <div class="controls">
                <div class="date-range">
                    <input type="date" id="startDate">
                    <span>to</span>
                    <input type="date" id="endDate">
                </div>
                <button id="refreshProfitability" class="refresh-btn">
                    <i class="fas fa-sync-alt"></i> Generate Report
                </button>
            </div>
        </div>
        <div class="profitability-container">
            <div class="profitability-header">
                <span class="rank">#</span>
                <span class="item-name">Menu Item</span>
                <span class="category">Category</span>
                <span class="units">Units Sold</span>
                <span class="revenue">Revenue</span>
                <span class="cost">Cost</span>
                <span class="profit">Profit</span>
                <span class="margin">Margin</span>
            </div>
            <div id="profitabilityResults" class="profitability-results"></div>
        </div>
        <style>
            .profitability-container {
                margin-top: 20px;
                border: 1px solid #ddd;
                border-radius: 5px;
                overflow: hidden;
            }
            
            .profitability-header {
                display: grid;
                grid-template-columns: 50px 2fr 1.5fr 1fr 1fr 1fr 1fr 1fr;
                background-color: #0D3B66;
                color: white;
                padding: 10px 15px;
                font-weight: bold;
                gap: 10px;
            }
            
            .profitability-results {
                max-height: 600px;
                overflow-y: auto;
            }
            
            .profitability-item {
                display: grid;
                grid-template-columns: 50px 2fr 1.5fr 1fr 1fr 1fr 1fr 1fr;
                padding: 10px 15px;
                border-bottom: 1px solid #eee;
                align-items: center;
                gap: 10px;
            }
            
            .profitability-item:nth-child(even) {
                background-color: #f9f9f9;
            }
            
            .profitability-item:hover {
                background-color: #f0f0f0;
            }
            
            .controls {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 15px;
            }
            
            .date-range {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .date-range input {
                padding: 5px;
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
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .refresh-btn:hover {
                background-color: #169c46;
            }
            
            .profit {
                color: #28a745;
                font-weight: bold;
            }
            
            .margin {
                color: #17a2b8;
                font-weight: bold;
            }
            
            .cost {
                color: #dc3545;
            }
        </style>
    `;

    // Set default dates (current month)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('startDate').valueAsDate = firstDay;
    document.getElementById('endDate').valueAsDate = today;

    // Load initial data
    fetchProfitabilityData();

    // Set up refresh button
    document.getElementById('refreshProfitability').addEventListener('click', fetchProfitabilityData);
}

function fetchProfitabilityData() {
    const container = document.getElementById('profitabilityResults');
    container.innerHTML = '<div class="loading">Loading profitability data...</div>';
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    ipcRenderer.send('get-menu-profitability', { startDate, endDate });
}

ipcRenderer.on('menu-profitability-response', (event, data) => {
    const container = document.getElementById('profitabilityResults');
    
    if (!data.success) {
        container.innerHTML = `<div class="error">Error: ${data.error || 'Failed to load profitability data'}</div>`;
        return;
    }

    if (data.items.length === 0) {
        container.innerHTML = '<div class="no-data">No profitability data found for selected period</div>';
        return;
    }

    let html = '';
    data.items.forEach((item, index) => {
        html += `
            <div class="profitability-item">
                <span class="rank">${index + 1}</span>
                <span class="item-name">${item.fname}</span>
                <span class="category">${item.catname}</span>
                <span class="units">${item.total_units_sold}</span>
                <span class="revenue">₹${item.total_revenue.toFixed(2)}</span>
                <span class="cost">₹${item.total_cost.toFixed(2)}</span>
                <span class="profit">₹${item.total_profit.toFixed(2)}</span>
                <span class="margin">${item.profit_margin}%</span>
            </div>
        `;
    });

    container.innerHTML = html;
});

module.exports = { loadMenuProfitability };