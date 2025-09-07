const  {createTextPopup} = require("./textPopup");

async function updateOnlineOrderStatus() {
  try {
    const count = await ipcRenderer.invoke('getOnlineOrderCount');
    const statusDiv = document.getElementById('online-order-status');
    if (!statusDiv) return;

    if (count > 0) {
      statusDiv.innerText = `${count} PENDING ONLINE ORDER${count > 1 ? 'S' : ''}`;
      statusDiv.style.backgroundColor = 'red';
      statusDiv.style.color = 'white';
    } else {
      statusDiv.innerText = 'NO PENDING ONLINE ORDERS';
      statusDiv.style.backgroundColor = 'white';
      statusDiv.style.color = 'green';
    }
  } catch (err) {
    console.error('Failed to fetch online order count:', err);
  }
}

// Call on load
document.addEventListener('DOMContentLoaded', () => {
  updateOnlineOrderStatus();

  // Optional: update every 30 seconds
  setInterval(updateOnlineOrderStatus, 5000);
});
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

            // Create quantity container with decrease/increase buttons
            const quantityContainer = document.createElement("div");
            quantityContainer.classList.add("quantity-container");
            quantityContainer.style.display = "flex";
            quantityContainer.style.alignItems = "center";
            quantityContainer.style.gap = "0px";

            const decreaseBtn = document.createElement("button");
            decreaseBtn.textContent = "-";
            decreaseBtn.classList.add("quantity-btn", "decrease-btn");
            decreaseBtn.style.width = "30px";
            decreaseBtn.style.height = "30px";
            decreaseBtn.style.border = "1px solid #ccc";
            decreaseBtn.style.background = "#0D3B66";
            decreaseBtn.style.cursor = "pointer";
            decreaseBtn.style.borderRadius = "6px 0 0 6px";
            decreaseBtn.style.margin = "0px";
            decreaseBtn.onclick = () => {
                const quantityInput = document.querySelector(`#bill-item-${itemId} .bill-quantity`);
                let newQuantity = Math.max(1, parseInt(quantityInput.value) - 1);
                quantityInput.value = newQuantity;
                updateQuantityInput(itemId, price);
            };

            const quantityInput = document.createElement("input");
            quantityInput.type = "number";
            quantityInput.classList.add("bill-quantity");
            quantityInput.value = quantity;
            quantityInput.min = 1;
            quantityInput.style.width = "60px";
            quantityInput.style.textAlign = "center";
            quantityInput.addEventListener("input", () => updateQuantityInput(itemId, price));

            const increaseBtn = document.createElement("button");
            increaseBtn.textContent = "+";
            increaseBtn.classList.add("quantity-btn", "increase-btn");
            increaseBtn.style.width = "30px";
            increaseBtn.style.height = "30px";
            increaseBtn.style.border = "1px solid #ccc";
            increaseBtn.style.background = "#0D3B66";
            increaseBtn.style.cursor = "pointer";
            increaseBtn.style.borderRadius = "0 6px 6px 0";
            increaseBtn.style.margin = "0px";
            increaseBtn.onclick = () => {
                const quantityInput = document.querySelector(`#bill-item-${itemId} .bill-quantity`);
                let newQuantity = parseInt(quantityInput.value) + 1;
                quantityInput.value = newQuantity;
                updateQuantityInput(itemId, price);
            };

            quantityContainer.append(decreaseBtn, quantityInput, increaseBtn);

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

            billItemRow.append(itemNameSpan, quantityContainer, timesSpan, priceSpan, equalsSpan, totalSpan, removeBtn);
            requestAnimationFrame(() => {
                billItemRow.classList.add("show");
            });
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
        discountField.remove(); // Remove completely instead of just setting value
    }

    let discountPercentageInput = document.getElementById("discount-percentage");
    let discountAmountInput = document.getElementById("discount-amount");
    if (discountPercentageInput) {
        discountPercentageInput.value = "";
        discountPercentageInput.disabled = false; // Re-enable in case it was disabled
    }
    if (discountAmountInput) {
        discountAmountInput.value = "";
        discountAmountInput.disabled = false; // Re-enable in case it was disabled
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
        totalElement.textContent = 'Total: Rs. 0.00';
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
async function saveBill() {
    const user = await ipcRenderer.invoke("get-session-user");
    const cashier = user.userid; // Replace with actual cashier ID
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
    let discountedTotal = totalAmount; // Default to original total
    
    if (discountField && discountField.value && parseFloat(discountField.value) !== totalAmount) {
        discountedTotal = parseFloat(discountField.value);
    }

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

//This function gets called when user clicks on 'Save and Print' in bill panel
async function saveAndPrintBill() {
    const user = await ipcRenderer.invoke("get-session-user");
    const cashier = user.userid;
    const date = new Date().toISOString().split("T")[0];

    const billItems = document.querySelectorAll(".bill-item");
    let orderItems = [];
    let totalAmount = 0;

    billItems.forEach(item => {
        let foodId = item.id.replace("bill-item-", "");
        let quantity = parseInt(item.querySelector(".bill-quantity").value);
        let itemTotal = parseFloat(item.querySelector(".bill-total").textContent);
        if (!isNaN(itemTotal)) totalAmount += itemTotal;
        orderItems.push({ foodId: parseInt(foodId), quantity });
    });

    if (orderItems.length === 0) {
        createTextPopup("No items in the bill. Please add items before proceeding.");
        return;
    }

    // Handle discount - only use discount if it exists and has a valid value
    let discountField = document.getElementById("discounted-total");
    let discountedTotal = totalAmount; // Default to original total
    
    if (discountField && discountField.value && parseFloat(discountField.value) !== totalAmount) {
        discountedTotal = parseFloat(discountField.value);
    }

    // Prepare items for printing
    const itemsForPrinting = Array.from(billItems).map(item => ({
        name: item.querySelector(".bill-item-name").textContent,
        quantity: item.querySelector(".bill-quantity").value,
        price: parseFloat(item.querySelector(".bill-total").textContent)
    }));

    try {
        // 👉 FIRST test if printer is available
        await ipcRenderer.invoke("test-printer-connection");
        
        // 👉 ONLY if printer test succeeds, then save to database
        ipcRenderer.send("save-bill", { cashier, date, orderItems, totalAmount: discountedTotal });

        ipcRenderer.once("bill-saved", (event, { kot, orderId }) => {
            // Now we print with the official kot & orderId
            ipcRenderer.send("print-bill", {
                billItems: itemsForPrinting,
                totalAmount: discountedTotal,
                kot,
                orderId,
                dateTime: new Date().toLocaleString()
            });

            ipcRenderer.once("print-success-with-data", () => {
                DeductInventory();
                clearAllDiscountFields(); // Clear discount immediately after successful print
                const billPanel = document.getElementById("bill-panel");
                billPanel.classList.add("glow");

                setTimeout(() => {
                    billPanel.classList.remove("glow");
                    NewOrder();
                }, 800);
            });

            ipcRenderer.once("print-error", (event, error) => {
                // Even if final print fails, at least we tested the printer was available
                createTextPopup(`Print failed after saving: ${error}`);
                DeductInventory();
                clearAllDiscountFields(); // Clear discount even if print fails
                const billPanel = document.getElementById("bill-panel");
                billPanel.classList.add("glow");

                setTimeout(() => {
                    billPanel.classList.remove("glow");
                    NewOrder();
                }, 800);
            });
        });

        ipcRenderer.once("bill-error", (event, { error }) => {
            createTextPopup(`Save Error: ${error}`);
        });

    } catch (error) {
        createTextPopup(`Printer not available: ${error}. Order was not saved.`);
    }
}

// This function gets called when user clicks on 'KOT' button in bill panel
async function saveAndPrintKOT() {
    const user = await ipcRenderer.invoke("get-session-user");
    const cashier = user.userid;
    const date = new Date().toISOString().split("T")[0];

    const billItems = document.querySelectorAll(".bill-item");
    let orderItems = [];
    let totalAmount = 0;

    billItems.forEach(item => {
        let foodId = item.id.replace("bill-item-", "");
        let quantity = parseInt(item.querySelector(".bill-quantity").value);
        let itemTotal = parseFloat(item.querySelector(".bill-total").textContent);
        if (!isNaN(itemTotal)) totalAmount += itemTotal;
        orderItems.push({ foodId: parseInt(foodId), quantity });
    });

    if (orderItems.length === 0) {
        createTextPopup("No items in the bill. Please add items before proceeding.");
        return;
    }

    // Handle discount - only use discount if it exists and has a valid value
    let discountField = document.getElementById("discounted-total");
    let discountedTotal = totalAmount; // Default to original total
    
    if (discountField && discountField.value && parseFloat(discountField.value) !== totalAmount) {
        discountedTotal = parseFloat(discountField.value);
    }

    // Prepare items for printing
    const itemsForPrinting = Array.from(billItems).map(item => ({
        name: item.querySelector(".bill-item-name").textContent,
        quantity: item.querySelector(".bill-quantity").value,
        price: parseFloat(item.querySelector(".bill-total").textContent)
    }));

    try {
        // 👉 FIRST test if printer is available
        await ipcRenderer.invoke("test-printer-connection");
        
        // 👉 ONLY if printer test succeeds, then save to database
        ipcRenderer.send("save-bill", { cashier, date, orderItems, totalAmount: discountedTotal });

        ipcRenderer.once("bill-saved", (event, { kot, orderId }) => {
            // Now we print only the KOT (no customer receipt)
            ipcRenderer.send("print-kot-only", {
                billItems: itemsForPrinting,
                totalAmount: discountedTotal,
                kot,
                orderId,
                dateTime: new Date().toLocaleString()
            });

            ipcRenderer.once("print-kot-success", () => {
                DeductInventory();
                const billPanel = document.getElementById("bill-panel");
                billPanel.classList.add("glow");

                setTimeout(() => {
                    billPanel.classList.remove("glow");
                    NewOrder();
                }, 800);
            });

            ipcRenderer.once("print-error", (event, error) => {
                // Even if KOT print fails, at least we tested the printer was available
                createTextPopup(`KOT print failed after saving: ${error}`);
                DeductInventory();
                const billPanel = document.getElementById("bill-panel");
                billPanel.classList.add("glow");

                setTimeout(() => {
                    billPanel.classList.remove("glow");
                    NewOrder();
                }, 800);
            });
        });

        ipcRenderer.once("bill-error", (event, { error }) => {
            createTextPopup(`Save Error: ${error}`);
        });

    } catch (error) {
        createTextPopup(`Printer not available: ${error}. Order was not saved.`);
    }
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

async function holdBill() {
    // Get cashier ID (Assume it's set somewhere in the UI)
    const user = await ipcRenderer.invoke("get-session-user");
    const cashier = user.userid; // Replace with actual cashier ID

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
    <div class="popup-content">
        <h3>Apply Discount</h3>
        
        <div class="input-group">
            <label for="discount-percentage">Discount Percentage:</label>
            <input type="number" 
                id="discount-percentage" 
                placeholder="0-100%" 
                min="0" 
                max="100" 
                step="0.01" 
                required>
        </div>

        <div class="input-group">
            <label for="discount-amount">Fixed Discount (Rs.):</label>
            <input type="number" 
                id="discount-amount" 
                placeholder="Enter amount" 
                min="0" 
                step="0.01" 
                required>
        </div>

        <div class="popup-buttons">
            <button id="apply-discount-btn" type="button">Apply</button>
            <button id="closePopup" type="button">Cancel</button>
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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    body, .popup-container {
        font-family: 'Inter', sans-serif;
    }

    .popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(13, 59, 102, 0.15);
        backdrop-filter: blur(12px);
        z-index: 999;
        animation: overlayFadeIn 0.3s ease-out;
    }

    @keyframes overlayFadeIn {
        from { opacity: 0; backdrop-filter: blur(0px); }
        to { opacity: 1; backdrop-filter: blur(12px); }
    }

    .held-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 20px;
        box-shadow: 
            0 25px 50px rgba(13, 59, 102, 0.25),
            0 10px 25px rgba(13, 59, 102, 0.15),
            0 0 0 1px rgba(13, 59, 102, 0.1);
        width: 95%;
        max-width: 1200px;
        max-height: 95vh;
        overflow: hidden;
        animation: popupEntrance 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: 1000;
    }

    @keyframes popupEntrance {
        0% { 
            transform: translate(-50%, -60%) scale(0.8); 
            opacity: 0; 
        }
        100% { 
            transform: translate(-50%, -50%) scale(1); 
            opacity: 1; 
        }
    }

    .popup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(135deg, #0D3B66 0%, #1a5490 100%);
        color: white;
        padding: 1.25rem 1.5rem;
        position: relative;
        overflow: hidden;
    }

    .popup-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
        animation: shimmer 3s infinite;
    }

    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }

    .popup-title {
        font-size: 2rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        justify-content: center;
        margin: 0;
        position: relative;
        z-index: 1;
        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .spacer {
        width: 48px;
    }

    .close-btn {
        background: rgba(255, 255, 255, 0.15);
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        z-index: 1;
        backdrop-filter: blur(10px);
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .close-btn:active {
        transform: scale(0.95);
    }

    .orders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 2rem;
        padding: 2rem;
        max-height: 75vh;
        overflow-y: auto;
        background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    }

    .order-card {
        background: white;
        border-radius: 16px;
        border: 2px solid transparent;
        box-shadow: 
            0 8px 25px rgba(13, 59, 102, 0.12),
            0 3px 10px rgba(13, 59, 102, 0.08);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        animation: cardFadeIn 0.5s ease-out;
        position: relative;
    }

    .order-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #0D3B66, #1a5490);
        transform: scaleX(0);
        transition: transform 0.3s ease;
    }

    .order-card:hover {
        transform: translateY(-8px);
        border-color: rgba(13, 59, 102, 0.2);
        box-shadow: 
            0 20px 40px rgba(13, 59, 102, 0.2),
            0 8px 20px rgba(13, 59, 102, 0.12);
    }

    .order-card:hover::before {
        transform: scaleX(1);
    }

    @keyframes cardFadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .card-header {
        padding: 1.5rem;
        background: linear-gradient(135deg, #0D3B66 0%, rgba(13, 59, 102, 0.9) 100%);
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75rem;
        position: relative;
        overflow: hidden;
    }

    .card-header::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 50%);
        pointer-events: none;
    }

    .order-id {
        font-weight: 700;
        font-size: 1.2rem;
        color: white;
        text-shadow: 0 1px 3px rgba(0,0,0,0.3);
        position: relative;
        z-index: 1;
    }

    .cashier-badge {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        backdrop-filter: blur(10px);
        position: relative;
        z-index: 1;
    }

    .order-items {
        padding: 1.5rem;
        display: grid;
        gap: 0.75rem;
        min-height: 180px;
        max-height: 180px;
        overflow-y: auto;
        background: linear-gradient(to bottom, #ffffff, #f8fafc);
    }

    .order-item {
        padding: 0.75rem 1rem;
        background: white;
        border: 1px solid rgba(13, 59, 102, 0.1);
        border-radius: 10px;
        font-size: 0.95rem;
        font-weight: 500;
        color: #0D3B66;
        display: flex;
        align-items: center;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(13, 59, 102, 0.05);
    }

    .order-item:hover {
        background: #f8fafc;
        border-color: rgba(13, 59, 102, 0.2);
        transform: translateX(4px);
    }

    .card-footer {
        padding: 1.5rem;
        background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
        border-top: 1px solid rgba(13, 59, 102, 0.1);
    }

    .order-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.25rem;
        font-weight: 600;
        font-size: 1.1rem;
        color: #0D3B66;
    }

    .total-label {
        color: #0D3B66;
        opacity: 0.8;
    }

    .total-amount {
        color: #0D3B66;
        font-weight: 700;
        font-size: 1.2rem;
    }

    .action-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .btn-add, .btn-delete {
        padding: 0.875rem 1.25rem;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
    }

    .btn-add {
        background: linear-gradient(135deg, #0D3B66 0%, #1a5490 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(13, 59, 102, 0.3);
    }

    .btn-add::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
    }

    .btn-add:hover::before {
        left: 100%;
    }

    .btn-delete {
        background: white;
        color: #0D3B66;
        border: 2px solid #0D3B66;
        box-shadow: 0 4px 12px rgba(13, 59, 102, 0.15);
    }

    .btn-add:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(13, 59, 102, 0.4);
    }

    .btn-delete:hover {
        background: #0D3B66;
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(13, 59, 102, 0.3);
    }

    .btn-add:active, .btn-delete:active {
        transform: translateY(0);
    }

    .icon {
        display: inline-block;
        vertical-align: middle;
        transition: transform 0.2s ease;
    }

    .btn-add:hover .icon, .btn-delete:hover .icon {
        transform: scale(1.1);
    }

    ::-webkit-scrollbar {
        width: 12px;
    }

    ::-webkit-scrollbar-track {
        background: rgba(13, 59, 102, 0.05);
        border-radius: 6px;
    }

    ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #0D3B66, #1a5490);
        border-radius: 6px;
        border: 2px solid transparent;
        background-clip: content-box;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #1a5490, #0D3B66);
        background-clip: content-box;
    }

    /* Empty state styling */
    .orders-grid:empty::after {
        content: 'No held orders found';
        grid-column: 1 / -1;
        text-align: center;
        padding: 4rem 2rem;
        font-size: 1.5rem;
        font-weight: 500;
        color: #0D3B66;
        opacity: 0.6;
        background: white;
        border-radius: 16px;
        border: 2px dashed rgba(13, 59, 102, 0.2);
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
    overlay.addEventListener('click', (e) => {
        // Only close if clicking directly on the overlay, not on the popup
        if (e.target === overlay) {
            closeTodaysOrdersPopup();
        }
    });
    
    // Prevent popup from closing when clicking inside it
    popup.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
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
    // Extra safety: ensure all discount-related fields are properly cleared
    clearAllDiscountFields();
}

