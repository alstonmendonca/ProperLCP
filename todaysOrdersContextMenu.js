const { ipcRenderer } = require("electron");
const  {createTextPopup} = require("./textPopup");

function attachTodaysOrdersContextMenu(selector) {
    const orderBoxes = document.querySelectorAll(selector);

    orderBoxes.forEach(box => {
        box.addEventListener("contextmenu", (event) => {
            event.preventDefault();

            // Remove any existing context menu
            document.querySelectorAll(".context-menu").forEach(menu => menu.remove());

            const menu = document.createElement("div");
            menu.classList.add("context-menu");

            const billNo = box.getAttribute("data-billno");
            menu.innerHTML = `
                <div class="context-option" id="deleteOrder">🗑️ Delete Order (Bill No: ${billNo})</div>
                <div class="context-option" id="printBill">🖨️ Print Bill (Bill No: ${billNo})</div>
                <div class="context-option">📄 View Details</div>
            `;

            // Handle delete order
            menu.querySelector("#deleteOrder").addEventListener("click", () => {
                openDeleteOrderPopup(billNo, "todaysOrders");
                menu.remove();
            });

            // Handle print bill
            menu.querySelector("#printBill").addEventListener("click", () => {
                printBill(billNo);
                menu.remove();
            });

            // Add functionality for other options as needed
            // For example, you can add functionality for "Refresh Order" and "View Details"

            document.body.appendChild(menu);
            menu.style.top = `${event.pageY}px`;
            menu.style.left = `${event.pageX}px`;

            document.addEventListener("click", () => {
                menu.remove();
            }, { once: true });
        });
    });
}

// Function to open the delete order popup
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

module.exports = { attachTodaysOrdersContextMenu };