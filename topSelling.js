const { ipcRenderer } = require("electron");
const  {createTextPopup} = require("./textPopup");

// Function to load the Top Selling Items content
function loadTopSellingItems(mainContent, billPanel) {
    // Set the main content's margin to accommodate the category panel
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";

    // Create the HTML structure for the Top Selling Items
    mainContent.innerHTML = `
        <div class="top-selling-items-header">
            <h2>Top Selling Items</h2>
            <div class="date-filters">
                <label for="startDate">Start Date:</label>
                <input type="date" id="startDate">
                
                <label for="endDate">End Date:</label>
                <input type="date" id="endDate">
                
                <button class="showTopSellingButton">Show Top Selling</button>
            </div>
        </div>
        <div id="topSellingItemsDiv"></div>
    `;

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];
    
    // Retrieve stored dates from sessionStorage or use today's date as default
    const startDate = sessionStorage.getItem("topSellingStartDate") || today;
    const endDate = sessionStorage.getItem("topSellingEndDate") || today;

    // Set the date inputs
    document.getElementById("startDate").value = startDate;
    document.getElementById("endDate").value = endDate;

    // Automatically fetch top selling items using the dates
    fetchTopSellingItems(startDate, endDate);

    // Hide the bill panel
    billPanel.style.display = 'none';

    // Initialize the event listener for the button
    document.querySelector(".showTopSellingButton").addEventListener("click", () => {
        const newStartDate = document.getElementById("startDate").value;
        const newEndDate = document.getElementById("endDate").value;

        // Store dates in sessionStorage
        sessionStorage.setItem("topSellingStartDate", newStartDate);
        sessionStorage.setItem("topSellingEndDate", newEndDate);

        fetchTopSellingItems(newStartDate, newEndDate);
    });
}

// Rest of the file remains the same...
async function fetchTopSellingItems(startDate, endDate) {
    if (!startDate || !endDate) {
        createTextPopup("Please select both start and end dates.");
        return;
    }

    // Send request to main process to get top selling items
    ipcRenderer.send("get-top-selling-items", { startDate, endDate });
}

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
                <tr style="background-color: #0D3B66; color: white;">
                    <th style="padding: 10px; cursor: pointer;" onclick="sortTopSellingTable('date')">Date <span id="dateSortIndicator">▲</span></th>
                    <th style="padding: 10px;">Most Sold Item</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.items.forEach(item => {
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

let currentSortOrder = 'asc';

function sortTopSellingTable(column) {
    const table = document.querySelector(".top-selling-table tbody");
    const rows = Array.from(table.rows);

    rows.sort((a, b) => {
        const dateA = parseFormattedDate(a.cells[0].innerText);
        const dateB = parseFormattedDate(b.cells[0].innerText);
        return currentSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
    rows.forEach(row => table.appendChild(row));

    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    const sortIndicator = document.getElementById("dateSortIndicator");
    sortIndicator.innerText = currentSortOrder === 'asc' ? '▲' : '▼';
}

function parseFormattedDate(dateString) {
    const [day, month, year] = dateString.split("-");
    return new Date(`${year}-${month}-${day}`);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

module.exports = { loadTopSellingItems, sortTopSellingTable };