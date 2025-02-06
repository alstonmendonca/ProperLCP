const { fetchCategoriesList } = require("./categoriesList");
const { fetchTabCategories } = require("./categoriesTab");

// Function to handle category button clicks
async function updateMainContent(contentType) {
    const mainContent = document.getElementById("main-content");
    const billPanel = document.getElementById("bill-panel");

    // Menu Management
    const menuManagement = ["ShowMenu","AddItem", "UpdateItem", "DeleteItem"];

    // Analytics
    const analytics = ["SalesOverview", "TopSelling", "Trends", "OrderHistory"];
    // Settings
    const settings = ["UserProfile", "ThemeToggle","TaxAndDiscount","PrinterConfig","Security","Help","Exit"];
    

    // Home Screen
    if (contentType === "Home") {
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
                        `<div class="food-item" style="border: 1px solid #ccc; padding: 10px; text-align: center;">
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
        
        
        
        // Menu Management
        else if (menuManagement.includes(contentType)) {

            let actionText = {
                "ShowMenu":"Show the menu",
                "AddItem": "Add an item here",
                "UpdateItem": "Edit an existing item",
                "DeleteItem": "Remove an item from the menu"
            };
            if (contentType === "AddItem") {
                ipcRenderer.send("open-add-item-window"); // Send event to main process
                return; // Stop further execution
            }
            else if (contentType === "ShowMenu") {
                displayMenu(); // Call the function from menu.js to display menu
            }
            else {
                mainContent.innerHTML = `
                <h2>${contentType.replace(/([A-Z])/g, " $1")}</h2>
                <p>${actionText[contentType]}</p>
            `;
            }
            billPanel.style.display = 'none'; // Hide bill panel for Menu Management
        } 
        // Analytics
        else if (analytics.includes(contentType)) {
            let analyticsText = {
                "SalesOverview": "Daily, weekly, and monthly sales overview",
                "TopSelling": "Best selling items",
                "Trends": "Latest trends in sales",
            };

            mainContent.innerHTML = `
                <h2>${contentType.replace(/([A-Z])/g, " $1")}</h2>
                <p>${analyticsText[contentType]}</p>
            `;
            billPanel.style.display = 'none'; // Hide bill panel for Analytics
        } //--------------------------CATEGORIES---------------------------------------------------------------
        else if (contentType === "Categories") {
            mainContent.innerHTML = `
                <h1>Categories</h1>
                <div id="categoriesTabDiv"></div>
            `;
            fetchCategoriesList();
            billPanel.style.display = 'none'; // Hide bill panel for History
        }        
        //--------------------------------CATEGORIES END HERE-----------------------------------------------------
        // Settings
        else if (settings.includes(contentType)) {
            let settingsText = {
                "UserProfile": "Manage your profile, Add/Update/Delete users",
                "ThemeToggle": "Switch between light and dark themes",
                "TaxAndDiscount": "Set default values for tax rates and discounts",
                "PrinterConfig": "Configure your printer",
                "Security": "Manage security settings, Manage roles and permissions",
                "Help": "Get help and support",
                "Exit": "Exit"
            };
            if (contentType === "Exit") {
                ipcRenderer.send("exit-app");
            }
            mainContent.innerHTML = `
                <h2>${contentType.replace(/([A-Z])/g, " $1")}</h2>
                <p>${settingsText[contentType]}</p>
            `;
            billPanel.style.display = 'none'; // Hide bill panel for Settings
        } 
        
        // HISTORY TAB
        else if (contentType === 'History' || contentType === "todaysOrders") {
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
                </div>
                <div id="deletedOrdersDiv"></div>
            `;

            // Attach event listener to the button
            document.getElementById("fetchDeletedOrdersBtn").addEventListener("click", fetchDeletedOrders);
        }

        //MENU TAB
        else if (contentType === "Menu") {
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
            categoryPanel.style.display = "block";

            // Render Menu-related buttons
            categoryPanel.innerHTML = `
                <button class="category" id="ShowMenu" onclick="updateMainContent('ShowMenu')">Menu</button>
                <button class="category" id="AddItem" onclick="updateMainContent('AddItem')">Add Item</button>
                <button class="category" id="UpdateItem" onclick="updateMainContent('UpdateItem')">Update Item</button>
            `;
            break;

        case "Analytics":
            categoryPanel.style.display = "block";

            // Render Analytics-related buttons
            categoryPanel.innerHTML = `
                <button class="category" id="SalesOverview" onclick="updateMainContent('SalesOverview')">Sales Overview</button>
                <button class="category" id="TopSelling" onclick="updateMainContent('TopSelling')">Top Selling</button>
                <button class="category" id="Trends" onclick="updateMainContent('Trends')">Trends</button>
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
