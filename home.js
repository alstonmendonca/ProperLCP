const { ipcRenderer } = require("electron");

// Function to load the Home section
async function loadHome(mainContent, billPanel) {
    mainContent.scrollTop = 0;
    mainContent.style.marginLeft = "200px";
    
    // Dynamic margin calculation based on bill panel width
    const billPanelWidth = parseInt(billPanel.style.width || '600', 10);
    mainContent.style.marginRight = (billPanelWidth + 20) + 'px';

    // Check switches to see if "All" button should be shown
    const switches = await ipcRenderer.invoke("load-switches");
    
    let foodItems;
    
    if (switches.showAllButton) {
        // Original behavior - show all food items
        foodItems = await ipcRenderer.invoke("get-all-food-items");
    } else if (switches.showFrequentButton) {
        // When "All" button is hidden but Frequent is shown, show frequent items
        foodItems = await ipcRenderer.invoke("get-frequent-items");
    } else {
        // When both "All" and "Frequent" buttons are hidden, show items from first category
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
            <div class="home-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div class="view-controls" style="display: flex; gap: 10px; align-items: center;">
                    <label style="color: #0D3B66; font-weight: 600;">View:</label>
                    <select id="gridSizeSelector" style="padding: 8px 12px; border: 2px solid #0D3B66; border-radius: 8px; background: white; color: #0D3B66;">
                        <option value="2">2 Columns</option>
                        <option value="3">3 Columns</option>
                        <option value="4" selected>4 Columns</option>
                        <option value="5">5 Columns</option>
                        <option value="6">6 Columns</option>
                    </select>
                    <select id="itemSizeSelector" style="padding: 8px 12px; border: 2px solid #0D3B66; border-radius: 8px; background: white; color: #0D3B66;">
                        <option value="compact">Compact</option>
                        <option value="normal" selected>Normal</option>
                        <option value="large">Large</option>
                    </select>
                </div>
                <input type="text" id="searchBarforHome" placeholder="Search..." 
                    style="padding: 12px 16px; border: 2px solid #ccc; border-radius: 20px; width: 400px; font-size: 14px;">
            </div>
            <div class="food-items" id="foodItemsGrid" style="
                display: grid; 
                grid-template-columns: repeat(4, 1fr); 
                gap: 20px;
                transition: all 0.3s ease;
            ">
                ${foodItems
                    .map(
                        (item) => 
                        `<div class="food-item" data-item-id="${item.fid}" style="
                            border: 2px solid ${item.veg == 1 ? 'green' : 'red'}; 
                            padding: 10px; 
                            text-align: center; 
                            border-radius: 20px; 
                            background: ${item.veg == 1 ? '#EFFBF0' : '#FFEBEB'};
                            display: flex; 
                            flex-direction: column; 
                            justify-content: space-between; 
                            min-height: 180px;
                            transition: all 0.3s ease;
                            cursor: pointer;
                        ">
                            
                            <div style="flex-grow: 1;">
                                <h3 class="item-name" style="margin-bottom: 10px; font-size: 16px; line-height: 1.3;">
                                    ${item.fname}
                                    <br style="line-height:5px;display:block"> 
                                    <span class="veg-indicator" style="font-size: 18px;">
                                        ${item.veg ? 
                                            '🌱' : 
                                            '🍗'
                                        }
                                    </span>
                                </h3>
                            </div>
                            <p class="item-price" style="margin: 5px 0; font-weight: 600; color: #0D3B66;">Price: ₹${item.cost}</p>
                            <div class="quantity-control" style="display: flex; align-items: center; justify-content: center; gap: 10px; margin: 10px 0;">
                                <button class="decrease-quantity" data-fid="${item.fid}" 
                                    style="font-size: 16px; padding: 5px 10px; width: 30px; height: 30px; border-radius: 8px; color: white; background: #0D3B66; border: none; cursor: pointer; transition: all 0.2s ease;">-</button>
                                <span class="quantity" id="quantity-${item.fid}" style="font-weight: 600; font-size: 16px; min-width: 20px; text-align: center;">1</span>
                                <button class="increase-quantity" data-fid="${item.fid}" 
                                    style="font-size: 16px; padding: 5px 10px; width: 30px; height: 30px; border-radius: 8px; color: white; background: #0D3B66; border: none; cursor: pointer; transition: all 0.2s ease;">+</button>
                            </div>

                            <button class="add-to-bill" data-fid="${item.fid}" data-fname="${item.fname}" data-price="${item.cost}" data-category="${item.category}"
                                style="font-size: 17px; padding: 10px; width: 100%; height: 40px; border-radius: 20px; 
                                color: white; background: #0D3B66; border: none; cursor: pointer; font-weight: 600; transition: all 0.2s ease; margin-top: auto;">
                                ADD
                            </button>
                        </div>`
                    )
                    .join("")}
            </div>`;

        billPanel.style.display = "block";
        
        // Initialize grid controls
        initializeGridControls();
        
        // Search functionality
        document.querySelector("#searchBarforHome").addEventListener("input", (event) => {
            const searchQuery = event.target.value.toLowerCase();
            document.querySelectorAll(".food-item").forEach((item) => {
                const foodName = item.querySelector(".item-name").textContent.toLowerCase();
                if (foodName.includes(searchQuery)) {
                    item.style.display = "flex";
                } else {
                    item.style.display = "none";
                }
            });
        });

        // Add hover effects
        document.querySelectorAll(".food-item").forEach(item => {
            item.addEventListener("mouseenter", () => {
                item.style.transform = "translateY(-5px)";
                item.style.boxShadow = "0 8px 16px rgba(13, 59, 102, 0.2)";
            });
            
            item.addEventListener("mouseleave", () => {
                item.style.transform = "translateY(0)";
                item.style.boxShadow = "none";
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
                addToBill(itemId, itemName, price, quantity, category);
                
                // Visual feedback
                event.target.style.background = "#28a745";
                event.target.textContent = "ADDED!";
                setTimeout(() => {
                    event.target.style.background = "#0D3B66";
                    event.target.textContent = "ADD";
                }, 1000);
            });
            
            button.addEventListener("mouseenter", () => {
                button.style.background = "#1a4f7a";
            });
            
            button.addEventListener("mouseleave", () => {
                button.style.background = "#0D3B66";
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
            
            button.addEventListener("mouseenter", () => {
                button.style.background = "#c82333";
            });
            
            button.addEventListener("mouseleave", () => {
                button.style.background = "#0D3B66";
            });
        });

        document.querySelectorAll(".increase-quantity").forEach(button => {
            button.addEventListener("click", (event) => {
                const itemId = event.target.getAttribute("data-fid");
                const quantityElement = document.getElementById(`quantity-${itemId}`);
                let currentQuantity = parseInt(quantityElement.textContent);
                quantityElement.textContent = currentQuantity + 1;
            });
            
            button.addEventListener("mouseenter", () => {
                button.style.background = "#28a745";
            });
            
            button.addEventListener("mouseleave", () => {
                button.style.background = "#0D3B66";
            });
        });
    } else {
        // Show message when no items are available
        mainContent.innerHTML = `
            <div style="text-align: center; margin-top: 100px; color: #555;">
                <h2>No food items available</h2>
                <p>Please add items to the menu from the admin panel.</p>
            </div>
        `;
    }
}

// Function to initialize grid controls
function initializeGridControls() {
    const gridSizeSelector = document.getElementById('gridSizeSelector');
    const itemSizeSelector = document.getElementById('itemSizeSelector');
    const foodItemsGrid = document.getElementById('foodItemsGrid');
    
    // Load saved preferences
    const savedGridSize = localStorage.getItem('foodItemsGridSize') || '4';
    const savedItemSize = localStorage.getItem('foodItemsSize') || 'normal';
    
    gridSizeSelector.value = savedGridSize;
    itemSizeSelector.value = savedItemSize;
    
    updateGridLayout(savedGridSize, savedItemSize);
    
    // Grid size change handler
    gridSizeSelector.addEventListener('change', (e) => {
        const newGridSize = e.target.value;
        localStorage.setItem('foodItemsGridSize', newGridSize);
        updateGridLayout(newGridSize, itemSizeSelector.value);
    });
    
    // Item size change handler
    itemSizeSelector.addEventListener('change', (e) => {
        const newItemSize = e.target.value;
        localStorage.setItem('foodItemsSize', newItemSize);
        updateGridLayout(gridSizeSelector.value, newItemSize);
    });
}

// Function to update grid layout
function updateGridLayout(gridSize, itemSize) {
    const foodItemsGrid = document.getElementById('foodItemsGrid');
    const foodItems = document.querySelectorAll('.food-item');
    
    if (!foodItemsGrid) return;
    
    // Update grid columns and add data attribute for responsive design
    foodItemsGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    foodItemsGrid.setAttribute('data-columns', gridSize);
    
    // Update item sizes
    let minHeight, fontSize, padding;
    
    switch (itemSize) {
        case 'compact':
            minHeight = '140px';
            fontSize = '14px';
            padding = '8px';
            break;
        case 'large':
            minHeight = '220px';
            fontSize = '18px';
            padding = '15px';
            break;
        default: // normal
            minHeight = '180px';
            fontSize = '16px';
            padding = '10px';
    }
    
    foodItems.forEach(item => {
        item.style.minHeight = minHeight;
        item.style.padding = padding;
        
        const itemName = item.querySelector('.item-name');
        const itemPrice = item.querySelector('.item-price');
        const addButton = item.querySelector('.add-to-bill');
        
        if (itemName) itemName.style.fontSize = fontSize;
        if (itemPrice) itemPrice.style.fontSize = fontSize;
        if (addButton) addButton.style.fontSize = fontSize;
    });
}

// Function to load the Frequent items section
async function loadFrequent(mainContent, billPanel) {
    mainContent.scrollTop = 0;
    mainContent.style.marginLeft = "200px";
    
    // Dynamic margin calculation based on bill panel width
    const billPanelWidth = parseInt(billPanel.style.width || '600', 10);
    mainContent.style.marginRight = (billPanelWidth + 20) + 'px';

    // Get frequent items
    const foodItems = await ipcRenderer.invoke("get-frequent-items");

    if (foodItems.length > 0) {
        mainContent.innerHTML = `
            <div class='section-title' style="margin-bottom: 20px;">
                <h2 style="color: #0D3B66; font-size: 28px; text-align: center;">Frequent Items</h2>
            </div>
            <div class="home-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div class="view-controls" style="display: flex; gap: 10px; align-items: center;">
                    <label style="color: #0D3B66; font-weight: 600;">View:</label>
                    <select id="gridSizeSelector" style="padding: 8px 12px; border: 2px solid #0D3B66; border-radius: 8px; background: white; color: #0D3B66;">
                        <option value="2">2 Columns</option>
                        <option value="3">3 Columns</option>
                        <option value="4" selected>4 Columns</option>
                        <option value="5">5 Columns</option>
                        <option value="6">6 Columns</option>
                    </select>
                    <select id="itemSizeSelector" style="padding: 8px 12px; border: 2px solid #0D3B66; border-radius: 8px; background: white; color: #0D3B66;">
                        <option value="compact">Compact</option>
                        <option value="normal" selected>Normal</option>
                        <option value="large">Large</option>
                    </select>
                </div>
                <input type="text" id="searchBarforFrequent" placeholder="Search frequent items..." 
                    style="padding: 12px 16px; border: 2px solid #ccc; border-radius: 20px; width: 400px; font-size: 14px;">
            </div>
            <div class="food-items" id="foodItemsGrid" style="
                display: grid; 
                grid-template-columns: repeat(4, 1fr); 
                gap: 20px;
                transition: all 0.3s ease;
            ">
                ${foodItems
                    .map(
                        (item) => 
                        `<div class="food-item" data-item-id="${item.fid}" style="
                            border: 2px solid ${item.veg == 1 ? 'green' : 'red'}; 
                            padding: 10px; 
                            text-align: center; 
                            border-radius: 20px; 
                            background: ${item.veg == 1 ? '#EFFBF0' : '#FFEBEB'};
                            display: flex; 
                            flex-direction: column; 
                            justify-content: space-between; 
                            min-height: 180px;
                            transition: all 0.3s ease;
                            cursor: pointer;
                        ">
                            
                            <div style="flex-grow: 1;">
                                <h3 class="item-name" style="margin-bottom: 10px; font-size: 16px; line-height: 1.3;">
                                    ${item.fname}
                                    <br style="line-height:5px;display:block"> 
                                    <span class="veg-indicator" style="font-size: 18px;">
                                        ${item.veg ? 
                                            '🌱' : 
                                            '🍗'
                                        }
                                    </span>
                                </h3>
                            </div>
                            <p class="item-price" style="margin: 5px 0; font-weight: 600; color: #0D3B66;">Price: ₹${item.cost}</p>
                            <div class="quantity-control" style="display: flex; align-items: center; justify-content: center; gap: 10px; margin: 10px 0;">
                                <button class="decrease-quantity" data-fid="${item.fid}" 
                                    style="font-size: 16px; padding: 5px 10px; width: 30px; height: 30px; border-radius: 8px; color: white; background: #0D3B66; border: none; cursor: pointer; transition: all 0.2s ease;">-</button>
                                <span class="quantity" id="quantity-${item.fid}" style="font-weight: 600; font-size: 16px; min-width: 20px; text-align: center;">1</span>
                                <button class="increase-quantity" data-fid="${item.fid}" 
                                    style="font-size: 16px; padding: 5px 10px; width: 30px; height: 30px; border-radius: 8px; color: white; background: #0D3B66; border: none; cursor: pointer; transition: all 0.2s ease;">+</button>
                            </div>

                            <button class="add-to-bill" data-fid="${item.fid}" data-fname="${item.fname}" data-price="${item.cost}" data-category="${item.category}"
                                style="font-size: 17px; padding: 10px; width: 100%; height: 40px; border-radius: 20px; 
                                color: white; background: #0D3B66; border: none; cursor: pointer; font-weight: 600; transition: all 0.2s ease; margin-top: auto;">
                                ADD
                            </button>
                        </div>`
                    )
                    .join("")}
            </div>`;

        billPanel.style.display = "block";
        
        // Initialize grid controls
        initializeGridControls();
        
        // Add search functionality
        document.querySelector("#searchBarforFrequent").addEventListener("input", (event) => {
            const searchQuery = event.target.value.toLowerCase();
            document.querySelectorAll(".food-item").forEach((item) => {
                const foodName = item.querySelector(".item-name").textContent.toLowerCase();
                if (foodName.includes(searchQuery)) {
                    item.style.display = "flex";
                } else {
                    item.style.display = "none";
                }
            });
        });

        // Add hover effects
        document.querySelectorAll(".food-item").forEach(item => {
            item.addEventListener("mouseenter", () => {
                item.style.transform = "translateY(-5px)";
                item.style.boxShadow = "0 8px 16px rgba(13, 59, 102, 0.2)";
            });
            
            item.addEventListener("mouseleave", () => {
                item.style.transform = "translateY(0)";
                item.style.boxShadow = "none";
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
                addToBill(itemId, itemName, price, quantity, category);
                
                // Visual feedback
                event.target.style.background = "#28a745";
                event.target.textContent = "ADDED!";
                setTimeout(() => {
                    event.target.style.background = "#0D3B66";
                    event.target.textContent = "ADD";
                }, 1000);
            });
            
            button.addEventListener("mouseenter", () => {
                button.style.background = "#1a4f7a";
            });
            
            button.addEventListener("mouseleave", () => {
                button.style.background = "#0D3B66";
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
            
            button.addEventListener("mouseenter", () => {
                button.style.background = "#c82333";
            });
            
            button.addEventListener("mouseleave", () => {
                button.style.background = "#0D3B66";
            });
        });

        document.querySelectorAll(".increase-quantity").forEach(button => {
            button.addEventListener("click", (event) => {
                const itemId = event.target.getAttribute("data-fid");
                const quantityElement = document.getElementById(`quantity-${itemId}`);
                let currentQuantity = parseInt(quantityElement.textContent);
                quantityElement.textContent = currentQuantity + 1;
            });
            
            button.addEventListener("mouseenter", () => {
                button.style.background = "#28a745";
            });
            
            button.addEventListener("mouseleave", () => {
                button.style.background = "#0D3B66";
            });
        });
    } else {
        // Show message when no frequent items are available
        mainContent.innerHTML = `
            <div style="text-align: center; margin-top: 100px; color: #555;">
                <h2>No frequent items marked</h2>
                <p>Mark items as frequent in Settings → Customize Panel to see them here.</p>
            </div>
        `;
    }
}

// Export the functions
module.exports = { loadHome, loadFrequent };