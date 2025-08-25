// contextMenu.js - Replace the existing order context menu section
const { ipcRenderer } = require("electron");
const { createTextPopup } = require("./textPopup"); // Make sure this is imported

function attachContextMenu(tableSelector, sourceSection) {
    const tableRows = document.querySelectorAll(`${tableSelector} tbody tr`);

    tableRows.forEach(row => {
        row.addEventListener("contextmenu", (event) => {
            event.preventDefault();

            // Remove any existing context menu
            document.querySelectorAll(".context-menu").forEach(menu => menu.remove());

            const menu = document.createElement("div");
            menu.classList.add("context-menu");

            if (sourceSection === "customer") {
                const customerId = row.getAttribute("data-cid");
                menu.innerHTML = `
                    <div class="context-option" id="editCustomer">✏️ Edit Customer</div>
                    <div class="context-option" id="deleteCustomer">🗑️ Delete Customer</div>
                `;

                // Handle edit customer
                menu.querySelector("#editCustomer").addEventListener("click", () => {
                    ipcRenderer.send("edit-customer", { customerId });
                    menu.remove();
                });

                // Handle delete customer
                menu.querySelector("#deleteCustomer").addEventListener("click", () => {
                    ipcRenderer.send("delete-customer", { customerId });
                    menu.remove();
                });

            } 
            // NEW: Updated Order Context Menu (same as todaysOrdersContextMenu)
            else {
                const billNo = row.getAttribute("data-billno");
                menu.innerHTML = `
                    <div class="context-option" id="deleteOrder">🗑️ Delete Order (Bill No: ${billNo})</div>
                    <div class="context-option" id="printBill">🖨️ Print Bill (Bill No: ${billNo})</div>
                    <div class="context-option">📄 View Details</div>
                `;

                // Handle delete order (using the new popup)
                menu.querySelector("#deleteOrder").addEventListener("click", () => {
                    openDeleteOrderPopup(billNo, sourceSection || "orderHistory");
                    menu.remove();
                });

                // Handle print bill
                menu.querySelector("#printBill").addEventListener("click", () => {
                    // You'll need to implement printBill function or import it
                    printBill(billNo);
                    menu.remove();
                });
            }

            document.body.appendChild(menu);
            menu.style.top = `${event.pageY}px`;
            menu.style.left = `${event.pageX}px`;

            document.addEventListener("click", () => {
                menu.remove();
            }, { once: true });
        });
    });
}

// Add this function to contextMenu.js (same as in todaysOrdersContextMenu)
function openDeleteOrderPopup(billNo, sourceSection) {
    const popup = document.createElement("div");
    popup.classList.add("delete-order-popup");
    popup.innerHTML = `
        <div class="delete-order-popup-content">
            <h3>Delete Order</h3>
            <label>Reason for Deletion:</label>
            <input type="text" id="deleteReason" placeholder="Enter reason">
            <div class="delete-order-popup-buttons">
                <button id="confirmDeleteOrder">Delete</button>
                <button id="cancelDeleteOrder">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Handle confirm delete
    popup.querySelector("#confirmDeleteOrder").addEventListener("click", () => {
        const reason = popup.querySelector("#deleteReason").value.trim();
        if (reason) {
            ipcRenderer.send("confirm-delete-order", { billNo, reason, source: sourceSection });
            document.body.removeChild(popup);
        } else {
            createTextPopup("Please enter a reason for deletion.");
        }
    });

    // Handle cancel delete
    popup.querySelector("#cancelDeleteOrder").addEventListener("click", () => {
        document.body.removeChild(popup);
    });

    // Close popup when clicking outside
    popup.addEventListener("click", (e) => {
        if (e.target === popup) {
            document.body.removeChild(popup);
        }
    });
}

module.exports = { attachContextMenu };