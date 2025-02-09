const { ipcRenderer } = require("electron");

function deleteOrder(billNo) {
    ipcRenderer.send("open-delete-order-window", { billNo });
}

module.exports = { deleteOrder };