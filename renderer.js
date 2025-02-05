const { ipcRenderer } = require('electron');
const { updateCategoryPanel } = require("./categoryHandler");
const { fetchOrderHistory } = require("./history");
const { fetchDeletedOrders } = require("./deletedOrdersTable");
const { fetchCategoryWise } = require("./categoryWiseTable");
const { fetchCategories } = require("./categoryDropDown");
const { fetchTodaysOrders } = require("./todaysOrders");
const { exportTableToExcel } = require("./export"); 
window.fetchOrderHistory = fetchOrderHistory;
window.updateCategoryPanel = updateCategoryPanel;
window.fetchDeletedOrders = fetchDeletedOrders;
window.fetchCategoryWise = fetchCategoryWise;
window.fetchCategories = fetchCategories;
window.fetchTodaysOrders = fetchTodaysOrders;
window.exportTableToExcel = exportTableToExcel;
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

