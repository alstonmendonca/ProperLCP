const { ipcRenderer } = require("electron");
const { createTextPopup } = require("./textPopup");

// Main function to load categories content
function loadCategories(mainContent, billPanel) {
    mainContent.style.marginLeft = "0px";
    mainContent.style.marginRight = "0px";
    
    mainContent.innerHTML = `
        <div class='section-title'>
            <h2>Categories</h2>
        </div>
        <div class="search-container">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="categorySearch" placeholder="Search categories...">
        </div>
        <div id="categoriesTabDiv"></div>
    `;
    document.getElementById("categorySearch").addEventListener("input", filterCategories);
    billPanel.style.display = 'none';
    fetchCategoriesList();
}

function filterCategories() {
    const searchTerm = document.getElementById("categorySearch").value.toLowerCase();
    const categoryBoxes = document.querySelectorAll(".category-box:not(#addCategoryBox)");
    
    categoryBoxes.forEach(box => {
        const categoryName = box.querySelector("h3").textContent.toLowerCase();
        if (categoryName.includes(searchTerm)) {
            box.style.display = "flex";
        } else {
            box.style.display = "none";
        }
    });
}

function fetchCategoriesList() {
    ipcRenderer.send("get-categories-list");
}

ipcRenderer.on("categories-list-response", (event, data) => {
    const categories = data.categories;
    const categoriesTabDiv = document.getElementById("categoriesTabDiv");
    categoriesTabDiv.innerHTML = ""; // clear old content

    // Start the categories grid with the Add Category box
    let gridHTML = `
        <div class="categories-grid">
            <div class="category-box" id="addCategoryBox" onclick="openAddCategoryPopup()">
                <svg class="add-icon" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                <p>Add New Category</p>
            </div>
    `;

    if (categories.length === 0) {
        // Show empty state below Add Category button
        gridHTML += `
            <div class="empty-state" style="margin-top: 20px; text-align: center; width: 100%;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <p>No categories found</p>
            </div>
        `;
    } else {
        // Add each category box
        categories.forEach(category => {
            gridHTML += `
                <div class="category-box">
                    <h3>${category.catname}</h3>
                    <div class="category-meta">
                        <div class="category-id">ID: ${category.catid}</div>
                        <span class="status-badge ${category.active === 1 ? 'active' : 'inactive'}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                ${category.active === 1 ? 
                                    '<circle cx="12" cy="12" r="10"></circle>' : 
                                    '<path d="M10 10l4 4m0-4l-4 4"></path>'
                                }
                            </svg>
                            ${category.active === 1 ? "Active" : "Inactive"}
                        </span>
                    </div>
                    <div class="category-actions">
                        <button class="remove-btn" onclick="confirmDeleteCategory(${category.catid})">Delete</button>
                        <button class="edit-btn" onclick="openEditCategoryPopup(${category.catid}, '${category.catname}', ${category.active})">Edit</button>
                    </div>
                </div>
            `;
        });
    }

    gridHTML += `</div>`; // close categories-grid
    categoriesTabDiv.innerHTML = gridHTML;
});


function confirmDeleteCategory(categoryId) {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.addEventListener("click", closeModal);

    const popup = document.createElement("div");
    popup.classList.add("category-edit-popup");
    popup.innerHTML = `
        <div class="category-popup-content">
            <svg class="warning-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff9800" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <h2 style="margin-bottom: 15px;">Confirm Deletion</h2>
            <p style="margin-bottom: 20px;">Are you sure you want to delete this category?</p>
            <div class="popup-buttons">
                <button id="cancelDeleteBtn" class="secondary-btn">
                    Cancel
                </button>
                <button id="confirmDeleteBtn" class="danger-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
        ipcRenderer.send("delete-category", categoryId);
        closeModal();
    });

    document.getElementById("cancelDeleteBtn").addEventListener("click", closeModal);
}

function openEditCategoryPopup(catid, catname, active) {
    closeModal();

    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.addEventListener("click", closeModal);

    const popup = document.createElement("div");
    popup.classList.add("category-edit-popup");
    popup.innerHTML = `
        <div class="category-popup-content">
            <h2>Edit Category</h2>
            <input type="text" id="editCategoryName" value="${catname}" placeholder="Category Name">
            <div class="toggle-container">
                <span id="toggleStatusLabel">${active === 1 ? "Active" : "Inactive"}</span>
                <div id="toggleActive" class="toggle-switch ${active === 1 ? "active" : ""}"></div>
            </div>
            <div class="popup-buttons">
                <button id="cancelEditBtn" class="secondary-btn">
                    Cancel
                </button>
                <button id="saveChangesBtn" class="primary-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    </svg>
                    Save Changes
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    let isActive = active;

    function updateStatusLabel() {
        const statusLabel = document.getElementById("toggleStatusLabel");
        statusLabel.textContent = isActive === 1 ? "Active" : "Inactive";
        statusLabel.style.color = isActive === 1 ? "#2e7d32" : "#c62828";
    }

    updateStatusLabel();

    document.getElementById("toggleActive").addEventListener("click", function () {
        isActive = isActive === 1 ? 0 : 1;
        this.classList.toggle("active", isActive === 1);
        updateStatusLabel();
    });

    document.getElementById("saveChangesBtn").addEventListener("click", () => {
        const updatedName = document.getElementById("editCategoryName").value.trim();

        if (!updatedName) {
            createTextPopup("Please enter a category name.");
            return;
        }

        ipcRenderer.send("update-category", { catid, catname: updatedName, active: isActive });
    });

    document.getElementById("cancelEditBtn").addEventListener("click", closeModal);
}

