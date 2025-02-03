const { ipcRenderer } = require('electron');
const { updateCategoryPanel } = require("./categoryHandler");
const { fetchOrderHistory } = require("./history");
window.fetchOrderHistory = fetchOrderHistory;

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

// Open the 'Add Category' window when the green button is clicked
document.body.addEventListener("click", (event) => {
    if (event.target.id === "addCategoryBtn") {
        ipcRenderer.send("open-add-category-window");
    }
});

// Listen for category addition success
ipcRenderer.on("category-added-success", () => {
    alert("Category added successfully!");
    // You can also update the UI dynamically to reflect the new category
});

// Make Order history available globally
