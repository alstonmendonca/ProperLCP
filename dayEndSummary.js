// dayEndSummary.js

const { ipcRenderer } = require('electron'); // Import ipcRenderer for inter-process communication

// Function to load the Day End Summary content
async function loadDayEndSummary(mainContent, billPanel) {
    // Set the main content's margin to accommodate the category panel
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    

    // Create the HTML structure for the Day End Summary
    mainContent.innerHTML = `
    <div style="background: linear-gradient(90deg,rgb(255, 255, 255),rgb(255, 255, 255)); padding: 20px; border-radius: 40px; border-color: #464646;">
        <h2 style="text-align: center; font-size: 3em; color: #094872; 
            margin: 0; 
            font-family: 'Arial', sans-serif;">
            Day End Summary
        </h2>
    </div>
    <div class="summary-container">
        <div class="summary-div" id="totalRevenue" onclick="handleSummaryClick('TotalRevenue')">
            <h3>Total Revenue Today</h3>
            <div class="summary-info-container">
                <div class="summary-info" id="revenueAmount">₹0.00</div> <!-- Placeholder for info -->
            </div>
        </div>
        <div class="summary-div" id="totalSales" onclick="handleSummaryClick('TotalSales')">
            <h3>Total Sales Today</h3>
            <div class="summary-info-container">
                <div class="summary-info" id="salesCount">0</div> <!-- Placeholder for info -->
            </div>
        </div>
        <div class="summary-div" id="yesterdaysRevenue" onclick="handleSummaryClick('YesterdaysRevenue')">
            <h3>Yesterday's Revenue</h3>
            <div class="summary-info-container">
                <div class="summary-info" id="yesterdaysRevenueAmount">₹0.00</div> <!-- Placeholder for info -->
            </div>
        </div>
        <div class="summary-div" id="totalTax" onclick="handleSummaryClick('TotalTax')">
            <h3>Total Tax From Sales</h3>
            <div class="summary-info-container">
                <div class="summary-info" id="taxAmount">0</div> <!-- Placeholder for info -->
            </div>
        </div>
        <div class="summary-div" id="discountedOrders" onclick="handleSummaryClick('DiscountedOrders')">
            <h3>Number of Discounted Orders Today</h3>
            <div class="summary-info-container">
                <div class="summary-info" id="discountedCount">0</div> <!-- Placeholder for info -->
            </div>
        </div>
        <div class="summary-div" id="deletedOrders" onclick="handleSummaryClick('DeletedOrders')">
            <h3>Number of Deleted Orders Today</h3>
            <div class="summary-info-container">
                <div class="summary-info" id="deletedCount">0</div> <!-- Placeholder for info -->
            </div>
        </div>
        <div class="summary-div" id="mostSoldItem" onclick="handleSummaryClick('MostSoldItem')">
            <h3>Most Sold Item Today</h3>
            <div class="summary-info-container">
                <div class="summary-info">Item Name</div> <!-- Placeholder for info -->
            </div>
        </div>
        <div class="summary-div" id="highestRevenueItem" onclick="handleSummaryClick('HighestRevenueItem')">
            <h3>Item with Highest Revenue Today</h3>
            <div class="summary-info-container">
                <div class="summary-info">Item Name</div> <!-- Placeholder for info -->
            </div>
        </div>
        <div class="summary-div" id="mostSoldCategory" onclick="handleSummaryClick('MostSoldCategory')">
            <h3>Most Sold Category</h3>
            <div class="summary-info-container">
                <div class="summary-info">Item Name</div> <!-- Placeholder for info -->
            </div>
        </div>
        <div class="summary-div" id="highestRevenueCategory" onclick="handleSummaryClick('HighestRevenueCategory')">
            <h3>Category with Highest Revenue Today</h3>
            <div class="summary-info-container">
                <div class="summary-info">Item Name</div> <!-- Placeholder for info -->
            </div>
        </div>
    </div>
    `;

    // Hide the bill panel
    billPanel.style.display = 'none';

    // Fetch today's total revenue
    const totalRevenue = await fetchTotalRevenueToday();
    document.getElementById('revenueAmount').innerText = `₹${totalRevenue.toFixed(2)}`; // Update the revenue display

    // Fetch today's total sales
    const totalSales = await fetchTotalSalesToday();
    document.getElementById('salesCount').innerText = totalSales; // Update the sales count display

    // Fetch today's total tax
    const totalTax = await fetchTotalTaxToday();
    document.getElementById('taxAmount').innerText = totalTax; // Update the tax amount display

    // Fetch today's total discounted orders
    const totalDiscountedOrders = await fetchTotalDiscountedOrdersToday();
    document.getElementById('discountedCount').innerText = totalDiscountedOrders; // Update the discounted orders count display

    // Fetch today's total deleted orders
    const totalDeletedOrders = await fetchTotalDeletedOrdersToday();
    document.getElementById('deletedCount').innerText = totalDeletedOrders; // Update the deleted orders count display

    // Fetch yesterday's revenue
    const yesterdaysRevenue = await fetchYesterdaysRevenue();

    // Update the yesterday's revenue display
    const yesterdaysRevenueElement = document.getElementById('yesterdaysRevenueAmount');
    yesterdaysRevenueElement.innerText = `₹${yesterdaysRevenue.toFixed(2)}`; // Format the revenue
    yesterdaysRevenueElement.style.fontSize = '22px'; // Increase font size
    yesterdaysRevenueElement.style.fontWeight = 'bold'; // Make the text bold


    // Fetch today's most sold items
    const mostSoldItems = await fetchMostSoldItemsToday();
    let mostSoldText = mostSoldItems.join(', '); // Join the items with a comma

    // If there are more than 2 items, truncate the list and add "..."
    if (mostSoldItems.length > 2) {
        mostSoldText = mostSoldText.slice(0, mostSoldText.lastIndexOf(',')) + ', ...'; // Show only the first two items
    }

    document.getElementById('mostSoldItem').children[1].innerText = mostSoldText; // Update the most sold items display

    // Fetch today's most sold categories
    const mostSoldCategories = await fetchMostSoldCategoriesToday();
    let mostSoldCategoryText = mostSoldCategories.join(', '); // Join the categories with a comma

    if (mostSoldCategories.length === 0) {
        document.getElementById('mostSoldCategory').children[1].innerText = "No categories sold today"; // Display a message if no categories
    } else {
        let mostSoldCategoryText = mostSoldCategories.join(', '); // Join the categories with a comma
    
        // If there are more than 2 categories, truncate the list and add "..."
        if (mostSoldCategories.length > 2) {
            mostSoldCategoryText = mostSoldCategoryText.slice(0, mostSoldCategoryText.lastIndexOf(',')) + ', ...'; // Show only the first two categories
        }
    
        document.getElementById('mostSoldCategory').children[1].innerText = mostSoldCategoryText; // Update the most sold categories display
    }

    // Fetch today's highest revenue items
    const highestRevenueItems = await fetchHighestRevenueItemsToday();
    let highestRevenueText = highestRevenueItems.join(', '); // Join the items with a comma

    // If there are more than 2 items, truncate the list and add "..."
    if (highestRevenueItems.length > 2) {
        highestRevenueText = highestRevenueText.slice(0, highestRevenueText.lastIndexOf(',')) + ', ...'; // Show only the first two items
    }

    document.getElementById('highestRevenueItem').children[1].innerText = highestRevenueText; // Update the highest revenue items display

    // Fetch today's highest revenue category
    const highestRevenueCategories = await fetchHighestRevenueCategoryToday();
    let highestRevenueCategoriesText = highestRevenueCategories.join(', '); // Join the categories with a comma

    // If there are more than 2 categories, truncate the list and add "..."
    if (highestRevenueCategories.length > 2) {
        highestRevenueCategoriesText = highestRevenueCategoriesText.slice(0, highestRevenueCategoriesText.lastIndexOf(',')) + ', ...'; // Show only the first two categories
    }

    document.getElementById('highestRevenueCategory').children[1].innerText = highestRevenueCategoriesText; // Update the highest revenue categories display
}

