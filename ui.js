const { fetchCategoriesList } = require("./categoriesList");

// Function to handle category button clicks
async function updateMainContent(contentType) {
    const mainContent = document.getElementById("main-content");
    const billPanel = document.getElementById("bill-panel");

    // List of top-panel button IDs
    const topPanelButtons = ["Home", "Menu", "History", "Categories", "Analytics", "Settings"];

    // Check if the clicked button is a top-panel button
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

    // Handle highlighting for category panel buttons
    const categoryButtons = document.querySelectorAll("#category-panel .category");
    categoryButtons.forEach(button => button.classList.remove("active"));

    const clickedCategoryButton = document.getElementById(contentType);
    if (clickedCategoryButton) {
        clickedCategoryButton.classList.add("active");
    }

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

                    <button class="add-to-bill" data-fid="${item.fid}" data-fname="${item.fname}" data-price="${item.cost}"
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
                    addToBill(itemId, itemName, price, quantity);  // Pass quantity now
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
            loadTopSellingItems(mainContent, billPanel); // Call the top selling items function

            // Retrieve stored dates from sessionStorage
            const savedStartDate = sessionStorage.getItem("topSellingStartDate");
            const savedEndDate = sessionStorage.getItem("topSellingEndDate");

            if (savedStartDate && savedEndDate) {
                document.getElementById("startDate").value = savedStartDate;
                document.getElementById("endDate").value = savedEndDate;

                // Automatically fetch top selling items using stored dates
                fetchTopSellingItems(savedStartDate, savedEndDate);
            }
        }
        else if (contentType === "TopSellingCategory") {
            loadTopSellingCategories(mainContent, billPanel); // Call the top selling categories function
        
            // Retrieve stored dates from sessionStorage
            const savedStartDate = sessionStorage.getItem("topSellingStartDate");
            const savedEndDate = sessionStorage.getItem("topSellingEndDate");
        
            if (savedStartDate && savedEndDate) {
                document.getElementById("startDate").value = savedStartDate;
                document.getElementById("endDate").value = savedEndDate;
        
                // Automatically fetch top selling categories using stored dates
                fetchTopSellingCategories(savedStartDate, savedEndDate);
            }
        }
        else if (contentType === "HourlySales") {
            mainContent.innerHTML = `
                <h2>Hourly Sales Trends</h2>
                <p>Sales performance based on different hours of the day.</p>
            `;
            billPanel.style.display = 'none';
        } 
        
        //-----------------------------------------------ANALYTICS ENDS HERE---------------------------------------------------
        //--------------------------CATEGORIES---------------------------------------------------------------
        else if (contentType === "Categories") {
            mainContent.style.marginLeft = "0px";
            mainContent.style.marginRight = "0px";
            mainContent.innerHTML = `
                <div class='section-title'>
                    <h2>Categories</h2>
                </div>
                <div id="categoriesTabDiv"></div>
            `;
            fetchCategoriesList();
            billPanel.style.display = 'none'; // Hide bill panel for History
        }        
        //--------------------------------CATEGORIES END HERE-----------------------------------------------------
        // --------------------------------SETTINGS START HERE-----------------------------------------------------
        // SETTINGS TAB
        else if (contentType === "UserProfile" || contentType === "Settings") {
            mainContent.style.marginLeft = "200px";
            mainContent.style.marginRight = "0px";
            loadUserProfile(mainContent, billPanel);
        }
        else if (contentType === "BusinessInfo") {
            mainContent.style.marginLeft = "200px";
            mainContent.style.marginRight = "0px";
            mainContent.innerHTML = `
                <div class='section-title'>
                    <h2>Business Information</h2>
                </div>
            `
        }
        else if (contentType === "ThemeToggle") {
            loadThemeToggle(mainContent, billPanel); // Call the theme toggle function
        }
        else if (contentType === "DisplaySettings") {
            mainContent.innerHTML = `
                <div class='section-title'>
                    <h2>Display Settings</h2>
                </div>
                <p>Settings for display</p>
            `;
        }
        else if (contentType === "TaxAndDiscount") {
            mainContent.innerHTML = `
                <div class='section-title'>
                    <h2>Tax and Discount</h2>
                </div>
                <p>Settings for display</p>
            `;
        }
        else if (contentType === "PrinterConfig") {
            loadPrinterConfig(mainContent);
        }
        else if (contentType === "Receipt") {
            mainContent.innerHTML = `
                <div class='section-title'>
                    <h2>Receipt</h2>
                </div>
                <p>Settings for display</p>
            `;
        }
        else if (contentType === "DateAndTime") {
            mainContent.innerHTML = `
                <div class='section-title'>
                    <h2>Date And Time</h2>
                </div>
                <p>Settings for display</p>
            `;
        }
        else if (contentType === "Currency") {
            mainContent.innerHTML = `
                <div class='section-title'>
                    <h2>Currency</h2>
                </div>
                <p>Settings for display</p>
            `;
        }
        else if (contentType === "Security") {
            mainContent.innerHTML = `
                <div class='section-title'>
                    <h2>Security</h2>
                </div>
                <p>Settings for display</p>
            `;
        }
        else if (contentType === "Help") {
            loadHelpSection();
        }
        else if (contentType === "Exit") {
            ipcRenderer.send("exit-app");
        }
    // --------------------------------SETTINGS END HERE----------------------------------------------------- 
        
        //----------------------------------------------- HISTORY TAB------------------------------------------------
        else if (contentType === 'History' || contentType === "todaysOrders") {
            mainContent.style.marginLeft = "200px";
            mainContent.style.marginRight = "0px";
            mainContent.innerHTML = `
                <div class="todays-orders-header">
                    <h1>Today's Orders</h1>
                    <button id="exportExcelButton">Export to Excel</button>
                </div>
                <div id="todaysOrdersDiv"></div>
            `;
            fetchTodaysOrders();
            billPanel.style.display = 'none'; // Hide bill panel for History
        } 
        else if (contentType === 'orderHistory') {
            
            const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

            mainContent.innerHTML = `
                <div class="order-history-header">
                    <h1>Order History</h1>
                    <div class="date-filters">
                        <label for="startDate">Start Date:</label>
                        <input type="date" id="startDate" value="${today}"> <!-- Set default to today's date -->
                        
                        <label for="endDate">End Date:</label>
                        <input type="date" id="endDate" value="${today}"> <!-- Set default to today's date -->
                        
                        <button class="showHistoryButton" onclick="fetchOrderHistory()">Show History</button>
                        <button id="exportExcelButton">Export to Excel</button>
                    </div>
                </div>
                <div id="orderHistoryDiv"></div>
            `;

            // Session Storage code to store the start and end date
            const savedStartDate = sessionStorage.getItem("orderHistoryStartDate");
            const savedEndDate = sessionStorage.getItem("orderHistoryEndDate");

            if (savedStartDate) document.getElementById("startDate").value = savedStartDate;
            if (savedEndDate) document.getElementById("endDate").value = savedEndDate;

            // Automatically fetch order history using today's date if no saved dates
            if (!savedStartDate && !savedEndDate) {
                fetchOrderHistory(today, today); // Fetch using today's date
            } else if (savedStartDate && savedEndDate) {
                fetchOrderHistory(savedStartDate, savedEndDate);
            }
            
        } else if (contentType === 'categoryHistory') {
            const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

            mainContent.innerHTML = `
                <div class="category-history-header">
                    <h1>Category Wise Sales</h1>
                    <div class="date-filters">
                        <label for="categoryStartDate">Start Date:</label>
                        <input type="date" id="categoryStartDate" value="${today}"> <!-- Set default to today's date -->
                        
                        <label for="categoryEndDate">End Date:</label>
                        <input type="date" id="categoryEndDate" value="${today}"> <!-- Set default to today's date -->
                        
                        <select id="categoryDropdown"></select>
                        <button class="showHistoryButton" onclick="fetchCategoryWise()">Show History</button>
                        <button id="exportExcelButton">Export to Excel</button>
                    </div>
                </div>
                <div id="categoryWiseDiv"></div>
            `;

            // Fetch categories and populate the dropdown
            fetchCategories(); // This will populate the dropdown and set the default value

            // Session Storage code to store the start and end date
            const savedStartDate = sessionStorage.getItem("categoryWiseStartDate");
            const savedEndDate = sessionStorage.getItem("categoryWiseEndDate");
            const savedCategory = sessionStorage.getItem("categoryWiseCategory");

            if (savedStartDate) document.getElementById("categoryStartDate").value = savedStartDate;
            if (savedEndDate) document.getElementById("categoryEndDate").value = savedEndDate;
            if (savedCategory) document.getElementById("categoryDropdown").value = savedCategory;

            // Automatically fetch category-wise sales using today's date if no saved dates
            if (!savedStartDate && !savedEndDate) {
                // Wait for categories to be populated before fetching
                ipcRenderer.once("categories-response", () => {
                    fetchCategoryWise(today, today, document.getElementById("categoryDropdown").value); // Fetch using today's date
                });
            } else if (savedStartDate && savedEndDate && savedCategory) {
                fetchCategoryWise(savedStartDate, savedEndDate, savedCategory);
            }
        }
         else if (contentType === "deletedOrders") {
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
        
                if (startDate > endDate) {
                    alert("Start date cannot be later than end date.");
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
            mainContent.innerHTML = `
                <div class="customer-header">
                    <h2>Customers</h2>
                    <button id="addCustomerBtn">Add Customer</button>
                    <button id="clearCustomerDataBtn">Clear Customer Data</button>
                </div>
                <div id="customersDiv"></div>
            `;

            fetchCustomers(); // Fetch and display customers

            // Remove any existing event listener before adding a new one
            const addCustomerBtn = document.getElementById("addCustomerBtn");
            addCustomerBtn.replaceWith(addCustomerBtn.cloneNode(true));

            // Add event listener for "Add Customer" button
            document.getElementById("addCustomerBtn").addEventListener("click", () => {
                showAddCustomerPopup();
            });

            document.getElementById("clearCustomerDataBtn").addEventListener("click", async () => {
                showConfirmPopup("Are you sure you want to permanently delete all customer data?", async () => {
                    await clearCustomerData();
                    fetchCustomers(); // Refresh customer list
                });
            });

        }
        else if(contentType === "filterHistory"){
            mainContent.innerHTML = `
                <h1>Filter History</h1>
                <div id="customersDiv"></div>
            `;
            
        }
        else if (contentType === 'itemHistory') {
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
            mainContent.innerHTML = `
                <h1>Day-Wise Order History</h1>
                <div id="customersDiv"></div>
            `;
            
        }
        else if(contentType === "monthWise"){
            mainContent.innerHTML = `
                <h1>Month-Wise Order History</h1>
                <div id="customersDiv"></div>
            `;
            
        }
        else if(contentType === "yearWise"){
            mainContent.innerHTML = `
                <h1>Year-Wise Order History</h1>
                <div id="customersDiv"></div>
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
    if (data.success) {
        alert("Deleted orders cleared successfully.");
        // Optionally, refresh the displayed deleted orders
        fetchDeletedOrders();
    } else {
        alert("Failed to clear deleted orders.");
    }
});

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

            // Render Analytics-related buttons
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

            // Render History-related buttons
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
        break;

        case "Categories":
            categoryPanel.style.display = "none";
            break;

        case "Settings":
            categoryPanel.style.display = "block";

            // Render Settings-related buttons
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

