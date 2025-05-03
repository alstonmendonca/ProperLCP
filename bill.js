const  {createTextPopup} = require("./textPopup");
// Add an item to the bill
function addToBill(itemId, itemName, price, quantity, category = null) {
    const  {createTextPopup} = require("./textPopup");

    if (quantity > 0) {
        const totalPrice = price * quantity;
        const billItemsList = document.getElementById("bill-items-list");

        // Handle category section if category is provided
        let categorySection = billItemsList;
        if (category) {
            const categoryId = `bill-category-${category.replace(/\s+/g, '-')}`;
            categorySection = document.getElementById(categoryId);
            if (!categorySection) {
                categorySection = document.createElement("div");
                categorySection.classList.add("bill-category");
                categorySection.id = categoryId;
                billItemsList.appendChild(categorySection);
            }
        }

        // Check if item already exists
        let existingItem = document.getElementById(`bill-item-${itemId}`);
        if (existingItem) {
            const quantityInput = existingItem.querySelector(".bill-quantity");
            const totalPriceCell = existingItem.querySelector(".bill-total");
            let newQuantity = parseInt(quantityInput.value) + quantity;
            quantityInput.value = newQuantity;
            totalPriceCell.textContent = (price * newQuantity).toFixed(2);
        } else {
            // Create new bill item
            const billItemRow = document.createElement("div");
            billItemRow.classList.add("bill-item");
            billItemRow.id = `bill-item-${itemId}`;

            const itemNameSpan = document.createElement("span");
            itemNameSpan.classList.add("bill-item-name");
            itemNameSpan.textContent = itemName;

            const quantityInput = document.createElement("input");
            quantityInput.type = "number";
            quantityInput.classList.add("bill-quantity");
            quantityInput.value = quantity;
            quantityInput.min = 1;
            quantityInput.addEventListener("input", () => updateQuantityInput(itemId, price));

            const timesSpan = document.createElement("span");
            timesSpan.textContent = " x ";

            const priceSpan = document.createElement("span");
            priceSpan.classList.add("bill-price");
            priceSpan.textContent = price.toFixed(2);

            const equalsSpan = document.createElement("span");
            equalsSpan.textContent = " = ";

            const totalSpan = document.createElement("span");
            totalSpan.classList.add("bill-total");
            totalSpan.textContent = totalPrice.toFixed(2);

            const removeBtn = document.createElement("button");
            removeBtn.textContent = "Remove";
            removeBtn.onclick = () => removeFromBill(itemId);

            billItemRow.append(itemNameSpan, quantityInput, timesSpan, priceSpan, equalsSpan, totalSpan, removeBtn);

            // Append to category or general list
            categorySection.appendChild(billItemRow);
        }

        updateBillTotal();
    } else {
        createTextPopup("Please select a quantity greater than 0 to add to the bill.");
    }
}



function updateQuantityInput(itemId, price) {
    let itemRow = document.getElementById(`bill-item-${itemId}`);
    if (!itemRow) return;

    let quantityInput = itemRow.querySelector(".bill-quantity");
    let totalPriceSpan = itemRow.querySelector(".bill-total");

    let newQuantity = Math.max(1, parseInt(quantityInput.value) || 1);
    quantityInput.value = newQuantity;
    totalPriceSpan.textContent = (price * newQuantity).toFixed(2);

    updateBillTotal();
}

// Function to remove an item from the bill
// Function to remove an item from the bill
function removeFromBill(itemId) {
    const billItem = document.getElementById(`bill-item-${itemId}`);
    if (billItem) {
        billItem.remove();
        updateBillTotal();
    }
}

// Function to reset the bill by removing all items
function resetBill() {
    const billItemsList = document.getElementById("bill-items-list");
    // Clear all items from the bill
    billItemsList.innerHTML = '';

    // Reset total display
    document.getElementById("total-amount").textContent = "Total: Rs. 0.00 (Your bill is empty)";

    // Reset discount display
    document.getElementById("discount-applied-display").textContent = "Discount: ₹0.00";

    // Remove or reset the discount fields
    let discountField = document.getElementById("discounted-total");
    if (discountField) {
        discountField.value = 0;
    }

    let discountPercentageInput = document.getElementById("discount-percentage");
    let discountAmountInput = document.getElementById("discount-amount");
    if (discountPercentageInput) {
        discountPercentageInput.value = "";
    }
    if (discountAmountInput) {
        discountAmountInput.value = "";
    }

    // Update the total bill amount
    updateBillTotal();
}