function closeModal() {
    const popup = document.querySelector(".category-edit-popup");
    const overlay = document.querySelector(".overlay");
    if (popup) document.body.removeChild(popup);
    if (overlay) document.body.removeChild(overlay);
}

function openAddCategoryPopup() {
    closeModal();

    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.addEventListener("click", closeModal);

    const popup = document.createElement("div");
    popup.classList.add("category-edit-popup");
    popup.innerHTML = `
        <div class="category-popup-content">
            <h2>Add Category</h2>
            <input type="text" id="newCategoryName" placeholder="Category Name">
            <div class="toggle-container">
                <span id="toggleStatusLabel">Active</span>
                <div id="toggleActive" class="toggle-switch active"></div>
            </div>
            <div class="popup-buttons">
                <button id="cancelAddBtn" class="secondary-btn">
                    Cancel
                </button>
                <button id="addCategoryBtn" class="primary-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14"></path>
                        <path d="M5 12h14"></path>
                    </svg>
                    Add Category
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    let isActive = 1;

    function updateStatusLabel() {
        const statusLabel = document.getElementById("toggleStatusLabel");
        statusLabel.textContent = isActive === 1 ? "Active" : "Inactive";
        statusLabel.style.color = isActive === 1 ? "#2e7d32" : "#c62828";
    }

    document.getElementById("toggleActive").addEventListener("click", function () {
        isActive = isActive === 1 ? 0 : 1;
        this.classList.toggle("active", isActive === 1);
        updateStatusLabel(); 
    });

    document.getElementById("addCategoryBtn").addEventListener("click", () => {
        const categoryName = document.getElementById("newCategoryName").value.trim();

        if (!categoryName) {
            const errorOverlay = document.createElement("div");
            errorOverlay.classList.add("overlay");
            errorOverlay.addEventListener("click", closeErrorPopup);

            const errorPopup = document.createElement("div");
            errorPopup.classList.add("add-category-error-popup");
            errorPopup.innerHTML = `
                <div class="category-popup-content">
                    <svg class="warning-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff9800" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <h2 style="margin-bottom: 15px;">Error</h2>
                    <p style="margin-bottom: 15px;">Please enter a category name.</p>
                    <div class="popup-buttons">
                        <button id="closeErrorBtn" class="primary-btn">
                            OK
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(errorOverlay);
            document.body.appendChild(errorPopup);

            document.getElementById("closeErrorBtn").addEventListener("click", closeErrorPopup);
            return;
        }

        ipcRenderer.send("add-category", { catname: categoryName, active: isActive });
    });

    document.getElementById("cancelAddBtn").addEventListener("click", closeModal);
}

ipcRenderer.on("category-added", () => {
    fetchCategoriesList();
    closeModal();
});

ipcRenderer.on("category-deleted", () => {
    fetchCategoriesList();
});

ipcRenderer.on("category-updated", () => {
    fetchCategoriesList();
    closeModal();
});

function closeErrorPopup() {
    const errorPopup = document.querySelector(".add-category-error-popup");
    const errorOverlay = document.querySelector(".overlay");
    if (errorPopup) document.body.removeChild(errorPopup);
    if (errorOverlay) document.body.removeChild(errorOverlay);
}

module.exports = { 
    loadCategories,
    fetchCategoriesList, 
    confirmDeleteCategory, 
    openAddCategoryPopup, 
    openEditCategoryPopup 
};