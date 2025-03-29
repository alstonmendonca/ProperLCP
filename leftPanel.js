// leftPanel.js
const { ipcRenderer } = require('electron');

// Function to dynamically update the left panel (category or settings buttons)
async function updateLeftPanel(contentType) {
    const categoryPanel = document.getElementById("category-panel");

    // Ensure the panel is visible for other sections
    if (contentType !== "Categories") {
        categoryPanel.style.display = "block";
    }

    switch (contentType) {
        case "Home":
            categoryPanel.style.display = "block";
            // Render Home-related buttons
            const categories = await ipcRenderer.invoke("get-categories");

            if (categories.length > 0) {
                categoryPanel.innerHTML = categories
                    .map(
                        (category) =>
                            `<button class="category" id="${category.catname}" onclick="updateMainContent('${category.catname}')">${category.catname}</button>`
                    )
                    .join("");
            } else {
                categoryPanel.innerHTML = "<p>No categories found.</p>";
            }
            break;

        case "Menu":
            categoryPanel.style.display = "none";
            break;

        case "Analytics":
            categoryPanel.style.display = "block";
            categoryPanel.innerHTML = `
                <button class="category" id="DayEndSummary" onclick="updateMainContent('DayEndSummary')">Day End Summary</button>
                <button class="category" id="ItemSummary" onclick="updateMainContent('ItemSummary')">Item Summary</button>
                <button class="category" id="SalesOverview" onclick="updateMainContent('SalesOverview')">Sales Overview</button>
                <button class="category" id="CategoryWiseSales" onclick="updateMainContent('CategoryWiseSales')">Category Wise Sales</button>
                <button class="category" id="TopSellingItems" onclick="updateMainContent('TopSellingItems')">Top Selling Items</button>
                <button class="category" id="TopSellingCategory" onclick="updateMainContent('TopSellingCategory')">Top Selling Category</button>
                <button class="category" id="RateOfSale" onclick="updateMainContent('RateOfSale')">Rate Of Sale</button>
                <button class="category" id="MenuAnalysis" onclick="updateMainContent('MenuAnalysis')">Menu Analysis</button>
                <button class="category" id="EmployeeAnalysis" onclick="updateMainContent('EmployeeAnalysis')">Employee Analysis</button>
                <button class="category" id="Charts" onclick="updateMainContent('Charts')">Charts</button>
                <button class="category" id="PersonalCalculator" onclick="updateMainContent('PersonalCalculator')">Personal Calculator</button>
                <button class="category" id="Notes" onclick="updateMainContent('Notes')">Notes</button>
                <button class="category" id="SpecialStatistics" onclick="updateMainContent('SpecialStatistics')">Special Statistics</button>
            `;
            break;

        case "History":
            categoryPanel.style.display = "block";
            categoryPanel.innerHTML = `
                <button class="category" id="todaysOrders" onclick="updateMainContent('todaysOrders')">Todays Orders</button>
                <button class="category" id="orderHistory" onclick="updateMainContent('orderHistory')">Order History</button>
                <button class="category" id="categoryHistory" onclick="updateMainContent('categoryHistory')">Category-wise</button>
                <button class="category" id="itemHistory" onclick="updateMainContent('itemHistory')">Item History</button>
                <button class="category" id="deletedOrders" onclick="updateMainContent('deletedOrders')">Deleted Orders</button>
                <button class="category" id="discountedOrders" onclick="updateMainContent('discountedOrders')">Discounted Orders</button>
                <button class="category" id="dayWise" onclick="updateMainContent('dayWise')">Day-wise</button>
                <button class="category" id="monthWise" onclick="updateMainContent('monthWise')">Month-wise</button>
                <button class="category" id="yearWise" onclick="updateMainContent('yearWise')">Year-wise</button>
                <button class="category" id="filterHistory" onclick="updateMainContent('filterHistory')">Filter History</button>
                <button class="category" id="customer" onclick="updateMainContent('customer')">Customers</button>
                <button class="category" id="makeATable" onclick="updateMainContent('makeATable')">Make A Table</button>
                <button class="category" id="tablesCreated" onclick="updateMainContent('createYourTable')">Tables Created</button>
            `;

            // Highlight the active history button
            const lastHistoryButton = sessionStorage.getItem('lastHistoryButton');
            if (lastHistoryButton) {
                const buttonToHighlight = document.getElementById(lastHistoryButton);
                if (buttonToHighlight) {
                    buttonToHighlight.classList.add('active');
                }
            } else {
                document.getElementById('todaysOrders').classList.add('active');
            }
            break;

        case "Categories":
            categoryPanel.style.display = "none";
            break;

        case "Settings":
            categoryPanel.style.display = "block";
            categoryPanel.innerHTML = `
                <button class="category" id="UserProfile" onclick="updateMainContent('UserProfile')">User Profile</button>
                <button class="category" id="BusinessInfo" onclick="updateMainContent('BusinessInfo')">Business Information</button>
                <button class="category" id="ThemeToggle" onclick="updateMainContent('ThemeToggle')">Light/Dark Mode</button>
                <button class="category" id="DisplaySettings" onclick="updateMainContent('DisplaySettings')">Display Settings</button>
                <button class="category" id="TaxAndDiscount" onclick="updateMainContent('TaxAndDiscount')">Tax and Discounts</button>
                <button class="category" id="PrinterConfig" onclick="updateMainContent('PrinterConfig')">Printer Configuration</button>
                <button class="category" id="Receipt" onclick="updateMainContent('Receipt')">Receipt</button>
                <button class="category" id="DateAndTime" onclick="updateMainContent('DateAndTime')">Date And Time</button>
                <button class="category" id="Currency" onclick="updateMainContent('Currency')">Currency</button>
                <button class="category" id="Security" onclick="updateMainContent('Security')">Security</button>
                <button class="category" id="Help" onclick="updateMainContent('Help')">Help and Support</button>
                <button class="category" id="SystemUpdates" onclick="updateMainContent('SystemUpdates')">System Updates</button>
                <button class="category" id="Exit" onclick="updateMainContent('Exit')">Exit</button>
            `;
            break;
    }

    // Highlight the active category button
    const categoryButtons = document.querySelectorAll("#category-panel .category");
    categoryButtons.forEach(button => button.classList.remove("active"));

    const activeCategoryButton = document.getElementById(contentType);
    if (activeCategoryButton) {
        activeCategoryButton.classList.add("active");
    }
}

module.exports = { updateLeftPanel };