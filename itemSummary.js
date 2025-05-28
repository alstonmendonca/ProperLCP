const { ipcRenderer } = require('electron');
const XLSX = require('xlsx'); // Import the xlsx library
const  {createTextPopup} = require("./textPopup");

// Function to load the Item Summary content
// Function to load the Item Summary content
function loadItemSummary(mainContent, billPanel) {
    const savedStartDate = sessionStorage.getItem("itemSummaryStartDate") || getToday();
    const savedEndDate = sessionStorage.getItem("itemSummaryEndDate") || getToday();

    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none'; // Hide bill panel for History

    mainContent.innerHTML = `
        <div class="item-summary-header">
            <h2>Item Summary</h2>
            <div class="date-filters">
                <label for="startDate">Start Date:</label>
                <input type="date" id="startDate" value="${savedStartDate}"> <!-- Set default to saved date -->
                
                <label for="endDate">End Date:</label>
                <input type="date" id="endDate" value="${savedEndDate}"> <!-- Set default to saved date -->
                
                <button id="showSummaryButton">Show Summary</button>
                <button id="exportExcelButton">Export to Excel</button>
            </div>
        </div>
        <div id="itemSummaryDiv" class="item-summary-container"></div>
    `;


    // Fetch and display item summary data
    fetchItemSummary(savedStartDate, savedEndDate); // Automatically fetch summary for saved dates

    // Add event listener for the Show Summary button
    document.getElementById("showSummaryButton").addEventListener("click", function() {
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;

        // Store dates in session storage
        sessionStorage.setItem("itemSummaryStartDate", startDate);
        sessionStorage.setItem("itemSummaryEndDate", endDate);

        fetchItemSummary(startDate, endDate); // Fetch item summary for the selected date range
    });

    // Add event listener for the Export to Excel button
    document.getElementById("exportExcelButton").addEventListener("click", exportToExcel);
}

// Function to fetch item summary data for a specific date range
function fetchItemSummary(startDate, endDate) {
    ipcRenderer.send("get-item-summary", { startDate, endDate });

    ipcRenderer.on("item-summary-response", (event, data) => {
        if (data.success) {
            const items = data.items;
            displayItemSummary(items);
        } else {
            console.error("Failed to fetch item summary.");
        }
    });
}

// Function to display the item summary data in a table
function displayItemSummary(items) {
    const itemSummaryDiv = document.getElementById("itemSummaryDiv");
    itemSummaryDiv.innerHTML = ""; // Clear previous content

    if (items.length === 0) {
        itemSummaryDiv.innerHTML = `
            <div style="text-align: center; font-family: 'Arial', sans-serif; background-color: #f5f5f5; color: #333; display: flex; justify-content: center; align-items: center; height: 78vh; margin: 0;">
                <div>
                    <div style="font-size: 72px; font-weight: bold; margin-bottom: 20px;">
                        No Items Found for Selected Dates
                    </div>
                    <div style="font-size: 24px; margin-bottom: 40px;">
                        Please try a different date range.
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Group items by category name
    const groupedItems = {};
    items.forEach(item => {
        if (!groupedItems[item.categoryName]) {
            groupedItems[item.categoryName] = [];
        }
        groupedItems[item.categoryName].push(item);
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
    return ""; // No indicator if the column is not sorted
}

// Function to export the table to Excel
function exportToExcel() {
    const table = document.querySelector(".item-summary-table");

    if (!table) {
        createTextPopup("No data to export.");
        return;
    }

    // Convert the table to a worksheet
    const worksheet = XLSX.utils.table_to_sheet(table);

    // Create a new workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Item Summary");

    // Write the workbook to a file
    XLSX.writeFile(workbook, "ItemSummary.xlsx");

    createTextPopup("Exported to ItemSummary.xlsx");
}

// Utility function to get today's date in YYYY-MM-DD format
function getToday() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
}

// Export the loadItemSummary function
module.exports = { loadItemSummary };