// Function to apply the discount
function applyDiscount() {
    let discountPercentage = parseFloat(document.getElementById("discount-percentage").value) || 0;
    let discountAmount = parseFloat(document.getElementById("discount-amount").value) || 0;
    let totalAmount = 0;

    document.querySelectorAll(".bill-item").forEach(item => {
        let amount = parseFloat(item.querySelector(".bill-total").textContent);
        if (!isNaN(amount)) totalAmount += amount;
    });

    if (discountPercentage < 0 || discountAmount < 0) {
        createTextPopup("Discount cannot be negative.");
        return;
    }

    if (discountPercentage > 0 && discountAmount > 0) {
        createTextPopup("Please apply either a percentage discount OR a fixed amount discount, not both.");
        return;
    }

    if (discountAmount > totalAmount) {
        createTextPopup("Discount amount cannot exceed the total bill amount.");
        return;
    }

    let discountedTotal = totalAmount;
    if (discountPercentage > 0) {
        discountedTotal -= totalAmount * (discountPercentage / 100);
    } else if (discountAmount > 0) {
        discountedTotal -= discountAmount;
    }

    discountedTotal = Math.max(0, Math.round(discountedTotal * 100) / 100);

    let discountField = document.getElementById("discounted-total");
    if (!discountField) {
        discountField = document.createElement("input");
        discountField.type = "hidden";
        discountField.id = "discounted-total";
        document.body.appendChild(discountField);
    }
    discountField.value = discountedTotal;

    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
    document.getElementById("total-amount").textContent = `Total: ${formatter.format(discountedTotal)}`;
    document.getElementById("discount-applied-display").textContent = `Discount: ${formatter.format(totalAmount - discountedTotal)}`;
}


// Function to update the total amount of the bill
function updateBillTotal() {
    const billItemsList = document.getElementById("bill-items-list");
    let totalAmount = 0;

    const billItems = billItemsList.getElementsByClassName("bill-item");
    for (let item of billItems) {
        const totalPrice = parseFloat(item.querySelector(".bill-total").textContent);
        totalAmount += totalPrice;
    }

    const totalElement = document.getElementById("total-amount");
    const formattedTotal = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(totalAmount);

    if (billItems.length === 0) {
        totalElement.textContent = 'Total: Rs. 0.00 (Your bill is empty)';
    } else {
        totalElement.textContent = `Total: ${formattedTotal}`;
    }
}

async function DeductInventory() {
    try {
        // Find all food items currently in the bill
        const billItems = document.querySelectorAll(".bill-item");

        // Track inventory usage per item
        for (const item of billItems) {
            const foodId = parseInt(item.id.replace("bill-item-", ""));
            const quantity = parseInt(item.querySelector(".bill-quantity").value);

            // Request inventory dependencies for this food item from the main process
            const inventoryItems = await ipcRenderer.invoke("get-inventory-for-food", foodId);

            await ipcRenderer.invoke("deduct-inventory-stock", {
                foodId: foodId,
                quantity: quantity
            });
        }
    } catch (err) {
        console.error("Error deducting inventory:", err);
        createTextPopup("Failed to deduct inventory.");
    }
}


// Function to only save the bill
function saveBill() {
    const cashier = 1; // Replace with actual cashier ID
    const date = new Date().toISOString().split("T")[0];

    const billItems = document.querySelectorAll(".bill-item");
    let orderItems = [];
    let totalAmount = 0;

    billItems.forEach(item => {
        let foodId = item.id.replace("bill-item-", ""); // Extract item ID
        let quantity = parseInt(item.querySelector(".bill-quantity").value);
        let itemTotal = parseFloat(item.querySelector(".bill-total").textContent);
        if (!isNaN(itemTotal)) {
            totalAmount += itemTotal;
        }
        orderItems.push({ foodId: parseInt(foodId), quantity });
    });

    if (orderItems.length === 0) {
        createTextPopup("No items in the bill. Please add items before proceeding.");
        return;
    }

    // Check if a discounted total exists, otherwise use the original totalAmount
    let discountField = document.getElementById("discounted-total");
    let discountedTotal = discountField && discountField.value ? parseFloat(discountField.value) : totalAmount;

    // Send order data to main process with discount applied (or not)
    ipcRenderer.send("save-bill", { cashier, date, orderItems, totalAmount: discountedTotal });
    DeductInventory();
    // Add the glow effect to the bill panel
    const billPanel = document.getElementById("bill-panel");
    billPanel.classList.add("glow");

    // Remove the glow effect after 2 seconds
    setTimeout(() => {
        billPanel.classList.remove("glow");
    },800);

    NewOrder();
}

