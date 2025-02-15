const { fetchCategoriesList } = require("./categoriesList");
const { fetchTabCategories } = require("./categoriesTab");


// Function to handle category button clicks
async function updateMainContent(contentType) {
    const mainContent = document.getElementById("main-content");
    const billPanel = document.getElementById("bill-panel");

    // Home Screen
    if (contentType === "Home") {
        mainContent.style.marginLeft = "200px";
        mainContent.style.marginRight = "600px";
        mainContent.innerHTML = `
            <h2>Home</h2>
            <p>Welcome to the default home page!</p>
        `;
        billPanel.style.display = 'block'; // Show bill panel for Home
    } 
    // Fetch and display food items dynamically
    else {
        const foodItems = await ipcRenderer.invoke("get-food-items", contentType);

        if (foodItems.length > 0) {
            mainContent.innerHTML = 
            `<h2>${contentType}</h2>
            <div class="food-items" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
                ${foodItems 
                    .map(
                        (item) => 
                        `<div class="food-item" style="border: 2px solid ${item.veg == 1 ? 'green' : 'red'}; padding: 10px; text-align: center;">
                            <h3>${item.fname}<br style="line-height:5px;display:block"> ${item.veg ? "🌱" : "🍖"}</h3>
                            <p>Price: ₹${item.cost}</p>
                            <div class="quantity-control">
                                <button class="decrease-quantity" data-fid="${item.fid}" 
                                    style="font-size: 12px; padding: 2px 6px; width: 18px; height: 18px; border-radius: 4px;">-</button>
                                <span class="quantity" id="quantity-${item.fid}">1</span>
                                <button class="increase-quantity" data-fid="${item.fid}" 
                                    style="font-size: 12px; padding: 2px 6px; width: 18px; height: 18px; border-radius: 4px;">+</button>
                            </div>
                            <button class="add-to-bill" data-fid="${item.fid}" data-fname="${item.fname}" data-price="${item.cost}"
                            style="font-size: 17px; padding: 2px 6px; width: 55px; height: 25px; border-radius: 1px; margin-top:5px">ADD</button>
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
        else if (contentType === "SalesOverview" || contentType === "Analytics") {
            mainContent.style.marginLeft = "200px";
            mainContent.style.marginRight = "0px";
            mainContent.innerHTML = `
                <h2>Sales Overview</h2>
                <p>Daily, weekly, and monthly sales overview.</p>
            `;
            billPanel.style.display = 'none';
        }
        else if (contentType === "ItemSummary") {
            loadItemSummary(mainContent, billPanel);
        }
        else if (contentType === "DayEndSummary") {
            mainContent.innerHTML = `
                <h2>Day End Summary</h2>
                <p>Summary of total sales and revenue at the end of the day.</p>
            `;
            billPanel.style.display = 'none';
        }
        else if (contentType === "CategoryWiseSales") {
            mainContent.innerHTML = `
                <h2>Category Wise Sales</h2>
                <p>Sales breakdown by different categories.</p>
            `;
            billPanel.style.display = 'none';
        }
        else if (contentType === "TopSelling") {
            mainContent.innerHTML = `
                <h2>Top Selling Items</h2>
                <p>List of best-selling products.</p>
            `;
            billPanel.style.display = 'none';
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
                <h1>Categories</h1>
                <button id="addCategoryButton">Add Category</button>
                <div id="categoriesTabDiv"></div>
            `;
            fetchCategoriesList();
            billPanel.style.display = 'none'; // Hide bill panel for History

            document.getElementById("addCategoryButton").addEventListener("click", () => {
                ipcRenderer.send("open-add-category-window");
            });
        }        
        //--------------------------------CATEGORIES END HERE-----------------------------------------------------
        // --------------------------------SETTINGS START HERE-----------------------------------------------------
        // SETTINGS TAB
        else if (contentType === "UserProfile" || contentType === "Settings") {
            mainContent.style.marginLeft = "200px";
            mainContent.style.marginRight = "0px";
            loadUserProfile(mainContent, billPanel);
        }
        else if (contentType === "ThemeToggle") {
            mainContent.innerHTML = `
                <h2>Theme Toggle</h2>
                <p>Switch between light and dark themes</p>
                <label class="dark-mode-toggle">
                    <input type="checkbox" id="darkModeToggle">
                    <span class="slider"></span>
                </label>
            `;
            
            billPanel.style.display = 'none';

            const toggleButton = document.getElementById("darkModeToggle");

            // Check if dark mode was previously enabled
            if (localStorage.getItem("theme") === "dark") {
                document.body.classList.add("dark-mode");
                toggleButton.checked = true;
            }

            toggleButton.addEventListener("change", () => {
                if (toggleButton.checked) {
                    document.body.classList.add("dark-mode");
                    localStorage.setItem("theme", "dark"); // Store theme in local storage
                } else {
                    document.body.classList.remove("dark-mode");
                    localStorage.setItem("theme", "light");
                }
            });
        }
        else if (contentType === "TaxAndDiscount") {
            mainContent.innerHTML = `
                <h2>Tax & Discount</h2>
                <p>Set default values for tax rates and discounts</p>
                <div id="taxDiscountDiv"></div>
            `;
            billPanel.style.display = 'none';
        }
        else if (contentType === "PrinterConfig") {
            mainContent.innerHTML = `
                <h2>Printer Configuration</h2>
                <p>Configure your printer</p>
                <div id="printerConfigDiv"></div>
            `;
            billPanel.style.display = 'none';
        }
        else if (contentType === "Security") {
            mainContent.innerHTML = `
                <h2>Security Settings</h2>
                <p>Manage security settings, roles, and permissions</p>
                <div id="securityDiv"></div>
            `;
            billPanel.style.display = 'none';
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
                <h1>Todays Orders</h1>
                <button id="exportExcelButton">Export to Excel</button>
                <div id="todaysOrdersDiv"></div>
            `;
            fetchTodaysOrders();
            billPanel.style.display = 'none'; // Hide bill panel for History
        } 
        else if (contentType === 'orderHistory') {
            
            mainContent.innerHTML = `
                <h1>Order History</h1>
                <div class="date-filters">
                    <label for="startDate">Start Date:</label>
                    <input type="date" id="startDate">
                    
                    <label for="endDate">End Date:</label>
                    <input type="date" id="endDate">
                    
                    <button class="showHistoryButton" onclick="fetchOrderHistory()" >Show History</button>
                    <button id="exportExcelButton">Export to Excel</button>
                </div>
                <div id="orderHistoryDiv"></div>
            `;

            //Session Storage code to store the start and end date
            const savedStartDate = sessionStorage.getItem("orderHistoryStartDate");
            const savedEndDate = sessionStorage.getItem("orderHistoryEndDate");

            if (savedStartDate) document.getElementById("startDate").value = savedStartDate;
            if (savedEndDate) document.getElementById("endDate").value = savedEndDate;

            // ✅ Automatically fetch order history using stored dates
            if (savedStartDate && savedEndDate) {
                fetchOrderHistory(savedStartDate, savedEndDate);
            }

            fetchOrderHistory(orders); // Call function to display the stored table
            
        } else if (contentType === 'categoryHistory') {
            mainContent.innerHTML = `
                <h1>Category-wise Sales</h1>
                <div class="date-filters">
                    <label for="startDate">Start Date:</label>
                    <input type="date" id="startDate">
                    
                    <label for="endDate">End Date:</label>
                    <input type="date" id="endDate">
                    
                    <select id="categoryDropdown"></select>
                    <button class="showHistoryButton" onclick="fetchCategoryWise()">Show History</button>
                    <button id="exportExcelButton">Export to Excel</button>
                </div>
                <div id="categoryWiseDiv"></div>
            `;
        
            fetchCategories(); // Fetch categories and populate the dropdown

            // ✅ Restore last selected start date, end date, and category
            const savedStartDate = sessionStorage.getItem("categoryWiseStartDate");
            const savedEndDate = sessionStorage.getItem("categoryWiseEndDate");
            const savedCategory = sessionStorage.getItem("categoryWiseCategory");

            if (savedStartDate) document.getElementById("startDate").value = savedStartDate;
            if (savedEndDate) document.getElementById("endDate").value = savedEndDate;
            if (savedCategory) document.getElementById("categoryDropdown").value = savedCategory;

            // ✅ Automatically fetch category-wise sales using stored dates and category
            if (savedStartDate && savedEndDate && savedCategory) {
                fetchCategoryWise(savedStartDate, savedEndDate, savedCategory);
            }
        }
         else if (contentType === "deletedOrders") {
            mainContent.innerHTML = `
                <h1>Deleted Orders</h1>
                <div class="date-filters">
                    <label for="startDate">Start Date:</label>
                    <input type="date" id="startDate">
                    
                    <label for="endDate">End Date:</label>
                    <input type="date" id="endDate">
                    
                    <button class="showHistoryButton" id="fetchDeletedOrdersBtn">Show Deleted Orders</button>
                    <button id="exportExcelButton">Export to Excel</button>
                    <button id="deletedClearHistory">Clear History</button>
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
                if (confirm("Are you sure you want to permanently delete these orders?")) {
                    await clearDeletedOrders();
                    // Refresh the deleted orders after clearing
                    fetchDeletedOrders();
                }
            });

            // Fetch deleted orders initially based on stored dates
            if (savedStartDate && savedEndDate) {
                fetchDeletedOrders();
            }
        }
        else if (contentType === 'discountedOrders') {
            mainContent.innerHTML = `
                <h1>Discounted Orders</h1>
                <p>View orders with discounts applied.</p>
            `;
        }
        else if (contentType === 'customer') {
            mainContent.innerHTML = `
                <h1>Customers</h1>
                <button id="addCustomerBtn">Add Customer</button>
                <div id="customersDiv"></div>
            `;
            fetchCustomers(); // Fetch and display customers
        }

        //-----------------------HISTORY TAB ENDS HERE-----------------------------------------------------
        //MENU TAB
        else if (contentType === "Menu") {
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
                <button class="category" id="SalesOverview" onclick="updateMainContent('SalesOverview')">Sales Overview</button>
                <button class="category" id="ItemSummary" onclick="updateMainContent('ItemSummary')">Item Summary</button>
                <button class="category" id="DayEndSummary" onclick="updateMainContent('DayEndSummary')">Day End Summary</button>
                <button class="category" id="Trends" onclick="updateMainContent('CategoryWiseSales')">Category Wise Sales</button>
                <button class="category" id="TopSelling" onclick="updateMainContent('TopSelling')">Top Selling</button>
                <button class="category" id="Trends" onclick="updateMainContent('HourlySales')">Hourly Sales</button>
            `;
            break;

        case "History":
            categoryPanel.style.display = "block";

            // Render History-related buttons
            categoryPanel.innerHTML = `
            <button class="category" id="TodaysOrders" onclick="updateMainContent('todaysOrders')">Todays Orders</button>
            <button class="category" id="orderHistory" onclick="updateMainContent('orderHistory')">Order History</button>
            <button class="category" id="categoryHistory" onclick="updateMainContent('categoryHistory')">Category-wise</button>
            <button class="category" id="deletedOrders" onclick="updateMainContent('deletedOrders')">Deleted Orders</button>
            <button class="category" id="discountedOrders" onclick="updateMainContent('discountedOrders')">Discounted Orders</button>
            <button class="category" id="customer" onclick="updateMainContent('customer')">Customers</button>
        `;
        break;

        case "Categories":
            categoryPanel.style.display = "none";

            // Categories
            categoryPanel.innerHTML;
            break;


        case "Settings":
            categoryPanel.style.display = "block";

            // Render Settings-related buttons
            categoryPanel.innerHTML = `
                <button class="category" id="UserProfile" onclick="updateMainContent('UserProfile')">User Profile</button>
                <button class="category" id="ThemeToggle" onclick="updateMainContent('ThemeToggle')">Light/Dark Mode</button>
                <button class="category" id="TaxAndDiscount" onclick="updateMainContent('TaxAndDiscount')">Tax and Discounts</button>
                <button class="category" id="PrinterConfig" onclick="updateMainContent('PrinterConfig')">Printer Configuration</button>
                <button class="category" id="Security" onclick="updateMainContent('Security')">Security</button>
                <button class="category" id="Help" onclick="updateMainContent('Help')">Help</button>
                <button class="category" id="Exit" onclick="updateMainContent('Exit')">Exit</button>
            `;
            break;
    }
}
