const { ipcRenderer } = require("electron");

// Function to show the Add Customer popup
function showAddCustomerPopup() {

    // Check if popup already exists
    if (document.getElementById("addCustomerPopup")) {
        return; // Prevent duplicate popups
    }

    // Create the popup container
    const popup = document.createElement("div");
    popup.id = "addCustomerPopup";
    popup.innerHTML = `
        <div class="add-customer-popup-content">
            <h2>Add New Customer</h2>
            <label>Name:</label>
            <input type="text" id="customerName" placeholder="Enter name" required>
            <label>Phone:</label>
            <input type="text" id="customerPhone" placeholder="Enter phone number" required>
            <label>Address:</label>
            <input type="text" id="customerAddress" placeholder="Enter address">
            <div class="add-customer-popup-buttons">
                <button id="confirmAddCustomer">Add Customer</button>
                <button id="cancelAddCustomer">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    function handleConfirmClick() {
        const cname = document.getElementById("customerName").value.trim();
        const phone = document.getElementById("customerPhone").value.trim();
        const address = document.getElementById("customerAddress").value.trim();

        if (!cname || !phone) {
            createTextPopup("Name and phone number are required!");
            return;
        }

        // Send data to main process
        ipcRenderer.send("add-customer", { cname, phone, address });

        // Wait for response before closing popup
        ipcRenderer.once("customer-added-response", (event, response) => {
            if (response.success) {
                closeAddCustomerPopup(); // Close only if addition is successful
                setTimeout(() => {
                    ipcRenderer.send("get-customers"); // Refresh customer list
                }, 100);
            } else {
                createTextPopup("Failed to add customer: " + response.error);
            }
        });
    }

    function closeAddCustomerPopup() {
        const popup = document.getElementById("addCustomerPopup");
        if (popup) {
            document.getElementById("confirmAddCustomer").removeEventListener("click", handleConfirmClick);
            document.getElementById("cancelAddCustomer").removeEventListener("click", closeAddCustomerPopup);
            popup.remove();
        }
    }

    document.getElementById("confirmAddCustomer").addEventListener("click", handleConfirmClick);
    document.getElementById("cancelAddCustomer").addEventListener("click", closeAddCustomerPopup);
}

// Export function so it can be used in ui.js
module.exports = { showAddCustomerPopup };