function saveAndPrintBill() {
    const cashier = 1; // Replace with actual cashier ID
    const date = new Date().toISOString().split("T")[0];

    const billItems = document.querySelectorAll(".bill-item");
    let orderItems = [];
    let totalAmount = 0;

    billItems.forEach(item => {
        let foodId = item.id.replace("bill-item-", ""); // Extract item ID
        let quantity = parseInt(item.querySelector(".bill-quantity").value);
        let itemTotal = parseFloat(item.querySelector(".bill-total").textContent);
        if (!isNaN(itemTotal)) {
            totalAmount += itemTotal;
        }
        orderItems.push({ foodId: parseInt(foodId), quantity });
    });

    if (orderItems.length === 0) {
        createTextPopup("No items in the bill. Please add items before proceeding.");
        return;
    }

    // Check if a discounted total exists
    let discountField = document.getElementById("discounted-total");
    let discountedTotal = discountField?.value ? parseFloat(discountField.value) : totalAmount;

    // Send order data to main process
    ipcRenderer.send("save-bill", { cashier, date, orderItems, totalAmount: discountedTotal });

    // Handle bill save response
    ipcRenderer.once("bill-saved", (event, { kot, orderId }) => {
        console.log(`Bill saved with KOT: ${kot}`);
        const billPanel = document.getElementById("bill-panel");
        
        // Convert items to simple format and send for printing
        generateEscPosCommands(billItems, discountedTotal, kot, orderId);
        
        // Visual feedback
        billPanel.classList.add("glow");
        
        // Print result handlers
        ipcRenderer.once('print-success', () => {
            setTimeout(() => {
                billPanel.classList.remove("glow");
                NewOrder();
            }, 800);
        });
        
        ipcRenderer.once('print-error', (event, error) => {
            createTextPopup(`Print Failed: ${error}`);
            billPanel.classList.remove("glow");
        });
    });

    // Handle save errors
    ipcRenderer.once("bill-error", (event, { error }) => {
        createTextPopup(`Save Error: ${error}`);
    });
}

function generateEscPosCommands(billItems, totalAmount, kot, orderId) {
    // Prepare items for printing
    const items = Array.from(billItems).map(item => ({
        name: item.querySelector(".bill-item-name").textContent,
        quantity: item.querySelector(".bill-quantity").value,
        price: parseFloat(item.querySelector(".bill-total").textContent)
    }));
    
    // Send structured data to main process
    ipcRenderer.send("print-bill", {
        billItems: items,
        totalAmount,
        kot,
        orderId,
        dateTime: new Date().toLocaleString()
    });
}

// Edit-Mode Bill Panel Starts Here------------------------------------------------------------------------------
function displayEditMode() {
    // Hide all existing buttons
    document.getElementById("upperbuttons").style.display = "none";
    document.getElementById("bill-buttons").style.display = "none";

    // Check if edit mode buttons already exist, if not, create them
    let editButtonsContainer = document.getElementById("edit-buttons");
    if (!editButtonsContainer) {
        editButtonsContainer = document.createElement("div");
        editButtonsContainer.id = "edit-buttons";
        editButtonsContainer.style.display = "flex";
        editButtonsContainer.style.justifyContent = "center";
        editButtonsContainer.style.gap = "20px"; // Increased gap between buttons
        editButtonsContainer.style.marginTop = "20px"; // Increased margin
        editButtonsContainer.style.width = "100%"; // Full width for better alignment

        // Save Button
        const saveButton = document.createElement("button");
        saveButton.textContent = "Save";
        saveButton.id = "save-edit";
        saveButton.onclick = saveEdit;
        styleButton(saveButton); // Apply button styling

        // Cancel Button
        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.id = "cancel-edit";
        cancelButton.onclick = exitEditMode;
        styleButton(cancelButton); // Apply button styling

        // Append buttons
        editButtonsContainer.appendChild(saveButton);
        editButtonsContainer.appendChild(cancelButton);
        document.getElementById("bill-panel").appendChild(editButtonsContainer);
    }

    // Show the edit mode buttons
    editButtonsContainer.style.display = "flex";
}

function saveEdit() {
    const billItems = document.querySelectorAll(".bill-item");
    let orderItems = [];

    // Collect the updated items from the bill panel
    billItems.forEach(item => {
        let foodId = item.id.replace("bill-item-", ""); // Extract item ID
        let quantity = parseInt(item.querySelector(".bill-quantity").value);
        orderItems.push({ foodId: parseInt(foodId), quantity });
    });

    // Get the bill number of the order being edited
    const billno = sessionStorage.getItem("editingBillNo");

    if (!billno) {
        createTextPopup("No order is being edited")
        return;
    }

    // Send the updated order details to the main process
    ipcRenderer.send("update-order", { billno, orderItems });
}

// Listen for update response
ipcRenderer.on("update-order-response", (event, response) => {
    if (response.success) {
        createTextPopup("Order updated successfully!");
        exitEditMode();
        ipcRenderer.send("get-todays-orders"); // Refresh today's orders
    } else {
        createTextPopup("Failed to update order. Please try again.")
    }
});

