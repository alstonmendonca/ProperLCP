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
                <div class="context-option" id="printBill">🖨️ Print Bill Only(Bill No: ${billNo})</div>
                <div class="context-option" id="printKot">🖨️ Print KOT Only(Bill No: ${billNo})</div>
                <div class="context-option" id="printBillAndKot">🖨️ Print Bill and KOT(Bill No: ${billNo})</div>
            `;

            // Handle delete order
            menu.querySelector("#deleteOrder").addEventListener("click", () => {
                openDeleteOrderPopup(billNo, "todaysOrders");
                menu.remove();
            });

            // Handle print bill
            menu.querySelector("#printBillAndKot").addEventListener("click", () => {
                printBill(billNo);
                menu.remove();
            });

            // Handle print bill only
            menu.querySelector("#printBill").addEventListener("click", () => {
                printBillOnly(billNo);
                menu.remove();
            });

            // Handle print KOT only
            menu.querySelector("#printKot").addEventListener("click", () => {
                printKOTOnly(billNo);
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

// Function to print both bill and KOT
function printBill(billno) {
    // Get the order details from the database
    ipcRenderer.send("get-order-for-printing", billno);
    
    // Handle the response
    ipcRenderer.once("order-for-printing-response", (event, { order, items }) => {
        if (!order || !items) {
            createTextPopup("Failed to load order details for printing");
            return;
        }
        
        // Prepare the data for printing - calculate total price per line item like in bill.js
        const printData = {
            billItems: items.map(item => ({
                name: item.fname,
                quantity: item.quantity,
                price: parseFloat(item.price) * parseInt(item.quantity) // Total price for this line item
            })),
            totalAmount: order.price,
            kot: order.kot,
            orderId: order.billno,
            dateTime: order.date
        };
        
        // Send to main process for printing both bill and KOT
        ipcRenderer.send("print-bill", printData);
        
        // Handle print result
        ipcRenderer.once('print-success', () => {
            createTextPopup("Bill and KOT printed successfully");
        });
        
        ipcRenderer.once('print-error', (event, error) => {
            createTextPopup(`Print Failed: ${error}`);
        });
    });
}

// Function to print only the bill (customer receipt)
function printBillOnly(billno) {
    // Get the order details from the database
    ipcRenderer.send("get-order-for-printing", billno);
    
    // Handle the response
    ipcRenderer.once("order-for-printing-response", (event, { order, items }) => {
        if (!order || !items) {
            createTextPopup("Failed to load order details for printing");
            return;
        }
        
        // Prepare the data for printing - calculate total price per line item like in bill.js
        const printData = {
            billItems: items.map(item => ({
                name: item.fname,
                quantity: item.quantity,
                price: parseFloat(item.price) * parseInt(item.quantity) // Total price for this line item
            })),
            totalAmount: order.price,
            kot: order.kot,
            orderId: order.billno,
            dateTime: order.date
        };
        
        // Send to main process for printing bill only
        ipcRenderer.send("print-bill-only", printData);
        
        // Handle print result
        ipcRenderer.once('print-success', () => {
            createTextPopup("Bill printed successfully");
        });
        
        ipcRenderer.once('print-error', (event, error) => {
            createTextPopup(`Print Failed: ${error}`);
        });
    });
}

// Function to print only KOT
function printKOTOnly(billno) {
    // Get the order details from the database
    ipcRenderer.send("get-order-for-printing", billno);
    
    // Handle the response
    ipcRenderer.once("order-for-printing-response", (event, { order, items }) => {
        if (!order || !items) {
            createTextPopup("Failed to load order details for printing");
            return;
        }
        
        // Prepare the data for printing - calculate total price per line item like in bill.js
        const printData = {
            billItems: items.map(item => ({
                name: item.fname,
                quantity: item.quantity,
                price: parseFloat(item.price) * parseInt(item.quantity) // Total price for this line item
            })),
            totalAmount: order.price,
            kot: order.kot,
            orderId: order.billno,
            dateTime: order.date
        };
        
        // Send to main process for printing KOT only
        ipcRenderer.send("print-kot-only", printData);
        
        // Handle print result
        ipcRenderer.once('print-kot-success', () => {
            createTextPopup("KOT printed successfully");
        });
        
        ipcRenderer.once('print-error', (event, error) => {
            createTextPopup(`Print Failed: ${error}`);
        });
    });
}

// Make these functions available globally
window.printBill = printBill;
window.printBillOnly = printBillOnly;
window.printKOTOnly = printKOTOnly;

module.exports = { attachTodaysOrdersContextMenu};