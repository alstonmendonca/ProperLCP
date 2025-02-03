const { ipcRenderer } = require("electron");

document.getElementById("addCategoryBtn").addEventListener("click", () => {
    const categoryName = document.getElementById("categoryName").value;
    ipcRenderer.send("add-category", categoryName);
});

// Listen for category success BEFORE the window closes
ipcRenderer.on("category-added-success", () => {
    alert("Category added successfully!");
    window.close(); // Close after showing the alert
});

ipcRenderer.on("category-add-failed", (event, message) => {
    alert(message);
});
