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
            document.querySelector("#addNewItem").addEventListener("click", async () => {
                ipcRenderer.send("open-add-item-window"); // Send event to main process
                return; // Stop further execution
            });


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
                    const confirmDelete = confirm("Are you sure you want to delete this item?");
                    if (confirmDelete) {
                        await ipcRenderer.invoke("delete-menu-item", parseInt(fid));

                        // Remove the food item from the DOM instead of reloading everything
                        document.querySelector(`.food-item[data-fid="${fid}"]`).remove();
                    }
                });
            });
            // Add event listeners for search bar
            document.querySelector("#searchBar").addEventListener("input", (event) => {
                const searchQuery = event.target.value.toLowerCase();
                document.querySelectorAll(".food-item").forEach((item) => {
                    const foodName = item.querySelector("h3").textContent.toLowerCase();
                    if (foodName.includes(searchQuery)) {
                        item.style.display = "block";
                    } else {
                        item.style.display = "none";
                    }
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
                        alert("Food item not found!");
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
                        const updatedFname = document.getElementById("editFname").value.trim();
                        const updatedCost = parseFloat(document.getElementById("editCost").value);
                        const updatedCategory = parseFloat(document.getElementById("category").value);
                        const updatedsgst = parseFloat(document.getElementById("editsgst").value);
                        const updatedcgst = parseFloat(document.getElementById("editcgst").value);
                        const updatedveg = document.getElementById("editveg").checked ? 1 : 0; // Convert toggle state to 1 or 0

                        // Validate inputs
                        if (!updatedFname || isNaN(updatedCost) || updatedCost <= 0) {
                            alert("Please enter valid details.");
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
                            displayMenu(); // Reload the menu
                            //keep scroll position
                            mainContent.scrollTop = currentScrollPosition;
                        } else {
                            alert(`Failed to update item: ${response.error}`);
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
