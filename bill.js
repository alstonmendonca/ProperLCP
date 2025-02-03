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
function removeFromBill(itemId) {
    const billItem = document.getElementById(`bill-item-${itemId}`);
    if (billItem) {
        billItem.remove();
        updateBillTotal();
    }
}

// Function to apply the discount
function applyDiscount() {
    const discountPercentage = parseFloat(document.getElementById("discount-percentage").value);
    const discountAmount = parseFloat(document.getElementById("discount-amount").value);
    let totalAmount = 0;

    // Get all the bill items
    const billPanel = document.getElementById("bill-panel");
    const billItems = billPanel.getElementsByClassName("bill-item");

    // Calculate the total amount
    for (let item of billItems) {
        totalAmount += parseFloat(item.querySelector(".bill-total").textContent);
    }

    // Validate discount input
    if ((isNaN(discountPercentage) && isNaN(discountAmount)) || (discountPercentage < 0 && discountAmount < 0)) {
        alert("Please enter a valid discount.");
        return;
    }

    // Apply the discount based on user input
    if (discountPercentage > 0) {
        // Apply percentage discount
        totalAmount -= totalAmount * (discountPercentage / 100);
    }

    if (discountAmount > 0) {
        // Apply fixed amount discount
        totalAmount -= discountAmount;
    }

    // Ensure the total doesn't go below zero
    totalAmount = Math.max(0, totalAmount);

    // Format the total amount with currency formatting
    const formattedTotal = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(totalAmount);

    // Update the total element with the discounted price
    const totalElement = document.getElementById("total-amount");
    totalElement.textContent = `Total: ${formattedTotal}`;

    // Optionally, hide the discount section after applying the discount
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
    alert("Bill saved and sent to print!");
    window.print(); // Opens print dialog
}

function holdBill() {
    alert("Bill put on hold!");
    // Add logic to hold the bill (e.g., store it in localStorage)
}

// Function to toggle the visibility of the discount inputs and apply button
function toggleDiscountInputs() {
    const discountSection = document.getElementById("discount-section");
    
    // Toggle the display style between block and none
    if (discountSection.style.display === 'block') {
        discountSection.style.display = 'none';
    } else {
        discountSection.style.display = 'block';
    }
}