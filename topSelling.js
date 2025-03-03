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

    // Set default dates to today's date
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
    document.getElementById("startDate").value = today; // Set start date to today
    document.getElementById("endDate").value = today; // Set end date to today

    // Automatically fetch top selling items using today's date
    fetchTopSellingItems(today, today);

    // Hide the bill panel
    billPanel.style.display = 'none'; // Hide the bill panel

    // Retrieve stored dates from sessionStorage
    const savedStartDate = sessionStorage.getItem("topSellingStartDate");
    const savedEndDate = sessionStorage.getItem("topSellingEndDate");

    if (savedStartDate && savedEndDate) {
        document.getElementById("startDate").value = savedStartDate;
        document.getElementById("endDate").value = savedEndDate;

        // Automatically fetch top selling items using stored dates
        fetchTopSellingItems(savedStartDate, savedEndDate);
    }

    // Initialize the event listener for the button
    document.querySelector(".showTopSellingButton").addEventListener("click", () => {
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;

        // Store dates in sessionStorage
        sessionStorage.setItem("topSellingStartDate", startDate);
        sessionStorage.setItem("topSellingEndDate", endDate);

        fetchTopSellingItems(startDate, endDate);
    });
}

// Function to fetch top selling items
async function fetchTopSellingItems(startDate, endDate) {
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
        // Format the date in "Day-Month-Year" format
        const formattedDate = formatDate(item.date);

        tableHTML += `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${formattedDate}</td>
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

// Function to format date in "Day-Month-Year" format
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0'); // Ensure 2 digits
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Export the loadTopSellingItems function
module.exports = { loadTopSellingItems, sortTopSellingTable };