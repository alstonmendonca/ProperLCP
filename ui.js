const { loadInventory } = require('./inventoryList');
const { loadYearWiseAnalysis } = require('./yearWise');

// Function to handle category button clicks
async function updateMainContent(contentType) {
    const mainContent = document.getElementById("main-content");
    const billPanel = document.getElementById("bill-panel");

//--------------------------------------- CATEGORY PANEL AND TOP PANEL SESSION STORAGE STARTS HERE ----------------------------------------
    // List of top-panel button IDs
    const topPanelButtons = ["Home", "Menu", "History", "Categories", "Analytics","Inventory", "Settings"];
    const historyButtons = [
        'todaysOrders', 'orderHistory', 'categoryHistory', 'itemHistory', 
        'deletedOrders', 'discountedOrders', 'dayWise', 'monthWise', 
        'yearWise', 'filterHistory', 'customer', 'makeATable', 'yourTables'
    ];
    const analyticsButtons = [
        'SalesOverview', 'ItemSummary', 'DayEndSummary', 'TopSellingItems', 
        'TopSellingCategory', 'CategoryWiseSales', 'EmployeeAnalysis', 'Notes', 'SpecialStatistics', 'TaxOnItems',
        'Charts', 'RateOfSale', 'BestInCategory'
    ];
    const settingsButtons = [
        'UserProfile', 'BusinessInfo',  
        'Receipt', 'DriverConfiguration', 'QRMenu', 'BackupDatabase', 'RestoreDatabase',
        'ConnectedDevices', 'Help'
    ];
    
    // Highlight top panel button for any top-level section
    if (topPanelButtons.includes(contentType)) {
        // Remove the 'active' class from all top-panel buttons
        const topButtons = document.querySelectorAll("#top-panel .top");
        topButtons.forEach(button => button.classList.remove("active"));

        // Add the 'active' class to the clicked button
        const clickedButton = document.getElementById(contentType);
        if (clickedButton) {
            clickedButton.classList.add("active");
        }
    }

    // Special case: When clicking the History top panel button
    if (contentType === "History") {
        // Get the last viewed history sub-section or default to todaysOrders
        const lastHistoryButton = sessionStorage.getItem('lastHistoryButton') || 'todaysOrders';
        
        // First update the left panel to show History buttons
        updateLeftPanel("History");
        
        // Then update the content with the last viewed sub-section
        updateMainContent(lastHistoryButton);
        return; // Exit early since we're handling the content update in the recursive call
    }
    
    // Store the last clicked History button if we're in History section
    if (historyButtons.includes(contentType)) {
        sessionStorage.setItem('lastHistoryButton', contentType);
    }

    // Special case: When clicking the Analytics top panel button
    if (contentType === "Analytics") {
        // Get the last viewed Analytics sub-section or default to todaysOrders
        const lastAnalyticsButton = sessionStorage.getItem('lastAnalyticsButton') || 'DayEndSummary';
        
        // First update the left panel to show History buttons
        updateLeftPanel("Analytics");
        
        // Then update the content with the last viewed sub-section
        updateMainContent(lastAnalyticsButton);
        return; // Exit early since we're handling the content update in the recursive call
    }
    
    // Store the last clicked History button if we're in History section
    if (analyticsButtons.includes(contentType)) {
        sessionStorage.setItem('lastAnalyticsButton', contentType);
    }

    // Special case: When clicking the Analytics top panel button
    if (contentType === "Settings") {
        // Get the last viewed Analytics sub-section or default to todaysOrders
        const lastSettingsButton = sessionStorage.getItem('lastSettingsButton') || 'UserProfile';
        
        // First update the left panel to show History buttons
        updateLeftPanel("Settings");
        
        // Then update the content with the last viewed sub-section
        updateMainContent(lastSettingsButton);
        return; // Exit early since we're handling the content update in the recursive call
    }
    
    // Store the last clicked History button if we're in History section
    if (settingsButtons.includes(contentType)) {
        sessionStorage.setItem('lastSettingsButton', contentType);
    }

    // Handle highlighting for category panel buttons
    const categoryButtons = document.querySelectorAll("#category-panel .category");
    categoryButtons.forEach(button => button.classList.remove("active"));

    const clickedCategoryButton = document.getElementById(contentType);
    if (clickedCategoryButton) {
        clickedCategoryButton.classList.add("active");
    }
//--------------------------------------- CATEGORY PANEL AND TOP PANEL SESSION STORAGE ENDS HERE ----------------------------------------
    // Home Screen
    if (contentType === "Home") {
        await loadHome(mainContent, billPanel);
    }
    // Fetch and display food items dynamically
    else {
        const foodItems = await ipcRenderer.invoke("get-food-items", contentType);

        if (foodItems.length > 0) {
            mainContent.innerHTML = 
    `<div class="homeFoodTitle">
        <h2>${contentType}</h2>
    </div>
    <div class="food-items" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
        ${foodItems 
            .map(
                (item) => 
                `<div class="food-item" style="border: 2px solid ${item.veg == 1 ? 'green' : 'red'}; 
                    padding: 10px; text-align: center; border-radius: 20px; background: ${item.veg == 1 ? '#EFFBF0' : '#FFEBEB'};
                    display: flex; flex-direction: column; justify-content: space-between; min-height: 180px;">
                    
                    <div style="flex-grow: 1;">
                        <h3 style="margin-bottom: 10px;">${item.fname}<br style="line-height:5px;display:block"> 
                            ${item.veg ? "🌱" : "🍖"}</h3>
                    </div>
                    <p>Price: ₹${item.cost}</p>
                    
                    <div class="quantity-control" style="display: flex; align-items: center; justify-content: center; gap: 5px; margin: 10px 0;">
                        <button class="decrease-quantity" data-fid="${item.fid}" 
                            style="font-size: 12px; padding: 2px 6px; width: 25px; height: 25px; border-radius: 4px; color: white;">-</button>
                        <span class="quantity" id="quantity-${item.fid}">1</span>
                        <button class="increase-quantity" data-fid="${item.fid}" 
                            style="font-size: 12px; padding: 2px 6px; width: 25px; height: 25px; border-radius: 4px; color: white;">+</button>
                    </div>

                    <button class="add-to-bill" data-fid="${item.fid}" data-fname="${item.fname}" data-price="${item.cost}" data-category="${item.category}"
                        style="font-size: 17px; padding: 5px 10px; width: 100%; height: 30px; border-radius: 20px;
                        color: white; margin-top: auto;">
                        ADD
                    </button>
                </div>`
            )
            .join("")}
    </div>`;

        
            billPanel.style.display = "block";
        
            // Add event listener to "ADD" buttons
            const addToBillButtons = document.querySelectorAll(".add-to-bill");
            addToBillButtons.forEach(button => {
                button.addEventListener("click", (event) => {
                    const itemId = event.target.getAttribute("data-fid");
                    const itemName = event.target.getAttribute("data-fname");
                    const price = parseFloat(event.target.getAttribute("data-price"));
                    const quantity = parseInt(document.getElementById(`quantity-${itemId}`).textContent);
                    const category = event.target.getAttribute("data-category");
                    addToBill(itemId, itemName, price, quantity, category);  // Pass quantity now
                });
            });
        
            // Add event listener to the quantity control buttons
            const decreaseButtons = document.querySelectorAll(".decrease-quantity");
            const increaseButtons = document.querySelectorAll(".increase-quantity");
        
            decreaseButtons.forEach(button => {
                button.addEventListener("click", (event) => {
                    const itemId = event.target.getAttribute("data-fid");
                    const quantityElement = document.getElementById(`quantity-${itemId}`);
                    let currentQuantity = parseInt(quantityElement.textContent);
                    if (currentQuantity > 1) {
                        quantityElement.textContent = currentQuantity - 1;
                    }
                });
            });
        
            increaseButtons.forEach(button => {
                button.addEventListener("click", (event) => {
                    const itemId = event.target.getAttribute("data-fid");
                    const quantityElement = document.getElementById(`quantity-${itemId}`);
                    let currentQuantity = parseInt(quantityElement.textContent);
                    quantityElement.textContent = currentQuantity + 1;
                });
            });
        }
        // Menu Management -----REMOVED-----------

        // -------------------------------------------------ANALYTICS STARTS HERE---------------------------------------------------
        else if (contentType === "SalesOverview") {
            loadSalesOverview(mainContent, billPanel); // Call the sales overview function
        }
        else if (contentType === "ItemSummary") {
            loadItemSummary(mainContent, billPanel);
        }
        else if (contentType === "DayEndSummary" || contentType === "Analytics") {
            loadDayEndSummary(mainContent, billPanel); // Call the day end summary function
        }
        else if (contentType === "CategoryWiseSales") {
            loadCategoryWiseSales(mainContent, billPanel); // Call the category wise sales function
        }
        else if (contentType === "TopSellingItems") {
            loadTopSellingItems(mainContent, billPanel);
        }
        else if (contentType === "TopSellingCategory") {
            loadTopSellingCategories(mainContent, billPanel); // Call the top selling categories function
        }
        else if (contentType === "EmployeeAnalysis") {
            loadEmployeeAnalysis(mainContent, billPanel); // Call the top selling categories function
        }
        else if (contentType === "SpecialStatistics") {
            loadSpecialStatistics(mainContent, billPanel);
        }
        else if (contentType === "TaxOnItems") {
            loadTaxOnItems(mainContent, billPanel);
        }
        else if (contentType === "BestInCategory") {
            loadBestInCategory(mainContent, billPanel);
        }
        else if (contentType === "Charts") {
            loadCharts(mainContent, billPanel);
        }
        
        //-----------------------------------------------ANALYTICS ENDS HERE---------------------------------------------------
        //--------------------------CATEGORIES---------------------------------------------------------------
        else if (contentType === "Categories") {
            loadCategories(mainContent, billPanel);
        }        
        //--------------------------------CATEGORIES END HERE-----------------------------------------------------
        //--------------------------------INVENTORY STARTS HERE-----------------------------------------------------
        else if (contentType === "Inventory") {
            loadInventory(mainContent, billPanel); 
        }
        //--------------------------------INVENTORY ENDS HERE-----------------------------------------------------
        // --------------------------------SETTINGS START HERE-----------------------------------------------------
        // SETTINGS TAB
        else if (contentType === "UserProfile" || contentType === "Settings") {
            mainContent.style.marginLeft = "200px";
            mainContent.style.marginRight = "0px";
            loadUserProfile(mainContent, billPanel);
        }
        else if (contentType === "BusinessInfo") {
            loadBusinessInfo(mainContent, billPanel);
        }
        else if (contentType === "Notes"){
            loadUserNotes(mainContent, billPanel);
        }
        else if (contentType === "DriverConfiguration") {
            const mode = 'auto';
            loadPrinterConfiguration(mainContent, billPanel, mode);
        }
        else if (contentType === "Receipt") {
            loadReceiptEditor(mainContent, billPanel);
        }
        else if (contentType === "ConnectedDevices") {
            loadConnectedDevices(mainContent, billPanel);
        }
        else if (contentType === "Help") {
            loadHelpSection();
        }
        else if (contentType === "QRMenu") {
            mainContent.style.marginLeft = "200px";
            mainContent.style.marginRight = "0px";
            billPanel.style.display = 'none';
            mainContent.innerHTML = `
                <div class='section-title'>
                    <h2>QR Menu</h2>
                </div>
                <p>Qr Menu</p>
            `;
        }
        else if (contentType === "BackupDatabase") {
            const { loadBackupUI } = require("./loadBackupUI");
            loadBackupUI(mainContent, billPanel); // Call the backup UI function
        }
        else if (contentType === "RestoreDatabase") {
            const { loadRestoreUI } = require("./loadRestoreUI");
            loadRestoreUI(mainContent, billPanel); // Call the restore UI function

        }
        else if (contentType === "Exit") {
            const  {createConfirmPopup} = require("./textPopup");
            createConfirmPopup("Are you sure you want to exit?", (confirmed) => {
                if (confirmed) {
                    ipcRenderer.send('exit-app');
                }
            });
        }
    // --------------------------------SETTINGS END HERE----------------------------------------------------- 
        
        //----------------------------------------------- HISTORY TAB------------------------------------------------
        else if (contentType === "History" || contentType === "todaysOrders") {
            loadTodaysOrders(mainContent, billPanel);
        }

        else if (contentType === 'orderHistory') {
            loadOrderHistory(mainContent, billPanel);
        } else if (contentType === 'categoryHistory') {
            loadCategoryHistory(mainContent, billPanel);
        }
         else if (contentType === "deletedOrders") {
            mainContent.style.marginLeft = "200px";
            mainContent.style.marginRight = "0px";
            billPanel.style.display = 'none'; // Hide bill panel for History
            const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

            mainContent.innerHTML = `
                <div class="deleted-orders-header">
                    <h1>Deleted Orders</h1>
                    <div class="date-filters">
                        <label for="startDate">Start Date:</label>
                        <input type="date" id="startDate" value="${today}"> <!-- Set default to today's date -->
                        
                        <label for="endDate">End Date:</label>
                        <input type="date" id="endDate" value="${today}"> <!-- Set default to today's date -->
                        
                        <button class="showHistoryButton" id="fetchDeletedOrdersBtn">Show Deleted Orders</button>
                        <button id="exportExcelButton">Export to Excel</button>
                        <button id="deletedClearHistory">Clear History</button>
                    </div>
                </div>
                <div id="deletedOrdersDiv"></div>
            `;
        
            // Restore last selected start date and end date
            const savedStartDate = sessionStorage.getItem("deletedOrdersStartDate");
            const savedEndDate = sessionStorage.getItem("deletedOrdersEndDate");
        
            if (savedStartDate) document.getElementById("startDate").value = savedStartDate;
            if (savedEndDate) document.getElementById("endDate").value = savedEndDate;
        
            // Attach event listener to the button
            document.getElementById("fetchDeletedOrdersBtn").addEventListener("click", fetchDeletedOrders);
        
            // Attach event listener for Clear History button
            document.getElementById("deletedClearHistory").addEventListener("click", async () => {
                showConfirmPopup("Are you sure you want to permanently remove all deleted Orders? This cannot be undone.", async () => {
                    await clearDeletedOrders();
                    fetchDeletedOrders(); // Refresh the deleted orders after clearing
                });
            });
        
            // Automatically fetch deleted orders using today's date if no saved dates
            if (!savedStartDate && !savedEndDate) {
                fetchDeletedOrders(); // Fetch using today's date
            } else if (savedStartDate && savedEndDate) {
                fetchDeletedOrders(); // Fetch using saved dates
            }
        }
        else if (contentType === 'discountedOrders') {
            mainContent.style.marginLeft = "200px";
            mainContent.style.marginRight = "0px";
            billPanel.style.display = 'none'; 
            const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
        
            // Retrieve stored dates from sessionStorage (or use today's date as default)
            const storedStartDate = sessionStorage.getItem("discountedOrdersStartDate") || today;
            const storedEndDate = sessionStorage.getItem("discountedOrdersEndDate") || today;
        
            mainContent.innerHTML = `
                <div class="discounted-orders-header">
                    <h1>Discounted Orders</h1>
                    <div class="date-filters">
                        <label for="startDate">Start Date:</label>
                        <input type="date" id="startDate" value="${storedStartDate}"> <!-- Set default to stored or today's date -->
                        
                        <label for="endDate">End Date:</label>
                        <input type="date" id="endDate" value="${storedEndDate}"> <!-- Set default to stored or today's date -->
                        
                        <button class="showHistoryButton" id="fetchDiscountedOrdersBtn">Show Discounted Orders</button>
                        <button id="exportExcelButton">Export to Excel</button>
                        <button id="discountedClearHistory">Clear History</button>
                    </div>
                </div>
                <div id="discountedOrdersDiv"></div>
            `;
        
            // Attach event listener for Clear History button
            document.getElementById("discountedClearHistory").addEventListener("click", async () => {
                showConfirmPopup("Are you sure you want to permanently delete all discounted orders?", async () => {
                    await clearDiscountedOrders();
        
                    // Reset dates to today's date
                    const today = new Date().toISOString().split("T")[0];
                    sessionStorage.setItem("discountedOrdersStartDate", today);
                    sessionStorage.setItem("discountedOrdersEndDate", today);
        
                    // Update the date inputs
                    document.getElementById("startDate").value = today;
                    document.getElementById("endDate").value = today;
        
                    // Refresh the discounted orders
                    fetchDiscountedOrders(today, today);
                });
            });
        
            // Attach event listener for Show Discounted Orders button
            document.getElementById("fetchDiscountedOrdersBtn").addEventListener("click", () => {
                const startDate = document.getElementById("startDate").value;
                const endDate = document.getElementById("endDate").value;
                const  {createTextPopup} = require("./textPopup");
                if (startDate > endDate) {
                    createTextPopup("Start date cannot be later than end date.");
                    return;
                }
        
                // Save the selected dates to sessionStorage
                sessionStorage.setItem("discountedOrdersStartDate", startDate);
                sessionStorage.setItem("discountedOrdersEndDate", endDate);
        
                // Fetch orders based on selected dates
                fetchDiscountedOrders(startDate, endDate);
            });
        
            // Fetch discounted orders for the stored or default dates
            fetchDiscountedOrders(storedStartDate, storedEndDate);
        }
        else if (contentType === 'customer') {
            loadCustomers(mainContent, billPanel);
        }
        else if(contentType === "filterHistory"){
            mainContent.style.marginLeft = "200px";
            mainContent.style.marginRight = "0px";
            billPanel.style.display = 'none'; 
            mainContent.innerHTML = `
                <div class='section-title'>
                    <h2>Filter History</h2>
                </div>
                <p>Coming Soon...</p>
            `;
        }
        else if (contentType === 'itemHistory') {
            mainContent.style.marginLeft = "200px";
            mainContent.style.marginRight = "0px";
            billPanel.style.display = 'none'; // Hide bill panel for History
            const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
        
            mainContent.innerHTML = `
                <div class="item-history-header">
                    <h1>Item History</h1>
                    <div class="date-filters">
                        <label for="itemStartDate">Start Date:</label>
                        <input type="date" id="itemStartDate" value="${today}">
                        
                        <label for="itemEndDate">End Date:</label>
                        <input type="date" id="itemEndDate" value="${today}">
                        
                        <select id="categoryDropdown"></select>
                        <select id="foodItemDropdown"></select>
                        <button class="showHistoryButton" id="fetchItemHistoryBtn">Show History</button>
                        <button id="exportExcelButton">Export to Excel</button>
                    </div>
                </div>
                <div id="itemHistoryDiv"></div>
            `;
        
            fetchCategories(); // Fetch categories and populate dropdown
        
            // Restore session storage values (if any)
            const savedStartDate = sessionStorage.getItem("itemHistoryStartDate") || today;
            const savedEndDate = sessionStorage.getItem("itemHistoryEndDate") || today;
            document.getElementById("itemStartDate").value = savedStartDate;
            document.getElementById("itemEndDate").value = savedEndDate;
        
            // Fetch initial data after food items are populated
            ipcRenderer.once("food-items-response-for-item-history", (event, data) => {
                if (data.success && data.foodItems.length > 0) {
                    const firstFoodItem = data.foodItems[0].fid;
                    document.getElementById("foodItemDropdown").value = firstFoodItem;
        
                    // ✅ Fetch and display history immediately when contentType is 'itemHistory'
                    fetchItemHistory(savedStartDate, savedEndDate, firstFoodItem);
                }
            });
        
            // Attach event listener for category dropdown changes
            document.getElementById("categoryDropdown").addEventListener("change", function () {
                const selectedCategory = this.value;
                const foodItemDropdown = document.getElementById("foodItemDropdown");
                const itemHistoryDiv = document.getElementById("itemHistoryDiv");
        
                if (selectedCategory) {
                    fetchFoodItems(selectedCategory);
                    itemHistoryDiv.innerHTML = ""; // Clear table on category change
                } else {
                    foodItemDropdown.innerHTML = "";
                    foodItemDropdown.disabled = true;
                }
            });
        
            // Attach event listener to the Show History button (Required for user-triggered updates)
            document.getElementById("fetchItemHistoryBtn").addEventListener("click", function () {
                const startDate = document.getElementById("itemStartDate").value;
                const endDate = document.getElementById("itemEndDate").value;
                const foodItem = document.getElementById("foodItemDropdown").value;
                fetchItemHistory(startDate, endDate, foodItem);
            });
        }
        
        else if(contentType === "dayWise"){
            loadDayWiseAnalysis(mainContent, billPanel);
        }
        else if(contentType === "monthWise"){
            loadMonthWiseAnalysis(mainContent, billPanel);
        }
        else if(contentType === "yearWise"){
            loadYearWiseAnalysis(mainContent, billPanel);
        }
        else if(contentType === "makeATable"){
            mainContent.style.marginLeft = "200px";
            mainContent.style.marginRight = "0px";
            billPanel.style.display = 'none'; 
            mainContent.innerHTML = `
                <div class='section-title'>
                    <h2>Make A Table</h2>
                </div>
                <p>Coming Soon...</p>
            `;
        }
        else if(contentType === "yourTables"){
            mainContent.style.marginLeft = "200px";
            mainContent.style.marginRight = "0px";
            billPanel.style.display = 'none'; 
            mainContent.innerHTML = `
                <div class='section-title'>
                    <h2>Your Tables</h2>
                </div>
                <p>Coming Soon...</p>
            `;
        }

        //-----------------------HISTORY TAB ENDS HERE-----------------------------------------------------
        //----------------------------- MENU TAB STARTS HERE------------------------------------------------
        else if (contentType === "Menu") {
            mainContent.scrollTop = 0;
            mainContent.style.marginLeft = "0px";
            mainContent.style.marginRight = "0px";
            displayMenu(); // Call the function from menu.js to display menu
        }
        // Default Case
        else {
            mainContent.innerHTML = `
                <h2>${contentType}</h2>
                <p>No items found in this category.</p>
            `;
            billPanel.style.display = 'none';
        }
    }

    // Update left panel dynamically
    updateLeftPanel(contentType);
}

