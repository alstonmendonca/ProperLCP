// leftPanel.js
const { ipcRenderer } = require('electron');

// Helper function to get user role with fallback
async function getUserRole() {
    try {
        let userRole = await ipcRenderer.invoke("get-user-role");
        // Fallback to localStorage if IPC fails
        if (!userRole) {
            userRole = localStorage.getItem('userRole');
        }
        return userRole;
    } catch (error) {
        console.error("Error getting user role:", error);
        return localStorage.getItem('userRole');
    }
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
            const switches = await ipcRenderer.invoke("load-switches");

            if (categories.length > 0) {
                // Only show "All" button if the switch is enabled
                if (switches.showAllButton) {
                    categoryPanel.innerHTML = `<button class="category" id="All" onclick="updateMainContent('Home')">All</button>`;
                } else {
                    categoryPanel.innerHTML = '';
                }
                
                // Only show "Frequent" button if the switch is enabled
                if (switches.showFrequentButton) {
                    categoryPanel.innerHTML += `<button class="category" id="Frequent" onclick="updateMainContent('Frequent')">Frequent</button>`;
                }
                
                categoryPanel.innerHTML += categories
                    .map(
                        (category) =>
                            `<button class="category" id="${category.catname}" onclick="updateMainContent('${category.catname}')">${category.catname}</button>`
                    )
                    .join("");

                // Highlight the active category button
                const lastCategoryButton = sessionStorage.getItem('lastCategoryButton');
                if (lastCategoryButton && document.getElementById(lastCategoryButton)) {
                    document.getElementById(lastCategoryButton).classList.add('active');
                } else if (switches.showAllButton && document.getElementById('All')) {
                    document.getElementById('All').classList.add('active');
                } else if (switches.showFrequentButton && document.getElementById('Frequent')) {
                    document.getElementById('Frequent').classList.add('active');
                } else if (categories.length > 0) {
                    // If both "All" and "Frequent" buttons are hidden, highlight the first category
                    document.getElementById(categories[0].catname).classList.add('active');
                }

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
                <button class="category" id="EmployeeAnalysis" onclick="updateMainContent('EmployeeAnalysis')">Employee Analysis</button>
                <button class="category" id="SpecialStatistics" onclick="updateMainContent('SpecialStatistics')">Special Statistics</button>
                <button class="category" id="Charts" onclick="updateMainContent('Charts')">Charts</button>
                <button class="category" id="BestInCategory" onclick="updateMainContent('BestInCategory')">Best In Category</button>
                <button class="category" id="TaxOnItems" onclick="updateMainContent('TaxOnItems')">Tax On Items</button>
            `;
            break;

        case "History":
            categoryPanel.style.display = "block";
            
            // Get user role from multiple sources for reliability
            const userRole = await getUserRole();
            
            console.log("Current user role in History section:", userRole);
            
            if (userRole === 'staff') {
                // Staff users only see Today's Orders
                categoryPanel.innerHTML = `
                    <button class="category" id="todaysOrders" onclick="updateMainContent('todaysOrders')">Todays Orders</button>
                `;
            } else {
                // Admin users see all history options
                categoryPanel.innerHTML = `
                    <button class="category" id="todaysOrders" onclick="updateMainContent('todaysOrders')">Todays Orders</button>
                    <button class="category" id="orderHistory" onclick="updateMainContent('orderHistory')">Order History</button>
                    <button class="category" id="categoryHistory" onclick="updateMainContent('categoryHistory')">Category-wise</button>
                    <button class="category" id="itemHistory" onclick="updateMainContent('itemHistory')">Item History</button>
                    <button class="category" id="dayWise" onclick="updateMainContent('dayWise')">Day-wise</button>
                    <button class="category" id="monthWise" onclick="updateMainContent('monthWise')">Month-wise</button>
                    <button class="category" id="yearWise" onclick="updateMainContent('yearWise')">Year-wise</button>
                    <button class="category" id="discountedOrders" onclick="updateMainContent('discountedOrders')">Discounted Orders</button>
                    <button class="category" id="deletedOrders" onclick="updateMainContent('deletedOrders')">Deleted Orders</button>
                    <button class="category" id="customer" onclick="updateMainContent('customer')">Customers</button>
                    <button class="category" id="searchOrder" onclick="updateMainContent('searchOrder')">Search Order</button>
                `;
            }

            // Highlight the active history button
            const lastHistoryButton = sessionStorage.getItem('lastHistoryButton');
            if (userRole === 'staff') {
                // For staff, always highlight and default to "todaysOrders"
                const todaysOrdersButton = document.getElementById('todaysOrders');
                if (todaysOrdersButton) {
                    todaysOrdersButton.classList.add('active');
                }
                sessionStorage.setItem('lastHistoryButton', 'todaysOrders');
            } else {
                // For admin, use normal highlighting logic
                if (lastHistoryButton) {
                    const buttonToHighlight = document.getElementById(lastHistoryButton);
                    if (buttonToHighlight) {
                        buttonToHighlight.classList.add('active');
                    }
                } else {
                    document.getElementById('todaysOrders').classList.add('active');
                }
            }
            break;

        case "Categories":
            categoryPanel.style.display = "none";
            break;

        case "Inventory":
            categoryPanel.style.display = "none";
            break;

        case "Settings":
            categoryPanel.style.display = "block";
            categoryPanel.innerHTML = `
                <button class="category" id="UserProfile" onclick="updateMainContent('UserProfile')">User Profile</button>
                <button class="category" id="BusinessInfo" onclick="updateMainContent('BusinessInfo')">Business Information</button>
                <button class="category" id="DriverConfiguration" onclick="updateMainContent('DriverConfiguration')">Printer Configuration</button>
                <button class="category" id="Receipt" onclick="updateMainContent('Receipt')">Receipt</button>
                <button class="category" id="ConnectedDevices" onclick="updateMainContent('ConnectedDevices')">Connected Devices</button>
                <button class="category" id="BackupDatabase" onclick="updateMainContent('BackupDatabase')">Backup Database</button>
                <button class="category" id="RestoreDatabase" onclick="updateMainContent('RestoreDatabase')">Restore Database</button>
                <button class="category" id="customizeLeftPanel" onclick="updateMainContent('customizeLeftPanel')">Customize Panel</button>
                <button class="category" id="ArrangeMenu" onclick="updateMainContent('ArrangeMenu')">Arrange Menu</button>
                <button class="category" id="Switches" onclick="updateMainContent('Switches')">Switches</button>
                <button class="category" id="ChangeMasterPassword" onclick="updateMainContent('ChangeMasterPassword')">Change Master Password</button>
                <button class="category" id="Help" onclick="updateMainContent('Help')">Help and Support</button>
                <button class="category" id="Exit" onclick="updateMainContent('Exit')">Exit</button>
            `;
            break;
    }

    // Highlight the active category button for non-Home sections
    if (contentType !== "Home") {
        const categoryButtons = document.querySelectorAll("#category-panel .category");
        categoryButtons.forEach(button => button.classList.remove("active"));

        const activeCategoryButton = document.getElementById(contentType);
        if (activeCategoryButton) {
            activeCategoryButton.classList.add("active");
        }
    }

    // Add logout button at the bottom of the panel only on Home screen
    if (contentType === "Home") {
        addLogoutButton();
    } else {
        // Remove logout button if it exists when not on Home screen
        const existingLogoutBtn = document.getElementById("logoutPanelBtn");
        if (existingLogoutBtn) {
            existingLogoutBtn.remove();
        }
    }
}

// Function to add logout button at the bottom of the left panel
function addLogoutButton() {
    const categoryPanel = document.getElementById("category-panel");
    
    // Remove existing logout button if any
    const existingLogoutBtn = document.getElementById("logoutPanelBtn");
    if (existingLogoutBtn) {
        existingLogoutBtn.remove();
    }
    
    // Create logout button
    const logoutButton = document.createElement("button");
    logoutButton.id = "logoutPanelBtn";
    logoutButton.className = "category logout-btn";
    logoutButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" 
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" 
            stroke-linejoin="round" style="margin-right: 8px; vertical-align: middle;">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Logout
    `;
    
    // Add click event listener
    logoutButton.addEventListener("click", handleLogout);
    
    // Append to the bottom of the panel
    categoryPanel.appendChild(logoutButton);
    
    // Add specific styling for logout button to keep it at the bottom
    logoutButton.style.marginTop = "auto";
    logoutButton.style.backgroundColor = "#dc3545";
    logoutButton.style.borderTop = "2px solid #999";
}

// Handle logout functionality
async function handleLogout() {
    try {
        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.id = 'logout-loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(13, 59, 102, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(5px);
        `;
        
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            border: 6px solid rgba(255, 255, 255, 0.2);
            border-top: 6px solid #FFFFFF;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            animation: spin 1s linear infinite;
        `;
        
        // Add keyframes for spinner animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        overlay.appendChild(spinner);
        document.body.appendChild(overlay);
        
        // Small delay to show the overlay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Call logout IPC
        await ipcRenderer.invoke("logout");
        
        // Redirect to login page
        window.location.href = "login.html";
    } catch (error) {
        console.error("Error during logout:", error);
        // Remove overlay if there's an error
        const overlay = document.getElementById('logout-loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

module.exports = { updateLeftPanel };