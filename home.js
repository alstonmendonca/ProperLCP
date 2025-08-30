const { ipcRenderer } = require("electron");

// Function to load the Home section
async function loadHome(mainContent, billPanel) {
    mainContent.scrollTop = 0;
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "600px";

    // Check switches to see if "All" button should be shown
    const switches = await ipcRenderer.invoke("load-switches");
    
    let foodItems;
    
    if (switches.showAllButton) {
        // Original behavior - show all food items
        foodItems = await ipcRenderer.invoke("get-all-food-items");
    } else {
        // When "All" button is hidden, show items from first category
        const categories = await ipcRenderer.invoke("get-categories");
        if (categories.length > 0) {
            const firstCategory = categories[0].catname;
            foodItems = await ipcRenderer.invoke("get-food-items", firstCategory);
        } else {
            foodItems = [];
        }
    }

    if (foodItems.length > 0) {
        mainContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <input type="text" id="searchBarforHome" placeholder="Search..." 
                    style="padding: 10px; border: 2px solid #ccc; border-radius: 20px; width: 900px;">
            </div><br>
            <div class="food-items" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
                ${foodItems
                    .map(
                        (item) => 
                        `<div class="food-item" style="border: 2px solid ${item.veg == 1 ? 'green' : 'red'}; 
                            padding: 10px; text-align: center; border-radius: 20px; background: ${item.veg == 1 ? '#EFFBF0' : '#FFEBEB'};
                            display: flex; flex-direction: column; justify-content: space-between; min-height: 180px;">
                            
                            <div style="flex-grow: 1;">
                                <h3 style="margin-bottom: 10px;">${item.fname}<br style="line-height:5px;display:block"> 
                                    ${item.veg ? "🌱" : "🍖"}</h3>
                            </div>
                            <p>Price: ₹${item.cost}</p>
                            <div class="quantity-control" style="display: flex; align-items: center; justify-content: center; gap: 5px; margin: 10px 0;">
                                <button class="decrease-quantity" data-fid="${item.fid}" 
                                    style="font-size: 12px; padding: 2px 6px; width: 25px; height: 25px; border-radius: 4px; color: white;">-</button>
                                <span class="quantity" id="quantity-${item.fid}">1</span>
                                <button class="increase-quantity" data-fid="${item.fid}" 
                                    style="font-size: 12px; padding: 2px 6px; width: 25px; height: 25px; border-radius: 4px; color: white;">+</button>
                            </div>

                            <button class="add-to-bill" data-fid="${item.fid}" data-fname="${item.fname}" data-price="${item.cost}" data-category="${item.category}"
                                style="font-size: 17px; padding: 5px 10px; width: 100%; height: 30px; border-radius: 20px; 
                                color: white; margin-top: auto;">
                                ADD
                            </button>
                        </div>`
                    )
                    .join("")}
            </div>`;

        billPanel.style.display = "block";
        document.querySelector("#searchBarforHome").addEventListener("input", (event) => {
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

        // Add event listener to "ADD" buttons
        const addToBillButtons = document.querySelectorAll(".add-to-bill");
        addToBillButtons.forEach(button => {
            button.addEventListener("click", (event) => {
                const itemId = event.target.getAttribute("data-fid");
                const itemName = event.target.getAttribute("data-fname");
                const price = parseFloat(event.target.getAttribute("data-price"));
                const quantity = parseInt(document.getElementById(`quantity-${itemId}`).textContent);
                const category = event.target.getAttribute("data-category");
                addToBill(itemId, itemName, price, quantity, category);  // Pass quantity now
            });
        });

        // Add event listener to quantity control buttons
        document.querySelectorAll(".decrease-quantity").forEach(button => {
            button.addEventListener("click", (event) => {
                const itemId = event.target.getAttribute("data-fid");
                const quantityElement = document.getElementById(`quantity-${itemId}`);
                let currentQuantity = parseInt(quantityElement.textContent);
                if (currentQuantity > 1) {
                    quantityElement.textContent = currentQuantity - 1;
                }
            });
        });

        document.querySelectorAll(".increase-quantity").forEach(button => {
            button.addEventListener("click", (event) => {
                const itemId = event.target.getAttribute("data-fid");
                const quantityElement = document.getElementById(`quantity-${itemId}`);
                let currentQuantity = parseInt(quantityElement.textContent);
                quantityElement.textContent = currentQuantity + 1;
            });
        });
    } else {
    // Show message when no items are available
    mainContent.innerHTML = `
        <div style="text-align: center; margin-top: 100px; color: #555;">
            <h2>No food items available 🍽️</h2>
            <p>Please add items to the menu from the admin panel.</p>
        </div>
    `;
    }
}

// Export the function
module.exports = { loadHome };