const { ipcRenderer } = require("electron");

function fetchCategoriesList() {
    ipcRenderer.send("get-categories-list");
}

// Receive categories from the main process and update the UI
ipcRenderer.on("categories-list-response", (event, data) => {
    const categories = data.categories;
    const categoriesTabDiv = document.getElementById("categoriesTabDiv");
    categoriesTabDiv.innerHTML = ""; // Clear previous content

    if (categories.length === 0) {
        categoriesTabDiv.innerHTML = "<p>No categories found.</p>";
        return;
    }

    // Create a grid layout for categories
    let gridHTML = `
        <div class="categories-grid">
            <div class="category-box" id="addCategoryBox" onclick="openAddCategoryPopup()">
                <p style = "font-size : 100px">+</p>     
            </div>
    `;

    categories.forEach(category => {
        gridHTML += `
            <div class="category-box">
                <h3>${category.catname}</h3>
                <p>ID: ${category.catid}</p>
                <p>Status: ${category.active === 1 ? "✅ Active" : "❌ Inactive"}</p>
                <div class="category-actions">
                    <button class="remove-btn" onclick="confirmDeleteCategory(${category.catid})">➖</button>
                    <button class="edit-btn" onclick="openEditCategoryPopup(${category.catid}, '${category.catname}', ${category.active})">✏️</button>
                </div>
            </div>
        `;
    });

    gridHTML += `</div>`;
    categoriesTabDiv.innerHTML = gridHTML;
});

// Function to confirm and delete category
function confirmDeleteCategory(categoryId) {
    // Create confirmation popup
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.addEventListener("click", closeModal); // Close on overlay click

    const popup = document.createElement("div");
    popup.classList.add("category-edit-popup");
    popup.innerHTML = `
        <div class="category-popup-content">
            <h2 style="margin-bottom: 15px;">Confirm Deletion</h2>
            <p style="margin-bottom: 20px;">Are you sure you want to delete this category?</p>
            <div class="buttons">
                <button id="confirmDeleteBtn" style="margin-right: 15px;">Delete</button>
                <button id="cancelDeleteBtn" style="margin-left: 15px;">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    // Confirm deletion
    document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
        ipcRenderer.send("delete-category", categoryId);
        closeModal(); // Close the popup after confirming
    });

    // Cancel deletion
    document.getElementById("cancelDeleteBtn").addEventListener("click", closeModal);
}

// Open the edit category popup within the same page
function openEditCategoryPopup(catid, catname, active) {
    // Remove existing popup if any
    closeModal();

    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.addEventListener("click", closeModal);

    const popup = document.createElement("div");
    popup.classList.add("category-edit-popup");
    popup.innerHTML = `
        <div class="category-popup-content">
            <h2>Edit Category</h2>
            <input type="text" id="editCategoryName" value="${catname}" placeholder="Category Name"><br><br>
            <div class="toggle-container">
                <span id="toggleStatusLabel">Inactive</span>
                <div id="toggleActive" class="toggle-switch ${active === 1 ? "active" : ""}"></div><br><br>
            </div>
            <div class="buttons">
                <button id="saveChangesBtn" style="margin-right: 20px; margin-top: 5px;">Save Changes</button>
                <button id="cancelEditBtn" style="margin-left: 20px; margin-top: 5px;">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    let isActive = active;

    // Function to update status label
    function updateStatusLabel() {
        const statusLabel = document.getElementById("toggleStatusLabel");
        statusLabel.textContent = isActive === 1 ? "Active" : "Inactive";
        statusLabel.style.color = isActive === 1 ? "green" : "red";
    }

    // Initialize label correctly
    updateStatusLabel();

    // Toggle active/inactive status
    document.getElementById("toggleActive").addEventListener("click", function () {
        isActive = isActive === 1 ? 0 : 1;
        this.classList.toggle("active", isActive === 1);
        updateStatusLabel(); // Ensure label updates when toggled
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

    // Cancel Edit
    document.getElementById("cancelEditBtn").addEventListener("click", closeModal);
}

// Function to close the modal
function closeModal() {
    const popup = document.querySelector(".category-edit-popup");
    const overlay = document.querySelector(".overlay");
    if (popup) document.body.removeChild(popup);
    if (overlay) document.body.removeChild(overlay);
}

// Open the add category popup within the same page
function openAddCategoryPopup() {
    // Remove existing popup if any
    closeModal();

    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.addEventListener("click", closeModal);

    const popup = document.createElement("div");
    popup.classList.add("category-edit-popup"); // Reusing the edit popup styling
    popup.innerHTML = `
        <div class="category-popup-content">
            <h2>Add Category</h2>
            <input type="text" id="newCategoryName" placeholder="Category Name"><br><br>
            <div class="toggle-container">
                <span id="toggleStatusLabel">Active</span>
                <div id="toggleActive" class="toggle-switch active"></div><br><br>
            </div>
            <div class="buttons">
                <button id="addCategoryBtn">Add</button>
                <button id="cancelAddBtn">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    let isActive = 1; // Default to Active

    // Function to update status label
    function updateStatusLabel() {
        const statusLabel = document.getElementById("toggleStatusLabel");
        statusLabel.textContent = isActive === 1 ? "Active" : "Inactive";
        statusLabel.style.color = isActive === 1 ? "green" : "red";
    }

    // Toggle active/inactive status
    document.getElementById("toggleActive").addEventListener("click", function () {
        isActive = isActive === 1 ? 0 : 1;
        this.classList.toggle("active", isActive === 1);
        updateStatusLabel(); 
    });

    // Add Category
    document.getElementById("addCategoryBtn").addEventListener("click", () => {
        const categoryName = document.getElementById("newCategoryName").value.trim();

        if (!categoryName) {
            // Create a custom error popup
            const errorOverlay = document.createElement("div");
            errorOverlay.classList.add("overlay");
            errorOverlay.addEventListener("click", closeErrorPopup);

            const errorPopup = document.createElement("div");
            errorPopup.classList.add("add-category-error-popup");
            errorPopup.innerHTML = `
                <div class="category-popup-content">
                    <h2 style="margin-bottom: 15px;">Error</h2>
                    <p style="margin-bottom: 15px;">Please enter a category name.</p>
                    <div class="buttons">
                        <button id="closeErrorBtn">OK</button>
                    </div>
                </div>
            `;

            document.body.appendChild(errorOverlay);
            document.body.appendChild(errorPopup);

            // Close error popup on button click
            document.getElementById("closeErrorBtn").addEventListener("click", closeErrorPopup);

            return;
        }

        ipcRenderer.send("add-category", { catname: categoryName, active: isActive });
    });

    // Cancel Add
    document.getElementById("cancelAddBtn").addEventListener("click", closeModal);
}

// Update event listener to use the popup
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("addCategoryBox").addEventListener("click", openAddCategoryPopup);
});

// Close popup and refresh categories list when category is added
ipcRenderer.on("category-added", () => {
    fetchCategoriesList();
    closeModal();
});

// Refresh the category list after deletion or update
ipcRenderer.on("category-deleted", () => {
    fetchCategoriesList();
});

ipcRenderer.on("category-updated", () => {
    fetchCategoriesList();
    closeModal();
});

// Function to close the error popup
function closeErrorPopup() {
    const errorPopup = document.querySelector(".add-category-error-popup");
    const errorOverlay = document.querySelector(".overlay");
    if (errorPopup) document.body.removeChild(errorPopup);
    if (errorOverlay) document.body.removeChild(errorOverlay);
}

module.exports = { fetchCategoriesList, confirmDeleteCategory, openAddCategoryPopup, openEditCategoryPopup };
