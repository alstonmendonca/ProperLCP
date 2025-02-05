// Function to display menu items
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
                    <div class="food-item" style="border: 1px solid #ccc; padding: 10px; text-align: center;">
                        <h3>${item.fname} <br style="line-height:5px; display:block"> 
                            ${item.veg == 1 ? "🌱" : "🍖"}
                        </h3>
                        <p>Category: ${item.category_name}</p>
                        <p>Food ID: ${item.fid}</p>
                        <p>Price: ₹${item.cost}</p>
                        <button class="delete-btn" data-fid="${item.fid}" 
                            style="background: red; color: white; padding: 5px; border: none; cursor: pointer;">
                            Delete
                        </button>
                    </div>
                `;
            });
            

            menuContent += `</div>`;
            mainContent.innerHTML = menuContent;

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

// In menu.js

// Listening for the 'refresh-menu' event to trigger menu reload
ipcRenderer.on('refresh-menu', async () => {
    await displayMenu();
});
