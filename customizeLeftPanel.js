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
                <p class="customize-subtitle">Drag and drop to rearrange the categories displayed in the Home tab</p>
            </div>
            
            <div class="customize-content">
                <div class="categories-list-container">
                    <h3 class="section-title">Available Categories</h3>
                    <p class="section-description">Drag items to reorder them. The "All" button will always appear first.</p>
                    
                    <ul id="categoriesSortableList" class="sortable-list">
                        <!-- Categories will be populated here -->
                    </ul>
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
        
        await ipcRenderer.invoke("save-category-order", categoryOrder);
        createTextPopup("Layout saved successfully! The changes will take effect when you return to the Home tab.");
        
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
        
        // Reload the categories list
        loadCategoriesForCustomization();
        
    } catch (error) {
        console.error("Error resetting category order:", error);
        createTextPopup("Error resetting layout. Please try again.");
    }
}

module.exports = { loadCustomizeLeftPanel };