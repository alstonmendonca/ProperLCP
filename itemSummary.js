// itemSummary.js

const { ipcRenderer } = require('electron');

// Function to load the Item Summary content
function loadItemSummary(mainContent, billPanel) {
    mainContent.innerHTML = `
        <h2>Item Summary</h2>
        <p>Summary of all sold items.</p>
        <div id="itemSummaryDiv"></div>
    `;
    billPanel.style.display = 'none';

    // Fetch and display item summary data
    fetchItemSummary();
}

// Function to fetch item summary data
function fetchItemSummary() {
    ipcRenderer.send("get-todays-items");

    ipcRenderer.on("todays-items-response", (event, data) => {
        if (data.success) {
            const items = data.items;
            displayItemSummary(items);
        } else {
            console.error("Failed to fetch today's items.");
        }
    });
}

// Function to display the item summary data in a table
function displayItemSummary(items) {
    const itemSummaryDiv = document.getElementById("itemSummaryDiv");

    if (items.length === 0) {
        itemSummaryDiv.innerHTML = "<p>No items sold today.</p>";
        return;
    }

    // Group items by category
    const groupedItems = {};
    items.forEach(item => {
        if (!groupedItems[item.category]) {
            groupedItems[item.category] = [];
        }
        groupedItems[item.category].push(item);
    });

    // Generate the table HTML
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Revenue</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Add rows for each category
    Object.keys(groupedItems).forEach(category => {
        tableHTML += `
            <tr style="background-color: #f0f0f0;">
                <td colspan="3"><strong>Category: ${category}</strong></td>
            </tr>
        `;
        groupedItems[category].forEach(item => {
            tableHTML += `
                <tr>
                    <td>${item.item}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.revenue.toFixed(2)}</td>
                </tr>
            `;
        });
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    itemSummaryDiv.innerHTML = tableHTML;
}

// Export the loadItemSummary function
module.exports = { loadItemSummary };