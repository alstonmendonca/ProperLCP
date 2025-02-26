const { ipcRenderer } = require("electron");

// Function to load the Top Selling Items content
function loadTopSellingItems(mainContent, billPanel) {
    // Set the main content's margin to accommodate the category panel
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";

    // Create the HTML structure for the Top Selling Items
    mainContent.innerHTML = `
        <h2>Top Selling Items</h2>
        <div class="date-filters">
            <label for="startDate">Start Date:</label>
            <input type="date" id="startDate">
            
            <label for="endDate">End Date:</label>
            <input type="date" id="endDate">
            
            <button class="showTopSellingButton">Show Top Selling</button>
        </div>
        <div id="topSellingItemsDiv"></div>
    `;

    // Hide the bill panel
    billPanel.style.display = 'none'; // Hide the bill panel

    // Initialize the event listener for the button
    document.querySelector(".showTopSellingButton").addEventListener("click", fetchTopSellingItems);
}

// Function to fetch top selling items
async function fetchTopSellingItems() {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    // Send request to main process to get top selling items
    ipcRenderer.send("get-top-selling-items", { startDate, endDate });
}

// Listen for the response with top selling items
ipcRenderer.on("top-selling-items-response", (event, data) => {
    const topSellingItemsDiv = document.getElementById("topSellingItemsDiv");
    topSellingItemsDiv.innerHTML = ""; // Clear previous content

    if (!data.success || data.items.length === 0) {
        topSellingItemsDiv.innerHTML = "<p>No top selling items found for the selected date range.</p>";
        return;
    }

    let tableHTML = `
        <table class="top-selling-table" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
                <tr style="background-color: #4CAF50; color: white;">
                    <th style="padding: 10px; cursor: pointer;" onclick="sortTopSellingTable('date')">Date <span id="dateSortIndicator">▲</span></th>
                    <th style="padding: 10px;">Most Sold Item</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.items.forEach(item => {
        tableHTML += `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.date}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.most_sold_item || "No items sold"}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    topSellingItemsDiv.innerHTML = tableHTML;
});

let currentSortOrder = 'asc'; // Default sort order

function sortTopSellingTable(column) {
    const table = document.querySelector(".top-selling-table tbody");
    const rows = Array.from(table.rows);

    // Sort rows based on the date column
    rows.sort((a, b) => {
        const dateA = new Date(a.cells[0].innerText);
        const dateB = new Date(b.cells[0].innerText);
        return currentSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Clear the table body and append sorted rows
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
    rows.forEach(row => table.appendChild(row));

    // Toggle sort order for next click
    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';

    // Update the sort indicator
    const sortIndicator = document.getElementById("dateSortIndicator");
    sortIndicator.innerText = currentSortOrder === 'asc' ? '▲' : '▼'; // Update the arrow
}

// Export the loadTopSellingItems function
module.exports = { loadTopSellingItems, sortTopSellingTable };