function exitEditMode() {
    // Show original buttons
    document.getElementById("upperbuttons").style.display = "flex";
    document.getElementById("bill-buttons").style.display = "flex";

    // Hide edit mode buttons
    const editButtonsContainer = document.getElementById("edit-buttons");
    if (editButtonsContainer) {
        editButtonsContainer.style.display = "none";
    }

    // Clear the bill panel
    resetBill();
}

// Function to apply button styles similar to existing ones
function styleButton(button) {
    button.style.fontSize = "16px";
    button.style.padding = "10px 20px";
    button.style.color = "white";
    button.style.border = "none";
    button.style.borderRadius = "8px";
    button.style.cursor = "pointer";
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.gap = "10px";
    button.style.backgroundColor = "#0C345A";
    button.style.width = "150px";
    button.style.transition = "background-color 0.3s ease";

    // Add hover effect
    button.addEventListener("mouseenter", () => {
        button.style.backgroundColor = "#0A2A4A"; // Darker shade on hover
    });

    button.addEventListener("mouseleave", () => {
        button.style.backgroundColor = "#0C345A"; // Restore original color
    });
}

// Add this function to bill.js
function printBill(billno) {
    // Get the order details from the database
    ipcRenderer.send("get-order-for-printing", billno);
    
    // Handle the response
    ipcRenderer.once("order-for-printing-response", (event, { order, items }) => {
        if (!order || !items) {
            createTextPopup("Failed to load order details for printing");
            return;
        }
        
        // Prepare the data for printing
        const printData = {
            billItems: items.map(item => ({
                name: item.fname,
                quantity: item.quantity,
                price: item.price * item.quantity
            })),
            totalAmount: order.price,
            kot: order.kot,
            orderId: order.billno,
            dateTime: order.date
        };
        
        // Send to main process for printing
        ipcRenderer.send("print-bill", printData);
        
        // Handle print result
        ipcRenderer.once('print-success', () => {
            createTextPopup("Bill printed successfully");
        });
        
        ipcRenderer.once('print-error', (event, error) => {
            createTextPopup(`Print Failed: ${error}`);
        });
    });
}

// Make it available globally
window.printBill = printBill;
// Edit-mode Bill panel ends here-------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------

