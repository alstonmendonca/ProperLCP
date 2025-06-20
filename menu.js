//REEVANS JOB - MOVE THIS CONFIRM POPUP INTO ANOTHER FILE. ELSE IT WONT DELETE BUTTON
function createConfirmPopup(message) {
    return new Promise((resolve) => {
        let existingPopup = document.getElementById("custom-confirm-popup");
        if (existingPopup) {
            existingPopup.remove();
        }

        // Create overlay
        const overlay = document.createElement("div");
        overlay.id = "custom-confirm-popup";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "9999";

        overlay.innerHTML = `
                <div class="menu-popup-content" style="background: white; padding: 20px; border-radius: 10px; width: 300px; pointer-events: auto;">
                    <p>${message}</p>
                    <br>
                    <div class="menu-popup-buttons" style="display: flex; justify-content: center; gap: 10px;">
                        <button id="confirmYes" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Yes</button>
                        <button id="confirmNo" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">No</button>
                    </div>
                </div>
            `;

        // Close on outside click
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        });

        document.body.appendChild(overlay);

        document.getElementById("confirmYes").addEventListener("click", () => {
            overlay.remove();
            resolve(true);
        });

        document.getElementById("confirmNo").addEventListener("click", () => {
            overlay.remove();
            resolve(false);
        });
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
        // Optional delay for 1 second to show the spinner clearly
        await new Promise(res => setTimeout(res, 400));

        const foodItems = await ipcRenderer.invoke("get-menu-items");

        // Remove loading message
        mainContent.innerHTML = "";

        // Continue with displaying foodItems here...
    } catch (error) {
        console.error("Error loading menu:", error);
    }
    try {
        const foodItems = await ipcRenderer.invoke("get-menu-items");

        // Remove loading message
        mainContent.innerHTML = "";

        if (foodItems.length > 0) {
            let menuContent = `
                
                <div class="menu-section-title">
                    <h2>Menu</h2>
                </div>
                <input type="text" id="searchBar" placeholder="Search..." style="padding: 10px; border: 3px solid #ccc; border-radius: 25px; width: 1490px; margin-bottom: 20px;">
                <div class="food-items" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
                    <button id="addNewItem" style="padding: 10px; text-align: center; background-color:rgb(255, 255, 255); border: 2px dashed #aaa; border-radius: 10px; color:black; font-size: 16px;">
                    <svg class="add-icon" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    <br>
                    Add New Item
                    </button>
            `;

            foodItems.forEach((item) => {
                menuContent += `
                    <div class="food-item" style="border: 2px solid ${item.veg == 1 ? 'green' : 'red'}; padding: 10px; text-align: center; border-radius: 10px; background: ${item.veg == 1 ? '#EFFBF0' : '#FFEBEB'};" data-fid="${item.fid}">
                        <h3>${item.fname} <br style="line-height:5px; display:block"> 
                            ${item.veg == 1 ? "🌱" : "🍖"}
                        </h3>
                        <p>Category: ${item.category_name}</p>
                        <p>Food ID: ${item.fid}</p>
                        <p>Price: ₹${item.cost}</p>
                        <!-- <p><strong>Depends On:</strong> ${item.depend_inv_names || 'None'}</p> -->

                        <!-- Toggle Switches Container -->
                        <div class="toggle-container" style="display: flex; justify-content: center; gap: 18px; align-items: center;">

                            <!-- ACTIVE Toggle Switch -->
                            <div class="toggle-group" style="display: flex; flex-direction: column; align-items: center; font-size: 12px;">
                                <label class="switch" style="transform: scale(0.85);">
                                    <input type="checkbox" class="active-toggle-switch" data-fid="${item.fid}" ${item.active ? "checked" : ""}>
                                    <span class="slider round"></span>
                                </label>
                                <p class="status active-status">${item.active ? "ACTIVE ✅" : "INACTIVE ❌"}</p>
                            </div>

                            <!-- IS_ON Toggle Switch (Initially Hidden if Not Active) -->
                            <div class="toggle-group is-on-container" style="display: ${item.active ? 'flex' : 'none'}; flex-direction: column; align-items: center; font-size: 12px;">
                                <label class="switch" style="transform: scale(0.85);">
                                    <input type="checkbox" class="toggle-switch" data-fid="${item.fid}" ${item.is_on ? "checked" : ""}>
                                    <span class="slider round"></span>
                                </label>
                                <p class="status is-on-status">${item.is_on ? "ON ✅" : "OFF ❌"}</p>
                            </div>

                        </div>

                        <!-- Delete Button -->
                        <button class="delete-btn" data-fid="${item.fid}" 
                            style="background: red; color: white; padding: 5px; border: none; cursor: pointer; margin-top: 5px;">
                            Delete
                        </button>
                        <!-- Edit Button -->
                        <button class="edit-btn" data-fid="${item.fid}" 
                            style="background: grey; color: white; padding: 5px; border: none; cursor: pointer; margin-top: 5px;">
                            Edit
                        </button>
                    </div>
                `;

            });

            menuContent += `</div>`;
            mainContent.innerHTML = menuContent;

            // Restore previous scroll position
            mainContent.scrollTop = currentScrollPosition;
            // Add event listeners to Add New Item button
            document.querySelector("#addNewItem").addEventListener("click", toggleAddItemPopup);



            // Add event listeners to IS_ON toggle switches
            document.querySelectorAll(".toggle-switch").forEach((switchEl) => {
                switchEl.addEventListener("change", async (event) => {
                    const fid = event.target.getAttribute("data-fid");
                    await ipcRenderer.invoke("toggle-menu-item", parseInt(fid));

                    // Update the toggle switch and status directly
                    const foodItemElement = document.querySelector(`.food-item[data-fid="${fid}"]`);
                    const statusElement = foodItemElement.querySelector(".is-on-status");
                    const isChecked = event.target.checked;

                    statusElement.textContent = isChecked ? "ON ✅" : "OFF ❌";
                });
            });

            // Add event listeners to ACTIVE toggle switches
            document.querySelectorAll(".active-toggle-switch").forEach((switchEl) => {
                switchEl.addEventListener("change", async (event) => {
                    const fid = event.target.getAttribute("data-fid");
                    await ipcRenderer.invoke("toggle-menu-item-active", parseInt(fid));

                    // Update the toggle switch and status directly
                    const foodItemElement = document.querySelector(`.food-item[data-fid="${fid}"]`);
                    const statusElement = foodItemElement.querySelector(".active-status");
                    const isChecked = event.target.checked;

                    statusElement.textContent = isChecked ? "ACTIVE ✅" : "INACTIVE ❌";

                    // Show or hide the IS_ON toggle switch container
                    const isOnContainer = foodItemElement.querySelector(".is-on-container");
                    if (isChecked) {
                        isOnContainer.style.display = "flex";
                    } else {
                        isOnContainer.style.display = "none";
                    }
                });
            });


            // Add event listeners to delete buttons
            document.querySelectorAll(".delete-btn").forEach((button) => {
                button.addEventListener("click", async (event) => {
                    const fid = event.target.getAttribute("data-fid");
                    const confirmDelete = await createConfirmPopup("Are you sure you want to delete this item?");
                    if (confirmDelete) {
                        await ipcRenderer.invoke("delete-menu-item", parseInt(fid));

                        // Remove the food item from the DOM instead of reloading everything
                        document.querySelector(`.food-item[data-fid="${fid}"]`).remove();
                    }
                });
            });
            // Add event listeners for search bar
            document.querySelector("#searchBar").addEventListener("input", (event) => {
                const searchQuery = event.target.value.trim().toLowerCase();
                document.querySelectorAll(".food-item").forEach((item) => {
                    const foodName = item.querySelector("h3").textContent.trim().toLowerCase();
                    item.style.display = foodName.includes(searchQuery) ? "block" : "none";
                });
            });

            // Add event listeners to edit buttons
            // Add event listeners to edit buttons
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
                            <h3>Edit Food Item</h3>
                            <label>Name:</label>
                            <input type="text" id="editFname" value="${item.fname}">
                            <label>Price:</label>
                            <input type="number" id="editCost" value="${item.cost}">
                            <label for="category">Category:</label>
                            <select id="category" required>
                                <option value="${item.category}">${item.category_name}</option>
                            </select>
                            <label>SGST:</label>
                            <input type="number" id="editsgst" value="${item.sgst}" min="0">
                            <label>CGST:</label>
                            <input type="number" id="editcgst" value="${item.cgst}" min="0">
                            <label>VEG:</label>
                            <label class="switch">
                                <input type="checkbox" id="editveg" ${item.veg == 1 ? "checked" : ""}>
                                <span class="slider round"></span>
                            </label>
                            <br>
                            <label>Dependant Items:</label>
                            <div id="dependant-items-container" class="checkbox-container">
                                Loading...
                            </div>
                            <div class="menu-popup-buttons">
                                <button id="saveChanges">Save</button>
                                <button id="closePopup">Cancel</button>
                            </div>
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
                    async function loadCategories() {
                        try {
                            const categories = await ipcRenderer.invoke("get-categories-for-additem");
                            const categorySelect = document.getElementById("category");

                            // Clear existing options except the first one
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
                    async function loadInventoryItems() {
                        try {
                            const inventoryItems = await ipcRenderer.invoke("get-all-inventory-items");
                            const container = document.getElementById("dependant-items-container");
                    
                            container.innerHTML = ''; // clear previous content
                    
                            inventoryItems.forEach(inv => {
                                const checkbox = document.createElement("input");
                                checkbox.type = "checkbox";
                                checkbox.value = inv.inv_no;
                                checkbox.id = `inv_${inv.inv_no}`;
                                checkbox.name = "dependant_inv";
                    
                                // Pre-check if this item is in depend_inv
                                const dependArray = (item.depend_inv || "").split(",").map(i => i.trim()).filter(i => i);
                                if (dependArray.includes(inv.inv_no.toString())) {
                                    checkbox.checked = true;
                                }
                    
                                const label = document.createElement("label");
                                label.htmlFor = `inv_${inv.inv_no}`;
                                label.textContent = inv.inv_item;
                                label.style.marginRight = "10px";
                    
                                const wrapper = document.createElement("div");
                                wrapper.appendChild(checkbox);
                                wrapper.appendChild(label);
                    
                                container.appendChild(wrapper);
                            });
                    
                        } catch (error) {
                            console.error("Failed to load inventory items:", error);
                            const container = document.getElementById("dependant-items-container");
                            container.textContent = "Failed to load inventory items.";
                        }
                    }
                    

                    loadCategories();
                    loadInventoryItems();
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
            document.getElementById('top-panel').classList.remove('disabled');


        } else {
            mainContent.innerHTML = `<p>No items available in this category.</p>`;
        }
    } catch (error) {
        mainContent.innerHTML = `<p>Error loading menu items: ${error.message}</p>`;
        console.error("Error fetching menu:", error);
    }
}

// Listening for the 'refresh-menu' event to trigger menu reload
ipcRenderer.on("refresh-menu", async () => {
    await displayMenu();
});
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
                        style="accent-color: #4f46e5;">
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
                background-color: #4f46e5;
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
                    background: #4f46e5;
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

