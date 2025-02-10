const { ipcRenderer } = require("electron");

function deleteOrder(billNo, sourceSection) {
    ipcRenderer.send("open-delete-order-window", { billNo, source: sourceSection });
}

// Listen for order deletion confirmation and refresh the correct section
ipcRenderer.on("order-deleted", (event, { source }) => {
    if (source === "todaysOrders") {
        ipcRenderer.send("get-todays-orders"); // Fetch data
        ipcRenderer.send("refresh-order-history"); // Ensure UI update
    } else if (source === "orderHistory") {
        ipcRenderer.send("get-order-history");
        ipcRenderer.send("refresh-order-history");
    } else if (source === "categoryHistory") {
        ipcRenderer.send("get-category-history");
        ipcRenderer.send("refresh-order-history");
    }
});
module.exports = { deleteOrder };
