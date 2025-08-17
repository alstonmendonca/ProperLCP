const { ipcRenderer } = require("electron");
const { createTextPopup } = require("./textPopup");

// Main function to load inventory content
function loadInventory(mainContent, billPanel) {
    mainContent.style.marginLeft = "0px";
    mainContent.style.marginRight = "0px";
    
    mainContent.innerHTML = `
        <div class='section-title'>
            <h2>Inventory</h2>
        </div>
        <div class="search-container">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="inventorySearchInv" placeholder="Search inventory items...">
        </div>
        <div id="lowStockBannerInv" class="low-stock-banner" style="display: none;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>Items running low</span>
        </div>
        <div id="lowStockItemsInv" class="inventory-grid"></div>
        <div id="inventoryTabDivInv"></div>
    `;
    
    document.getElementById("inventorySearchInv").addEventListener("input", filterInventory);
    billPanel.style.display = 'none';
    fetchInventoryList();
}

function filterInventory() {
    const searchTerm = document.getElementById("inventorySearchInv").value.toLowerCase();
    const inventoryItems = document.querySelectorAll(".inventory-item-box:not(#addInventoryItemBoxInv)");
    
    inventoryItems.forEach(item => {
        const itemName = item.querySelector("h3").textContent.toLowerCase();
        if (itemName.includes(searchTerm)) {
            item.style.display = "flex";
        } else {
            item.style.display = "none";
        }
    });
}

function fetchInventoryList() {
    ipcRenderer.send("get-inventory-list");
}

