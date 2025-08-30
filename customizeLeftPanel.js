const { ipcRenderer } = require('electron');
const { createTextPopup } = require("./textPopup");

function loadCustomizeLeftPanel(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    mainContent.innerHTML = `
        <div class="customize-panel-wrapper">
            <div class="customize-header">
                <h2 class="customize-title">Customize Home Panel Layout</h2>
                <p class="customize-subtitle">Manage categories order and frequent items</p>
            </div>
            
            <div class="customize-content">
                <div class="categories-list-container">
                    <h3 class="section-title">Available Categories</h3>
                    <p class="section-description">Drag items to reorder them. The "All" button will always appear first.</p>
                    
                    <ul id="categoriesSortableList" class="sortable-list">
                        <!-- Categories will be populated here -->
                    </ul>
                </div>
                
                <div class="frequent-items-container" style="margin-top: 30px;">
                    <h3 class="section-title">Frequent Items</h3>
                    <p class="section-description">Mark items as frequent to show them in the Frequent section</p>
                    
                    <div id="frequentItemsSection">
                        <!-- Frequent items will be populated here -->
                    </div>
                </div>
                
                <div class="customize-actions">
                    <button id="saveLayoutBtn" class="btn btn-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        Save Layout
                    </button>
                    
                    <button id="resetLayoutBtn" class="btn btn-secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M2.5 2v6h6M21.5 22v-6h-6"></path>
                            <path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"></path>
                        </svg>
                        Reset to Default
                    </button>
                </div>
            </div>
        </div>
    `;

    loadCategoriesForCustomization();
    loadFrequentItemsForCustomization();
    setupEventListeners();
}

async function loadCategoriesForCustomization() {
    try {
        // Get all active categories
        const categories = await ipcRenderer.invoke("get-categories");
        
        // Get saved order if exists
        const savedOrder = await ipcRenderer.invoke("get-category-order");
        
        let categoriesList = categories.map(cat => cat.catname);
        
        // Apply saved order if available
        if (savedOrder && savedOrder.length > 0) {
            // Filter out any categories that might have been deleted
            const validOrder = savedOrder.filter(catName => 
                categoriesList.includes(catName)
            );
            
            // Add any new categories that aren't in the saved order
            const newCategories = categoriesList.filter(catName => 
                !validOrder.includes(catName)
            );
            
            categoriesList = [...validOrder, ...newCategories];
        }

        const sortableList = document.getElementById("categoriesSortableList");
        
        // Always add "All" button first
        sortableList.innerHTML = `
            <li class="sortable-item" data-category="All" draggable="true">
                <div class="item-handle">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="5" r="1"></circle>
                        <circle cx="9" cy="12" r="1"></circle>
                        <circle cx="9" cy="19" r="1"></circle>
                        <circle cx="15" cy="5" r="1"></circle>
                        <circle cx="15" cy="12" r="1"></circle>
                        <circle cx="15" cy="19" r="1"></circle>
                    </svg>
                </div>
                <span class="item-name">All</span>
                <span class="item-badge">Always First</span>
            </li>
        `;

        // Add other categories
        categoriesList.forEach(category => {
            if (category !== "All") {
                sortableList.innerHTML += `
                    <li class="sortable-item" data-category="${category}" draggable="true">
                        <div class="item-handle">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="9" cy="5" r="1"></circle>
                                <circle cx="9" cy="12" r="1"></circle>
                                <circle cx="9" cy="19" r="1"></circle>
                                <circle cx="15" cy="5" r="1"></circle>
                                <circle cx="15" cy="12" r="1"></circle>
                                <circle cx="15" cy="19" r="1"></circle>
                            </svg>
                        </div>
                        <span class="item-name">${category}</span>
                    </li>
                `;
            }
        });

        setupDragAndDrop();

    } catch (error) {
        console.error("Error loading categories:", error);
        createTextPopup("Error loading categories. Please try again.");
    }
}

