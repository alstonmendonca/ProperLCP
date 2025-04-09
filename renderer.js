const { ipcRenderer } = require('electron');
const { updateCategoryPanel } = require("./categoryHandler");
const { fetchOrderHistory } = require("./history");
const { fetchDeletedOrders } = require("./deletedOrdersTable");
const { fetchCategoryWise } = require("./categoryWiseTable");
const { fetchCategories } = require("./categoryDropDown");
const { fetchTodaysOrders } = require("./todaysOrders");
const { exportTableToExcel } = require("./export"); 
const {confirmDeleteCategory} = require("./categoriesList");
const {openEditWindow} = require("./categoriesList");
const { displayCategoryWiseSales } = require("./categoryWiseTable");
const { displayDeletedOrders } = require("./deletedOrdersTable");
const { loadUserProfile } = require("./userProfile");
const {deleteOrder} = require("./deleteOrder");
const { loadItemSummary } = require('./itemSummary');
const {sortTodaysOrdersTable} = require('./todaysOrders');
const {loadCustomers} = require('./customer');
const {displayCustomers} = require('./customer');
const {sortCustomersTable} = require('./customer');
const {fetchDiscountedOrders} = require('./discountedOrders');
const {sortDiscountedOrdersTable} = require('./discountedOrders');
const {clearDiscountedOrders} = require('./discountedOrders');
const {sortOrderHistoryTable} = require('./history');
const {attachContextMenu} = require('./contextMenu');
const {showAddCustomerPopup} = require('./addCustomerPopup');
const {showEditCustomerPopup} = require('./editCustomerPopup');
const {clearCustomerData} = require('./customer');
const { loadSalesOverview } = require('./salesOverview'); 
const { loadDayEndSummary } = require('./dayEndSummary'); // Import the day end summary function
const {handleSummaryClick} = require('./dayEndSummary'); // Import the handleSummaryClick function}
const {openAddCategoryWindow} = require('./categoriesList');
const {openEditCategoryPopup} = require('./categoriesList');
const {updateStatusLabel} = require('./editCategory');
const {openAddCategoryPopup} = require('./categoriesList');
const {openTodayEditOrder} = require('./todaysOrders');
const {attachTodaysOrdersContextMenu} = require('./todaysOrdersContextMenu');
const { loadTopSellingItems } = require("./topSelling");
const {sortTopSellingTable} = require("./topSelling");
const {loadCategoryWiseSales} = require("./categoryWiseSales");
const {fetchFoodItems} = require("./itemDropDown");
const {fetchItemHistory} = require("./itemHistory");
const {displayItemHistory} = require("./itemHistory");
const {sortItemHistoryTable} = require("./itemHistory");
const {sortCategoryWiseTable} = require("./categoryWiseTable");
const {loadTopSellingCategories} = require("./topSellingCategory");
const {sortTopSellingCategoriesTable} = require("./topSellingCategory");
const {sortSalesOverviewTable} = require('./salesOverview'); 
const {sortDeletedOrdersTable} = require('./deletedOrdersTable');
const {loadPrinterConfig} = require('./printerConfig');
const {showOrderDetails} = require('./todaysOrders');
const {closeOrderDetails} = require('./todaysOrders');
const {loadThemeToggle} = require('./themeToggle');
const {loadHome} = require('./home');
const { updateLeftPanel } = require("./leftPanel"); // Add this import
const { loadCategories } = require("./categoriesList");
const { loadTodaysOrders } = require("./todaysOrders");
const { loadOrderHistory } = require("./history");
const {loadCategoryHistory} = require("./categoryWiseTable");
window.fetchOrderHistory = fetchOrderHistory;
window.updateCategoryPanel = updateCategoryPanel;
window.fetchDeletedOrders = fetchDeletedOrders;
window.fetchCategoryWise = fetchCategoryWise;
window.fetchCategories = fetchCategories;
window.fetchTodaysOrders = fetchTodaysOrders;
window.exportTableToExcel = exportTableToExcel;
window.confirmDeleteCategory = confirmDeleteCategory;
window.openEditWindow = openEditWindow;
window.displayCategoryWiseSales = displayCategoryWiseSales;
window.displayDeletedOrders = displayDeletedOrders;
window.deleteOrder = deleteOrder;
window.loadItemSummary = loadItemSummary;
window.sortTodaysOrdersTable = sortTodaysOrdersTable;
window.displayCustomers = displayCustomers;
window.fetchDiscountedOrders = fetchDiscountedOrders;
window.sortDiscountedOrdersTable = sortDiscountedOrdersTable;
window.clearDiscountedOrders = clearDiscountedOrders;
window.sortOrderHistoryTable = sortOrderHistoryTable;
window.sortCustomersTable = sortCustomersTable;
window.showAddCustomerPopup = showAddCustomerPopup;
window.showEditCustomerPopup = showEditCustomerPopup;
window.attachContextMenu = attachContextMenu;
window.closeAddCustomerPopup = closeAddCustomerPopup;
window.closeEditCustomerPopup = closeEditCustomerPopup;
window.clearCustomerData = clearCustomerData;
window.loadSalesOverview = loadSalesOverview;
window.loadDayEndSummary = loadDayEndSummary; 
window.handleSummaryClick = handleSummaryClick;
window.openEditWindow = openEditWindow;
window.openEditCategoryPopup = openEditCategoryPopup;
window.openAddCategoryPopup = openAddCategoryPopup;
window.loadCategoryWiseSales = loadCategoryWiseSales;
window.fetchFoodItems = fetchFoodItems;
window.fetchItemHistory = fetchItemHistory;
window.displayItemHistory = displayItemHistory;
window.sortItemHistoryTable = sortItemHistoryTable;
window.sortCategoryWiseTable = sortCategoryWiseTable;
window.loadHome = loadHome;
// Listen for the 'set-user-role' message from the main process
ipcRenderer.on('set-user-role', (event, role) => {
    const content = document.getElementById('content'); // Assuming this is the main container
    if (content) {
        content.classList.add('fade-in');
        console.log(`Received role: ${role}`);
        const billPanel = document.getElementById("bill-panel");
        billPanel.style.display = 'none';
        if (role === 'staff') {
            console.log("Hiding buttons for staff via 'set-user-role'");
            document.getElementById('Analytics').style.display = 'none';
            document.getElementById('History').style.display = 'none';
        }
    }
});

ipcRenderer.on("delete-order-response", (event, data) => {
    alert(data.message);
    if (data.success) {
        fetchOrderHistory(); // Refresh the order list
    }
});