ipcRenderer.on("inventory-list-response", (event, data) => {
  const inventoryItems = Array.isArray(data.inventory) ? data.inventory : [];
  const inventoryTabDiv = document.getElementById("inventoryTabDivInv");
  const lowStockBanner = document.getElementById("lowStockBannerInv");
  const lowStockItemsDiv = document.getElementById("lowStockItemsInv");

  // Clear previous contents
  inventoryTabDiv.innerHTML = "";
  lowStockItemsDiv.innerHTML = "";

  // Start grid with Add box always visible
  let gridHTML = `
    <div class="inventory-grid">
      <div class="inventory-item-box" id="addInventoryItemBoxInv" onclick="window.InventoryFunctions.openAddInventoryItemPopupInv()">
        <svg class="add-icon" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <p>Add New Item</p>
      </div>
  `;

  // Partition low-stock (<5) and normal items
  const lowStockItems = inventoryItems.filter(item => Number(item.current_stock) < 5);
  const normalStockItems = inventoryItems.filter(item => Number(item.current_stock) >= 5);

  // Build low-stock section (use a local string and set once)
  if (lowStockItems.length > 0) {
    lowStockBanner.style.display = "flex";

    let lowHtml = "";
    for (const item of lowStockItems) {
      // escape single quotes to safely inject into onclick single-quoted args
      const safeName = String(item.inv_item).replace(/'/g, "\\'").replace(/\n/g, " ");
      lowHtml += `
        <div class="inventory-item-box low-stock">
          <h3>${item.inv_item}</h3>
          <div class="inventory-meta-inv">
            <div class="inventory-id-inv">ID: ${item.inv_no}</div>
            <div class="stock-count-inv ${item.current_stock < 1 ? 'out-of-stock' : ''}">
              Stock: ${item.current_stock}
            </div>
          </div>
          <div class="inventory-actions-inv">
            <button class="restock-btn-inv" onclick="window.InventoryFunctions.openRestockPopupInv(${item.inv_no}, '${safeName}', ${item.current_stock})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12h3l3-9 6 18 3-9h3"></path>
              </svg>
              Restock
            </button>
            <button class="edit-btn-inv" onclick="window.InventoryFunctions.openEditInventoryItemPopupInv(${item.inv_no}, '${safeName}', ${item.current_stock})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit
            </button>
          </div>
        </div>
      `;
    }
    lowStockItemsDiv.innerHTML = lowHtml;
  } else {
    lowStockBanner.style.display = "none";
  }

  // If no normal-stock items and no low-stock items, show empty state below Add button
  if (normalStockItems.length === 0 && lowStockItems.length === 0) {
    gridHTML += `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #64748b;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:12px;">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <div style="font-size: 18px; margin-bottom: 6px;">No inventory items found</div>
        <div style="color:#94a3b8;">Click <strong>Add New Item</strong> to create the first inventory item.</div>
      </div>
    `;
  } else {
    // Append normal-stock item boxes
    for (const item of normalStockItems) {
      const safeName = String(item.inv_item).replace(/'/g, "\\'").replace(/\n/g, " ");
      gridHTML += `
        <div class="inventory-item-box">
          <h3>${item.inv_item}</h3>
          <div class="inventory-meta-inv">
            <div class="inventory-id-inv">ID: ${item.inv_no}</div>
            <div class="stock-count-inv">
              Stock: ${item.current_stock}
            </div>
          </div>
          <div class="inventory-actions-inv">
            <button class="restock-btn-inv" onclick="window.InventoryFunctions.openRestockPopupInv(${item.inv_no}, '${safeName}', ${item.current_stock})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12h3l3-9 6 18 3-9h3"></path>
              </svg>
              Restock
            </button>
            <button class="edit-btn-inv" onclick="window.InventoryFunctions.openEditInventoryItemPopupInv(${item.inv_no}, '${safeName}', ${item.current_stock})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit
            </button>
            <button class="delete-btn-inv" onclick="window.InventoryFunctions.openDeleteInventoryItemPopupInv(${item.inv_no}, '${safeName}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"></path>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Delete
            </button>
          </div>
        </div>
      `;
    }
  }

  // Close grid and render
  gridHTML += `</div>`;
  inventoryTabDiv.innerHTML = gridHTML;
});


function openRestockPopupInv(inv_no, inv_item, current_stock) {
    closeModalInv();

    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.addEventListener("click", closeModalInv);

    const popup = document.createElement("div");
    popup.classList.add("inventory-edit-popup-inv");
    popup.innerHTML = `
        <div class="inventory-popup-content-inv">
            <h2>Restock Item</h2>
            <div class="inventory-form-group-inv">
                <label>Item Name</label>
                <input type="text" id="restockItemNameInv" value="${inv_item}" readonly>
            </div>
            <div class="inventory-form-group-inv">
                <label>Current Stock</label>
                <input type="number" id="currentStockInv" value="${current_stock}" readonly>
            </div>
            <div class="inventory-form-group-inv">
                <label>Quantity to Add</label>
                <input type="number" id="restockQuantityInv" min="1" value="1">
            </div>
            <div class="popup-buttons-inv">
                <button id="cancelRestockBtnInv" class="secondary-btn-inv">
                    Cancel
                </button>
                <button id="confirmRestockBtnInv" class="primary-btn-inv">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 12h3l3-9 6 18 3-9h3"></path>
                    </svg>
                    Confirm Restock
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    document.getElementById("confirmRestockBtnInv").addEventListener("click", () => {
        const quantity = parseInt(document.getElementById("restockQuantityInv").value);
        
        if (isNaN(quantity)) {
            createTextPopup("Please enter a valid quantity.");
            return;
        }
        
        if (quantity <= 0) {
            createTextPopup("Quantity must be greater than 0.");
            return;
        }

        ipcRenderer.send("restock-inventory-item", { 
            inv_no, 
            quantity 
        });
    });

    document.getElementById("cancelRestockBtnInv").addEventListener("click", closeModalInv);
}

function openEditInventoryItemPopupInv(inv_no, inv_item, current_stock) {
    closeModalInv();

    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.addEventListener("click", closeModalInv);

    const popup = document.createElement("div");
    popup.classList.add("inventory-edit-popup-inv");
    popup.innerHTML = `
        <div class="inventory-popup-content-inv">
            <h2>Edit Inventory Item</h2>
            <div class="inventory-form-group-inv">
                <label>Item Name</label>
                <input type="text" id="editItemNameInv" value="${inv_item}" placeholder="Item Name">
            </div>
            <div class="inventory-form-group-inv">
                <label>Current Stock</label>
                <input type="number" id="editStockCountInv" value="${current_stock}" min="0">
            </div>
            <div class="popup-buttons-inv">
                <button id="cancelEditBtnInv" class="secondary-btn-inv">
                    Cancel
                </button>
                <button id="saveChangesBtnInv" class="primary-btn-inv">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    </svg>
                    Save Changes
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    document.getElementById("saveChangesBtnInv").addEventListener("click", () => {
        const updatedName = document.getElementById("editItemNameInv").value.trim();
        const updatedStock = parseInt(document.getElementById("editStockCountInv").value);

        if (!updatedName) {
            createTextPopup("Please enter an item name.");
            return;
        }

        if (isNaN(updatedStock)) {
            createTextPopup("Please enter a valid stock count.");
            return;
        }

        if (updatedStock < 0) {
            createTextPopup("Stock count cannot be negative.");
            return;
        }

        ipcRenderer.send("update-inventory-item", { 
            inv_no, 
            inv_item: updatedName, 
            current_stock: updatedStock 
        });
    });

    document.getElementById("cancelEditBtnInv").addEventListener("click", closeModalInv);
}

function openDeleteInventoryItemPopupInv(inv_no, inv_item) {
    closeModalInv(); // Close any existing popup first

    // Create overlay
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.addEventListener("click", closeModalInv);

    // Create popup
    const popup = document.createElement("div");
    popup.classList.add("inventory-edit-popup-inv");
    popup.innerHTML = `
        <div class="inventory-popup-content-inv">
            <h2>Delete Inventory Item</h2>
            <p>Are you sure you want to delete the item <strong>${inv_item}</strong>?</p>
            <div class="popup-buttons-inv">
                <button id="cancelDeleteBtnInv" class="secondary-btn-inv">Cancel</button>
                <button id="confirmDeleteBtnInv" class="primary-btn-inv">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18"></path>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                    Delete
                </button>
            </div>
        </div>
    `;

    // Append to DOM
    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    // Confirm delete
    popup.querySelector("#confirmDeleteBtnInv").addEventListener("click", () => {
        ipcRenderer.send("delete-inventory-item", inv_no);
    });

    // Cancel delete
    popup.querySelector("#cancelDeleteBtnInv").addEventListener("click", closeModalInv);
}


ipcRenderer.on("inventory-item-deleted", () => {
    fetchInventoryList();
    closeModalInv();
});
function openAddInventoryItemPopupInv() {
    closeModalInv();

    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.addEventListener("click", closeModalInv);

    const popup = document.createElement("div");
    popup.classList.add("inventory-edit-popup-inv");
    popup.innerHTML = `
        <div class="inventory-popup-content-inv">
            <h2>Add Inventory Item</h2>
            <div class="inventory-form-group-inv">
                <label>Item Name</label>
                <input type="text" id="newItemNameInv" placeholder="Item Name">
            </div>
            <div class="inventory-form-group-inv">
                <label>Initial Stock</label>
                <input type="number" id="initialStockInv" value="0" min="0">
            </div>
            <div class="popup-buttons-inv">
                <button id="cancelAddBtnInv" class="secondary-btn-inv">
                    Cancel
                </button>
                <button id="addItemBtnInv" class="primary-btn-inv">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14"></path>
                        <path d="M5 12h14"></path>
                    </svg>
                    Add Item
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    document.getElementById("addItemBtnInv").addEventListener("click", () => {
        const itemName = document.getElementById("newItemNameInv").value.trim();
        const initialStock = parseInt(document.getElementById("initialStockInv").value);

        if (!itemName) {
            createTextPopup("Please enter an item name.");
            return;
        }

        if (isNaN(initialStock)) {
            createTextPopup("Please enter a valid stock count.");
            return;
        }

        if (initialStock < 0) {
            createTextPopup("Stock count cannot be negative.");
            return;
        }

        ipcRenderer.send("add-inventory-item", { 
            inv_item: itemName, 
            current_stock: initialStock 
        });
    });

    document.getElementById("cancelAddBtnInv").addEventListener("click", closeModalInv);
}

function closeModalInv() {
    const popup = document.querySelector(".inventory-edit-popup-inv");
    const overlay = document.querySelector(".overlay");
    if (popup) document.body.removeChild(popup);
    if (overlay) document.body.removeChild(overlay);
}

ipcRenderer.on("inventory-item-added", () => {
    fetchInventoryList();
    closeModalInv();
});

ipcRenderer.on("inventory-item-updated", () => {
    fetchInventoryList();
    closeModalInv();
});

ipcRenderer.on("inventory-item-restocked", () => {
    fetchInventoryList();
    closeModalInv();
});

module.exports = { 
    loadInventory,
    fetchInventoryList,
    openRestockPopupInv,
    openEditInventoryItemPopupInv,
    openAddInventoryItemPopupInv
};

// Attach functions to window object to make them available in HTML onclick handlers
window.InventoryFunctions = {
    openAddInventoryItemPopupInv,
    openRestockPopupInv,
    openEditInventoryItemPopupInv,
    openDeleteInventoryItemPopupInv,
    closeModalInv
};