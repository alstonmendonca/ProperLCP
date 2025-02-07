const { ipcRenderer } = require("electron");

let catid;
let isActive = 1;

document.addEventListener("DOMContentLoaded", () => {
    ipcRenderer.on("edit-category-data", (event, categoryData) => {
        catid = categoryData.catid;
        document.getElementById("editCategoryName").value = categoryData.catname;
        isActive = categoryData.active;

        const toggleBtn = document.getElementById("toggleActive");
        toggleBtn.classList.toggle("active", isActive === 1);
        toggleBtn.classList.toggle("inactive", isActive === 0);
        toggleBtn.textContent = isActive === 1 ? "Active" : "Inactive";
    });

    // Toggle Active/Inactive
    document.getElementById("toggleActive").addEventListener("click", function () {
        isActive = isActive === 1 ? 0 : 1;
        this.classList.toggle("active", isActive === 1);
        this.classList.toggle("inactive", isActive === 0);
        this.textContent = isActive === 1 ? "Active" : "Inactive";
    });

    // Save Changes
    document.getElementById("saveChangesBtn").addEventListener("click", () => {
        const updatedName = document.getElementById("editCategoryName").value.trim();

        if (!updatedName) {
            alert("Please enter a category name.");
            return;
        }

        ipcRenderer.send("update-category", { catid, catname: updatedName, active: isActive });
    });

    // Close Window on Update
    ipcRenderer.on("category-updated", () => {
        window.close();
    });

    // Cancel Edit
    document.getElementById("cancelEditBtn").addEventListener("click", () => {
        window.close();
    });
});
