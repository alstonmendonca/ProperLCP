// salesOverview.js

// Function to load the Sales Overview content
function loadSalesOverview(mainContent, billPanel) {
    // Set the main content's margin to accommodate the category panel
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";

    // Create the HTML structure for the Sales Overview
    mainContent.innerHTML = `
        <h2>Sales Overview</h2>
        <div class="sales-overview-grid">
            <div class="sales-box" id="totalSales" onclick="handleBoxClick('TotalSales')">
                <h3>Total Sales</h3>
            </div>
            <div class="sales-box" id="revenue" onclick="handleBoxClick('Revenue')">
                <h3>Revenue</h3>
            </div>
            <div class="sales-box" id="taxInfo" onclick="handleBoxClick('TaxInfo')">
                <h3>Tax Information</h3>
            </div>
            <div class="sales-box" id="highestSellingItem" onclick="handleBoxClick('HighestSellingItem')">
                <h3>Item with Highest Sales</h3>
            </div>
            <div class="sales-box" id="highestSellingCategory" onclick="handleBoxClick('HighestSellingCategory')">
                <h3>Category with Highest Sales</h3>
            </div>
            <div class="sales-box" id="highestSellingCategory" onclick="handleBoxClick('HighestSellingCategory')">
                <h3>Sales Statistics</h3>
            </div>
            <!-- Add more boxes as needed -->
        </div>
    `;

    // Hide the bill panel
    billPanel.style.display = 'none';
}

// Function to handle box clicks
function handleBoxClick(boxType) {
    // Placeholder for functionality to be added later
    console.log(`Clicked on: ${boxType}`);
}

// Export the loadSalesOverview function
module.exports = { loadSalesOverview };