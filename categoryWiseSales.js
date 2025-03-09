const { ipcRenderer } = require("electron");

// Function to load the Category Wise Sales content
function loadCategoryWiseSales(mainContent, billPanel) {
    // Set the main content's margin to accommodate the category panel
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";

    // Create the HTML structure for Category Wise Sales
    mainContent.innerHTML = `
        <div class="category-wise-sales-header">
            <h2>Category Wise Sales</h2>
            <div class="date-filters">
                <label for="categoryStartDate">Start Date:</label>
                <input type="date" id="categoryStartDate">
                
                <label for="categoryEndDate">End Date:</label>
                <input type="date" id="categoryEndDate">
                
                <button class="showCategorySalesButton">Show Sales</button>
            </div>
        </div>
        <div id="categoryBoxesDiv" class="category-wise-sales-boxes"></div>
    `;

    // Hide the bill panel
    billPanel.style.display = 'none'; // Hide the bill panel

    // Fetch categories from the database
    fetchCategoryWiseSalesCategories();

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Set default dates to today's date
    document.getElementById("categoryStartDate").value = today;
    document.getElementById("categoryEndDate").value = today;

    // Retrieve stored dates from sessionStorage
    const storedStartDate = sessionStorage.getItem("categoryWiseSalesStartDate");
    const storedEndDate = sessionStorage.getItem("categoryWiseSalesEndDate");

    // If no dates are stored in sessionStorage, use today's date
    if (!storedStartDate || !storedEndDate) {
        // Automatically fetch and display sales data for today's date
        displayCategoryWiseSales(today, today);
    } else {
        // Populate the date inputs with stored dates
        document.getElementById("categoryStartDate").value = storedStartDate;
        document.getElementById("categoryEndDate").value = storedEndDate;

        // Automatically fetch and display sales data based on stored dates
        displayCategoryWiseSales(storedStartDate, storedEndDate);
    }

    // Initialize the event listener for the button
    document.querySelector(".showCategorySalesButton").addEventListener("click", () => {
        const startDate = document.getElementById("categoryStartDate").value;
        const endDate = document.getElementById("categoryEndDate").value;

        // Store the selected dates in sessionStorage
        sessionStorage.setItem("categoryWiseSalesStartDate", startDate);
        sessionStorage.setItem("categoryWiseSalesEndDate", endDate);

        // Call a function to display sales data based on selected dates
        displayCategoryWiseSales(startDate, endDate);
    });
}

// Function to fetch categories for Category Wise Sales
function fetchCategoryWiseSalesCategories() {
    ipcRenderer.send("get-category-wise-sales-categories"); // Send request to main process to get categories
}

// Listen for the response with categories
ipcRenderer.on("category-wise-sales-categories-response", (event, data) => {
    const categoryBoxesDiv = document.getElementById("categoryBoxesDiv");
    categoryBoxesDiv.innerHTML = ""; // Clear previous content

    if (data.success) {
        // Inside the fetchCategoryWiseSalesCategories function
        data.categories.forEach(category => {
            const categoryBox = document.createElement("div");
            categoryBox.classList.add("category-wise-sales-box"); // Updated class name
            categoryBox.innerHTML = `
                <h3>${category.catname}</h3>
                <p>Total Sales: <span class="total-sales">0</span></p>
                <p>Revenue: <span class="revenue">0.00</span></p>
            `;
            categoryBoxesDiv.appendChild(categoryBox);
        });
    } else {
        categoryBoxesDiv.innerHTML = "<p>Error fetching categories.</p>";
    }
});

// Function to display category sales based on selected dates
async function displayCategoryWiseSales(startDate, endDate) {
    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    try {
        // Fetch category-wise sales data from the main process
        const salesData = await ipcRenderer.invoke('get-category-wise-sales-data', startDate, endDate);

        // Update the category boxes with the fetched data
        const categoryBoxesDiv = document.getElementById("categoryBoxesDiv");
        const categoryBoxes = categoryBoxesDiv.querySelectorAll(".category-wise-sales-box");

        categoryBoxes.forEach((box) => {
            const categoryName = box.querySelector("h3").innerText;
            const totalSalesElement = box.querySelector(".total-sales");
            const revenueElement = box.querySelector(".revenue");

            // Find the matching category in the fetched data
            const categoryData = salesData.find((data) => data.catname === categoryName);

            if (categoryData) {
                totalSalesElement.innerText = categoryData.totalSales;
                revenueElement.innerText = `₹${categoryData.totalRevenue.toFixed(2)}`;
            } else {
                totalSalesElement.innerText = "0";
                revenueElement.innerText = "₹0.00";
            }
        });
    } catch (error) {
        console.error("Error fetching category-wise sales data:", error);
        alert("An error occurred while fetching sales data.");
    }
}

// Export the loadCategoryWiseSales function
module.exports = { loadCategoryWiseSales };