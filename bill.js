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
        totalAmount += parseFloat(item.querySelector(".bill-total").textContent);
    });

    // Ensure valid discount inputs
    if (discountPercentage < 0 || discountAmount < 0) {
        alert("Discount cannot be negative.");
        return;
    }

    if (discountPercentage > 0 && discountAmount > 0) {
        alert("Please apply either a percentage discount OR a fixed amount discount, not both.");
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

    // Hide discount section after applying
    document.getElementById("discount-section").style.display = 'none';
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
        <div class="popup-content" style="align-items: center; justify-content: center; width: 300px;">
            <h3>Apply Discount</h3>
            
            <label for="discount-percentage">Discount Percentage:</label>
            <input type="number" id="discount-percentage" placeholder="Enter discount %" min="0" max="100" style="width: 75%;">

            <label for="discount-amount">Fixed Discount (Rs.):</label>
            <input type="number" id="discount-amount" placeholder="Enter discount amount" min="0" style="width: 75%;">

            <br>

            <div class="popup-buttons">
                <button id="apply-discount-btn" style="margin-right: 10px;">Apply</button>
                <button id="closePopup">Cancel</button>
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
        popup.style.display = 'none'; // Close the popup
        applyDiscount(); // Call the discount function
        
    });
}
