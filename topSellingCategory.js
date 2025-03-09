const { ipcRenderer } = require("electron");

// Function to load the Top Selling Categories content
function loadTopSellingCategories(mainContent, billPanel) {
    // Set the main content's margin to accommodate the category panel
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";

    // Create the HTML structure for the Top Selling Categories
    mainContent.innerHTML = `
        <div class="top-selling-categories-header">
            <h2>Top Selling Categories</h2>
            <div class="date-filters">
                <label for="startDate">Start Date:</label>
                <input type="date" id="startDate">
                
                <label for="endDate">End Date:</label>
                <input type="date" id="endDate">
                
                <button class="showTopSellingButton">Show Top Selling</button>
            </div>
        </div>
        <div id="topSellingCategoriesDiv"></div>
    `;

    // Set default dates to today's date
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
    document.getElementById("startDate").value = today; // Set start date to today
    document.getElementById("endDate").value = today; // Set end date to today

    // Automatically fetch top selling categories using today's date
    fetchTopSellingCategories(today, today);

    // Hide the bill panel
    billPanel.style.display = 'none'; // Hide the bill panel

    // Retrieve stored dates from sessionStorage
    const savedStartDate = sessionStorage.getItem("topSellingStartDate");
    const savedEndDate = sessionStorage.getItem("topSellingEndDate");

    if (savedStartDate && savedEndDate) {
        document.getElementById("startDate").value = savedStartDate;
        document.getElementById("endDate").value = savedEndDate;

        // Automatically fetch top selling categories using stored dates
        fetchTopSellingCategories(savedStartDate, savedEndDate);
    }

    // Initialize the event listener for the button
    document.querySelector(".showTopSellingButton").addEventListener("click", () => {
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;

        // Store dates in sessionStorage
        sessionStorage.setItem("topSellingStartDate", startDate);
        sessionStorage.setItem("topSellingEndDate", endDate);

        fetchTopSellingCategories(startDate, endDate);
    });
}

// Function to fetch top selling categories
async function fetchTopSellingCategories(startDate, endDate) {
    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    // Send request to main process to get top selling categories
    ipcRenderer.send("get-top-selling-categories", { startDate, endDate });
}

// Listen for the response with top selling categories
ipcRenderer.on("top-selling-categories-response", (event, data) => {
    const topSellingCategoriesDiv = document.getElementById("topSellingCategoriesDiv");
    topSellingCategoriesDiv.innerHTML = ""; // Clear previous content

    if (!data.success || data.categories.length === 0) {
        topSellingCategoriesDiv.innerHTML = "<p>No top selling categories found for the selected date range.</p>";
        return;
    }

    let tableHTML = `
        <table class="top-selling-table" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
                <tr style="background-color: #4CAF50; color: white;">
                    <th style="padding: 10px; cursor: pointer;" onclick="sortTopSellingCategoriesTable('date')">Date <span id="dateSortIndicator">▲</span></th>
                    <th style="padding: 10px; cursor: pointer;" onclick="sortTopSellingCategoriesTable('category')">Top Selling Category <span id="categorySortIndicator"></span></th>
                    <th style="padding: 10px; cursor: pointer;" onclick="sortTopSellingCategoriesTable('units')">Units Sold <span id="unitsSortIndicator"></span></th>
                </tr>
            </thead>
            <tbody>
    `;

    data.categories.forEach(category => {
        // Format the date in "DD-MM-YYYY" format
        const formattedDate = formatDate(category.date);

        tableHTML += `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${formattedDate}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${category.category_name}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${category.total_quantity}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    topSellingCategoriesDiv.innerHTML = tableHTML;
});

let currentSortColumn = null; // Track the currently sorted column
let currentSortOrder = 'asc'; // Default sort order

// Function to sort the top selling categories table
function sortTopSellingCategoriesTable(column) {
    const table = document.querySelector(".top-selling-table tbody");
    const rows = Array.from(table.rows);

    // Toggle sort order if the same column is clicked again
    if (currentSortColumn === column) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortOrder = 'asc'; // Reset to ascending for a new column
    }

    // Sort rows based on the selected column
    rows.sort((a, b) => {
        const cellA = a.cells[column === 'date' ? 0 : column === 'category' ? 1 : 2].innerText;
        const cellB = b.cells[column === 'date' ? 0 : column === 'category' ? 1 : 2].innerText;

        if (column === 'date') {
            const dateA = parseFormattedDate(cellA);
            const dateB = parseFormattedDate(cellB);
            return currentSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        } else if (column === 'units') {
            const unitsA = parseFloat(cellA);
            const unitsB = parseFloat(cellB);
            return currentSortOrder === 'asc' ? unitsA - unitsB : unitsB - unitsA;
        } else {
            // Sort alphabetically for category names
            return currentSortOrder === 'asc' ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
        }
    });

    // Clear the table body and append sorted rows
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
    rows.forEach(row => table.appendChild(row));

    // Update the sort indicators
    updateSortIndicators(column);
}

// Function to update the sort indicators
function updateSortIndicators(column) {
    const dateSortIndicator = document.getElementById("dateSortIndicator");
    const categorySortIndicator = document.getElementById("categorySortIndicator");
    const unitsSortIndicator = document.getElementById("unitsSortIndicator");

    // Reset all indicators
    dateSortIndicator.innerText = "";
    categorySortIndicator.innerText = "";
    unitsSortIndicator.innerText = "";

    // Set the indicator for the current column
    if (column === 'date') {
        dateSortIndicator.innerText = currentSortOrder === 'asc' ? '▲' : '▼';
    } else if (column === 'category') {
        categorySortIndicator.innerText = currentSortOrder === 'asc' ? '▲' : '▼';
    } else if (column === 'units') {
        unitsSortIndicator.innerText = currentSortOrder === 'asc' ? '▲' : '▼';
    }
}

// Function to parse a formatted date (DD-MM-YYYY) into a Date object
function parseFormattedDate(dateString) {
    const [day, month, year] = dateString.split("-");
    return new Date(`${year}-${month}-${day}`); // Convert to YYYY-MM-DD format
}

// Function to format date in "Day-Month-Year" format
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0'); // Ensure 2 digits
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Export the loadTopSellingCategories function
module.exports = { loadTopSellingCategories, sortTopSellingCategoriesTable };