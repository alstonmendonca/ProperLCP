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
                <h2>Menu</h2>
                <div class="food-items" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
            `;

            foodItems.forEach((item) => {
                menuContent += `
                    <div class="food-item" style="border: 1px solid #ccc; padding: 10px; text-align: center;" data-fid="${item.fid}">
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
                    </div>
                `;
            });

            menuContent += `</div>`;
            mainContent.innerHTML = menuContent;

            // Restore previous scroll position
            mainContent.scrollTop = currentScrollPosition;

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
