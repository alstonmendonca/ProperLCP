// dayEndSummary.js

// Function to load the Day End Summary content
function loadDayEndSummary(mainContent, billPanel) {
    // Set the main content's margin to accommodate the category panel
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";

    // Create the HTML structure for the Day End Summary
    mainContent.innerHTML = `
        <h2>Day End Summary</h2>
        <div class="summary-container">
            <div class="summary-div" id="totalRevenue" onclick="handleSummaryClick('TotalRevenue')">
                <h3>Total Revenue Today</h3>
                <div class="summary-info">₹0.00</div> <!-- Placeholder for info -->
            </div>
            <div class="summary-div" id="totalSales" onclick="handleSummaryClick('TotalSales')">
                <h3>Total Sales Today</h3>
                <div class="summary-info">0</div> <!-- Placeholder for info -->
            </div>
            <div class="summary-div" id="mostSoldItem" onclick="handleSummaryClick('MostSoldItem')">
                <h3>Most Sold Item Today</h3>
                <div class="summary-info">Item Name</div> <!-- Placeholder for info -->
            </div>
            <div class="summary-div" id="highestRevenueItem" onclick="handleSummaryClick('HighestRevenueItem')">
                <h3>Item with Highest Revenue Today</h3>
                <div class="summary-info">Item Name</div> <!-- Placeholder for info -->
            </div>
            <div class="summary-div" id="mostSoldCategory" onclick="handleSummaryClick('MostSoldCategory')">
                <h3>Most Sold Category</h3>
                <div class="summary-info">Item Name</div> <!-- Placeholder for info -->
            </div>
            <div class="summary-div" id="highestRevenueCategory" onclick="handleSummaryClick('HighestRevenueCategory')">
                <h3>Category with Highest Revenue Today</h3>
                <div class="summary-info">Item Name</div> <!-- Placeholder for info -->
            </div>
            <div class="summary-div" id="totalTax" onclick="handleSummaryClick('TotalTax')">
                <h3>Total Tax From Sales</h3>
                <div class="summary-info">0</div> <!-- Placeholder for info -->
            </div>
            <div class="summary-div" id="discountedOrders" onclick="handleSummaryClick('DiscountedOrders')">
                <h3>Number of Discounted Orders Today</h3>
                <div class="summary-info">0</div> <!-- Placeholder for info -->
            </div>
            <div class="summary-div" id="deletedOrders" onclick="handleSummaryClick('DeletedOrders')">
                <h3>Number of Deleted Orders Today</h3>
                <div class="summary-info">0</div> <!-- Placeholder for info -->
            </div>
            <div class="summary-div" id="yesterdayComparison" onclick="handleSummaryClick('YesterdayComparison')">
                <h3>Compared To Yesterday</h3>
                <div class="summary-info">0</div> <!-- Placeholder for info -->
            </div>
        </div>
        <!-- Add more summary divs as needed -->
    `;

    // Hide the bill panel
    billPanel.style.display = 'none';
}

// Function to handle summary div clicks
function handleSummaryClick(summaryType) {
    // Placeholder for functionality to be added later
    console.log(`Clicked on: ${summaryType}`);
    // Expand the clicked div or show detailed information
    const summaryDiv = document.getElementById(summaryType);
    summaryDiv.classList.toggle('expanded'); // Toggle the expanded class
}

// Export the loadDayEndSummary function
module.exports = { loadDayEndSummary, handleSummaryClick };