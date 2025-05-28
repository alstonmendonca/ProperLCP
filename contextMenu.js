const { ipcRenderer } = require("electron");

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
            // Existing Order Context Menu (Do not modify)
            else {
                const billNo = row.getAttribute("data-billno");
                menu.innerHTML = `
                    <div class="context-option" id="deleteOrder">🗑️ Delete Order (Bill No: ${billNo})</div>
                    <div class="context-option">📄 View Details</div>
                `;

                menu.querySelector("#deleteOrder").addEventListener("click", () => {
                    ipcRenderer.send("open-delete-order-window", { billNo, source: sourceSection });
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

module.exports = { attachContextMenu };
