// const { contextBridge, ipcRenderer } = require("electron");

// contextBridge.exposeInMainWorld("api", {
//     fetchOrderHistory: (startDate, endDate) => ipcRenderer.send("get-order-history", { startDate, endDate }),
//     exportToExcel: () => ipcRenderer.send("export-excel"),
//     receiveOrderHistory: (callback) => ipcRenderer.on("order-history-response", (event, data) => callback(data)),
//     showExportMessage: (callback) => ipcRenderer.on("show-excel-export-message", (event, message) => callback(message)),
// });