function holdBill() {
    // Get cashier ID (Assume it's set somewhere in the UI)
    const cashier = 1; // Replace with actual cashier ID

    // Get current date in YYYY-MM-DD format
    const date = new Date().toISOString().split("T")[0];

    // Get all bill items
    const billItems = document.querySelectorAll(".bill-item");
    let orderItems = [];

    billItems.forEach(item => {
        let foodId = item.id.replace("bill-item-", ""); // Extract item ID
        let quantity = parseInt(item.querySelector(".bill-quantity").value);

        orderItems.push({ foodId: parseInt(foodId), quantity });
    });

    if (orderItems.length === 0) {
        createTextPopup("No items in the bill. Please add items before proceeding.");
        return;
    }

    // Send order data to main process
    ipcRenderer.send("hold-bill", { cashier, date, orderItems });

    // Add the glow effect to the bill panel
    const billPanel = document.getElementById("bill-panel");
    billPanel.classList.add("glow");

    // Remove the glow effect after 2 seconds
    setTimeout(() => {
        billPanel.classList.remove("glow");
    },800);

    NewOrder();
}
// Function to toggle the visibility of the discount inputs and apply button
function toggleDiscountPopup() {
    const billItems = document.querySelectorAll(".bill-item");
    let orderItems = [];

    billItems.forEach(item => {
        let foodId = item.id.replace("bill-item-", ""); // Extract item ID
        let quantity = parseInt(item.querySelector(".bill-quantity").value);

        orderItems.push({ foodId: parseInt(foodId), quantity });
    });

    if (orderItems.length === 0) {
        createTextPopup("No items in the bill. Please add items before proceeding.");
        return;
    }

    let existingPopup = document.getElementById("discount-popup");
    if (existingPopup) {
        existingPopup.remove();
        return;
    }

    const popup = document.createElement("div");
    popup.id = "discount-popup";
    popup.classList.add("edit-popup");

    popup.innerHTML = `
    <div class="popup-content" style="
        display: flex; 
        flex-direction: column; 
        max-width: 100%; 
        width: 320px; 
        pointer-events: auto; 
        padding: 24px; 
        background-color: #ffffff; 
        border-radius: 12px; 
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1); 
        border: 1px solid rgba(0, 0, 0, 0.05);
        font-family: 'Segoe UI', Roboto, sans-serif;
    ">
        <h3 style="
            font-size: 1.5em; 
            margin: 0 0 20px 0; 
            color: #2c3e50; 
            text-align: center; 
            font-weight: 600;
            letter-spacing: -0.5px;
        ">Apply Discount</h3>
        
        <label for="discount-percentage" style="
            margin-bottom: 6px; 
            font-weight: 500; 
            color: #4a5568; 
            font-size: 14px;
        ">Discount Percentage:</label>
        <input type="number" id="discount-percentage" placeholder="0-100%" min="0" max="100" step="0.01" style="
            width: 100%; 
            padding: 10px 12px; 
            margin-bottom: 16px; 
            border: 1px solid #e2e8f0; 
            border-radius: 6px; 
            font-size: 14px; 
            transition: all 0.2s;
            background-color: #f8fafc;
        " required
        onfocus="this.style.borderColor='#4299e1'; this.style.boxShadow='0 0 0 3px rgba(66, 153, 225, 0.2)'; this.style.backgroundColor='#ffffff'"
        onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'; this.style.backgroundColor='#f8fafc'">
    
        <label for="discount-amount" style="
            margin-bottom: 6px; 
            font-weight: 500; 
            color: #4a5568; 
            font-size: 14px;
        ">Fixed Discount (Rs.):</label>
        <input type="number" id="discount-amount" placeholder="Enter amount" min="0" step="0.01" style="
            width: 100%; 
            padding: 10px 12px; 
            margin-bottom: 24px; 
            border: 1px solid #e2e8f0; 
            border-radius: 6px; 
            font-size: 14px;
            transition: all 0.2s;
            background-color: #f8fafc;
        " required
        onfocus="this.style.borderColor='#4299e1'; this.style.boxShadow='0 0 0 3px rgba(66, 153, 225, 0.2)'; this.style.backgroundColor='#ffffff'"
        onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'; this.style.backgroundColor='#f8fafc'">
    
        <div class="popup-buttons" style="
            display: flex; 
            justify-content: center; 
            gap: 12px;
        ">
            <button id="apply-discount-btn" type="button" style="
                width: 100px; 
                height: 40px; 
                background-color: #4299e1; 
                color: white; 
                border: none; 
                border-radius: 6px; 
                cursor: pointer; 
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
            " onmouseover="this.style.backgroundColor='#3182ce'" onmouseout="this.style.backgroundColor='#4299e1'">Apply</button>
            <button id="closePopup" type="button" style="
                width: 100px; 
                height: 40px; 
                background-color: #ffffff; 
                color: #4a5568; 
                border: 1px solid #e2e8f0; 
                border-radius: 6px; 
                cursor: pointer; 
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
            " onmouseover="this.style.backgroundColor='#f7fafc'; this.style.borderColor='#cbd5e0'" onmouseout="this.style.backgroundColor='#ffffff'; this.style.borderColor='#e2e8f0'">Cancel</button>
        </div>
    </div>
`;
    document.body.appendChild(popup);
    const percentField = document.getElementById("discount-percentage");
    const amountField = document.getElementById("discount-amount");

    percentField.addEventListener("input", () => {
        amountField.disabled = percentField.value.trim() !== "";
        if (amountField.disabled) amountField.value = "";
    });

    amountField.addEventListener("input", () => {
        percentField.disabled = amountField.value.trim() !== "";
        if (percentField.disabled) percentField.value = "";
    });

    // Add event listener for closing popup
    document.getElementById("closePopup").addEventListener("click", () => {
        popup.remove();
    });

    // Add event listener for applying discount and closing popup
    document.getElementById("apply-discount-btn").addEventListener("click", () => {
        console.log("Apply button clicked!"); // Debugging
        applyDiscount(); // Call the discount function
        popup.remove(); // Close the popup
        
    });
}

function displayHeld() {
    let existingPopup = document.getElementById("heldpopup");

    if (existingPopup) {
        existingPopup.remove();
        return;
    }

    ipcRenderer.send('get-held-orders'); // Request held orders from the main process
}

