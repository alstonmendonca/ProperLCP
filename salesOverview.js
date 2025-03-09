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
            border-bottom: 3px solid #1DB954; /* Add a green line underneath the title */
            text-align: center; /* Center the content */
        
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
                        <th>Date</th>
                        <th>Total Sales</th>
                        <th>Total Revenue</th>
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
            #salesTable th, #salesTable td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }
            #salesTable th {
                background-color: #094872;
                color: white;
                font-weight: bold;
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

    // Retrieve stored dates from sessionStorage
    const storedStartDate = sessionStorage.getItem("salesOverviewStartDate");
    const storedEndDate = sessionStorage.getItem("salesOverviewEndDate");

    // Populate the date inputs with stored dates
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

// Function to format date in "Day-Month-Year" format
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0'); // Ensure 2 digits
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Export the loadSalesOverview function
module.exports = { loadSalesOverview };