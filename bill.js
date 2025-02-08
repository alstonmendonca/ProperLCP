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