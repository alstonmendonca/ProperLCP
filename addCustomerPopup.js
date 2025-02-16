const { ipcRenderer } = require("electron");

// Function to show the Add Customer popup
function showAddCustomerPopup() {
    // Create the popup container
    const popup = document.createElement("div");
    popup.id = "addCustomerPopup";
    popup.innerHTML = `
        <div class="popup-content">
            <h2>Add New Customer</h2>
            <label>Name:</label>
            <input type="text" id="customerName" placeholder="Enter name" required>
            <label>Phone:</label>
            <input type="text" id="customerPhone" placeholder="Enter phone number" required>
            <label>Address:</label>
            <input type="text" id="customerAddress" placeholder="Enter address">
            <div class="popup-buttons">
                <button id="confirmAddCustomer">Add Customer</button>
                <button id="cancelAddCustomer">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Event listeners
    document.getElementById("confirmAddCustomer").addEventListener("click", async () => {
        const cname = document.getElementById("customerName").value.trim();
        const phone = document.getElementById("customerPhone").value.trim();
        const address = document.getElementById("customerAddress").value.trim();

        if (!cname || !phone) {
            alert("Name and phone number are required!");
            return;
        }

        // Send data to main process
        ipcRenderer.send("add-customer", { cname, phone, address });

        // Close popup
        closeAddCustomerPopup();
    });

    document.getElementById("cancelAddCustomer").addEventListener("click", closeAddCustomerPopup);
}

// Function to close the popup
function closeAddCustomerPopup() {
    const popup = document.getElementById("addCustomerPopup");
    if (popup) {
        popup.remove();
    }
}

// Export function so it can be used in ui.js
module.exports = { showAddCustomerPopup };
