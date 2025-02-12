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
    // Update the total bill amount (if you have a total display)
    updateBillTotal();
}
// Function to apply the discount
// Function to apply the discount
function applyDiscount() {
    let discountPercentage = parseFloat(document.getElementById("discount-percentage").value) || 0;
    let discountAmount = parseFloat(document.getElementById("discount-amount").value) || 0;
    let totalAmount = 0;

    // Get all the bill items
    const billItems = document.querySelectorAll(".bill-item");

    // Calculate the total amount before applying discounts
    billItems.forEach(item => {
        let amountText = item.querySelector(".bill-total").textContent;
        let amount = parseFloat(amountText.replace(/[^0-9.]/g, "")); // Extract only numeric value
        if (!isNaN(amount)) {
            totalAmount += amount;
        }
    });

    // Ensure valid discount inputs
    if (discountPercentage < 0 || discountAmount < 0) {
        alert("Discount cannot be negative.");
        document.getElementById("discount-percentage").value = "";
        document.getElementById("discount-amount").value = "";
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

    // Apply the discount
    if (discountPercentage > 0) {
        totalAmount -= totalAmount * (discountPercentage / 100);
    } else if (discountAmount > 0) {
        totalAmount -= discountAmount;
    }

    // Ensure total doesn't go negative
    totalAmount = Math.max(0, totalAmount);

    // Format the total amount
    const formattedTotal = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(totalAmount);

    // Update total display
    document.getElementById("total-amount").textContent = `Total: ${formattedTotal}`;

    // Hide discount section after applying (if it exists)
    const discountSection = document.getElementById("discount-section");
    if (discountSection) {
        discountSection.style.display = 'none';
    }
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
        alert("No items in the bill.");
        return;
    }

    // Send order data to main process
    ipcRenderer.send("save-bill", { cashier, date, orderItems });

    alert("Bill saved and sent to print!");
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
        alert("No items in the bill.");
        return;
    }

    // Send order data to main process
    ipcRenderer.send("hold-bill", { cashier, date, orderItems });
    alert("Bill put on hold!");
    resetBill();
    // Add logic to hold the bill (e.g., store it in localStorage)
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
