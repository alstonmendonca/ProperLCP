const { ipcRenderer } = require('electron');
const { createTextPopup } = require("./textPopup");

function loadArrangeMenu(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    mainContent.innerHTML = `
        <div class="arrange-menu-container" style="padding: 20px;">
            <div class="arrange-menu-header">
                <h2 style="margin-bottom: 8px; color: #0D3B66;">Arrange Menu Items</h2>
                <p style="color: #64748b; margin-bottom: 24px;">Drag and drop items to change their display order within each category</p>
            </div>
            
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                <div style="flex: 1;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Select Category</label>
                    <select id="categorySelect" style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                        font-size: 14px;
                        background: white;
                        cursor: pointer;
                    ">
                        <option value="">Loading categories...</option>
                    </select>
                </div>
                
                <div style="flex: 2;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Search Items</label>
                    <input type="text" id="searchItems" placeholder="Search items in this category..." style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                        font-size: 14px;
                    ">
                </div>
            </div>
            
            <div id="itemsContainer" style="
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 16px;
                background: #f9fafb;
                min-height: 400px;
                max-height: 600px;
                overflow-y: auto;
            ">
                <div style="text-align: center; padding: 40px; color: #6b7280;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px;">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <p>Select a category to view and arrange items</p>
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
                <button id="resetOrderBtn" style="
                    padding: 12px 24px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    background: white;
                    color: #6b7280;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                " onmouseover="this.style.borderColor='#ef4444'; this.style.color='#ef4444'" 
                   onmouseout="this.style.borderColor='#e5e7eb'; this.style.color='#6b7280'">
                    Reset to Default
                </button>
                
                <button id="saveOrderBtn" style="
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    background: #0D3B66;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                " onmouseover="this.style.backgroundColor='#1e40af'" 
                   onmouseout="this.style.backgroundColor='#0D3B66'">
                    Save Order
                </button>
            </div>
        </div>
    `;

    // Load categories
    loadCategories();
    
    // Set up event listeners
    document.getElementById('categorySelect').addEventListener('change', loadCategoryItems);
    document.getElementById('searchItems').addEventListener('input', filterItems);
    document.getElementById('saveOrderBtn').addEventListener('click', saveItemOrder);
    document.getElementById('resetOrderBtn').addEventListener('click', resetItemOrder);
}

async function loadCategories() {
    try {
        const categories = await ipcRenderer.invoke('get-categories');
        const select = document.getElementById('categorySelect');
        
        select.innerHTML = '<option value="">Select a category</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.catid;
            option.textContent = category.catname;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
        createTextPopup('Failed to load categories');
    }
}

async function loadCategoryItems() {
    const categoryId = document.getElementById('categorySelect').value;
    if (!categoryId) return;

    try {
        // Get category name first
        const categories = await ipcRenderer.invoke('get-categories');
        const category = categories.find(cat => cat.catid == categoryId);
        
        if (!category) return;

        // Get items for this category with custom order
        const items = await ipcRenderer.invoke('get-food-items-with-order', category.catname);
        
        displayItems(items, category.catname);
    } catch (error) {
        console.error('Error loading category items:', error);
        createTextPopup('Failed to load items for this category');
    }
}