// Function to clear deleted orders
function clearDeletedOrders() {
    ipcRenderer.send("clear-deleted-orders");
}

ipcRenderer.on("clear-deleted-orders-response", (event, data) => {
    const  {createTextPopup} = require("./textPopup");
    if (data.success) {
        createTextPopup("Deleted orders cleared successfully.");
        // Optionally, refresh the displayed deleted orders
        fetchDeletedOrders();
    } else {
        createTextPopup("Failed to clear deleted orders.");
    }
});

function showConfirmPopup(message, onConfirm) {
    // Remove existing popup if any
    if (document.getElementById("confirmPopup")) {
        document.getElementById("confirmPopup").remove();
    }

    // Create the popup container
    const popup = document.createElement("div");
    popup.id = "confirmPopup";
    popup.innerHTML = `
        <div class="popup-content">
            <p>${message}</p>
            <div class="popup-buttons">
                <button id="confirmYes">Yes</button>
                <button id="confirmNo">Cancel</button>
            </div>
        </div>
    `;

    // Style the popup
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.backgroundColor = "white";
    popup.style.padding = "20px";
    popup.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
    popup.style.borderRadius = "8px";
    popup.style.zIndex = "1001";
    popup.style.textAlign = "center";

    document.body.appendChild(popup);

    // Event listeners for buttons
    document.getElementById("confirmYes").addEventListener("click", () => {
        popup.remove();
        onConfirm(); // Call the confirmation function
    });

    document.getElementById("confirmNo").addEventListener("click", () => {
        popup.remove();
    });
}
