const { ipcRenderer } = require("electron");

// Function to load the Sales Overview content
function loadSalesOverview(mainContent, billPanel) {
    // Set the main content's margin to accommodate the category panel
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";

    // Create the HTML structure for the Sales Overview
    mainContent.innerHTML = `
        <h2 class="salesOverviewTitle" style="
            font-size: 2.5rem; /* Increase font size */
            font-weight: bold; /* Make it bold */
            color: #2c3e50; /* Use a dark, professional color */
            margin-bottom: 20px; /* Add spacing below the heading */
            text-transform: uppercase; /* Uppercase the text for emphasis */
            letter-spacing: 2px; /* Add spacing between letters */
            padding-bottom: 10px; /* Add padding to create space for the border */
            border-bottom: 3px solid #0D3B66; /* Add a line underneath the title */
            text-align: center; /* Center the content -->
        ">Sales Overview</h2>
        <div class="date-filters">
            <label for="salesStartDate">Start Date:</label>
            <input type="date" id="salesStartDate">
            
            <label for="salesEndDate">End Date:</label>
            <input type="date" id="salesEndDate">
            
            <button class="showSalesButton">Show Sales</button>
        </div>
        <div id="salesTableContainer">
            <table id="salesTable">
                <thead>
                    <tr>
                        <th style="padding: 10px; cursor: pointer;" onclick="sortSalesOverviewTable('date')">Date <span id="dateSortIndicator">▲</span></th>
                        <th style="padding: 10px; cursor: pointer;" onclick="sortSalesOverviewTable('sales')">Total Sales <span id="salesSortIndicator"></span></th>
                        <th style="padding: 10px; cursor: pointer;" onclick="sortSalesOverviewTable('revenue')">Total Revenue <span id="revenueSortIndicator"></span></th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Rows will be populated dynamically -->
                </tbody>
            </table>
        </div>
        <style>
            #salesTable {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                font-family: Arial, sans-serif;
            }
            #salesTable td {
                padding: 12px;
                text-align: left;
                border: 1px solid #ddd;
            }
            #salesTable th {
                padding: 12px;
                text-align: left;
                background-color: #0D3B66;
                color: white;
                font-weight: bold;
            }
            #salesTable th:hover {
                background-color: #11487b;
            }
            #salesTable tr:hover {
                background-color: #f5f5f5;
            }
            #salesTableContainer {
                overflow-x: auto;
            }
            .date-filters {
                margin-bottom: 20px;
            }
            .date-filters label {
                margin-right: 10px;
                font-weight: bold;
            }
            .date-filters input {
                padding: 5px;
                margin-right: 15px;
                border: 1px solid #ccc;
                border-radius: 4px;
            }
            .showSalesButton {
                padding: 8px 16px;
                background-color: #094872;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .showSalesButton:hover {
                background-color: #07314d;
            }
        </style>
    `;

    // Hide the bill panel
    billPanel.style.display = 'none';

    // Set default dates to today's date
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
    document.getElementById("salesStartDate").value = today; // Set start date to today
    document.getElementById("salesEndDate").value = today; // Set end date to today

    // Automatically fetch and display sales data for today's date
    displaySalesOverview(today, today);

    // Retrieve stored dates from sessionStorage
    const storedStartDate = sessionStorage.getItem("salesOverviewStartDate");
    const storedEndDate = sessionStorage.getItem("salesOverviewEndDate");

    // Populate the date inputs with stored dates (if available)
    if (storedStartDate && storedEndDate) {
        document.getElementById("salesStartDate").value = storedStartDate;
        document.getElementById("salesEndDate").value = storedEndDate;

        // Automatically fetch and display sales data based on stored dates
        displaySalesOverview(storedStartDate, storedEndDate);
    }

    // Initialize the event listener for the button
    document.querySelector(".showSalesButton").addEventListener("click", () => {
        const startDate = document.getElementById("salesStartDate").value;
        const endDate = document.getElementById("salesEndDate").value;

        // Store the selected dates in sessionStorage
        sessionStorage.setItem("salesOverviewStartDate", startDate);
        sessionStorage.setItem("salesOverviewEndDate", endDate);

        // Call a function to display sales data based on selected dates
        displaySalesOverview(startDate, endDate);
    });
}

// Function to display sales data in the table
async function displaySalesOverview(startDate, endDate) {
    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    try {
        // Fetch sales data from the main process
        const salesData = await ipcRenderer.invoke('get-sales-overview-data', startDate, endDate);

        // Update the table with the fetched data
        const salesTableBody = document.querySelector("#salesTable tbody");
        salesTableBody.innerHTML = ""; // Clear previous content

        if (salesData.length === 0) {
            salesTableBody.innerHTML = `<tr><td colspan="3">No sales data found for the selected date range.</td></tr>`;
            return;
        }

        salesData.forEach((data) => {
            // Format the date in "Day-Month-Year" format
            const formattedDate = formatDate(data.date);

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${data.totalSales}</td>
                <td>₹${data.totalRevenue.toFixed(2)}</td>
            `;
            salesTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching sales overview data:", error);
        alert("An error occurred while fetching sales data.");
    }
}

let currentSortColumn = null; // Track the currently sorted column
let currentSortOrder = 'asc'; // Default sort order

// Function to sort the sales overview table
function sortSalesOverviewTable(column) {
    const table = document.querySelector("#salesTable tbody");
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
        const cellA = a.cells[column === 'date' ? 0 : column === 'sales' ? 1 : 2].innerText;
        const cellB = b.cells[column === 'date' ? 0 : column === 'sales' ? 1 : 2].innerText;

        if (column === 'date') {
            const dateA = parseFormattedDate(cellA);
            const dateB = parseFormattedDate(cellB);
            return currentSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        } else if (column === 'sales' || column === 'revenue') {
            const valueA = parseFloat(cellA.replace(/[^0-9.]/g, '')); // Remove non-numeric characters
            const valueB = parseFloat(cellB.replace(/[^0-9.]/g, ''));
            return currentSortOrder === 'asc' ? valueA - valueB : valueB - valueA;
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
    const salesSortIndicator = document.getElementById("salesSortIndicator");
    const revenueSortIndicator = document.getElementById("revenueSortIndicator");

    // Reset all indicators
    dateSortIndicator.innerText = "";
    salesSortIndicator.innerText = "";
    revenueSortIndicator.innerText = "";

    // Set the indicator for the current column
    if (column === 'date') {
        dateSortIndicator.innerText = currentSortOrder === 'asc' ? '▲' : '▼';
    } else if (column === 'sales') {
        salesSortIndicator.innerText = currentSortOrder === 'asc' ? '▲' : '▼';
    } else if (column === 'revenue') {
        revenueSortIndicator.innerText = currentSortOrder === 'asc' ? '▲' : '▼';
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

// Export the loadSalesOverview function
module.exports = { loadSalesOverview, sortSalesOverviewTable };