function displayItems(items, categoryName) {
    const container = document.getElementById('itemsContainer');
    
    if (items.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>No items found in "${categoryName}" category</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="margin-bottom: 16px; padding: 8px; background: #e5e7eb; border-radius: 6px; font-weight: 600;">
            Items in: ${categoryName} (${items.length} items)
        </div>
        <div id="sortableItems" style="display: flex; flex-direction: column; gap: 8px;">
            ${items.map((item, index) => `
                <div class="sortable-item" data-fid="${item.fid}" style="
                    display: flex;
                    align-items: center;
                    padding: 16px;
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    cursor: grab;
                    transition: all 0.2s ease;
                " onmouseover="this.style.borderColor='#0D3B66'; this.style.boxShadow='0 2px 8px rgba(13, 59, 102, 0.1)'" 
                   onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
                    <div style="
                        width: 32px;
                        height: 32px;
                        border-radius: 6px;
                        background: #f3f4f6;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-right: 16px;
                        font-weight: 600;
                        color: #6b7280;
                    ">${index + 1}</div>
                    
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${item.fname}</div>
                        <div style="font-size: 14px; color: #6b7280;">
                            ₹${item.cost} • ${item.veg ? 'Vegetarian' : 'Non-Vegetarian'}
                        </div>
                    </div>
                    
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #9ca3af;">
                        <path d="M12 2l9 7-9 13L3 9l9-7z" style="${item.veg ? 'stroke: #22c55e;' : 'stroke: #ef4444;'}"></path>
                    </svg>
                    
                    <div style="
                        width: 24px;
                        height: 24px;
                        margin-left: 12px;
                        color: #9ca3af;
                    ">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 9l9-7 9 7-9 13L3 9z"></path>
                            <path d="M9 22V12h6v10"></path>
                        </svg>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Initialize drag and drop
    initSortable();
}

function initSortable() {
    const container = document.getElementById('sortableItems');
    let draggedItem = null;

    container.querySelectorAll('.sortable-item').forEach(item => {
        item.setAttribute('draggable', 'true');
        
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', item.getAttribute('data-fid'));
            setTimeout(() => item.style.opacity = '0.5', 0);
        });

        item.addEventListener('dragend', () => {
            draggedItem = null;
            item.style.opacity = '1';
            container.querySelectorAll('.sortable-item').forEach(i => {
                i.style.backgroundColor = '';
                i.style.borderColor = '#e5e7eb';
            });
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        item.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (item !== draggedItem) {
                item.style.backgroundColor = '#f0f9ff';
                item.style.borderColor = '#0D3B66';
            }
        });

        item.addEventListener('dragleave', () => {
            if (item !== draggedItem) {
                item.style.backgroundColor = '';
                item.style.borderColor = '#e5e7eb';
            }
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            if (item !== draggedItem) {
                const allItems = Array.from(container.querySelectorAll('.sortable-item'));
                const fromIndex = allItems.indexOf(draggedItem);
                const toIndex = allItems.indexOf(item);
                
                if (fromIndex < toIndex) {
                    container.insertBefore(draggedItem, item.nextSibling);
                } else {
                    container.insertBefore(draggedItem, item);
                }
                
                // Update numbers
                updateItemNumbers();
            }
        });
    });
}

function updateItemNumbers() {
    const items = document.querySelectorAll('.sortable-item');
    items.forEach((item, index) => {
        const numberDiv = item.querySelector('div:first-child');
        numberDiv.textContent = index + 1;
    });
}

function filterItems() {
    const searchTerm = document.getElementById('searchItems').value.toLowerCase();
    const items = document.querySelectorAll('.sortable-item');
    
    items.forEach(item => {
        const itemName = item.querySelector('div:nth-child(2) div:first-child').textContent.toLowerCase();
        if (itemName.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

async function saveItemOrder() {
    const categoryId = document.getElementById('categorySelect').value;
    if (!categoryId) {
        createTextPopup('Please select a category first');
        return;
    }

    const items = Array.from(document.querySelectorAll('.sortable-item'));
    if (items.length === 0) return;

    const categoryName = document.getElementById('categorySelect').selectedOptions[0].text;
    const itemOrder = items.map(item => parseInt(item.getAttribute('data-fid')));

    try {
        await ipcRenderer.invoke('save-item-order', categoryName, itemOrder);
        createTextPopup('Item order saved successfully!');
    } catch (error) {
        console.error('Error saving item order:', error);
        createTextPopup('Failed to save item order');
    }
}

async function resetItemOrder() {
    const categoryId = document.getElementById('categorySelect').value;
    if (!categoryId) {
        createTextPopup('Please select a category first');
        return;
    }

    const categoryName = document.getElementById('categorySelect').selectedOptions[0].text;
    
    try {
        await ipcRenderer.invoke('reset-item-order', categoryName);
        createTextPopup('Item order reset to default!');
        // Reload the items to show the default order
        loadCategoryItems();
    } catch (error) {
        console.error('Error resetting item order:', error);
        createTextPopup('Failed to reset item order');
    }
}

module.exports = { loadArrangeMenu };