async function loadFrequentItemsForCustomization() {
    try {
        // Get all food items
        const allItems = await ipcRenderer.invoke("get-all-food-items");
        
        // Get current frequent items
        const miscData = await ipcRenderer.invoke("load-miscellaneous");
        const frequentItemIds = miscData.frequentItems || [];
        
        const frequentSection = document.getElementById("frequentItemsSection");
        
        if (allItems.length === 0) {
            frequentSection.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #666;">
                    <p>No items available to mark as frequent.</p>
                </div>
            `;
            return;
        }
        
        frequentSection.innerHTML = `
            <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
                ${allItems.map(item => `
                    <div class="frequent-item" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 16px;">${item.veg ? "🌱" : "🍖"}</span>
                            <span style="font-weight: 500;">${item.fname}</span>
                            <span style="color: #666; font-size: 14px;">₹${item.cost}</span>
                        </div>
                        <label class="frequent-toggle" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                            <input type="checkbox" class="frequent-checkbox" data-fid="${item.fid}" 
                                ${frequentItemIds.includes(item.fid) ? 'checked' : ''} 
                                style="opacity: 0; width: 0; height: 0;">
                            <span class="frequent-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; 
                                background-color: ${frequentItemIds.includes(item.fid) ? '#4CAF50' : '#ccc'}; 
                                transition: .4s; border-radius: 24px;">
                                <span style="position: absolute; content: ''; height: 18px; width: 18px; 
                                    left: ${frequentItemIds.includes(item.fid) ? '26px' : '3px'}; bottom: 3px; 
                                    background-color: white; transition: .4s; border-radius: 50%;"></span>
                            </span>
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add event listeners for toggle switches
        const toggles = document.querySelectorAll('.frequent-checkbox');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', handleFrequentToggle);
        });
        
    } catch (error) {
        console.error("Error loading frequent items:", error);
        createTextPopup("Error loading frequent items. Please try again.");
    }
}

function handleFrequentToggle(event) {
    const checkbox = event.target;
    const slider = checkbox.nextElementSibling;
    const sliderButton = slider.querySelector('span');
    
    if (checkbox.checked) {
        slider.style.backgroundColor = '#4CAF50';
        sliderButton.style.left = '26px';
    } else {
        slider.style.backgroundColor = '#ccc';
        sliderButton.style.left = '3px';
    }
}

function setupDragAndDrop() {
    const sortableList = document.getElementById("categoriesSortableList");
    const items = sortableList.querySelectorAll('.sortable-item');
    
    items.forEach(item => {
        item.addEventListener('dragstart', () => {
            item.classList.add('dragging');
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });
    });
    
    sortableList.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(sortableList, e.clientY);
        const draggable = document.querySelector('.dragging');
        
        // Don't allow dragging the "All" item
        if (draggable && draggable.dataset.category === "All") {
            return;
        }
        
        // Don't allow dropping before the "All" item
        if (afterElement && afterElement.dataset.category === "All") {
            const firstItem = sortableList.querySelector('.sortable-item:first-child');
            if (firstItem && firstItem.nextSibling) {
                sortableList.insertBefore(draggable, firstItem.nextSibling.nextSibling);
            }
            return;
        }
        
        if (afterElement == null) {
            sortableList.appendChild(draggable);
        } else {
            sortableList.insertBefore(draggable, afterElement);
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.sortable-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function setupEventListeners() {
    // Save layout button
    document.getElementById("saveLayoutBtn").addEventListener("click", saveCategoryOrder);
    
    // Reset layout button
    document.getElementById("resetLayoutBtn").addEventListener("click", resetCategoryOrder);
}

async function saveCategoryOrder() {
    try {
        const sortableList = document.getElementById("categoriesSortableList");
        const items = sortableList.querySelectorAll('.sortable-item');
        
        // Skip the first item ("All") and get the order of other categories
        const categoryOrder = [];
        
        for (let i = 1; i < items.length; i++) {
            categoryOrder.push(items[i].dataset.category);
        }
        
        // Get frequent items
        const frequentCheckboxes = document.querySelectorAll('.frequent-checkbox');
        const frequentItems = [];
        
        frequentCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                frequentItems.push(parseInt(checkbox.dataset.fid));
            }
        });
        
        // Save category order
        await ipcRenderer.invoke("save-category-order", categoryOrder);
        
        // Save frequent items
        const miscData = await ipcRenderer.invoke("load-miscellaneous");
        miscData.frequentItems = frequentItems;
        
        ipcRenderer.send('save-miscellaneous', miscData);
        
        // Wait for save response
        ipcRenderer.once('save-miscellaneous-response', (event, response) => {
            if (response.success) {
                createTextPopup("Layout and frequent items saved successfully! The changes will take effect when you return to the Home tab.");
            } else {
                createTextPopup("Error saving frequent items: " + response.message);
            }
        });
        
    } catch (error) {
        console.error("Error saving category order:", error);
        createTextPopup("Error saving layout. Please try again.");
    }
}

async function resetCategoryOrder() {
    try {
        const confirmed = confirm("Are you sure you want to reset the category order to default? This cannot be undone.");
        if (!confirmed) return;
        
        await ipcRenderer.invoke("reset-category-order");
        createTextPopup("Layout reset to default successfully!");
        
        // Reload the categories list and frequent items
        loadCategoriesForCustomization();
        loadFrequentItemsForCustomization();
        
    } catch (error) {
        console.error("Error resetting category order:", error);
        createTextPopup("Error resetting layout. Please try again.");
    }
}

module.exports = { loadCustomizeLeftPanel };