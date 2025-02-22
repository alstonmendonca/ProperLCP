async function displayMenu() {
    const mainContent = document.getElementById("main-content");
    const billPanel = document.getElementById("bill-panel");

    // Store scroll position before updating content
    const currentScrollPosition = mainContent.scrollTop;

    // Show loading message
    mainContent.innerHTML = `
        <div class="loading-message" id="loading-message">
            <p>Loading menu...</p>
        </div>
    `;
    billPanel.style.display = "none";

    try {
        const foodItems = await ipcRenderer.invoke("get-menu-items");

        // Remove loading message
        mainContent.innerHTML = "";

        if (foodItems.length > 0) {
            let menuContent = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2>Menu</h2>
                    <input type="text" id="searchBar" placeholder="Search for an item..." style="padding: 5px; border: 1px solid #ccc; border-radius: 5px; width: 300px;">
                </div><br>
                <div class="food-items" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
                    <button id="addNewItem" style="border: 1px solid #ccc; padding: 10px; text-align: center;">
                    <p style = "font-size : 100px">+</p>
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
            document.querySelectorAll(".edit-btn").forEach((button) => {
                button.addEventListener("click", async (event) => {
                    const fid = event.target.getAttribute("data-fid");
                    const existingPopup = document.querySelector(".edit-popup");

                    // If popup already exists, remove it (toggle behavior)
                    if (existingPopup) {
                        document.body.removeChild(existingPopup);
                        return; // Stop execution to prevent reopening immediately
                    }

                    const item = foodItems.find((item) => item.fid == fid);
                    if (!item) {
                        createTextPopup("Food item not found!");
                        return;
                    }

                    // Create the edit popup dynamically
                    const popup = document.createElement("div");
                    popup.classList.add("edit-popup");
                    popup.innerHTML = `
                        <div class="popup-content" style = "align-items: center; justify-content: center; pointer-events: auto;">
                            <h3>Edit Food Item</h3>
                            <label>Name:</label>
                            <input type="text" id="editFname" value="${item.fname}">
                            <label>Price:</label>
                            <input type="number" id="editCost" value="${item.cost}" style="width: 150px;">
                            <label for="category">Category:</label>
                            <select id="category" required style = "width: 150px; height : 35px; border-radius: 5px; border: 1px solid #ccc;
                            font-size : 15px; text-align: center;">
                                <option value="${item.category}">${item.category_name}</option>
                            </select>
                            <label style = "margin-top:7px">SGST:</label>
                            <input type="number" id="editsgst" value="${item.sgst}" min="0" style="width: 150px;">
                            <label>CGST:</label>
                            <input type="number" id="editcgst" value="${item.cgst}" min="0" style="width: 150px;">
                            <label>VEG:</label>
                            <label class="switch">
                            <input type="checkbox" id="editveg" ${item.veg == 1 ? "checked" : ""}>
                            <span class="slider round"></span>
                            </label>
                            <br>

                            <div class="popup-buttons">
                                <button id="saveChanges" style="margin-right: 10px;">Save</button>
                                <button id="closePopup">Cancel</button>
                            </div>
                        </div>
                    `;

                    document.body.appendChild(popup);
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
                    
                    loadCategories(); // Call after popup is added to DOM
                    // Close popup when clicking "Cancel"
                    document.getElementById("closePopup").addEventListener("click", () => {
                        document.body.removeChild(popup);
                    });

                    // Save changes
                    document.getElementById("saveChanges").addEventListener("click", async () => {
                        // Store the current scroll position
                        const currentScrollPosition = mainContent.scrollTop;
                    
                        const updatedFname = document.getElementById("editFname").value.trim();
                        const updatedCost = parseFloat(document.getElementById("editCost").value);
                        const updatedCategory = parseFloat(document.getElementById("category").value);
                        const updatedsgst = parseFloat(document.getElementById("editsgst").value);
                        const updatedcgst = parseFloat(document.getElementById("editcgst").value);
                        const updatedveg = document.getElementById("editveg").checked ? 1 : 0; // Convert toggle state to 1 or 0
                    
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
                            veg: updatedveg
                        });
                    
                        if (response.success) {
                            // Remove the popup
                            document.body.removeChild(popup);
                    
                            // Update UI dynamically
                            const foodItemElement = document.querySelector(`.food-item[data-fid="${fid}"]`);
                            if (foodItemElement) {
                                foodItemElement.querySelector("h3").innerHTML = `${updatedFname} <br> ${updatedveg == 1 ? "🌱" : "🍖"}`;
                                foodItemElement.querySelector("p:nth-child(2)").textContent = `Category: ${updatedCategory}`;
                                foodItemElement.querySelector("p:nth-child(3)").textContent = `Price: ₹${updatedCost}`;
                            }
                    
                            // Restore the scroll position
                            mainContent.scrollTop = currentScrollPosition;
                        } else {
                            createTextPopup("Failed to update item");
                        }
                    });
                });
            });



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
    let existingPopup = document.getElementById("add-item-popup");
    if (existingPopup) {
        existingPopup.remove();
        return;
    }

    const popup = document.createElement("div");
    popup.id = "add-item-popup";
    popup.classList.add("edit-popup");

    popup.innerHTML = `
        <div class="popup-content" style="align-items: center; justify-content: center; width: 400px; pointer-events: auto;">
            <h3 style="text-align: center; margin-bottom: 20px; font-size: 24px; color: #333;">Add New Food Item</h3>
            <form id="addItemForm" style="display: flex; flex-direction: column; gap: 15px;">
                <div class="form-group">
                    <label for="fname" style="font-size: 14px; color: #555; margin-bottom: 5px;">Food Name:</label>
                    <input type="text" id="fname" required style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                </div>

                <div class="form-group">
                    <label for="category" style="font-size: 14px; color: #555; margin-bottom: 5px;">Category:</label>
                    <select id="category" required style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; background: white;">
                        <option value="">Select a category</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="cost" style="font-size: 14px; color: #555; margin-bottom: 5px;">Cost (₹):</label>
                    <input type="number" id="cost" step="0.01" required style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                </div>

                <div class="form-group">
                    <label for="sgst" style="font-size: 14px; color: #555; margin-bottom: 5px;">SGST (%):</label>
                    <input type="number" id="sgst" step="0.01" value="0" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                </div>

                <div class="form-group">
                    <label for="cgst" style="font-size: 14px; color: #555; margin-bottom: 5px;">CGST (%):</label>
                    <input type="number" id="cgst" step="0.01" value="0" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                </div>

                <div class="form-group">
                    <label for="veg" style="font-size: 14px; color: #555; margin-bottom: 5px;">Veg:</label>
                    <select id="veg" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; background: white;">
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="active" style="font-size: 14px; color: #555; margin-bottom: 5px;">Active:</label>
                    <select id="active" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; background: white;">
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="is_on" style="font-size: 14px; color: #555; margin-bottom: 5px;">Available:</label>
                    <select id="is_on" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; background: white;">
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                    </select>
                </div>

                <div class="popup-buttons" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                    <button type="submit" id="addItemBtn" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">Add</button>
                    <button id="closePopup" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">Cancel</button>
                </div>
            </form>
        </div>
        `;

    document.body.appendChild(popup);

    // Load categories dynamically
    loadCategories();

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
            active: parseInt(document.getElementById("active").value),
            is_on: parseInt(document.getElementById("is_on").value),
            veg: parseInt(document.getElementById("veg").value)
        };

        try {
            await ipcRenderer.invoke("add-food-item", newItem);
            createTextPopup("Item added successfully!");
            ipcRenderer.send("refresh-menu");
            popup.remove();
        } catch (error) {
            console.error("Error adding item:", error);
            createTextPopup("Failed to add item");
        }
    });

    // Close popup on cancel
    document.getElementById("closePopup").addEventListener("click", () => {
        popup.remove();
    });
}

// Function to load categories dynamically
async function loadCategories() {
    try {
        const categories = await ipcRenderer.invoke("get-categories-for-additem");
        const categorySelect = document.getElementById("category");
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
    popup.classList.add("edit-popup");

    popup.innerHTML = `
        <div class="popup-content" style="align-items: center; justify-content: center; width: 300px; pointer-events: auto;">
            <p>${message}</p>

            <br>

            <div class="popup-buttons">
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

// CREATE CONFIRM POPUP
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
        popup.classList.add("edit-popup");

        popup.innerHTML = `
            <div class="popup-content" style="align-items: center; justify-content: center; width: 300px; pointer-events: auto;">
                <p>${message}</p>
                <br>
                <div class="popup-buttons" style="display: flex; justify-content: center; gap: 10px;">
                    <button id="confirmYes" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Yes</button>
                    <button id="confirmNo" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">No</button>
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        // Add event listeners for buttons
        document.getElementById("confirmYes").addEventListener("click", () => {
            popup.remove();
            resolve(true);
        });

        document.getElementById("confirmNo").addEventListener("click", () => {
            popup.remove();
            resolve(false);
        });
    });
}