// Add an item to the bill
function addToBill(itemId, itemName, price, quantity) {
    if (quantity > 0) {
        const totalPrice = price * quantity;
        // Get the scrollable container for bill items:
        const billItemsList = document.getElementById("bill-items-list");

        let existingItem = document.getElementById(`bill-item-${itemId}`);
        if (existingItem) {
            const quantityCell = existingItem.querySelector(".bill-quantity");
            const totalPriceCell = existingItem.querySelector(".bill-total");
            let newQuantity = parseInt(quantityCell.textContent) + quantity;
            quantityCell.textContent = newQuantity;
            totalPriceCell.textContent = (price * newQuantity).toFixed(2);
        } else {
            const billItemRow = document.createElement("div");
            billItemRow.classList.add("bill-item");
            billItemRow.id = `bill-item-${itemId}`;
            billItemRow.innerHTML = `
                <span class="bill-item-name">${itemName}</span>
                <span class="bill-quantity">${quantity}</span>
                x
                <span class="bill-price">${price.toFixed(2)}</span>
                = 
                <span class="bill-total">${totalPrice.toFixed(2)}</span>
                <button onclick="removeFromBill('${itemId}')">Remove</button>
            `;
            // Append to the scrollable container:
            billItemsList.appendChild(billItemRow);
        }

        updateBillTotal();
    } else {
        alert('Please select a quantity greater than 0 to add to the bill.');
    }
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

    const billItems = document.querySelectorAll(".bill-item");

    // Calculate total before applying discount
    billItems.forEach(item => {
        let amount = parseFloat(item.querySelector(".bill-total").textContent);
        if (!isNaN(amount)) {
            totalAmount += amount;
        }
    });

    // Ensure previous discount is cleared before applying a new one
    let discountField = document.getElementById("discounted-total");
    if (discountField) {
        discountField.value = totalAmount; // Reset before applying a new discount
    }

    if (discountPercentage < 0 || discountAmount < 0) {
        alert("Discount cannot be negative.");
        return;
    }

    if (discountPercentage > 0 && discountAmount > 0) {
        alert("Please apply either a percentage discount OR a fixed amount discount, not both.");
        return;
    }

    if (discountAmount > totalAmount) {
        alert("Discount amount cannot exceed the total bill amount.");
        return;
    }

    // Apply discount
    let discountedTotal = totalAmount;
    if (discountPercentage > 0) {
        discountedTotal -= totalAmount * (discountPercentage / 100);
    } else if (discountAmount > 0) {
        discountedTotal -= discountAmount;
    }

    discountedTotal = Math.max(0, discountedTotal); // Prevent negative total

    // Store discounted total properly
    if (!discountField) {
        discountField = document.createElement("input");
        discountField.type = "hidden";
        discountField.id = "discounted-total";
        document.body.appendChild(discountField);
    }
    discountField.value = discountedTotal;

    // Update displayed total
    const formattedTotal = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(discountedTotal);
    document.getElementById("total-amount").textContent = `Total: ${formattedTotal}`;
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


// Function to save and print the bill
function saveAndPrintBill() {
    const cashier = 1; // Replace with actual cashier ID
    const date = new Date().toISOString().split("T")[0];

    const billItems = document.querySelectorAll(".bill-item");
    let orderItems = [];
    let totalAmount = 0;

    billItems.forEach(item => {
        let foodId = item.id.replace("bill-item-", ""); // Extract item ID
        let quantity = parseInt(item.querySelector(".bill-quantity").textContent);
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

    createTextPopup("Bill saved and sent to print!");

    resetBill();
}



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
        let quantity = parseInt(item.querySelector(".bill-quantity").textContent);

        orderItems.push({ foodId: parseInt(foodId), quantity });
    });

    if (orderItems.length === 0) {
        createTextPopup("No items in the bill. Please add items before proceeding.");
        return;
    }

    // Send order data to main process
    ipcRenderer.send("hold-bill", { cashier, date, orderItems });

    // Show confirmation popup instead of alert
    createTextPopup("Bill put on hold!");

    resetBill();
}
// Function to toggle the visibility of the discount inputs and apply button
function toggleDiscountPopup() {
    let existingPopup = document.getElementById("discount-popup");
    if (existingPopup) {
        existingPopup.remove();
        return;
    }

    const popup = document.createElement("div");
    popup.id = "discount-popup";
    popup.classList.add("edit-popup");

    popup.innerHTML = `
        <div class="popup-content" style="align-items: center; justify-content: center; width: 300px; pointer-events: auto;">
            <h3>Apply Discount</h3>
            
            <label for="discount-percentage">Discount Percentage:</label>
            <input type="number" id="discount-percentage" placeholder="Enter discount %" min="0" max="100" style="width: 75%;">

            <label for="discount-amount">Fixed Discount (Rs.):</label>
            <input type="number" id="discount-amount" placeholder="Enter discount amount" min="0" style="width: 75%;">

            <br>

            <div class="popup-buttons">
                <button id="apply-discount-btn" style="margin-right: 10px; width: 90px; height: 40px;">Apply</button>
                <button id="closePopup" style="width: 90px; height: 40px;">Cancel</button>

            </div>
        </div>
    `;

    document.body.appendChild(popup);

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

    let tableHTML = `
        <div class="popup-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 800px;">
            <div style="width: 100%; display: flex; justify-content: flex-end;">
                <span class="close-btn" onclick="closeHeldPopup()" style="cursor: pointer; font-size: 20px; font-weight: bold;">&times;</span>
            </div>
            <h3>Held Orders</h3>
            <div class="custom-scrollbar" style="max-height: 550px; overflow-y: auto; width: 100%;">
                <table class="order-history-table">
                    <thead>
                        <tr>
                            <th>Held ID</th>
                            <th>Cashier</th>
                            <th>Price (₹)</th>
                            <th>SGST (₹)</th>
                            <th>CGST (₹)</th>
                            <th>Tax (₹)</th>
                            <th>Food Items</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    heldOrders.forEach(order => {
        tableHTML += `
            <tr data-heldid="${order.heldid}">
            <td>${order.heldid}</td>
            <td>${order.cashier_name}</td>
            <td>${order.price.toFixed(2)}</td>
            <td>${order.sgst.toFixed(2)}</td>
            <td>${order.cgst.toFixed(2)}</td>
            <td>${order.tax.toFixed(2)}</td>
            <td>${order.food_items || "No items"}</td>
            <td style="display: flex; flex-direction: column; align-items: center;">
                <button onclick="addHeldToBill(${order.heldid})" style="background-color: green; color: white; padding: 5px 10px; border: none; border-radius: 5px; width:140px; height:30px">Add</button>
                <button onclick="deleteHeldOrder(${order.heldid})" style="margin-top: 10px; background-color: red; color: white; padding: 5px 10px; border: none; border-radius: 5px; width:140px; height:30px">Delete</button>
            </td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table></div></div>`;

    popup.innerHTML = tableHTML;
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
    let row = document.querySelector(`tr[data-heldid="${heldId}"]`);
    if (row) {
        row.remove(); // Remove row from UI
    }
});

function closeHeldPopup() {
    let popup = document.getElementById("heldpopup");
    if (popup) {
        popup.remove();
    }
}


function createTextPopup(message) {
    // Remove existing popup if it exists
    let existingPopup = document.getElementById("custom-popup");
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create popup container
    const popup = document.createElement("div");
    popup.id = "custom-popup";
    popup.classList.add("edit-popup");

    popup.innerHTML = `
        <div class="popup-content" style="align-items: center; justify-content: center; width: 300px; pointer-events: auto;">
            <p>${message}</p>

            <br>

            <div class="popup-buttons">
                <button id="closePopup" style="width: 90px; height: 40px;">OK</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Add event listener for closing popup
    document.getElementById("closePopup").addEventListener("click", () => {
        popup.remove();
    });
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
        let quantity = parseInt(item.querySelector(".bill-quantity").textContent);

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

    let tableHTML = `
        <div class="popup-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 800px;">
            <div style="width: 100%; display: flex; justify-content: flex-end;">
                <span class="close-btn" onclick="closeTodaysOrdersPopup()" style="cursor: pointer; font-size: 20px; font-weight: bold;">&times;</span>
            </div>
            <h3>Today's Orders</h3>
            <div class="custom-scrollbar" style="max-height: 550px; overflow-y: auto; width: 100%;">
                <table class="order-history-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Cashier</th>
                            <th>Price (₹)</th>
                            <th>SGST (₹)</th>
                            <th>CGST (₹)</th>
                            <th>Tax (₹)</th>
                            <th>Food Items</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    data.orders.forEach(order => {
        tableHTML += `
            <tr data-orderid="${order.billno}">
                <td>${order.billno}</td>
                <td>${order.cashier_name}</td>
                <td>${order.price.toFixed(2)}</td>
                <td>${order.sgst.toFixed(2)}</td>
                <td>${order.cgst.toFixed(2)}</td>
                <td>${order.tax.toFixed(2)}</td>
                <td>${order.food_items || "No items"}</td>
                <td>
                    <button onclick="addToExistingOrder(${order.billno})" style="background-color: green; color: white; padding: 5px 10px; border: none; border-radius: 5px; width:140px; height:30px">Add to Order</button>
                </td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table></div></div>`;
    popup.innerHTML = tableHTML;
    document.body.appendChild(popup);
});

// Function to add current bill items to an existing order
function addToExistingOrder(orderId) {
    // Get all bill items
    const billItems = document.querySelectorAll(".bill-item");
    let orderItems = [];

    billItems.forEach(item => {
        let foodId = item.id.replace("bill-item-", ""); // Extract item ID
        let quantity = parseInt(item.querySelector(".bill-quantity").textContent);

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
    createTextPopup(`Order ${orderId} updated successfully with new items.`);
}

// Close popup function
function closeTodaysOrdersPopup() {
    let popup = document.getElementById("todaysOrdersPopup");
    if (popup) popup.remove();
}
// ------------ SAVE TO ORDER FUNCTIONALITY ENDS HERE ------------------