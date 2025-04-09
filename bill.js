const  {createTextPopup} = require("./textPopup");
// Add an item to the bill
function addToBill(itemId, itemName, price, quantity, category = null) {
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
        <div class="popup-content" style="display: flex; flex-direction: column; max-width: 100%; width: 300px; pointer-events: auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <h3 style="font-size: 1.5em; margin-bottom: 16px; color: #333; text-align: center;">Apply Discount</h3>
            
            <label for="discount-percentage" style="margin-bottom: 8px; font-weight: bold; color: #555;">Discount Percentage:</label>
            <input type="number" id="discount-percentage" placeholder="Enter discount %" min="0" max="100" step="0.01" style="width: 100%; padding: 8px; margin-bottom: 16px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;" required>
        
            <label for="discount-amount" style="margin-bottom: 8px; font-weight: bold; color: #555;">Fixed Discount (Rs.):</label>
            <input type="number" id="discount-amount" placeholder="Enter discount amount" min="0" step="0.01" style="width: 100%; padding: 8px; margin-bottom: 16px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;" required>
        
            <div class="popup-buttons" style="display: flex; justify-content: center; gap: 10px;">
                <button id="apply-discount-btn" type="button" style="width: 90px; height: 40px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">Apply</button>
                <button id="closePopup" type="button" style="width: 90px; height: 40px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">Cancel</button>
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
    let popup = document.createElement("div");
    popup.id = "heldpopup";
    popup.classList.add("edit-popup");

    let popupContent = `
        <div class="popup-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 850px;">
            <div style="width: 100%; display: flex; justify-content: flex-end;">
                <span class="close-btn" onclick="closeHeldPopup()" style="cursor: pointer; font-size: 20px; font-weight: bold;">&times;</span>
            </div>
            <h3>Held Orders</h3>
            <div class="custom-scrollbar" style="max-height: 550px; overflow-y: auto; width: 100%; display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">
    `;

    heldOrders.forEach(order => {
        let itemsArray = order.food_items ? order.food_items.split(", ") : ["No items"];
        let itemsGrid = "";

        itemsArray.forEach(item => {
            itemsGrid += `<div style="padding: 2px; border: 1px solid #ddd; font-size: 12px; text-align: center; flex-basis: 48%; height: 30px; display: flex; justify-content: center; align-items: center;">${item}</div>`;
        });

        popupContent += `
            <div data-heldid="${order.heldid}" style="border: 2px solid #333; width: 350px; background: #fff; padding: 10px; border-radius: 8px; box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2); height: 250px; display: flex; flex-direction: column;">
                <div style="border-bottom: 2px solid #333; padding-bottom: 5px; font-size: 18px; font-weight: bold; display: flex; justify-content: space-between;">
                    <span>HELD ID: ${order.heldid}</span>
                </div>
                <div style="padding: 5px; flex-grow: 1; display: flex; flex-direction: column;">
                    <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">Cashier: ${order.cashier_name}</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: space-between; flex-grow: 1; max-height: 120px; overflow-y: auto;">
                        ${itemsGrid}
                    </div>
                    <div style="text-align: right; font-size: 16px; font-weight: bold; margin-top: auto;">
                        Total: ₹${order.price.toFixed(2)}
                    </div>
                </div>
                <div style="border-top: 2px solid #333; padding-top: 5px; text-align: right; display: flex; justify-content: space-between; align-items: center; gap: 5px;">
                    <button onclick="addHeldToBill(${order.heldid})" style="background-color: green; color: white; padding: 5px 10px; border: none; border-radius: 5px; width:140px; height:30px; flex-grow: 1;">Add</button>
                    <button onclick="deleteHeldOrder(${order.heldid})" style="background-color: red; color: white; padding: 5px 10px; border: none; border-radius: 5px; width:140px; height:30px; flex-grow: 1;">Delete</button>
                </div>
            </div>
        `;
    });

    popupContent += `</div></div>`;
    popup.innerHTML = popupContent;
    document.body.appendChild(popup);
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


function deleteHeldOrder(heldId) {
    if (confirm("Are you sure you want to delete this held order?")) {
        ipcRenderer.send('delete-held-order', heldId);
    }
}

// Handle held order deletion
ipcRenderer.on('held-order-deleted', (event, heldId) => {
    let orderCard = document.querySelector(`#heldpopup div[data-heldid="${heldId}"]`);
    if (orderCard) {
        orderCard.remove(); // Remove the order card from the UI
    }
});


function closeHeldPopup() {
    let popup = document.getElementById("heldpopup");
    if (popup) {
        popup.remove();
    }
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

    let popup = document.createElement("div");
    popup.id = "todaysOrdersPopup";
    popup.classList.add("edit-popup");

    let popupContent = `
        <div class="popup-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 850px;">
            <div style="width: 100%; display: flex; justify-content: flex-end;">
                <span class="close-btn" onclick="closeTodaysOrdersPopup()" style="cursor: pointer; font-size: 20px; font-weight: bold;">&times;</span>
            </div>
    `;

    if (data.orders.length === 0) {
        popupContent += `
            <div style="text-align: center; font-family: 'Arial', sans-serif; background-color: #f5f5f5; color: #333; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 50vh; width: 100%;">
                <div style="font-size: 36px; font-weight: bold; margin-bottom: 20px;">
                    No Orders For Today
                </div>
                <div style="font-size: 18px; margin-bottom: 30px;">
                    Come back after placing an order!
                </div>
                <button id='goHomeButton' style="font-size: 18px; color: #fff; background-color: #1DB954; padding: 10px 20px; border: none; border-radius: 25px; cursor: pointer;">
                    Place an Order
                </button>
            </div>
        `;
    } else {
        popupContent += `
            <h3>Today's Orders</h3>
            <div class="custom-scrollbar" style="max-height: 550px; overflow-y: auto; width: 100%; display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">
        `;

        data.orders.forEach(order => {
            let itemsArray = order.food_items ? order.food_items.split(", ") : ["No items"];
            let itemsGrid = "";

            itemsArray.forEach(item => {
                itemsGrid += `<div style="padding: 3px; border: 1px solid #ddd; font-size: 12px; text-align: center; flex-grow: 1; flex-basis: 48%; height: 40px; display: flex; justify-content: center; align-items: center; background: #f1f1f1;">${item}</div>`;
            });

            popupContent += `
                <div style="border: 2px solid #333; width: 350px; background: #fff; padding: 10px; border-radius: 8px; box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2); height: 250px; display: flex; flex-direction: column;">
                    <div style="border-bottom: 2px solid #333; padding-bottom: 5px; font-size: 18px; font-weight: bold; display: flex; justify-content: space-between;">
                        <span>BILL NO: ${order.billno}</span>
                        <span>KOT: ${order.kot || "N/A"}</span>
                    </div>
                    <div style="padding: 5px; flex-grow: 1; display: flex; flex-direction: column;">
                        <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">Cashier: ${order.cashier_name}</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: space-between; flex-grow: 1; max-height: 120px; overflow-y: auto;">
                            ${itemsGrid}
                        </div>
                        <div style="text-align: right; font-size: 16px; font-weight: bold; margin-top: auto;">
                            Total: ₹${order.price.toFixed(2)}
                        </div>
                    </div>
                    <div style="border-top: 2px solid #333; padding-top: 5px; text-align: right;">
                        <button onclick="addToExistingOrder(${order.billno})" style="background-color: #1db954; color: white; padding: 5px 10px; border: none; border-radius: 5px; width:100%; height:30px">
                            Add to Order
                        </button>
                    </div>
                </div>
            `;
        });

        popupContent += `</div>`;
    }

    popupContent += `</div>`;
    popup.innerHTML = popupContent;
    document.body.appendChild(popup);

    if (data.orders.length === 0) {
        document.getElementById('goHomeButton').addEventListener('click', function () {
            document.getElementById('Home').click();
        });
    }
});

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

    // Close the popup after adding
    document.getElementById("todaysOrdersPopup").remove();
    resetBill();
    // Add the glow effect to the bill panel
    const billPanel = document.getElementById("bill-panel");
    billPanel.classList.add("glow");

    // Remove the glow effect after 2 seconds
    setTimeout(() => {
        billPanel.classList.remove("glow");
    },800);
    
    NewOrder();
}

// Close popup function
function closeTodaysOrdersPopup() {
    let popup = document.getElementById("todaysOrdersPopup");
    if (popup) popup.remove();
}
// ------------ SAVE TO ORDER FUNCTIONALITY ENDS HERE ------------------
function NewOrder() {
    resetBill();
    updateMainContent('Home');
}