ipcRenderer.on('held-orders-data', (event, heldOrders) => {
    const popup = document.createElement("div");
    popup.id = "heldpopup";
    popup.classList.add("held-popup", "popup-entrance");

    const popupContent = `
    <div class="popup-container">
        <div class="popup-header">
            <div class="spacer"></div>
            <h2 class="popup-title">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
                Held Orders
            </h2>
            <button class="close-btn" onclick="closeHeldPopup()">×</button>
        </div>

        <div class="orders-grid">
            ${heldOrders.map(order => `
            <div class="order-card" data-heldid="${order.heldid}">
                <div class="card-header">
                    <span class="order-id">#${order.heldid}</span>
                    <span class="cashier-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M4 21v-2a4 4 0 0 1 3-3.87"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        ${order.cashier_name}
                    </span>
                </div>

                <div class="order-items">
                    ${(order.food_items ? order.food_items.split(", ") : ["No items"])
                        .map(item => `
                        <div class="order-item">
                            <span class="item-name">${item}</span>
                        </div>`).join('')}
                </div>

                <div class="card-footer">
                    <div class="order-total">
                        <span class="total-label">Total:</span>
                        <span class="total-amount">₹${order.price.toFixed(2)}</span>
                    </div>

                    <div class="action-buttons">
                        <button class="btn-add" onclick="addHeldToBill(${order.heldid})">
                            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Add to Bill
                        </button>
                        <button class="btn-delete" onclick="deleteHeldOrder(${order.heldid})">
                            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14H5V6"/>
                                <path d="M10 11v6"/>
                                <path d="M14 11v6"/>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            </div>`).join('')}
        </div>
    </div>`;

    popup.innerHTML = popupContent;
    document.body.appendChild(popup);

    // Create overlay for semi-transparent background
    const overlay = document.createElement("div");
    overlay.classList.add("popup-overlay");
    document.body.appendChild(overlay);

    const style = document.createElement('style');
    style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

    body, .popup-container {
        font-family: 'Inter', sans-serif;
    }

    .popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);  /* Semi-transparent black */
        backdrop-filter: blur(8px);  /* Optional: Adds a blur effect */
        z-index: 999;  /* Ensure the overlay is above the background content */
    }

    .held-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.9);  /* White background for the popup */
        backdrop-filter: blur(10px);
        border-radius: 16px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.06);
        width: 90%;
        max-width: 1000px;
        max-height: 90vh;
        overflow: hidden;
        animation: popupEntrance 0.3s ease-out;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        z-index: 1000;  /* Ensure the popup is above the overlay */
    }

    @keyframes popupEntrance {
        0% { transform: translate(-50%, -60%); opacity: 0; }
        100% { transform: translate(-50%, -50%); opacity: 1; }
    }

    .popup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(135deg,#0D3B66,#0D3B66);
        color: white;
        padding: 0.5rem 1rem;
    }

    .popup-title {
        font-size: 1.8rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
        justify-content: center;
        pointer-events: none;
        margin: 0;
    }

    .spacer {
        width: 40px;
    }

    .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 2rem;
        cursor: pointer;
        padding: 0.25rem 0.75rem;
        line-height: 1;
        border-radius: 8px;
        transition: transform 0.2s, background 0.2s;
    }

    .close-btn:hover {
        transform: scale(1.1);
        background: rgba(255, 255, 255, 0.1);
    }

    .orders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        padding: 1.5rem;
        max-height: 70vh;
        overflow-y: auto;
    }

    .order-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        transition: transform 0.2s, box-shadow 0.2s;
        overflow: hidden;
        animation: fadeInUp 0.3s ease both;
    }

    .order-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.12);
    }

    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .card-header {
        padding: 1rem;
        background: linear-gradient(135deg, #e0eafc, #cfdef3);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .order-id {
        font-weight: 600;
        color: #2c3e50;
    }

    .cashier-badge {
        background: #e9ecef;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.3rem;
    }

    .order-items {
        padding: 1rem;
        display: grid;
        gap: 0.5rem;
        height: 150px;
        overflow-y: auto;
    }

    .order-item {
        padding: 0.5rem;
        background: #f8f9fa;
        border-radius: 4px;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
    }

    .card-footer {
        padding: 1rem;
        background: #f8f9fa;
        border-top: 1px solid #dee2e6;
    }

    .order-total {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        font-weight: 600;
    }

    .action-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
    }

    .btn-add, .btn-delete {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        justify-content: center;
        font-weight: 500;
    }

    .btn-add {
        background: #28a745;
        color: white;
    }

    .btn-delete {
        background: #dc3545;
        color: white;
    }

    .btn-add:hover, .btn-delete:hover {
        filter: brightness(0.95);
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    .icon {
        display: inline-block;
        vertical-align: middle;
    }

    ::-webkit-scrollbar {
        width: 8px;
    }

    ::-webkit-scrollbar-track {
        background: #f1f3f5;
    }

    ::-webkit-scrollbar-thumb {
        background: #adb5bd;
        border-radius: 4px;
    }
    `;
    document.head.appendChild(style);
    overlay.addEventListener('click', closeHeldPopup);
});






function addHeldToBill(heldId) {
    ipcRenderer.send('get-held-order-details', heldId);
}


ipcRenderer.on('held-order-details-data', (event, foodDetails, heldId) => {
    foodDetails.forEach(item => {
        addToBill(item.foodid, item.fname, item.price, item.quantity);
    });

    // Delete the held order from the database after restoring it to the bill
    ipcRenderer.send('delete-held-order', heldId);

    closeHeldPopup(); // Close the popup after adding items
});


// Function to delete a held order
function deleteHeldOrder(heldId) {
    const  {createConfirmPopup} = require("./textPopup");
    // Show the custom confirmation popup and handle the user's response
    createConfirmPopup("Are you sure you want to delete this held order?", (confirmed) => {
        if (confirmed) {
            // User clicked OK, send the delete request
            ipcRenderer.send('delete-held-order', heldId);
        } 
    });
}

// Handle held order deletion
ipcRenderer.on('held-order-deleted', (event, heldId) => {
    let orderCard = document.querySelector(`#heldpopup div[data-heldid="${heldId}"]`);
    if (orderCard) {
        orderCard.remove(); // Remove the order card from the UI
    }
});


