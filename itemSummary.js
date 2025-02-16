// itemSummary.js
const { ipcRenderer } = require('electron');
const XLSX = require('xlsx'); // Import the xlsx library

// Function to load the Item Summary content
function loadItemSummary(mainContent, billPanel) {
    mainContent.innerHTML = `
        <h2>Item Summary</h2>
        <button id="exportExcelButton">Export to Excel</button>
        <div id="itemSummaryDiv" class="item-summary-container"></div>
    `;
    billPanel.style.display = 'none';

    // Fetch and display item summary data
    fetchItemSummary();

    // Add event listener for the Export to Excel button
    document.getElementById("exportExcelButton").addEventListener("click", exportToExcel);
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
    exportExcelButton.style.display = 'none';
    if (items.length === 0) {
        itemSummaryDiv.innerHTML = `
            <div style="text-align: center; font-family: 'Arial', sans-serif; background-color: #f5f5f5; color: #333; display: flex; justify-content: center; align-items: center; height: 78vh; margin: 0;">
                <div>
                    <div style="font-size: 72px; font-weight: bold; margin-bottom: 20px;">
                        No Orders For Today
                    </div>
                    <div style="font-size: 24px; margin-bottom: 40px;">
                        Come back after placing an order!
                    </div>
                    <button id='goHomeButton' style="font-size: 18px; color: #fff; background-color: #1DB954; padding: 10px 20px; border: none; border-radius: 25px; text-decoration: none; cursor: pointer;">
                        Place an Order
                    </button>
                </div>
            </div>
        `;
        document.getElementById('goHomeButton').addEventListener('click', function () {
            document.getElementById('Home').click();
        });
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

// Function to export the table to Excel
function exportToExcel() {
    const table = document.querySelector(".item-summary-table");

    if (!table) {
        alert("No data to export.");
        return;
    }

    // Convert the table to a worksheet
    const worksheet = XLSX.utils.table_to_sheet(table);

    // Create a new workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Item Summary");

    // Write the workbook to a file
    XLSX.writeFile(workbook, "ItemSummary.xlsx");

    alert("Exported to ItemSummary.xlsx");
}

// Export the loadItemSummary function
module.exports = { loadItemSummary };