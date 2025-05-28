const { ipcRenderer } = require("electron");
const  {createTextPopup} = require("./textPopup");

let catid;
let isActive = 1;

document.addEventListener("DOMContentLoaded", () => {
    ipcRenderer.on("edit-category-data", (event, categoryData) => {
        catid = categoryData.catid;
        document.getElementById("editCategoryName").value = categoryData.catname;
        isActive = categoryData.active;

        const toggleBtn = document.getElementById("toggleActive");
        toggleBtn.classList.toggle("active", isActive === 1);
        updateStatusLabel(); // Update label based on initial value

        document.querySelector(".close-overlay").style.display = "block";
        document.querySelector(".modal").style.display = "block";
    });

    document.getElementById("toggleActive").addEventListener("click", function () {
        isActive = isActive === 1 ? 0 : 1;
        this.classList.toggle("active", isActive === 1);
        updateStatusLabel(); // Update label when toggled
    });

    document.getElementById("saveChangesBtn").addEventListener("click", () => {
        const updatedName = document.getElementById("editCategoryName").value.trim();

        if (!updatedName) {
            createTextPopup("Please enter a category name.");
            return;
        }

        ipcRenderer.send("update-category", { catid, catname: updatedName, active: isActive });
    });

    ipcRenderer.on("category-updated", () => {
        closeModal();
    });

    document.getElementById("cancelEditBtn").addEventListener("click", closeModal);
});

// Function to update the status label
function updateStatusLabel() {
    const statusLabel = document.getElementById("toggleStatusLabel");
    statusLabel.textContent = isActive === 1 ? "Active" : "Inactive";
    statusLabel.style.color = isActive === 1 ? "green" : "red";
}

function closeModal() {
    document.querySelector(".close-overlay").style.display = "none";
    document.querySelector(".modal").style.display = "none";
}