function closeHeldPopup() {
    const popup = document.getElementById('heldpopup');
    const overlay = document.querySelector('.popup-overlay');

    // Fade-out effect (optional)
    popup.classList.add('fade-out');
    overlay.classList.add('fade-out');

    // After the fade-out animation finishes, remove the popup and overlay from the DOM
    setTimeout(() => {
        if (popup) {
            popup.remove();
        }
        if (overlay) {
            overlay.remove();
        }
    }, 90);  // Match the duration of the fade-out animation
}






// ------------ SAVE TO ORDER FUNCTIONALITY IS HERE ------------------
// Function to display today's orders in a popup
function displayTodaysOrders() {
    let existingPopup = document.getElementById("todaysOrdersPopup");

    if (existingPopup) {
        existingPopup.remove();
        return;
    }
    const billItems = document.querySelectorAll(".bill-item");
    let orderItems = [];

    billItems.forEach(item => {
        let foodId = item.id.replace("bill-item-", ""); // Extract item ID
        let quantity = parseInt(item.querySelector(".bill-quantity").value);

        orderItems.push({ foodId: parseInt(foodId), quantity });
    });

    if (orderItems.length === 0) {
        createTextPopup("No items in the bill. Please add items before proceeding.");
        return;
    }

    ipcRenderer.send("get-todays-orders-for-save-to-orders"); // Request today's orders from the main process
}

