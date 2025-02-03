// Function to display the item values in the database
function createTableContent(rows, category) {
    return `
        <h2>${category}</h2>
        <div class="table-container">
            <table style="width: 100%; border-collapse: collapse; text-align: left; border: 1px solid #ccc;">
                <thead>
                    <tr>
                        <th style="padding: 8px; border: 1px solid #ccc;">Item ID</th>
                        <th style="padding: 8px; border: 1px solid #ccc;">Item Name</th>
                        <th style="padding: 8px; border: 1px solid #ccc;">Price</th>
                        <th style="padding: 8px; border: 1px solid #ccc;">Quantity</th>
                        <th style="padding: 8px; border: 1px solid #ccc;">Add</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ccc;">${row.ITEMID}</td>
                            <td style="padding: 8px; border: 1px solid #ccc;">${row.ITEMNAME}</td>
                            <td style="padding: 8px; border: 1px solid #ccc;">${row.PRICE.toFixed(2)}</td>
                            <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">
                                <button class="quantity-btn" onclick="changeQuantity('${row.ITEMID}', -1)">-</button>
                                <input type="number" id="quantity-${row.ITEMID}" value="0" min="0" readonly style="width: 50px; text-align: center;" />
                                <button class="quantity-btn" onclick="changeQuantity('${row.ITEMID}', 1)">+</button>
                            </td>
                            <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">
                                <button onclick="addToBill('${row.ITEMID}', '${row.ITEMNAME}', ${row.PRICE})" style="padding: 6px 12px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    Add to Bill
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Change the quantity for a specific item
function changeQuantity(itemId, change) {
    const quantityInput = document.getElementById(`quantity-${itemId}`);
    let currentQuantity = parseInt(quantityInput.value);
    currentQuantity = Math.max(0, currentQuantity + change);  // Prevent going below 0
    quantityInput.value = currentQuantity;
}