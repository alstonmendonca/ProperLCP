const { ipcRenderer } = require("electron");

function exportTableToExcel(tableId, filename = "export.xlsx") {
    const table = document.querySelector(tableId);
    if (!table) {
        alert("Table not found!");
        return;
    }

    const XLSX = require("xlsx");
    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.table_to_sheet(table);

    XLSX.utils.book_append_sheet(wb, ws, "Order History");
    XLSX.writeFile(wb, filename);

    ipcRenderer.send("show-excel-export-message", {
        type: "info",
        title: "Export Successful",
        message: `Order history has been successfully exported to ${filename}.`,
    });
}

module.exports = { exportTableToExcel };
