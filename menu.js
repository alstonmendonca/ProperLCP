async function displayMenu() {
    const mainContent = document.getElementById("main-content");
    const billPanel = document.getElementById("bill-panel");

    // Show loading message
    mainContent.innerHTML = `
        <div class="loading-message" id="loading-message">
            <p>Loading menu...</p>
        </div>
    `;
    billPanel.style.display = 'none';

    try {
        const foodItems = await ipcRenderer.invoke("get-menu-items");

        // Remove loading message
        mainContent.innerHTML = "";

        if (foodItems.length > 0) {
            let menuContent = `
                <h2>Menu</h2>
                <div class="food-items" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
            `;

            foodItems.forEach(item => {
                menuContent += `
                    <div class="food-item" style="border: 1px solid #ccc; padding: 10px; text-align: center;" data-fid="${item.fid}">
                        <h3>${item.fname} <br style="line-height:5px; display:block"> 
                            ${item.veg == 1 ? "🌱" : "🍖"}
                        </h3>
                        <p>Category: ${item.category_name}</p>
                        <p>Food ID: ${item.fid}</p>
                        <p>Price: ₹${item.cost}</p>

                        <!-- Toggle Switch -->
                        <label class="switch">
                            <input type="checkbox" class="toggle-switch" data-fid="${item.fid}" ${item.is_on ? "checked" : ""}>
                            <span class="slider round"></span>
                        </label>
                        <p class="status">${item.is_on ? "ON ✅" : "OFF ❌"}</p>

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

            // Add event listeners to toggle switches
            document.querySelectorAll(".toggle-switch").forEach(switchEl => {
                switchEl.addEventListener("change", async (event) => {
                    const fid = event.target.getAttribute("data-fid");
                    const currentScrollPosition = mainContent.scrollTop; // Store current scroll position
                    await ipcRenderer.invoke("toggle-menu-item", parseInt(fid));

                    // Update the toggle switch and status directly
                    const foodItemElement = document.querySelector(`.food-item[data-fid="${fid}"]`);
                    const statusElement = foodItemElement.querySelector(".status");
                    const isChecked = event.target.checked;

                    // Update the toggle state and status text
                    event.target.checked = isChecked; // Update the toggle switch
                    statusElement.textContent = isChecked ? "Active ✅" : "Inactive ❌"; // Update status text

                    mainContent.scrollTop = currentScrollPosition; // Restore scroll position
                });
            });

            // Add event listeners to delete buttons
            document.querySelectorAll(".delete-btn").forEach(button => {
                button.addEventListener("click", async (event) => {
                    const fid = event.target.getAttribute("data-fid");
                    const confirmDelete = confirm("Are you sure you want to delete this item?");
                    if (confirmDelete) {
                        await ipcRenderer.invoke("delete-menu-item", parseInt(fid));
                        displayMenu(); // Refresh menu after deletion
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
ipcRenderer.on('refresh-menu', async () => {
    await displayMenu();
});