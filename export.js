const { ipcRenderer } = require("electron");
const  {createTextPopup} = require("./textPopup");

function exportTableToExcel(tableId, defaultFilename = "export.xlsx") {
    const table = document.querySelector(tableId);
    if (!table) {
        createTextPopup("Table not found!");
        return;
    }

    ipcRenderer.invoke("show-save-dialog", defaultFilename).then(filePath => {
        if (!filePath) {
            createTextPopup("Export canceled.");
            return;
        }

        const XLSX = require("xlsx");
        let wb = XLSX.utils.book_new();
        let ws = XLSX.utils.table_to_sheet(table);

        XLSX.utils.book_append_sheet(wb, ws, "Order History");
        XLSX.writeFile(wb, filePath);

        ipcRenderer.send("show-excel-export-message", {
            type: "info",
            title: "Export Successful",
            message: `Order history has been successfully exported to:\n${filePath}`,
        });
    });
}

module.exports = { exportTableToExcel };
