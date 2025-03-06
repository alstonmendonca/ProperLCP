const { ipcRenderer } = require("electron");

function fetchItemHistory(startDate = null, endDate = null, foodItem = null) {
    // Use function parameters if available; otherwise, get values from inputs
    if (!startDate) startDate = document.getElementById("itemStartDate").value;
    if (!endDate) endDate = document.getElementById("itemEndDate").value;
    if (!foodItem) foodItem = document.getElementById("foodItemDropdown").value;

    if (!startDate || !endDate) {
        showPopupMessage("Please select both start and end dates."); // Custom popup message
        return;
    }

    if (!foodItem) {
        showPopupMessage("Please select a food item."); // Custom popup message
        return;
    }

    // Store selected filters in sessionStorage
    sessionStorage.setItem("itemHistoryStartDate", startDate);
    sessionStorage.setItem("itemHistoryEndDate", endDate);
    sessionStorage.setItem("itemHistoryCategory", foodItem);

    // Send request to fetch item history data
    ipcRenderer.send("get-item-history", { startDate, endDate, foodItem });
}

// Function to display item history table
function displayItemHistory(orders) {
    const itemHistoryDiv = document.getElementById("itemHistoryDiv");
    itemHistoryDiv.innerHTML = ""; // Clear previous content

    if (orders.length === 0) {
        itemHistoryDiv.innerHTML = "<p>No item history found for the selected criteria.</p>";
        return;
    }

    // Create a table
    let tableHTML = `
        <table class="order-history-table">
            <thead>
                <tr>
                    <th>Bill No</th>
                    <th class="date-column">Date</th>
                    <th>Cashier</th>
                    <th>KOT</th>
                    <th>Price (₹)</th>
                    <th>Food Item</th>
                </tr>
            </thead>
            <tbody>
    `;

    orders.forEach(order => {
        tableHTML += `
            <tr>
                <td>${order.billno}</td>
                <td class="date-column">${order.date}</td>
                <td>${order.cashier_name}</td>
                <td>${order.kot}</td>
                <td>${order.price.toFixed(2)}</td>
                <td>${order.food_item}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    itemHistoryDiv.innerHTML = tableHTML;
}

// ✅ Store item history data and display it
ipcRenderer.on("item-history-response", (event, data) => {
    displayItemHistory(data.orders);
});

// Function to show a custom popup message
function showPopupMessage(message) {
    // Implement your custom popup message logic here
    alert(message); // Replace with your custom popup implementation
}

// Export functions
module.exports = { fetchItemHistory, displayItemHistory };