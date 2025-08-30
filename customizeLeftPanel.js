const { ipcRenderer } = require('electron');
const { createTextPopup, createConfirmPopup } = require("./textPopup");

function loadCustomizeLeftPanel(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    mainContent.innerHTML = `
        <div style="padding: 30px; max-width: 1200px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #0D3B66; padding-bottom: 15px;">
                <h2 style="color: #0D3B66; font-size: 2.5rem; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Customize Panel</h2>
                <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Manage categories order and frequent items</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px;">
                <div style="background: white; border: 2px solid #0D3B66; border-radius: 12px; padding: 25px; box-shadow: 0 4px 12px rgba(13, 59, 102, 0.1);">
                    <h3 style="color: #0D3B66; font-size: 1.5rem; font-weight: 600; margin: 0 0 15px 0; text-align: center; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D3B66" stroke-width="2">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        Category Order
                    </h3>
                    <p style="color: #666; font-size: 14px; text-align: center; margin-bottom: 20px;">Drag items to reorder them. The "All" button will always appear first.</p>
                    
                    <ul id="categoriesSortableList" style="list-style: none; padding: 0; margin: 0;">
                        <!-- Categories will be populated here -->
                    </ul>
                </div>
                
                <div style="background: white; border: 2px solid #0D3B66; border-radius: 12px; padding: 25px; box-shadow: 0 4px 12px rgba(13, 59, 102, 0.1);">
                    <h3 style="color: #0D3B66; font-size: 1.5rem; font-weight: 600; margin: 0 0 15px 0; text-align: center; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D3B66" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9 17 14.74 18.18 21.02 12 17.77 5.82 21.02 7 14.74 2 9 8.91 8.26 12 2"/>
                        </svg>
                        Frequent Items
                    </h3>
                    <p style="color: #666; font-size: 14px; text-align: center; margin-bottom: 20px;">Mark items as frequent to show them in the Frequent section</p>
                    
                    <div id="frequentItemsSection">
                        <!-- Frequent items will be populated here -->
                    </div>
                </div>
            </div>
            
            <div style="text-align: center;">
                <button id="saveLayoutBtn" style="background: #0D3B66; color: white; border: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-right: 15px; box-shadow: 0 3px 8px rgba(13, 59, 102, 0.3); transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                     Save Layout
                </button>
                
                <button id="resetCategoriesBtn" style="background: white; color: #dc3545; border: 2px solid #dc3545; padding: 12px 30px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-right: 10px; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2.5 2v6h6M21.5 22v-6h-6"></path>
                        <path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"></path>
                    </svg>
                     Reset Categories
                </button>
                
                <button id="resetFrequentBtn" style="background: white; color: #dc3545; border: 2px solid #dc3545; padding: 12px 30px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        <path d="m9 14 2 2 4-4"></path>
                    </svg>
                     Clear Frequent Items
                </button>
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
            <li style="display: flex; align-items: center; padding: 15px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 10px; margin-bottom: 10px; cursor: move; transition: all 0.2s ease;" data-category="All" draggable="true">
                <div style="margin-right: 12px; color: #0D3B66;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="5" r="1"></circle>
                        <circle cx="9" cy="12" r="1"></circle>
                        <circle cx="9" cy="19" r="1"></circle>
                        <circle cx="15" cy="5" r="1"></circle>
                        <circle cx="15" cy="12" r="1"></circle>
                        <circle cx="15" cy="19" r="1"></circle>
                    </svg>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D3B66" stroke-width="2" style="margin-right: 8px;">
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                    <path d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4"/>
                </svg>
                <span style="font-weight: 600; color: #0D3B66; flex-grow: 1;">All</span>
                <span style="background: #0D3B66; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">Always First</span>
            </li>
        `;

        // Add other categories
        categoriesList.forEach(category => {
            if (category !== "All") {
                sortableList.innerHTML += `
                    <li style="display: flex; align-items: center; padding: 15px; background: white; border: 1px solid #0D3B66; border-radius: 10px; margin-bottom: 10px; cursor: move; transition: all 0.2s ease;" data-category="${category}" draggable="true">
                        <div style="margin-right: 12px; color: #0D3B66;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="9" cy="5" r="1"></circle>
                                <circle cx="9" cy="12" r="1"></circle>
                                <circle cx="9" cy="19" r="1"></circle>
                                <circle cx="15" cy="5" r="1"></circle>
                                <circle cx="15" cy="12" r="1"></circle>
                                <circle cx="15" cy="19" r="1"></circle>
                            </svg>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D3B66" stroke-width="2" style="margin-right: 8px;">
                            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                        </svg>
                        <span style="font-weight: 500; color: #0D3B66; flex-grow: 1;">${category}</span>
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
                <div style="text-align: center; padding: 30px; color: #666; background: #f8f9fa; border-radius: 10px; border: 1px solid #e9ecef;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" style="margin-bottom: 15px;">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                        <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                    <p style="margin: 0; font-size: 16px; font-weight: 500;">No items available to mark as frequent.</p>
                </div>
            `;
            return;
        }
        
        frequentSection.innerHTML = `
            <div style="max-height: 350px; overflow-y: auto; border: 1px solid #0D3B66; border-radius: 10px; padding: 15px; background: #f8f9fa;">
                ${allItems.map(item => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: white; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e9ecef; transition: all 0.2s ease;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${item.veg ? '#22c55e' : '#ef4444'}" stroke-width="2">
                                ${item.veg 
                                    ? '<path d="M12 2l9 7-9 13L3 9l9-7z"/>' 
                                    : '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>'
                                }
                            </svg>
                            <div>
                                <span style="font-weight: 600; color: #0D3B66; display: block;">${item.fname}</span>
                                <span style="color: #666; font-size: 14px;">₹${item.cost}</span>
                            </div>
                        </div>
                        <label style="position: relative; display: inline-block; width: 60px; height: 30px;">
                            <input type="checkbox" class="frequent-checkbox" data-fid="${item.fid}" 
                                ${frequentItemIds.includes(item.fid) ? 'checked' : ''} 
                                style="opacity: 0; width: 0; height: 0;">
                            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; 
                                background-color: ${frequentItemIds.includes(item.fid) ? '#0D3B66' : '#ccc'}; 
                                transition: .3s; border-radius: 30px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                <span style="position: absolute; content: ''; height: 22px; width: 22px; 
                                    left: ${frequentItemIds.includes(item.fid) ? '32px' : '4px'}; bottom: 2px; 
                                    background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></span>
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
        slider.style.backgroundColor = '#0D3B66';
        sliderButton.style.left = '32px';
    } else {
        slider.style.backgroundColor = '#ccc';
        sliderButton.style.left = '4px';
    }
}

function setupDragAndDrop() {
    const sortableList = document.getElementById("categoriesSortableList");
    const items = sortableList.querySelectorAll('li[draggable="true"]');
    
    items.forEach(item => {
        item.addEventListener('dragstart', () => {
            item.classList.add('dragging');
            item.style.opacity = '0.5';
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            item.style.opacity = '1';
        });
        
        // Add hover effects
        item.addEventListener('mouseenter', () => {
            if (!item.classList.contains('dragging')) {
                item.style.transform = 'translateY(-2px)';
                item.style.boxShadow = '0 4px 8px rgba(13, 59, 102, 0.2)';
            }
        });
        
        item.addEventListener('mouseleave', () => {
            if (!item.classList.contains('dragging')) {
                item.style.transform = 'translateY(0)';
                item.style.boxShadow = 'none';
            }
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
            const firstItem = sortableList.querySelector('li[data-category="All"]');
            if (firstItem && firstItem.nextSibling) {
                sortableList.insertBefore(draggable, firstItem.nextSibling);
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
    const draggableElements = [...container.querySelectorAll('li[draggable="true"]:not(.dragging)')];
    
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
    const saveBtn = document.getElementById("saveLayoutBtn");
    const resetCategoriesBtn = document.getElementById("resetCategoriesBtn");
    const resetFrequentBtn = document.getElementById("resetFrequentBtn");
    
    saveBtn.addEventListener("click", saveCategoryOrder);
    resetCategoriesBtn.addEventListener("click", resetCategoryOrder);
    resetFrequentBtn.addEventListener("click", resetFrequentItems);
    
    // Add hover effects for buttons
    saveBtn.addEventListener('mouseenter', () => {
        saveBtn.style.backgroundColor = '#11487b';
        saveBtn.style.transform = 'translateY(-2px)';
        saveBtn.style.boxShadow = '0 5px 12px rgba(13, 59, 102, 0.4)';
    });
    
    saveBtn.addEventListener('mouseleave', () => {
        saveBtn.style.backgroundColor = '#0D3B66';
        saveBtn.style.transform = 'translateY(0)';
        saveBtn.style.boxShadow = '0 3px 8px rgba(13, 59, 102, 0.3)';
    });
    
    // Reset categories button hover effects
    resetCategoriesBtn.addEventListener('mouseenter', () => {
        resetCategoriesBtn.style.backgroundColor = '#dc3545';
        resetCategoriesBtn.style.color = 'white';
        resetCategoriesBtn.style.transform = 'translateY(-2px)';
        resetCategoriesBtn.style.boxShadow = '0 3px 8px rgba(220, 53, 69, 0.3)';
    });
    
    resetCategoriesBtn.addEventListener('mouseleave', () => {
        resetCategoriesBtn.style.backgroundColor = 'white';
        resetCategoriesBtn.style.color = '#dc3545';
        resetCategoriesBtn.style.transform = 'translateY(0)';
        resetCategoriesBtn.style.boxShadow = 'none';
    });
    
    // Reset frequent items button hover effects
    resetFrequentBtn.addEventListener('mouseenter', () => {
        resetFrequentBtn.style.backgroundColor = '#dc3545';
        resetFrequentBtn.style.color = 'white';
        resetFrequentBtn.style.transform = 'translateY(-2px)';
        resetFrequentBtn.style.boxShadow = '0 3px 8px rgba(220, 53, 69, 0.3)';
    });
    
    resetFrequentBtn.addEventListener('mouseleave', () => {
        resetFrequentBtn.style.backgroundColor = 'white';
        resetFrequentBtn.style.color = '#dc3545';
        resetFrequentBtn.style.transform = 'translateY(0)';
        resetFrequentBtn.style.boxShadow = 'none';
    });
}

async function saveCategoryOrder() {
    try {
        const sortableList = document.getElementById("categoriesSortableList");
        const items = sortableList.querySelectorAll('li[data-category]');
        
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
        
        // Show enhanced success message
        showSuccessMessage("Layout and frequent items saved successfully! The changes will take effect when you return to the Home tab.");
        
    } catch (error) {
        console.error("Error saving category order:", error);
        createTextPopup("Error saving layout. Please try again.");
    }
}

async function resetCategoryOrder() {
    try {
        const { createConfirmPopup } = require("./textPopup");
        createConfirmPopup("Are you sure you want to reset the category order to default? This cannot be undone.", async () => {
            await ipcRenderer.invoke("reset-category-order");
            createTextPopup("Category order reset to default successfully!");
            
            // Reload the categories list
            loadCategoriesForCustomization();
        });
        
    } catch (error) {
        console.error("Error resetting category order:", error);
        createTextPopup("Error resetting category order. Please try again.");
    }
}

async function resetFrequentItems() {
    try {
        const { createConfirmPopup } = require("./textPopup");
        createConfirmPopup("Are you sure you want to clear all frequent items? This cannot be undone.", async () => {
            // Clear all frequent items
            const miscData = await ipcRenderer.invoke("load-miscellaneous");
            miscData.frequentItems = [];
            
            ipcRenderer.send('save-miscellaneous', miscData);
            createTextPopup("All frequent items cleared successfully!");
            
            // Reload the frequent items list
            loadFrequentItemsForCustomization();
        });
        
    } catch (error) {
        console.error("Error clearing frequent items:", error);
        createTextPopup("Error clearing frequent items. Please try again.");
    }
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.innerHTML = `✅ ${message}`;
    successDiv.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        background: #0D3B66;
        color: white;
        padding: 20px 25px;
        border-radius: 10px;
        z-index: 1000;
        font-weight: 600;
        font-size: 16px;
        box-shadow: 0 4px 12px rgba(13, 59, 102, 0.3);
        border-left: 4px solid white;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
    `;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (document.body.contains(successDiv)) {
                document.body.removeChild(successDiv);
            }
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        }, 300);
    }, 4000);
}

module.exports = { loadCustomizeLeftPanel };