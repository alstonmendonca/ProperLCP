const { ipcRenderer } = require("electron");

function attachContextMenu(tableSelector, sourceSection) {
    const tableRows = document.querySelectorAll(`${tableSelector} tbody tr`);
    
    tableRows.forEach(row => {
        row.addEventListener("contextmenu", (event) => {
            event.preventDefault();

            // Remove any existing context menu
            document.querySelectorAll(".context-menu").forEach(menu => menu.remove());
            
            const billNo = row.getAttribute("data-billno");
            const menu = document.createElement("div");
            menu.classList.add("context-menu");
            menu.innerHTML = `
                <div class="context-option" id="deleteOrder">🗑️ Delete Order (Bill No: ${billNo})</div>
                <div class="context-option">🔄 Refresh Order</div>
                <div class="context-option">📄 View Details</div>
            `;

            document.body.appendChild(menu);
            menu.style.top = `${event.pageY}px`;
            menu.style.left = `${event.pageX}px`;

            document.addEventListener("click", () => {
                menu.remove();
            }, { once: true });

            // Handle delete order click
            menu.querySelector("#deleteOrder").addEventListener("click", () => {
                ipcRenderer.send("open-delete-order-window", { billNo, source: sourceSection });
                menu.remove(); // Close context menu after click
            });
        });
    });
}

module.exports = { attachContextMenu };