// Helper function to completely clear all discount-related fields
function clearAllDiscountFields() {
    // Remove the hidden discounted-total field completely
    let discountField = document.getElementById("discounted-total");
    if (discountField) {
        discountField.remove();
    }
    
    // Clear visible discount input fields
    let discountPercentageInput = document.getElementById("discount-percentage");
    let discountAmountInput = document.getElementById("discount-amount");
    
    if (discountPercentageInput) {
        discountPercentageInput.value = "";
        discountPercentageInput.disabled = false;
    }
    if (discountAmountInput) {
        discountAmountInput.value = "";
        discountAmountInput.disabled = false;
    }
    
    // Reset discount display
    let discountDisplay = document.getElementById("discount-applied-display");
    if (discountDisplay) {
        discountDisplay.textContent = "Discount: ₹0.00";
    }
}
// ----------------ONLINE ORDERS FUNCTIONALITY STARTS HERE ------------------
function getOnlineOrders() {
    function fetchFoodItemName(fid, callback) {
        ipcRenderer.once(`food-name-${fid}`, (event, name) => {
            callback(name || "Unknown Item");
        });
        ipcRenderer.send("get-food-name", fid);
    }
    async function showOnlineOrdersPopup(orders) {
        // Overlay for background blur
        const overlay = document.createElement("div");
        overlay.style = `
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(13, 59, 102, 0.18);
            backdrop-filter: blur(6px);
            z-index: 999;
        `;
        overlay.onclick = () => {
            popup.remove();
            overlay.remove();
        };

        let popup = document.createElement("div");
        popup.id = "onlineOrdersPopup";
        popup.style = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f7fbff;
            padding: 35px 24px 24px 24px;
            border-radius: 16px;
            box-shadow: 0 12px 40px rgba(13,59,102,0.13);
            max-width: 95%;
            width: 650px;
            max-height: 85vh;
            overflow-y: auto;
            z-index: 1000;
            border: 1px solid #dbeafe;
            font-family: 'Segoe UI', 'Inter', Arial, sans-serif;
        `;

        // Close Button
        const closeBtn = document.createElement("div");
        closeBtn.innerHTML = "&times;";
        closeBtn.style = `
            position: absolute;
            top: 15px;
            right: 15px;
            cursor: pointer;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #2563eb;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            transition: all 0.2s;
            line-height: 1;
            box-shadow: 0 2px 8px rgba(37,99,235,0.08);
        `;
        closeBtn.onmouseover = () => {
            closeBtn.style.background = '#1e40af';
            closeBtn.style.transform = 'rotate(90deg) scale(1.1)';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.background = '#2563eb';
            closeBtn.style.transform = 'none';
        };
        closeBtn.onclick = () => {
            popup.remove();
            overlay.remove();
        };
        popup.appendChild(closeBtn);

        // SVG icons (blue/gray theme, no emojis)
        const svgPackage = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 24 24"><path d="M21 16v-8l-9-4-9 4v8l9 4 9-4zm-18-7.5 7.5-3.33v5.83l-7.5 3.34v-5.84zm16.5 6.33-7.5 3.34v-5.84l7.5-3.34v5.84zm-11.25-4.33h4.5v2h-4.5v-2z"/></svg>`;
        const svgUser = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#0c345a" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
        const svgMoney = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 24 24"><path d="M12 1c-4.97 0-9 4.03-9 9h2a7 7 0 0 1 7-7 7 7 0 0 1 7 7c0 3.86-3.14 7-7 7a6.97 6.97 0 0 1-6.93-6H3c0 4.97 4.03 9 9 9 5.52 0 10-4.48 10-10S17.52 1 12 1z"/></svg>`;
        const svgFood = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#0c345a" viewBox="0 0 24 24"><path d="M8 13v5a1 1 0 1 0 2 0v-5a3 3 0 1 0-2 0zM12 8a1 1 0 0 0 0 2h2v8h2v-8h2a1 1 0 0 0 0-2h-6z"/></svg>`;
        const svgCheck = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M20.285 6.709l-11.09 11.09-5.486-5.486 1.415-1.415 4.07 4.07 9.675-9.675z"/></svg>`;
        const svgCancel = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M18.364 5.636l-1.414-1.414L12 9.172 7.05 4.222 5.636 5.636 10.586 10.586 5.636 15.536l1.414 1.414L12 12l4.95 4.95 1.414-1.414L13.414 10.586z"/></svg>`;

        // Title
        const title = document.createElement("div");
        title.style = `
            font-size: 1.7rem;
            font-weight: 700;
            color: #0c345a;
            margin-bottom: 18px;
            text-align: center;
            letter-spacing: -0.5px;
        `;
        title.textContent = "Online Orders";
        popup.appendChild(title);

        if (orders.length === 0) {
            const emptyMsg = document.createElement("div");
            emptyMsg.style = `
                color: #2563eb;
                background: #e0e7ef;
                border-radius: 10px;
                padding: 32px 0;
                text-align: center;
                font-size: 1.2rem;
                font-weight: 500;
                margin: 24px 0;
            `;
            emptyMsg.textContent = "No pending online orders.";
            popup.appendChild(emptyMsg);
        }

        orders.forEach(order => {
            const orderDiv = document.createElement("div");
            orderDiv.style = `
                background: #fff;
                margin: 18px 0;
                padding: 20px 18px 16px 18px;
                border-radius: 12px;
                box-shadow: 0 3px 12px rgba(13,59,102,0.07);
                border: 1px solid #e0e7ef;
                transition: transform 0.2s, box-shadow 0.2s;
            `;
            orderDiv.onmouseover = () => {
                orderDiv.style.transform = 'translateY(-2px)';
                orderDiv.style.boxShadow = '0 6px 18px rgba(13,59,102,0.11)';
            };
            orderDiv.onmouseout = () => {
                orderDiv.style.transform = 'none';
                orderDiv.style.boxShadow = '0 3px 12px rgba(13,59,102,0.07)';
            };

            // Payment status text & color
            const paidOnline = order.paymentId !== null && order.paymentId !== "";
            const paymentMethod = paidOnline ? "Online" : "Cafe";
            const paymentColor = paidOnline ? "#2563eb" : "#e11d48";
            const paymentBg = paidOnline ? "#e0e7ef" : "#fef2f2";


            const header = document.createElement("div");
            header.style = `
                font-weight: 600;
                color: #0c345a;
                font-size: 1.1rem;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 2px solid #f1f5fa;
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            `;
            header.innerHTML = `
                ${svgPackage} <span style="color: #2563eb;">Order ${order.orderId}</span>
                | ${svgUser} ${order.customerName} (${order.phone})
                | ${svgMoney} <span style="color: #2563eb;">₹${order.totalPrice}</span>
                | <span style="color: ${paymentColor}; background: ${paymentBg}; border-radius: 6px; padding: 2px 10px; font-size: 0.98em;">
                ${paidOnline ? `Paid Online (ID: ${order.paymentId})` : "Pay at Cafe"}
                </span>
            `;
            orderDiv.appendChild(header);

            // Items - asynchronously fetch names and then append
            order.items.forEach(item => {
                // Create placeholder paragraph to update later
                const itemP = document.createElement("p");
                itemP.style = `
                    margin: 8px 0;
                    padding: 8px 10px;
                    background: #f1f5fa;
                    border-radius: 7px;
                    font-size: 1rem;
                    color: #0c345a;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                `;
                itemP.innerHTML = `${svgFood} <span style="font-weight: 500;">Loading item #${item.fid}...</span>`;
                orderDiv.appendChild(itemP);

                // Fetch food item name and update paragraph
                fetchFoodItemName(item.fid, (itemName) => {
                    itemP.innerHTML = `
                        ${svgFood} <span style="font-weight: 500;">${itemName}</span>
                        <span style="color: #2563eb; margin-left: 12px;">x${item.quantity}</span>
                        <span style="margin-left: auto; color: #0c345a; font-weight: 600;">₹${item.price}</span>
                    `;
                });
            });

            const buttonsDiv = document.createElement("div");
            buttonsDiv.style = `
                display: flex;
                gap: 14px;
                margin-top: 18px;
                padding-top: 14px;
                border-top: 1px solid #e0e7ef;
            `;

            // Add to Bill Button
            const addToBillBtn = document.createElement("button");
            addToBillBtn.style = `
                background: #2563eb;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: 600;
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-size: 1rem;
                box-shadow: 0 2px 8px rgba(37,99,235,0.07);
            `;
            addToBillBtn.onmouseover = () => addToBillBtn.style.background = '#1e40af';
            addToBillBtn.onmouseout = () => addToBillBtn.style.background = '#2563eb';
            addToBillBtn.innerHTML = `${svgCheck} Add to Bill`;
            addToBillBtn.onclick = async () => {
                order.items.forEach(item => {
                    fetchFoodItemName(item.fid, (itemName) => {
                        addToBill(item.fid, itemName, item.price, item.quantity);
                    });
                });
                ipcRenderer.send("cancel-online-order", order.orderId);
                const result = await ipcRenderer.invoke('update-online-order', { orderId: order.orderId, status: 1 });
                if (result.success) {
                    console.log('Status updated:', result.message);
                } else {
                    console.error('Failed to update:', result.message);
                }
                popup.remove();
                overlay.remove();
            };

            // Cancel Order Button
            const cancelBtn = document.createElement("button");
            cancelBtn.style = `
                background: #e11d48;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: 600;
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-size: 1rem;
                box-shadow: 0 2px 8px rgba(225,29,72,0.07);
            `;
            cancelBtn.onmouseover = () => cancelBtn.style.background = '#be123c';
            cancelBtn.onmouseout = () => cancelBtn.style.background = '#e11d48';
            cancelBtn.innerHTML = `${svgCancel} Cancel Order`;
            cancelBtn.onclick = () => {
                    const  {createConfirmPopup} = require("./textPopup");
                    // Show the custom confirmation popup and handle the user's response

                    createConfirmPopup(`Are you sure you want to cancel Order ${order.orderId}?`, async (confirmed) => {
                    if (confirmed) {
                        // User clicked OK, send the delete request
                        ipcRenderer.send("cancel-online-order", order.orderId);
                        const result = await ipcRenderer.invoke('update-online-order', { orderId: order.orderId, status: 0 });
                        if (result.success) {
                            console.log('Status updated:', result.message);
                        } else {
                            console.error('Failed to update:', result.message);
                        }

                        popup.remove();
                        overlay.remove();
                    } 
                });


            };

            buttonsDiv.appendChild(addToBillBtn);
            buttonsDiv.appendChild(cancelBtn);
            orderDiv.appendChild(buttonsDiv);
            popup.appendChild(orderDiv);
        });

        document.body.appendChild(overlay);
        document.body.appendChild(popup);
    }



    let existingPopup = document.getElementById("onlineOrdersPopup");

    if (existingPopup) {
        existingPopup.remove();
        return;
    }

    ipcRenderer.send("get-online-orders"); // Request online orders from the main process
    ipcRenderer.once('online-orders-response', (event, response) => {
        if (response.error) {
            const createTextPopup = require("./textPopup");
            createTextPopup('Failed to fetch online orders: ' + response.message);
            return;
        }

        showOnlineOrdersPopup(response.orders);
    });

}

// --------------- ONLINE ORDERS FUNCTIONALITY ENDS HERE ------------------