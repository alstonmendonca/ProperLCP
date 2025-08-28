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

        popup.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;

        popup.innerHTML = `
            <div style="
                background: #ffffff;
                padding: 32px;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(13, 59, 102, 0.15);
                width: 420px;
                max-width: 90%;
                text-align: center;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                border: 1px solid #e2e8f0;
                position: relative;
                animation: popupSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            ">
                <style>
                    @keyframes popupSlideIn {
                        from {
                            opacity: 0;
                            transform: scale(0.8) translateY(-20px);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                        }
                    }
                    
                    .confirm-btn:hover {
                        transform: translateY(-2px);
                    }
                    
                    .confirm-btn:active {
                        transform: translateY(0);
                    }
                    
                    .ok-btn:hover {
                        box-shadow: 0 8px 24px rgba(13, 59, 102, 0.3);
                    }
                    
                    .cancel-btn:hover {
                        box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
                    }
                </style>
                
                <div style="
                    width: 64px;
                    height: 64px;
                    background: linear-gradient(135deg, #ff9800, #f57c00);
                    border-radius: 50%;
                    margin: 0 auto 24px auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 24px rgba(255, 152, 0, 0.2);
                ">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </div>
                
                <p style="
                    font-size: 18px;
                    line-height: 1.5;
                    margin-bottom: 32px;
                    color: #1e293b;
                    font-weight: 500;
                    letter-spacing: -0.01em;
                ">${message}</p>

                <div style="
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                    flex-wrap: wrap;
                ">
                    <button id="confirmPopup_okButton" class="confirm-btn ok-btn" style="
                        background: linear-gradient(135deg, #0D3B66, #1a5490);
                        color: white;
                        border: none;
                        border-radius: 12px;
                        padding: 14px 28px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                        box-shadow: 0 4px 16px rgba(13, 59, 102, 0.2);
                        font-family: inherit;
                        letter-spacing: 0.02em;
                        min-width: 120px;
                    ">OK</button>

                    <button id="confirmPopup_cancelButton" class="confirm-btn cancel-btn" style="
                        background: linear-gradient(135deg, #ef4444, #dc2626);
                        color: white;
                        border: none;
                        border-radius: 12px;
                        padding: 14px 28px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
                        font-family: inherit;
                        letter-spacing: 0.02em;
                        min-width: 120px;
                    ">Cancel</button>
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
    <div class="loading-message" id="loading-message" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        font-size: 18px;
        color: #555;
    ">
        <div class="spinner" style="
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 0.4s linear infinite;
            margin-bottom: 15px;
        "></div>
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
            <div class="menu-section-title" style="display: flex; justify-content: center; align-items: center; margin-bottom: 20px; position: relative;">
                <h2 style="margin: 0;">Menu</h2>
                <button id="syncToOnlineBtn" style="
                    padding: 10px 20px;
                    background: #0D3B66;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    position: absolute;
                    right: 0;
                " onmouseover="this.style.backgroundColor='#11487b'" 
                   onmouseout="this.style.backgroundColor='#0D3B66'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                    </svg>
                    SYNC TO ONLINE
                </button>
            </div>

            <div style="display: flex; gap: 12px; margin-bottom: 20px; align-items: center;">
                <input type="text" id="searchBar" placeholder="Search..." style="
                    padding: 10px 16px; 
                    border: 2px solid #cbd5e1; 
                    border-radius: 8px; 
                    flex: 1; 
                    font-size: 14px;
                    background: #f8fafc;
                    transition: border-color 0.2s ease;
                    box-sizing: border-box;
                " onfocus="this.style.borderColor='#0D3B66'; this.style.boxShadow='0 0 0 3px rgba(13, 59, 102, 0.1)'" 
                   onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='none'">
                
                <select id="categoryFilter" style="
                    padding: 10px 16px;
                    border: 2px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 14px;
                    background: #f8fafc;
                    min-width: 150px;
                    cursor: pointer;
                    transition: border-color 0.2s ease;
                " onfocus="this.style.borderColor='#0D3B66'; this.style.boxShadow='0 0 0 3px rgba(13, 59, 102, 0.1)'" 
                   onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='none'">
                    <option value="">All Categories</option>
                </select>
                
                <select id="vegFilter" style="
                    padding: 10px 16px;
                    border: 2px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 14px;
                    background: #f8fafc;
                    min-width: 120px;
                    cursor: pointer;
                    transition: border-color 0.2s ease;
                " onfocus="this.style.borderColor='#0D3B66'; this.style.boxShadow='0 0 0 3px rgba(13, 59, 102, 0.1)'" 
                   onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='none'">
                    <option value="">All Items</option>
                    <option value="1">🌱 Vegetarian</option>
                    <option value="0">🍖 Non-Vegetarian</option>
                </select>
            </div>

            <div class="food-items" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
                <button id="addNewItem" style="padding: 20px; text-align: center; background-color: #ffffff; border: 2px dashed #0D3B66; border-radius: 12px; color: #0D3B66; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.2s ease;" 
                        onmouseover="this.style.backgroundColor='#f8fafc'; this.style.borderColor='#11487b'" 
                        onmouseout="this.style.backgroundColor='#ffffff'; this.style.borderColor='#0D3B66'">
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
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #64748b;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:12px;">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <div style="font-size: 18px; margin-bottom: 6px;">No items available</div>
                    <div style="color:#94a3b8;">Click <strong>Add New Item</strong> to create the first menu item.</div>
                </div>
            `;
        } else {
            // Render each item
            for (const item of foodItems) {
                menuContent += `
                    <div class="food-item" style="border: 2px solid ${item.veg == 1 ? 'green' : 'red'}; padding: 10px; text-align: center; border-radius: 10px; background: ${item.veg == 1 ? '#EFFBF0' : '#FFEBEB'};" data-fid="${item.fid}" data-category="${item.category}" data-veg="${item.veg}">
                        <h3>${item.fname} <br style="line-height:5px; display:block"> 
                            ${item.veg == 1 ? "🌱" : "🍖"}
                        </h3>
                        <p>Category: ${item.category_name}</p>
                        <p>Food ID: ${item.fid}</p>
                        <p>Price: ₹${item.cost}</p>

                        <div class="toggle-container" style="display: flex; justify-content: center; gap: 18px; align-items: center;">
                            <div class="toggle-group" style="display: flex; flex-direction: column; align-items: center; font-size: 12px;">
                                <label class="switch" style="transform: scale(0.85);">
                                    <input type="checkbox" class="active-toggle-switch" data-fid="${item.fid}" ${item.active ? "checked" : ""}>
                                    <span class="slider round"></span>
                                </label>
                                <p class="status active-status">${item.active ? "ACTIVE ✅" : "INACTIVE ❌"}</p>
                            </div>

                            <div class="toggle-group is-on-container" style="display: ${item.active ? 'flex' : 'none'}; flex-direction: column; align-items: center; font-size: 12px;">
                                <label class="switch" style="transform: scale(0.85);">
                                    <input type="checkbox" class="toggle-switch" data-fid="${item.fid}" ${item.is_on ? "checked" : ""}>
                                    <span class="slider round"></span>
                                </label>
                                <p class="status is-on-status">${item.is_on ? "ON ✅" : "OFF ❌"}</p>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: row; gap: 8px; margin-top: 15px;">
                            <button class="edit-btn" data-fid="${item.fid}" style="
                                background: linear-gradient(135deg, #0D3B66, #1a5490);
                                color: white;
                                border: none;
                                border-radius: 8px;
                                padding: 12px;
                                cursor: pointer;
                                font-weight: 600;
                                font-size: 14px;
                                transition: all 0.2s ease;
                                box-shadow: 0 2px 8px rgba(13, 59, 102, 0.2);
                                width: 100%;
                            " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(13, 59, 102, 0.3)'" 
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(13, 59, 102, 0.2)'">
                                Edit
                            </button>
                            
                            <button class="delete-btn" data-fid="${item.fid}" style="
                                background: linear-gradient(135deg, #ef4444, #dc2626);
                                color: white;
                                border: none;
                                border-radius: 8px;
                                padding: 12px;
                                cursor: pointer;
                                font-weight: 600;
                                font-size: 14px;
                                transition: all 0.2s ease;
                                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
                                width: 100%;
                            " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(239, 68, 68, 0.3)'" 
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(239, 68, 68, 0.2)'">
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

            document.querySelectorAll(".food-item").forEach((itemEl) => {
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
            loadingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            `;
            
            loadingOverlay.innerHTML = `
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 16px;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.2);
                    text-align: center;
                    min-width: 200px;
                ">
                    <div style="
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #0D3B66;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px auto;
                    "></div>
                    <h3 style="
                        margin: 0 0 10px 0;
                        color: #1e293b;
                        font-size: 18px;
                        font-weight: 600;
                    ">Syncing to Online Database</h3>
                    <p style="
                        margin: 0;
                        color: #64748b;
                        font-size: 14px;
                    ">Please wait while we sync your menu items...</p>
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
                        <div class="menu-popup-content" style="
                            pointer-events: auto;
                            max-width: 500px;
                            width: 100%;
                            background: #ffffff;
                            padding: 30px;
                            border-radius: 16px;
                            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                        ">
                            <style>
                                .edit-popup-input:focus, .edit-popup-select:focus {
                                    border-color: #0D3B66;
                                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
                                    outline: none;
                                }
                                .edit-popup-switch {
                                    position: relative;
                                    display: inline-block;
                                    width: 44px;
                                    height: 24px;
                                }
                                .edit-popup-switch input { 
                                    opacity: 0;
                                    width: 0;
                                    height: 0;
                                }
                                .edit-popup-slider {
                                    position: absolute;
                                    cursor: pointer;
                                    top: 0;
                                    left: 0;
                                    right: 0;
                                    bottom: 0;
                                    background-color: #e2e8f0;
                                    transition: .3s;
                                    border-radius: 24px;
                                }
                                .edit-popup-slider:before {
                                    position: absolute;
                                    content: "";
                                    height: 18px;
                                    width: 18px;
                                    left: 3px;
                                    bottom: 3px;
                                    background-color: white;
                                    transition: .3s;
                                    border-radius: 50%;
                                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                                }
                                input:checked + .edit-popup-slider {
                                    background-color: #0D3B66;
                                }
                                input:checked + .edit-popup-slider:before {
                                    transform: translateX(20px);
                                }
                                .edit-popup-btn {
                                    transition: all 0.2s ease;
                                    font-weight: 500;
                                    border-radius: 8px;
                                    padding: 10px 22px;
                                    font-size: 14px;
                                    cursor: pointer;
                                }
                                .edit-popup-btn:active {
                                    transform: translateY(1px);
                                }
                                .edit-checkbox-item {
                                    display: flex;
                                    align-items: center;
                                    gap: 8px;
                                    padding: 6px 10px;
                                    border-radius: 6px;
                                    background: #f8fafc;
                                    border: 1px solid #e2e8f0;
                                }
                            </style>
                            
                            <h3 style="
                                text-align: center;
                                margin-bottom: 24px;
                                font-size: 22px;
                                font-weight: 700;
                                color: #1e293b;
                                letter-spacing: -0.02em;
                            ">
                                Edit Food Item
                            </h3>
                            
                            <form style="display: flex; flex-direction: column; gap: 18px;">
                                <div class="form-group">
                                    <label for="editFname" style="
                                        display: block;
                                        font-size: 14px;
                                        color: #475569;
                                        margin-bottom: 6px;
                                        font-weight: 500;
                                    ">Food Name</label>
                                    <input type="text" id="editFname" value="${item.fname}" class="edit-popup-input" style="
                                        width: 100%;
                                        padding: 12px;
                                        border: 1px solid #cbd5e1;
                                        border-radius: 8px;
                                        font-size: 14px;
                                        background: #f8fafc;
                                        transition: border 0.2s, box-shadow 0.2s;
                                    ">
                                </div>

                                <div class="form-group">
                                    <label for="category" style="
                                        display: block;
                                        font-size: 14px;
                                        color: #475569;
                                        margin-bottom: 6px;
                                        font-weight: 500;
                                    ">Category</label>
                                    <select id="category" required class="edit-popup-select" style="
                                        width: 100%;
                                        padding: 12px;
                                        border: 1px solid #cbd5e1;
                                        border-radius: 8px;
                                        font-size: 14px;
                                        background: #f8fafc;
                                        appearance: none;
                                        background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" viewBox=\"0 0 16 16\"><path d=\"M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z\"/></svg>');
                                        background-repeat: no-repeat;
                                        background-position: right 12px center;
                                        background-size: 14px;
                                        transition: border 0.2s, box-shadow 0.2s;
                                    ">
                                        <option value="${item.category}">${item.category_name}</option>
                                    </select>
                                </div>

                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                                    <div class="form-group">
                                        <label for="editCost" style="
                                            display: block;
                                            font-size: 14px;
                                            color: #475569;
                                            margin-bottom: 6px;
                                            font-weight: 500;
                                        ">Cost (₹)</label>
                                        <input type="number" id="editCost" value="${item.cost}" step="0.01" class="edit-popup-input" style="
                                            width: 100%;
                                            padding: 12px;
                                            border: 1px solid #cbd5e1;
                                            border-radius: 8px;
                                            font-size: 14px;
                                            background: #f8fafc;
                                            transition: border 0.2s, box-shadow 0.2s;
                                        ">
                                    </div>
                                    <div class="form-group">
                                        <label for="editsgst" style="
                                            display: block;
                                            font-size: 14px;
                                            color: #475569;
                                            margin-bottom: 6px;
                                            font-weight: 500;
                                        ">SGST (%)</label>
                                        <input type="number" id="editsgst" value="${item.sgst}" step="0.01" min="0" class="edit-popup-input" style="
                                            width: 100%;
                                            padding: 12px;
                                            border: 1px solid #cbd5e1;
                                            border-radius: 8px;
                                            font-size: 14px;
                                            background: #f8fafc;
                                            transition: border 0.2s, box-shadow 0.2s;
                                        ">
                                    </div>
                                    <div class="form-group">
                                        <label for="editcgst" style="
                                            display: block;
                                            font-size: 14px;
                                            color: #475569;
                                            margin-bottom: 6px;
                                            font-weight: 500;
                                        ">CGST (%)</label>
                                        <input type="number" id="editcgst" value="${item.cgst}" step="0.01" min="0" class="edit-popup-input" style="
                                            width: 100%;
                                            padding: 12px;
                                            border: 1px solid #cbd5e1;
                                            border-radius: 8px;
                                            font-size: 14px;
                                            background: #f8fafc;
                                            transition: border 0.2s, box-shadow 0.2s;
                                        ">
                                    </div>
                                </div>

                                <div style="
                                    display: flex;
                                    justify-content: center;
                                    background: #f1f5f9;
                                    padding: 16px;
                                    border-radius: 10px;
                                    margin-top: 8px;
                                ">
                                    <div class="form-group" style="
                                        display: flex;
                                        align-items: center;
                                        justify-content: space-between;
                                        min-width: 120px;
                                    ">
                                        <label for="editveg" style="font-size: 14px; color: #334155; font-weight: 500;">Vegetarian</label>
                                        <label class="edit-popup-switch">
                                            <input type="checkbox" id="editveg" ${item.veg == 1 ? "checked" : ""}>
                                            <span class="edit-popup-slider"></span>
                                        </label>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label style="
                                        display: block;
                                        font-size: 14px;
                                        color: #475569;
                                        margin-bottom: 6px;
                                        font-weight: 500;
                                    ">Inventory Dependencies</label>
                                    <div id="dependant-items-container" style="
                                        display: flex;
                                        flex-wrap: wrap;
                                        gap: 10px;
                                        padding: 16px;
                                        border: 1px solid #e2e8f0;
                                        border-radius: 10px;
                                        max-height: 140px;
                                        overflow-y: auto;
                                        background: #ffffff;
                                    ">
                                        Loading...
                                    </div>
                                </div>

                                <div style="
                                    display: flex;
                                    justify-content: center;
                                    gap: 12px;
                                    margin-top: 10px;
                                    padding-top: 8px;
                                    border-top: 1px solid #f1f5f9;
                                ">
                                    <button type="button" id="saveChanges" class="edit-popup-btn" style="
                                        background: #0D3B66;
                                        color: white;
                                        border: none;
                                        box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
                                    ">Save Changes</button>
                                    <button type="button" id="closePopup" class="edit-popup-btn" style="
                                        background: #ffffff;
                                        color: #64748b;
                                        border: 1px solid #e2e8f0;
                                    ">Cancel</button>
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
                                checkbox.style.accentColor = "#0D3B66";

                                // Pre-check if this item is in depend_inv
                                const dependArray = (item.depend_inv || "").split(",").map(i => i.trim()).filter(i => i);
                                if (dependArray.includes(inv.inv_no.toString())) {
                                    checkbox.checked = true;
                                }

                                const label = document.createElement("label");
                                label.htmlFor = `edit_inv_${inv.inv_no}`;
                                label.textContent = inv.inv_item;
                                label.style.fontSize = "13px";
                                label.style.color = "#475569";
                                label.style.cursor = "pointer";

                                const wrapper = document.createElement("div");
                                wrapper.className = "edit-checkbox-item";
                                wrapper.appendChild(checkbox);
                                wrapper.appendChild(label);

                                fragment.appendChild(wrapper);
                            });

                            container.appendChild(fragment);

                            // Add empty state message if needed
                            if (inventoryItems.length === 0) {
                                container.innerHTML = `<div style="
                                    color: #94a3b8;
                                    font-style: italic;
                                    padding: 10px;
                                    text-align: center;
                                    width: 100%;
                                ">No inventory items available</div>`;
                            }

                        } catch (error) {
                            console.error("Failed to load inventory items:", error);
                            const container = document.getElementById("dependant-items-container");
                            container.innerHTML = `<div style="
                                color: #ef4444;
                                padding: 10px;
                                text-align: center;
                                font-size: 13px;
                            ">Failed to load inventory items</div>`;
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
                        style="accent-color: #0D3B66;">
                    <label for="${itemId}" 
                        style="font-size: 13px; color: #475569; cursor: pointer;">
                        ${inv.inv_item}
                    </label>
                `;
                
                fragment.appendChild(itemContainer);
            });
            
            container.appendChild(fragment);
            
            // Add empty state message if needed
            if (inventory.length === 0) {
                container.innerHTML = `<div style="
                    color: #94a3b8;
                    font-style: italic;
                    padding: 10px;
                    text-align: center;
                    width: 100%;
                ">No inventory items available</div>`;
            }
        } catch (err) {
            console.error("Failed to load inventory items:", err);
            // Show error in UI
            document.getElementById("inventory-checklist").innerHTML = `
                <div style="
                    color: #ef4444;
                    padding: 10px;
                    text-align: center;
                    font-size: 13px;
                ">
                    Failed to load inventory items
                </div>`;
        }
    }

    // Create overlay container
    const popupOverlay = document.createElement("div");
    popupOverlay.id = "add-item-popup-overlay";
    popupOverlay.classList.add("menu-edit-popup-overlay");

    // Create popup content
    const popup = document.createElement("div");
    popup.id = "add-item-popup";
    popup.classList.add("menu-edit-popup");

    popup.innerHTML = `
    <div class="menu-popup-content" style="
        pointer-events: auto;
        max-width: 500px;
        width: 100%;
        background: #ffffff;
        padding: 30px;
        border-radius: 16px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    ">
        <style>
            .popup-input:focus, .popup-select:focus {
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
                outline: none;
            }
            .popup-switch {
                position: relative;
                display: inline-block;
                width: 44px;
                height: 24px;
            }
            .popup-switch input { 
                opacity: 0;
                width: 0;
                height: 0;
            }
            .popup-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #e2e8f0;
                transition: .3s;
                border-radius: 24px;
            }
            .popup-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .3s;
                border-radius: 50%;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            input:checked + .popup-slider {
                background-color: #0D3B66;
            }
            input:checked + .popup-slider:before {
                transform: translateX(20px);
            }
            .popup-btn {
                transition: all 0.2s ease;
                font-weight: 500;
                border-radius: 8px;
                padding: 10px 22px;
                font-size: 14px;
                cursor: pointer;
            }
            .popup-btn:active {
                transform: translateY(1px);
            }
            .checkbox-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 10px;
                border-radius: 6px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
            }
        </style>
        
        <h3 style="
            text-align: center;
            margin-bottom: 24px;
            font-size: 22px;
            font-weight: 700;
            color: #1e293b;
            letter-spacing: -0.02em;
        ">
            Add New Food Item
        </h3>
        
        <form id="addItemForm" style="display: flex; flex-direction: column; gap: 18px;">
            <div class="form-group">
                <label for="fname" style="
                    display: block;
                    font-size: 14px;
                    color: #475569;
                    margin-bottom: 6px;
                    font-weight: 500;
                ">Food Name</label>
                <input type="text" id="fname" required class="popup-input" style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 14px;
                    background: #f8fafc;
                    transition: border 0.2s, box-shadow 0.2s;
                ">
            </div>

            <div class="form-group">
                <label for="category" style="
                    display: block;
                    font-size: 14px;
                    color: #475569;
                    margin-bottom: 6px;
                    font-weight: 500;
                ">Category</label>
                <select id="category" required class="popup-select" style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 14px;
                    background: #f8fafc;
                    appearance: none;
                    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>');
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    background-size: 14px;
                    transition: border 0.2s, box-shadow 0.2s;
                ">
                    <option value="">Select a category</option>
                </select>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                <div class="form-group">
                    <label for="cost" style="
                        display: block;
                        font-size: 14px;
                        color: #475569;
                        margin-bottom: 6px;
                        font-weight: 500;
                    ">Cost (₹)</label>
                    <input type="number" id="cost" step="0.01" required class="popup-input" style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #cbd5e1;
                        border-radius: 8px;
                        font-size: 14px;
                        background: #f8fafc;
                        transition: border 0.2s, box-shadow 0.2s;
                    ">
                </div>
                <div class="form-group">
                    <label for="sgst" style="
                        display: block;
                        font-size: 14px;
                        color: #475569;
                        margin-bottom: 6px;
                        font-weight: 500;
                    ">SGST (%)</label>
                    <input type="number" id="sgst" step="0.01" value="0" class="popup-input" style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #cbd5e1;
                        border-radius: 8px;
                        font-size: 14px;
                        background: #f8fafc;
                        transition: border 0.2s, box-shadow 0.2s;
                    ">
                </div>
                <div class="form-group">
                    <label for="cgst" style="
                        display: block;
                        font-size: 14px;
                        color: #475569;
                        margin-bottom: 6px;
                        font-weight: 500;
                    ">CGST (%)</label>
                    <input type="number" id="cgst" step="0.01" value="0" class="popup-input" style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #cbd5e1;
                        border-radius: 8px;
                        font-size: 14px;
                        background: #f8fafc;
                        transition: border 0.2s, box-shadow 0.2s;
                    ">
                </div>
            </div>

            <div style="
                display: flex;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 12px;
                background: #f1f5f9;
                padding: 16px;
                border-radius: 10px;
                margin-top: 8px;
            ">
                <div class="form-group" style="
                    flex: 1;
                    min-width: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                ">
                    <label for="veg" style="font-size: 14px; color: #334155; font-weight: 500;">Veg</label>
                    <label class="popup-switch">
                        <input type="checkbox" id="veg" checked>
                        <span class="popup-slider"></span>
                    </label>
                </div>
                <div class="form-group" style="
                    flex: 1;
                    min-width: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                ">
                    <label for="active" style="font-size: 14px; color: #334155; font-weight: 500;">Active</label>
                    <label class="popup-switch">
                        <input type="checkbox" id="active" checked>
                        <span class="popup-slider"></span>
                    </label>
                </div>
                <div class="form-group" style="
                    flex: 1;
                    min-width: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                ">
                    <label for="is_on" style="font-size: 14px; color: #334155; font-weight: 500;">Available</label>
                    <label class="popup-switch">
                        <input type="checkbox" id="is_on" checked>
                        <span class="popup-slider"></span>
                    </label>
                </div>
            </div>

            <div class="form-group">
                <label style="
                    display: block;
                    font-size: 14px;
                    color: #475569;
                    margin-bottom: 6px;
                    font-weight: 500;
                ">Inventory Dependencies</label>
                <div id="inventory-checklist" style="
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    padding: 16px;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    max-height: 140px;
                    overflow-y: auto;
                    background: #ffffff;
                ">
                </div>
            </div>

            <div style="
                display: flex;
                justify-content: center;
                gap: 12px;
                margin-top: 10px;
                padding-top: 8px;
                border-top: 1px solid #f1f5f9;
            ">
                <button type="submit" id="addItemBtn" class="popup-btn" style="
                    background: #0D3B66;
                    color: white;
                    border: none;
                    box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
                ">Add Item</button>
                <button type="button" id="closeAddItemPopup" class="popup-btn" style="
                    background: #ffffff;
                    color: #64748b;
                    border: 1px solid #e2e8f0;
                ">Cancel</button>
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

