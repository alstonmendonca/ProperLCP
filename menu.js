function createConfirmPopup(message) {
    return new Promise((resolve) => {
        // Remove existing popup if it exists
        let existingPopup = document.getElementById("custom-confirm-popup");
        if (existingPopup) {
            existingPopup.remove();
        }

        // Create popup container
        const popup = document.createElement("div");
        popup.id = "custom-confirm-popup";
        popup.classList.add("confirm-popup");

        popup.innerHTML = `
            <div class="confirm-popup-content">
                <div class="confirm-icon-container">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </div>
                
                <p class="confirm-message">${message}</p>

                <div class="confirm-buttons-container">
                    <button id="confirmPopup_okButton" class="confirm-btn ok-btn">OK</button>
                    <button id="confirmPopup_cancelButton" class="confirm-btn cancel-btn">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        // Add event listeners for both buttons
        document.getElementById("confirmPopup_okButton").addEventListener("click", () => {
            popup.remove(); // Close the popup
            resolve(true); // Resolve with 'true' (OK clicked)
        });

        document.getElementById("confirmPopup_cancelButton").addEventListener("click", () => {
            popup.remove(); // Close the popup
            resolve(false); // Resolve with 'false' (Cancel clicked)
        });

        // Also allow closing with Escape key
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                popup.remove();
                document.removeEventListener('keydown', handleKeyDown);
                resolve(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    });
}

async function displayMenu() {
    const mainContent = document.getElementById("main-content");
    const billPanel = document.getElementById("bill-panel");

    // Store scroll position before updating content
    const currentScrollPosition = mainContent.scrollTop;
    document.getElementById('top-panel').classList.add('disabled');

    // Show loading message with spinner immediately
    mainContent.innerHTML = `
        <div class="loading-message" id="loading-message">
            <div class="loading-spinner"></div>
            <p>Loading menu...</p>
        </div>
    `;

    billPanel.style.display = "none";

    try {
        // small delay so spinner is visible
        await new Promise(res => setTimeout(res, 200));

        // Fetch items once
        const foodItems = await ipcRenderer.invoke("get-menu-items");

        // Build UI: header, search bar, grid start with Add button ALWAYS
        let menuContent = `
            <div class="menu-section-title">
                <h2>Menu</h2>
            </div>

            <div class="menu-controls-container">
                <input type="text" id="searchBar" class="search-input" placeholder="Search...">
                
                <select id="categoryFilter" class="filter-select">
                    <option value="">All Categories</option>
                </select>
                
                <select id="vegFilter" class="filter-select veg-filter-select">
                    <option value="">All Items</option>
                    <option value="1">🌱 Vegetarian</option>
                    <option value="0">🍖 Non-Vegetarian</option>
                </select>
                
                <button id="bulkEditBtn" class="action-button bulk-edit-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    BULK EDIT
                </button>
                
                <button id="syncToOnlineBtn" class="action-button sync-online-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                    </svg>
                    SYNC TO ONLINE
                </button>
            </div>

            <div class="food-items-grid">
                <button id="addNewItem" class="add-item-button">
                    <svg class="add-icon" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    <br>
                    Add New Item
                </button>
        `;

        if (!Array.isArray(foodItems) || foodItems.length === 0) {
            // Empty state (below add button)
            menuContent += `
                <div class="empty-state">
                    <svg class="empty-state-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <div class="empty-state-title">No items available</div>
                    <div class="empty-state-subtitle">Click <strong>Add New Item</strong> to create the first menu item.</div>
                </div>
            `;
        } else {
            // Render each item
            for (const item of foodItems) {
                const foodItemClass = item.veg == 1 ? 'food-item-card food-item-veg' : 'food-item-card food-item-nonveg';
                
                menuContent += `
                    <div class="${foodItemClass}" data-fid="${item.fid}" data-category="${item.category}" data-veg="${item.veg}">
                        <h3>${item.fname} <br style="line-height:5px; display:block"> 
                            ${item.veg == 1 ? "🌱" : "🍖"}
                        </h3>
                        <p>Category: ${item.category_name}</p>
                        <p>Food ID: ${item.fid}</p>
                        <p>Price: ₹${item.cost}</p>

                        <div class="toggle-container">
                            <div class="toggle-group">
                                <label class="switch">
                                    <input type="checkbox" class="active-toggle-switch" data-fid="${item.fid}" ${item.active ? "checked" : ""}>
                                    <span class="slider round"></span>
                                </label>
                                <p class="status active-status">${item.active ? "ACTIVE ✅" : "INACTIVE ❌"}</p>
                            </div>

                            <div class="toggle-group is-on-container" style="display: ${item.active ? 'flex' : 'none'}">
                                <label class="switch">
                                    <input type="checkbox" class="toggle-switch" data-fid="${item.fid}" ${item.is_on ? "checked" : ""}>
                                    <span class="slider round"></span>
                                </label>
                                <p class="status is-on-status">${item.is_on ? "ON ✅" : "OFF ❌"}</p>
                            </div>
                        </div>

                        <div class="action-buttons-container">
                            <button class="edit-button edit-btn" data-fid="${item.fid}">
                                Edit
                            </button>
                            
                            <button class="delete-button delete-btn" data-fid="${item.fid}">
                                Delete
                            </button>
                        </div>
                    </div>
                `;
            }
        }

        // Close grid
        menuContent += `</div>`;
        mainContent.innerHTML = menuContent;

        // Populate category filter dropdown
        await populateCategoryFilter();

        // Restore previous scroll position
        mainContent.scrollTop = currentScrollPosition;

        // Always attach the Add New Item button handler
        const addBtn = document.querySelector("#addNewItem");
        if (addBtn) addBtn.addEventListener("click", toggleAddItemPopup);

        // Attach search filter (works even when zero items)
        const searchBar = document.querySelector("#searchBar");
        if (searchBar) {
            searchBar.addEventListener("input", (event) => {
                applyFilters();
            });
        }

        // Attach category filter
        const categoryFilter = document.querySelector("#categoryFilter");
        if (categoryFilter) {
            categoryFilter.addEventListener("change", (event) => {
                applyFilters();
            });
        }

        // Attach veg filter
        const vegFilter = document.querySelector("#vegFilter");
        if (vegFilter) {
            vegFilter.addEventListener("change", (event) => {
                applyFilters();
            });
        }

        // Function to apply all filters simultaneously
        function applyFilters() {
            const searchQuery = document.querySelector("#searchBar")?.value.trim().toLowerCase() || "";
            const categoryValue = document.querySelector("#categoryFilter")?.value || "";
            const vegValue = document.querySelector("#vegFilter")?.value || "";

            document.querySelectorAll(".food-item-card").forEach((itemEl) => {
                const foodName = itemEl.querySelector("h3").textContent.trim().toLowerCase();
                const itemCategory = itemEl.getAttribute("data-category");
                const itemVeg = itemEl.getAttribute("data-veg");

                // Check search filter
                const matchesSearch = foodName.includes(searchQuery);
                
                // Check category filter
                const matchesCategory = !categoryValue || itemCategory === categoryValue;
                
                // Check veg filter
                const matchesVeg = !vegValue || itemVeg === vegValue;

                // Show item only if it matches all filters
                itemEl.style.display = (matchesSearch && matchesCategory && matchesVeg) ? "block" : "none";
            });
        }

        document.getElementById('syncToOnlineBtn').addEventListener('click', async () => {
            const syncBtn = document.getElementById('syncToOnlineBtn');
            
            // Create loading overlay
            const loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'sync-loading-overlay';
            loadingOverlay.className = 'sync-loading-overlay';
            
            loadingOverlay.innerHTML = `
                <div class="sync-loading-content">
                    <div class="sync-loading-spinner"></div>
                    <h3 class="sync-loading-title">Syncing to Online Database</h3>
                    <p class="sync-loading-text">Please wait while we sync your menu items...</p>
                </div>
            `;
            
            // Disable the button and show loading state
            syncBtn.disabled = true;
            syncBtn.style.opacity = '0.7';
            syncBtn.style.cursor = 'not-allowed';
            
            // Add the overlay to the page
            document.body.appendChild(loadingOverlay);
            
            try {
                const result = await ipcRenderer.invoke("sync-menu-items-to-mongo");
                
                // Remove loading overlay
                document.body.removeChild(loadingOverlay);
                
                // Re-enable button
                syncBtn.disabled = false;
                syncBtn.style.opacity = '1';
                syncBtn.style.cursor = 'pointer';
                
                if(result.success){
                    createTextPopup("Menu items synced successfully!");
                } else {
                    createTextPopup("Failed to sync to Online Database");
                }
            } catch (error) {
                // Remove loading overlay on error
                document.body.removeChild(loadingOverlay);
                
                // Re-enable button
                syncBtn.disabled = false;
                syncBtn.style.opacity = '1';
                syncBtn.style.cursor = 'pointer';
                
                createTextPopup("Failed to sync to Online Database");
                console.error("Sync error:", error);
            }
        });
        // If items exist, attach interactive listeners
        if (Array.isArray(foodItems) && foodItems.length > 0) {
            // IS_ON toggles
            document.querySelectorAll(".toggle-switch").forEach((switchEl) => {
                switchEl.addEventListener("change", async (event) => {
                    const fid = event.target.getAttribute("data-fid");
                    await ipcRenderer.invoke("toggle-menu-item", parseInt(fid));

                    const foodItemElement = document.querySelector(`.food-item[data-fid="${fid}"]`);
                    if (!foodItemElement) return;
                    const statusElement = foodItemElement.querySelector(".is-on-status");
                    const isChecked = event.target.checked;
                    if (statusElement) statusElement.textContent = isChecked ? "ON ✅" : "OFF ❌";
                });
            });

            // ACTIVE toggles
            document.querySelectorAll(".active-toggle-switch").forEach((switchEl) => {
                switchEl.addEventListener("change", async (event) => {
                    const fid = event.target.getAttribute("data-fid");
                    await ipcRenderer.invoke("toggle-menu-item-active", parseInt(fid));

                    const foodItemElement = document.querySelector(`.food-item[data-fid="${fid}"]`);
                    if (!foodItemElement) return;
                    const statusElement = foodItemElement.querySelector(".active-status");
                    const isOnContainer = foodItemElement.querySelector(".is-on-container");
                    const isChecked = event.target.checked;

                    if (statusElement) statusElement.textContent = isChecked ? "ACTIVE ✅" : "INACTIVE ❌";
                    if (isOnContainer) isOnContainer.style.display = isChecked ? "flex" : "none";
                });
            });
            // Delete buttons
            document.querySelectorAll(".delete-btn").forEach((button) => {
                button.addEventListener("click", async (event) => {
                    const fid = event.target.getAttribute("data-fid");
                    const confirmDelete = await createConfirmPopup("Are you sure you want to delete this item?");
                    if (confirmDelete) {
                        await ipcRenderer.invoke("delete-menu-item", parseInt(fid));
                        const removed = document.querySelector(`.food-item[data-fid="${fid}"]`);
                        if (removed) removed.remove();

                        // if now no items, refresh the menu to show empty state (keeps Add button visible)
                        if (document.querySelectorAll(".food-item").length === 0) {
                            displayMenu();
                        }
                    }
                });
            });

            document.querySelectorAll(".edit-btn").forEach((button) => {
                button.addEventListener("click", async (event) => {
                    const fid = event.target.getAttribute("data-fid");
                    const existingPopup = document.querySelector(".menu-edit-popup-overlay");

                    // If popup already exists, remove it (toggle behavior)
                    if (existingPopup) {
                        document.body.removeChild(existingPopup);
                        return;
                    }

                    const item = foodItems.find((item) => item.fid == fid);
                    if (!item) {
                        createTextPopup("Food item not found!");
                        return;
                    }

                    // Create the popup overlay and content
                    const popupOverlay = document.createElement("div");
                    popupOverlay.classList.add("menu-edit-popup-overlay");

                    const popupContent = document.createElement("div");
                    popupContent.classList.add("menu-edit-popup");
                    popupContent.innerHTML = `
                        <div class="menu-popup-content">
                            <h3 class="menu-popup-title">
                                Edit Food Item
                            </h3>
                            
                            <form class="menu-popup-form">
                                <div class="form-group">
                                    <label for="editFname" class="form-label">Food Name</label>
                                    <input type="text" id="editFname" value="${item.fname}" class="edit-popup-input">
                                </div>

                                <div class="form-group">
                                    <label for="category" class="form-label">Category</label>
                                    <select id="category" required class="edit-popup-select">
                                        <option value="${item.category}">${item.category_name}</option>
                                    </select>
                                </div>

                                <div class="price-grid">
                                    <div class="form-group">
                                        <label for="editCost" class="form-label">Cost (₹)</label>
                                        <input type="number" id="editCost" value="${item.cost}" step="0.01" class="edit-popup-input">
                                    </div>
                                    <div class="form-group">
                                        <label for="editsgst" class="form-label">SGST (%)</label>
                                        <input type="number" id="editsgst" value="${item.sgst}" step="0.01" min="0" class="edit-popup-input">
                                    </div>
                                    <div class="form-group">
                                        <label for="editcgst" class="form-label">CGST (%)</label>
                                        <input type="number" id="editcgst" value="${item.cgst}" step="0.01" min="0" class="edit-popup-input">
                                    </div>
                                </div>

                                <div class="veg-toggle-container">
                                    <div class="form-group veg-toggle-group">
                                        <label for="editveg" class="veg-toggle-label">Vegetarian</label>
                                        <label class="edit-popup-switch">
                                            <input type="checkbox" id="editveg" ${item.veg == 1 ? "checked" : ""}>
                                            <span class="edit-popup-slider"></span>
                                        </label>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Inventory Dependencies</label>
                                    <div id="dependant-items-container" class="inventory-container">
                                        Loading...
                                    </div>
                                </div>

                                <div class="popup-buttons-container">
                                    <button type="button" id="saveChanges" class="edit-popup-btn save-changes-btn">Save Changes</button>
                                    <button type="button" id="closePopup" class="edit-popup-btn cancel-btn">Cancel</button>
                                </div>
                            </form>
                        </div>
                    `;

                    popupOverlay.appendChild(popupContent);
                    document.body.appendChild(popupOverlay);

                    // Close when clicking outside the content
                    popupOverlay.addEventListener("click", (e) => {
                        if (e.target === popupOverlay) {
                            document.body.removeChild(popupOverlay);
                        }
                    });

                    // Load categories for dropdown
                    async function loadCategoriesForEdit() {
                        try {
                            const categories = await ipcRenderer.invoke("get-categories-for-additem");
                            const categorySelect = document.getElementById("category");

                            // Clear existing options
                            categorySelect.innerHTML = '';

                            categories.forEach(cat => {
                                let option = document.createElement("option");
                                option.value = cat.catid;
                                option.textContent = cat.catname;

                                // Preselect the existing category
                                if (cat.catid === item.category) {
                                    option.selected = true;
                                }

                                categorySelect.appendChild(option);
                            });
                        } catch (error) {
                            console.error("Failed to load categories:", error);
                        }
                    }

                    async function loadInventoryItemsForEdit() {
                        try {
                            const inventoryItems = await ipcRenderer.invoke("get-all-inventory-items");
                            const container = document.getElementById("dependant-items-container");

                            container.innerHTML = ''; // clear previous content

                            // Create document fragment for batch DOM insertion
                            const fragment = new DocumentFragment();

                            inventoryItems.forEach(inv => {
                                const checkbox = document.createElement("input");
                                checkbox.type = "checkbox";
                                checkbox.value = inv.inv_no;
                                checkbox.id = `edit_inv_${inv.inv_no}`;
                                checkbox.name = "dependant_inv";
                                checkbox.className = "inventory-checkbox";

                                // Pre-check if this item is in depend_inv
                                const dependArray = (item.depend_inv || "").split(",").map(i => i.trim()).filter(i => i);
                                if (dependArray.includes(inv.inv_no.toString())) {
                                    checkbox.checked = true;
                                }

                                const label = document.createElement("label");
                                label.htmlFor = `edit_inv_${inv.inv_no}`;
                                label.textContent = inv.inv_item;
                                label.className = "inventory-label";

                                const wrapper = document.createElement("div");
                                wrapper.className = "edit-checkbox-item";
                                wrapper.appendChild(checkbox);
                                wrapper.appendChild(label);

                                fragment.appendChild(wrapper);
                            });

                            container.appendChild(fragment);

                            // Add empty state message if needed
                            if (inventoryItems.length === 0) {
                                container.innerHTML = `<div class="empty-inventory-message">No inventory items available</div>`;
                            }

                        } catch (error) {
                            console.error("Failed to load inventory items:", error);
                            const container = document.getElementById("dependant-items-container");
                            container.innerHTML = `<div class="inventory-error-message">Failed to load inventory items</div>`;
                        }
                    }                                                   

                    loadCategoriesForEdit();
                    loadInventoryItemsForEdit();

                    // Close popup when clicking "Cancel"
                    document.getElementById("closePopup").addEventListener("click", () => {
                        document.body.removeChild(popupOverlay);
                    });

                    // Save changes
                    document.getElementById("saveChanges").addEventListener("click", async () => {
                        const currentScrollPosition = mainContent.scrollTop;

                        const updatedFname = document.getElementById("editFname").value.trim();
                        const updatedCost = parseFloat(document.getElementById("editCost").value);
                        const updatedCategory = parseFloat(document.getElementById("category").value);
                        const updatedsgst = parseFloat(document.getElementById("editsgst").value);
                        const updatedcgst = parseFloat(document.getElementById("editcgst").value);
                        const updatedveg = document.getElementById("editveg").checked ? 1 : 0;
                        const selectedInvCheckboxes = document.querySelectorAll("input[name='dependant_inv']:checked");
                        const depend_inv = Array.from(selectedInvCheckboxes).map(cb => cb.value).join(",") || null;

                        // Validate inputs
                        if (!updatedFname || isNaN(updatedCost) || updatedCost <= 0) {
                            createTextPopup("Please enter valid details");
                            return;
                        }

                        // Send IPC message to update the database
                        const response = await ipcRenderer.invoke("update-food-item", {
                            fid,
                            fname: updatedFname,
                            cost: updatedCost,
                            category: updatedCategory,
                            sgst: updatedsgst,
                            cgst: updatedcgst,
                            veg: updatedveg,
                            depend_inv
                        });

                        if (response.success) {
                            // Remove the popup
                            document.body.removeChild(popupOverlay);

                            displayMenu();

                            // Restore the scroll position
                            mainContent.scrollTop = currentScrollPosition;
                        } else {
                            createTextPopup("Failed to update item");
                        }
                    });
                });
            });
        }

        document.getElementById('top-panel').classList.remove('disabled');
    } catch (error) {
        mainContent.innerHTML = `<p style="color: #ef4444; padding: 20px;">Error loading menu items: ${error.message}</p>`;
        console.error("Error fetching menu:", error);
        document.getElementById('top-panel').classList.remove('disabled');
    }
}


// Listening for the 'refresh-menu' event to trigger menu reload
ipcRenderer.on("refresh-menu", async () => {
    await displayMenu();
});

// Function to populate category filter dropdown
async function populateCategoryFilter() {
    try {
        const categories = await ipcRenderer.invoke("get-categories-for-additem");
        const categorySelect = document.getElementById("categoryFilter");
        
        if (categorySelect) {
            // Clear existing options except "All Categories"
            categorySelect.innerHTML = '<option value="">All Categories</option>';
            
            // Add each category as an option
            categories.forEach(cat => {
                const option = document.createElement("option");
                option.value = cat.catid;
                option.textContent = cat.catname;
                categorySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Failed to load categories for filter:", error);
    }
}
function toggleAddItemPopup() {
    let existingPopup = document.getElementById("add-item-popup-overlay");
    if (existingPopup) {
        existingPopup.remove();
        return;
    }
    // Function to load categories dynamically
    async function loadCategories() {
        try {
            const categories = await ipcRenderer.invoke("get-categories-for-additem");
            const categorySelect = document.getElementById("category");
            categorySelect.innerHTML = '<option value="">Select a category</option>'; // Clear old
            categories.forEach(cat => {
                let option = document.createElement("option");
                option.value = cat.catid;
                option.textContent = cat.catname;
                categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error("Failed to load categories:", error);
        }
    }
        // Function to load inventory items dynamically
    async function loadInventoryItems() {
        try {
            const inventory = await ipcRenderer.invoke("get-all-inventory-items");
            const container = document.getElementById("inventory-checklist");
            
            // Clear existing items while preserving the container
            container.replaceChildren();
            
            // Create document fragment for batch DOM insertion
            const fragment = new DocumentFragment();
            
            inventory.forEach(inv => {
                const itemId = `inv_${inv.inv_no}`;
                
                // Create checkbox container
                const itemContainer = document.createElement("div");
                itemContainer.className = "checkbox-item";
                itemContainer.innerHTML = `
                    <input type="checkbox" 
                        id="${itemId}" 
                        value="${inv.inv_no}" 
                        class="inventory-checkbox">
                    <label for="${itemId}" 
                        class="inventory-label">
                        ${inv.inv_item}
                    </label>
                `;
                
                fragment.appendChild(itemContainer);
            });
            
            container.appendChild(fragment);
            
            // Add empty state message if needed
            if (inventory.length === 0) {
                container.innerHTML = `<div class="empty-inventory-message">No inventory items available</div>`;
            }
        } catch (err) {
            console.error("Failed to load inventory items:", err);
            // Show error in UI
            document.getElementById("inventory-checklist").innerHTML = `
                <div class="inventory-error-message">
                    Failed to load inventory items
                </div>`;
        }
    }

    // Create overlay container
    const popupOverlay = document.createElement("div");
    popupOverlay.id = "add-item-popup-overlay";
    popupOverlay.classList.add("add-item-popup-overlay");

    // Create popup content
    const popup = document.createElement("div");
    popup.id = "add-item-popup";
    popup.classList.add("add-item-popup");

    popup.innerHTML = `
        <div class="menu-popup-content">
            <h3 class="add-item-popup-title">
                Add New Food Item
            </h3>
            
            <form id="addItemForm" class="add-item-form">
                <div class="form-group">
                    <label for="fname" class="form-label">Food Name</label>
                    <input type="text" id="fname" required class="popup-input">
                </div>

                <div class="form-group">
                    <label for="category" class="form-label">Category</label>
                    <select id="category" required class="popup-select">
                        <option value="">Select a category</option>
                    </select>
                </div>

                <div class="add-item-price-grid">
                    <div class="form-group">
                        <label for="cost" class="form-label">Cost (₹)</label>
                        <input type="number" id="cost" step="0.01" required class="popup-input">
                    </div>
                    <div class="form-group">
                        <label for="sgst" class="form-label">SGST (%)</label>
                        <input type="number" id="sgst" step="0.01" value="0" class="popup-input">
                    </div>
                    <div class="form-group">
                        <label for="cgst" class="form-label">CGST (%)</label>
                        <input type="number" id="cgst" step="0.01" value="0" class="popup-input">
                    </div>
                </div>

                <div class="toggles-container">
                    <div class="form-group toggle-group">
                        <label for="veg" class="toggle-label">Veg</label>
                        <label class="popup-switch">
                            <input type="checkbox" id="veg" checked>
                            <span class="popup-slider"></span>
                        </label>
                    </div>
                    <div class="form-group toggle-group">
                        <label for="active" class="toggle-label">Active</label>
                        <label class="popup-switch">
                            <input type="checkbox" id="active" checked>
                            <span class="popup-slider"></span>
                        </label>
                    </div>
                    <div class="form-group toggle-group">
                        <label for="is_on" class="toggle-label">Available</label>
                        <label class="popup-switch">
                            <input type="checkbox" id="is_on" checked>
                            <span class="popup-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Inventory Dependencies</label>
                    <div id="inventory-checklist" class="inventory-checklist">
                    </div>
                </div>

                <div class="add-item-buttons-container">
                    <button type="submit" id="addItemBtn" class="popup-btn add-item-btn">Add Item</button>
                    <button type="button" id="closeAddItemPopup" class="popup-btn cancel-add-btn">Cancel</button>
                </div>
            </form>
        </div>
    `;

    // Append to overlay
    popupOverlay.appendChild(popup);
    document.body.appendChild(popupOverlay);
    // Focus on the food name input
    document.getElementById("fname").focus();
    // Close popup on cancel
    document.getElementById("closeAddItemPopup").addEventListener("click", () => {
        const overlay = document.getElementById("add-item-popup-overlay");
        if (overlay) {
            overlay.remove();
        } else {
            // Fallback: Remove any existing popups
            const existing = document.querySelector(".menu-edit-popup-overlay");
            if (existing) existing.remove();
        }
    });
    // Add click handler for overlay
    popupOverlay.addEventListener("click", (e) => {
        if (e.target === popupOverlay) {
            const overlay = document.getElementById("add-item-popup-overlay");
            if (overlay) overlay.remove();
        }
    });
    // Load categories dynamically
    loadCategories();
    loadInventoryItems(); // Load inventory checkboxes

    // Handle form submission
    document.getElementById("addItemForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        const newItem = {
            fname: document.getElementById("fname").value,
            category: document.getElementById("category").value,
            cost: parseFloat(document.getElementById("cost").value),
            sgst: parseFloat(document.getElementById("sgst").value),
            cgst: parseFloat(document.getElementById("cgst").value),
            tax: parseFloat(document.getElementById("sgst").value) + parseFloat(document.getElementById("cgst").value),
            active: document.getElementById("active").checked ? 1 : 0,
            is_on: document.getElementById("is_on").checked ? 1 : 0,
            veg: document.getElementById("veg").checked ? 1 : 0,
            depend_inv: Array.from(document.querySelectorAll('#inventory-checklist input[type="checkbox"]:checked'))
                  .map(cb => cb.value)
                  .join(",")
        };


        try {
            await ipcRenderer.invoke("add-food-item", newItem);
            createTextPopup("Item added successfully!");
            ipcRenderer.send("refresh-menu");
            popupOverlay.remove();
            displayMenu();
        } catch (error) {
            console.error("Error adding item:", error);
            createTextPopup("Failed to add item");
        }
    });


}

// Function to load categories dynamically
async function loadCategories() {
    try {
        const categories = await ipcRenderer.invoke("get-categories-for-additem");
        const categorySelect = document.getElementById("category");
        categorySelect.innerHTML = '<option value="">Select a category</option>'; // Clear old
        categories.forEach(cat => {
            let option = document.createElement("option");
            option.value = cat.catid;
            option.textContent = cat.catname;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Failed to load categories:", error);
    }
}

function createTextPopup(message) {
    // Remove existing popup if it exists
    let existingPopup = document.getElementById("custom-popup");
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create popup container
    const popup = document.createElement("div");
    popup.id = "custom-popup";
    popup.classList.add("menu-edit-popup");

    popup.innerHTML = `
        <div class="menu-popup-content" style="align-items: center; justify-content: center; width: 300px; pointer-events: auto;">
            <p>${message}</p>

            <br>

            <div class="menu-popup-buttons">
                <button id="closePopuptext" style="width: 90px; height: 40px;">OK</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Add event listener for closing popup
    document.getElementById("closePopuptext").addEventListener("click", () => {
        popup.remove();
    });
}