// Function to fetch total revenue for today
async function fetchTotalRevenueToday() {
    return new Promise((resolve, reject) => {
        ipcRenderer.invoke('get-todays-revenue') // Send a request to the main process
            .then((revenue) => {
                resolve(revenue); // Resolve the promise with the revenue
            })
            .catch((error) => {
                console.error("Error fetching today's revenue:", error);
                resolve(0); // In case of error, return 0
            });
    });
}

// Function to fetch total sales for today
async function fetchTotalSalesToday() {
    return new Promise((resolve, reject) => {
        ipcRenderer.invoke('get-todays-sales') // Send a request to the main process
            .then((salesCount) => {
                resolve(salesCount); // Resolve the promise with the sales count
            })
            .catch((error) => {
                console.error("Error fetching today's sales count:", error);
                resolve(0); // In case of error, return 0
            });
    });
}

// Function to fetch total tax for today
async function fetchTotalTaxToday() {
    return new Promise((resolve, reject) => {
        ipcRenderer.invoke('get-todays-tax') // Send a request to the main process
            .then((taxAmount) => {
                resolve(taxAmount); // Resolve the promise with the tax amount
            })
            .catch((error) => {
                console.error("Error fetching today's tax amount:", error);
                resolve(0); // In case of error, return 0
            });
    });
}

