// specialStatistics.js
const { ipcRenderer } = require('electron');

function loadSpecialStatistics(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    mainContent.innerHTML = `
        <div class="section-title">
            <h2>Special Statistics - Food Pairing Analysis</h2>
            <div class="controls">
                <button id="refreshPairings" class="refresh-btn">
                    <i class="fas fa-sync-alt"></i> Refresh Data
                </button>
            </div>
        </div>
        <div class="pairing-container">
            <div class="pairing-header">
                <span class="pairing-rank">#</span>
                <span class="pairing-items">Item Pair</span>
                <span class="pairing-count">Times Ordered Together</span>
            </div>
            <div id="pairingResults" class="pairing-results"></div>
        </div>
        <style>
            .pairing-container {
                margin-top: 20px;
                border: 1px solid #ddd;
                border-radius: 5px;
                overflow: hidden;
            }
            
            .pairing-header {
                display: flex;
                background-color: #0D3B66;
                color: white;
                padding: 10px 15px;
                font-weight: bold;
            }
            
            .pairing-rank {
                width: 50px;
            }
            
            .pairing-items {
                flex: 2;
            }
            
            .pairing-count {
                flex: 1;
                text-align: right;
            }
            
            .pairing-results {
                max-height: 500px;
                overflow-y: auto;
            }
            
            .pairing-item {
                display: flex;
                padding: 10px 15px;
                border-bottom: 1px solid #eee;
                align-items: center;
            }
            
            .pairing-item:nth-child(even) {
                background-color: #f9f9f9;
            }
            
            .pairing-item:hover {
                background-color: #f0f0f0;
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
        </style>
    `;

    // Load initial data
    fetchFoodPairings();

    // Set up refresh button
    document.getElementById('refreshPairings').addEventListener('click', fetchFoodPairings);
}

function fetchFoodPairings() {
    const container = document.getElementById('pairingResults');
    container.innerHTML = '<div class="loading">Loading food pairing data...</div>';
    
    ipcRenderer.send('get-food-pairings');
}

ipcRenderer.on('food-pairings-response', (event, data) => {
    const container = document.getElementById('pairingResults');
    
    if (!data.success) {
        container.innerHTML = `<div class="error">Error: ${data.error || 'Failed to load food pairings'}</div>`;
        return;
    }

    if (data.pairings.length === 0) {
        container.innerHTML = '<div class="no-data">No food pairing data found</div>';
        return;
    }

    let html = '';
    data.pairings.forEach((pair, index) => {
        html += `
            <div class="pairing-item">
                <span class="pairing-rank">${index + 1}</span>
                <span class="pairing-items">
                    ${pair.item1} + ${pair.item2}
                </span>
                <span class="pairing-count">${pair.times_ordered_together}</span>
            </div>
        `;
    });

    container.innerHTML = html;
});

module.exports = { loadSpecialStatistics };