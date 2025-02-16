const { ipcRenderer } = require("electron");

function showEditCustomerPopup(customer) {
    // Prevent duplicate popups
    if (document.getElementById("editCustomerPopup")) {
        return;
    }

    const popup = document.createElement("div");
    popup.id = "editCustomerPopup";
    popup.innerHTML = `
        <div class="edit-customer-popup-content">
            <h2>Edit Customer</h2>
            <label>Name:</label>
            <input type="text" id="editCustomerName" value="${customer.cname}">
            <label>Phone:</label>
            <input type="text" id="editCustomerPhone" value="${customer.phone}">
            <label>Address:</label>
            <input type="text" id="editCustomerAddress" value="${customer.address || ''}">
            <div class="edit-customer-popup-buttons">
                <button id="confirmEditCustomer">Save</button>
                <button id="cancelEditCustomer">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    function handleConfirmClick() {
        const updatedCustomer = {
            cid: customer.cid,
            cname: document.getElementById("editCustomerName").value.trim(),
            phone: document.getElementById("editCustomerPhone").value.trim(),
            address: document.getElementById("editCustomerAddress").value.trim()
        };

        ipcRenderer.send("update-customer", updatedCustomer);

        ipcRenderer.once("update-customer-response", (event, response) => {
            if (response.success) {
                closeEditCustomerPopup(); // Now only close when the update is successful
                setTimeout(() => {
                    ipcRenderer.send("get-customers");
                }, 100); // Small delay ensures proper UI update
            } else {
                alert("Failed to update customer: " + response.error);
            }
        });
    }

    document.getElementById("confirmEditCustomer").addEventListener("click", handleConfirmClick);
    document.getElementById("cancelEditCustomer").addEventListener("click", closeEditCustomerPopup);

    function closeEditCustomerPopup() {
        const popup = document.getElementById("editCustomerPopup");
        if (popup) {
            document.getElementById("confirmEditCustomer").removeEventListener("click", handleConfirmClick);
            document.getElementById("cancelEditCustomer").removeEventListener("click", closeEditCustomerPopup);
            popup.remove();
        }
    }
}

// Remove duplicate event listener
ipcRenderer.on("edit-customer-data", (event, customer) => {
    if (!customer) {
        alert("Customer not found.");
        return;
    }
    showEditCustomerPopup(customer);
});

module.exports = { showEditCustomerPopup };