// Function to fetch total discounted orders for today
async function fetchTotalDiscountedOrdersToday() {
    return new Promise((resolve, reject) => {
        ipcRenderer.invoke('get-todays-discounted-orders') // Send a request to the main process
            .then((discountedCount) => {
                resolve(discountedCount); // Resolve the promise with the discounted orders count
            })
            .catch((error) => {
                console.error("Error fetching today's discounted orders count:", error);
                resolve(0); // In case of error, return 0
            });
    });
}

// Function to fetch total deleted orders for today
async function fetchTotalDeletedOrdersToday() {
    return new Promise((resolve, reject) => {
        ipcRenderer.invoke('get-todays-deleted-orders') // Send a request to the main process
            .then((deletedCount) => {
                resolve(deletedCount); // Resolve the promise with the deleted orders count
            })
            .catch((error) => {
                console.error("Error fetching today's deleted orders count:", error);
                resolve(0); // In case of error, return 0
            });
    });
}

// Function to fetch yesterday's revenue
async function fetchYesterdaysRevenue() {
    return new Promise((resolve, reject) => {
        ipcRenderer.invoke('get-yesterdays-revenue') // Send a request to the main process
            .then((revenue) => {
                resolve(revenue); // Resolve the promise with the revenue
            })
            .catch((error) => {
                console.error("Error fetching yesterday's revenue:", error);
                resolve(0); // In case of error, return 0
            });
    });
}

// Function to fetch most sold categories for today
async function fetchMostSoldCategoriesToday() {
    return new Promise((resolve, reject) => {
        ipcRenderer.invoke('get-most-sold-categories') // Send a request to the main process
            .then((categories) => {
                resolve(categories); // Resolve the promise with the categories
            })
            .catch((error) => {
                console.error("Error fetching today's most sold categories:", error);
                resolve([]); // In case of error, return an empty array
            });
    });
}

// Function to fetch highest revenue item(s) for today
async function fetchHighestRevenueItemsToday() {
    return new Promise((resolve, reject) => {
        ipcRenderer.invoke('get-highest-revenue-items') // Send a request to the main process
            .then((items) => {
                resolve(items); // Resolve the promise with the items
            })
            .catch((error) => {
                console.error("Error fetching today's highest revenue items:", error);
                resolve([]); // In case of error, return an empty array
            });
    });
}

// Function to fetch highest revenue category for today
async function fetchHighestRevenueCategoryToday() {
    return new Promise((resolve, reject) => {
        ipcRenderer.invoke('get-highest-revenue-category') // Send a request to the main process
            .then((categories) => {
                resolve(categories); // Resolve the promise with the categories
            })
            .catch((error) => {
                console.error("Error fetching today's highest revenue category:", error);
                resolve([]); // In case of error, return an empty array
            });
    });
}
// Function to handle summary div clicks
function handleSummaryClick(summaryType) {
    // Placeholder for functionality to be added later
    console.log(`Clicked on: ${summaryType}`);
    // Expand the clicked div or show detailed information
    const summaryDiv = document.getElementById(summaryType);
    summaryDiv.classList.toggle('expanded'); // Toggle the expanded class
}

// Function to fetch most sold items for today
async function fetchMostSoldItemsToday() {
    return new Promise((resolve, reject) => {
        ipcRenderer.invoke('get-most-sold-items') // Send a request to the main process
            .then((items) => {
                resolve(items); // Resolve the promise with the items
            })
            .catch((error) => {
                console.error("Error fetching today's most sold items:", error);
                resolve([]); // In case of error, return an empty array
            });
    });
}

// Export the loadDayEndSummary function
module.exports = { loadDayEndSummary, handleSummaryClick };