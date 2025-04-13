const { ipcRenderer } = require("electron");
const  {createTextPopup} = require("./textPopup");

document.addEventListener("DOMContentLoaded", () => {
    let isActive = 1; // Default Active

    // Toggle Active/Inactive
    document.getElementById("toggleActive").addEventListener("click", function () {
        isActive = isActive === 1 ? 0 : 1;
        this.classList.toggle("active", isActive === 1);
        this.classList.toggle("inactive", isActive === 0);
        this.textContent = isActive === 1 ? "Active" : "Inactive";
    });

    // Add Category
    document.getElementById("addCategoryBtn").addEventListener("click", function () {
        const categoryName = document.getElementById("categoryName").value.trim();

        if (!categoryName) {
            createTextPopup("Please enter a category name.");
            return;
        }

        ipcRenderer.send("add-category", { catname: categoryName, active: isActive });
    });

    // Close Window
    document.getElementById("cancelBtn").addEventListener("click", function () {
        window.close();
    });

    // Close window after category is added
    ipcRenderer.on("category-added", () => {
        ipcRenderer.send("refresh-categories"); // Send event to refresh categories
        window.close();
    });
});