// Handle response from IPC and display orders in popup
ipcRenderer.on("todays-orders-response-for-save-to-orders", (event, data) => {
    if (!data.success) {
        createTextPopup("Error fetching today's orders.");
        return;
    }

    // Create popup container
    const popup = document.createElement("div");
    popup.id = "sto-popup";
    popup.classList.add("sto-popup", "popup-entrance");

    // Create overlay
    const overlay = document.createElement("div");
    overlay.classList.add("sto-popup-overlay");
    document.body.appendChild(overlay);

    let popupContent = `
    <div class="sto-popup-container">
        <div class="sto-popup-header">
            <div class="sto-spacer"></div>
            <h2 class="sto-popup-title">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/>
                    <path d="M9 12l2 2l4 -4"/>
                </svg>
                Today's Orders
            </h2>
            <button class="sto-close-btn" onclick="closeTodaysOrdersPopup()">×</button>
        </div>
    `;

    if (data.orders.length === 0) {
        popupContent += `
        <div class="sto-empty-state">
            <div class="sto-empty-message">
                No Orders For Today
            </div>
            <div class="sto-empty-submessage">
                Come back after placing an order!
            </div>
        </div>
        `;
    } else {
        popupContent += `
        <div class="sto-orders-grid">
        `;

        data.orders.forEach(order => {
            let itemsArray = order.food_items ? order.food_items.split(", ") : ["No items"];
            
            popupContent += `
            <div class="sto-order-card" data-billno="${order.billno}">
                <div class="sto-card-header">
                    <span class="sto-order-id">#${order.billno}</span>
                    <span class="sto-cashier-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M4 21v-2a4 4 0 0 1 3-3.87"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        ${order.cashier_name}
                    </span>
                    <span class="sto-kot-badge">KOT: ${order.kot || "N/A"}</span>
                </div>

                <div class="sto-order-items">
                    ${itemsArray.map(item => `
                    <div class="sto-order-item">
                        <span class="sto-item-name">${item}</span>
                    </div>`).join('')}
                </div>

                <div class="sto-card-footer">
                    <div class="sto-order-total">
                        <span class="sto-total-label">Total:</span>
                        <span class="sto-total-amount">₹${order.price.toFixed(2)}</span>
                    </div>

                    <div class="sto-action-buttons">
                        <button class="sto-btn-add" onclick="addToExistingOrder(${order.billno})">
                            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Add to Order
                        </button>
                    </div>
                </div>
            </div>
            `;
        });

        popupContent += `</div>`;
    }

    popupContent += `</div>`;
    popup.innerHTML = popupContent;
    document.body.appendChild(popup);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
    .sto-popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(8px);
        z-index: 999;
    }

    .sto-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.06);
        width: 90%;
        max-width: 1000px;
        max-height: 90vh;
        overflow: hidden;
        animation: popupEntrance 0.3s ease-out;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        z-index: 1000;
    }

    .sto-popup-container {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .sto-popup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(135deg, #0D3B66, #0D3B66);
        color: white;
        padding: 0.5rem 1rem;
    }

    .sto-popup-title {
        font-size: 1.8rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
        justify-content: center;
        pointer-events: none;
        margin: 0;
    }

    .sto-spacer {
        width: 40px;
    }

    .sto-close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 2rem;
        cursor: pointer;
        padding: 0.25rem 0.75rem;
        line-height: 1;
        border-radius: 8px;
        transition: transform 0.2s, background 0.2s;
    }

    .sto-close-btn:hover {
        transform: scale(1.1);
        background: rgba(255, 255, 255, 0.1);
    }

    .sto-orders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        padding: 1.5rem;
        max-height: 70vh;
        overflow-y: auto;
    }

    .sto-empty-state {
        text-align: center;
        padding: 3rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 50vh;
        width: 100%;
    }

    .sto-empty-message {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 1rem;
        color: #2c3e50;
    }

    .sto-empty-submessage {
        font-size: 1.2rem;
        margin-bottom: 2rem;
        color: #7f8c8d;
    }

    .sto-empty-button {
        font-size: 1.2rem;
        color: #fff;
        background-color: #28a745;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .sto-empty-button:hover {
        background-color: #218838;
        transform: translateY(-2px);
    }

    .sto-order-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        transition: transform 0.2s, box-shadow 0.2s;
        overflow: hidden;
        animation: fadeInUp 0.3s ease both;
    }

    .sto-order-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.12);
    }

    .sto-card-header {
        padding: 1rem;
        background: linear-gradient(135deg, #e0eafc, #cfdef3);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .sto-order-id {
        font-weight: 600;
        color: #2c3e50;
    }

    .sto-cashier-badge, .sto-kot-badge {
        background: #e9ecef;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.3rem;
    }

    .sto-order-items {
        padding: 1rem;
        display: grid;
        gap: 0.5rem;
        height: 150px;
        overflow-y: auto;
    }

    .sto-order-item {
        padding: 0.5rem;
        background: #f8f9fa;
        border-radius: 4px;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
    }

    .sto-card-footer {
        padding: 1rem;
        background: #f8f9fa;
        border-top: 1px solid #dee2e6;
    }

    .sto-order-total {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        font-weight: 600;
    }

    .sto-action-buttons {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }

    .sto-btn-add {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        justify-content: center;
        font-weight: 500;
        background: #28a745;
        color: white;
        width: 100%;
    }

    .sto-btn-add:hover {
        filter: brightness(0.95);
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
    `;
    document.head.appendChild(style);

    // Add event listeners
    overlay.addEventListener('click', closeTodaysOrdersPopup);
    
    if (data.orders.length === 0) {
        document.getElementById('sto-goHomeButton').addEventListener('click', function() {
            document.getElementById('Home').click();
        });
    }
});

// Function to add current bill items to an existing order
// Function to add current bill items to an existing order
function addToExistingOrder(orderId) {
    // Get all bill items
    const billItems = document.querySelectorAll(".bill-item");
    let orderItems = [];

    billItems.forEach(item => {
        let foodId = item.id.replace("bill-item-", ""); // Extract item ID
        let quantity = parseInt(item.querySelector(".bill-quantity").value);

        orderItems.push({ foodId: parseInt(foodId), quantity });
    });

    if (orderItems.length === 0) {
        createTextPopup("No items in the bill. Please add items before proceeding.");
        return;
    }

    // Send order data to main process
    ipcRenderer.send("add-to-existing-order", { orderId, orderItems });

    // Close the popup and overlay after adding
    const popup = document.getElementById("sto-popup");
    const overlay = document.querySelector(".sto-popup-overlay");
    if (popup) popup.remove();
    if (overlay) overlay.remove();
    
    resetBill();
    // Add the glow effect to the bill panel
    const billPanel = document.getElementById("bill-panel");
    billPanel.classList.add("glow");

    // Remove the glow effect after 2 seconds
    setTimeout(() => {
        billPanel.classList.remove("glow");
    }, 800);
    
    NewOrder();
}

// Close popup function
function closeTodaysOrdersPopup() {
    const popup = document.getElementById("sto-popup");
    const overlay = document.querySelector(".sto-popup-overlay");
    if (popup) popup.remove();
    if (overlay) overlay.remove();
}
// ------------ SAVE TO ORDER FUNCTIONALITY ENDS HERE ------------------
function NewOrder() {
    resetBill();
    updateMainContent('Home');
}
