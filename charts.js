// charts.js
const { ipcRenderer } = require('electron');
const Chart = require('chart.js/auto');

function loadCharts(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    mainContent.innerHTML = `
        <div class="section-title">
            <h2>7-Day Sales Performance</h2>
            <div class="chart-controls">
                <button id="refreshChart" class="refresh-btn">
                    <i class="fas fa-sync-alt"></i> Refresh Chart
                </button>
            </div>
        </div>
        <div class="chart-container" style="position: relative; height:70vh; width:80vw">
            <canvas id="salesChart"></canvas>
        </div>
        <style>
            .chart-controls {
                margin-bottom: 15px;
            }
            
            .refresh-btn {
                background-color: #104475;
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
                background-color: #092947;
            }
        </style>
    `;

    // Initialize chart
    const ctx = document.getElementById('salesChart').getContext('2d');
    let salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Number of Sales',
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.1,
                    yAxisID: 'y'
                },
                {
                    label: 'Total Revenue (₹)',
                    data: [],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.1,
                    yAxisID: 'y1'
                },
                {
                    label: 'Units Sold',
                    data: [],
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 2,
                    tension: 0.1,
                    yAxisID: 'y2'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Number of Sales'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                    title: {
                        display: true,
                        text: 'Total Revenue (₹)'
                    }
                },
                y2: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                    title: {
                        display: true,
                        text: 'Units Sold'
                    },
                    // Adjust this if units sold scale is very different
                    suggestedMin: 0
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });

    // Load initial data
    fetchSalesData(salesChart);

    // Set up refresh button
    document.getElementById('refreshChart').addEventListener('click', () => {
        fetchSalesData(salesChart);
    });
}

function fetchSalesData(chart) {
    ipcRenderer.send('get-seven-day-sales');
}

ipcRenderer.on('seven-day-sales-response', (event, data) => {
    const chart = Chart.getChart('salesChart');
    
    if (!data.success) {
        console.error('Error loading sales data:', data.error);
        return;
    }

    // Update chart data
    chart.data.labels = data.dates;
    chart.data.datasets[0].data = data.salesCounts;
    chart.data.datasets[1].data = data.totalRevenues;
    chart.data.datasets[2].data = data.unitsSold;
    chart.update();
});

module.exports = { loadCharts };