// itemSummary.js

const { ipcRenderer } = require('electron');

// Function to load the Item Summary content
function loadItemSummary(mainContent, billPanel) {
    mainContent.innerHTML = `
        <h2>Item Summary</h2>
        <div id="itemSummaryDiv" class="item-summary-container"></div>
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
        <table class="item-summary-table">
            <thead>
                <tr>
                    <th onclick="sortTable('item')">Item ${getSortIndicator('item')}</th>
                    <th onclick="sortTable('quantity')">Quantity ${getSortIndicator('quantity')}</th>
                    <th onclick="sortTable('revenue')">Revenue ${getSortIndicator('revenue')}</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Add rows for each category
    Object.keys(groupedItems).forEach(category => {
        tableHTML += `
            <tr class="category-row">
                <td colspan="3"><strong>${category}</strong></td>
            </tr>
        `;
        groupedItems[category].forEach(item => {
            tableHTML += `
                <tr class="item-row">
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

    // Add the sorting function to the window object
    window.sortTable = (sortBy) => {
        const sortedItems = sortItems(items, sortBy);
        displayItemSummary(sortedItems);
    };
}

// Function to sort items by a specific key
function sortItems(items, sortBy) {
    let sortOrder = window.currentSortOrder || "asc"; // Default to ascending order

    // Toggle sort order if the same column is clicked again
    if (window.currentSortBy === sortBy) {
        sortOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
        sortOrder = "asc"; // Reset to ascending order if a new column is clicked
    }

    // Save the current sort state
    window.currentSortBy = sortBy;
    window.currentSortOrder = sortOrder;

    return items.sort((a, b) => {
        let comparison = 0;
        if (sortBy === "item") {
            comparison = a.item.localeCompare(b.item);
        } else if (sortBy === "quantity") {
            comparison = a.quantity - b.quantity;
        } else if (sortBy === "revenue") {
            comparison = a.revenue - b.revenue;
        }

        // Apply sort order
        return sortOrder === "asc" ? comparison : -comparison;
    });
}

// Function to get the sort indicator (▲ or ▼) for a column
function getSortIndicator(sortBy) {
    if (window.currentSortBy === sortBy) {
        return window.currentSortOrder === "asc" ? "▲" : "▼";
    }
    return "▲▼"; // Default indicator if the column is not sorted
}

// Export the loadItemSummary function
module.exports = { loadItemSummary };