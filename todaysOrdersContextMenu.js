const { ipcRenderer } = require("electron");

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
                <div class="context-option">🔄 Refresh Order</div>
                <div class="context-option">📄 View Details</div>
            `;

            // Handle delete order
            menu.querySelector("#deleteOrder").addEventListener("click", () => {
                ipcRenderer.send("open-delete-order-window", { billNo, source: "todaysOrders" });
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

module.exports = { attachTodaysOrdersContextMenu };