const { ipcRenderer } = require("electron");

// Function to load the Category Wise Sales content
function loadCategoryWiseSales(mainContent, billPanel) {
    // Set the main content's margin to accommodate the category panel
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";

    // Create the HTML structure for Category Wise Sales
    mainContent.innerHTML = `
        <h2>Category Wise Sales</h2>
        <div class="date-filters">
            <label for="categoryStartDate">Start Date:</label>
            <input type="date" id="categoryStartDate">
            
            <label for="categoryEndDate">End Date:</label>
            <input type="date" id="categoryEndDate">
            
            <button class="showCategorySalesButton">Show Sales</button>
        </div>
        <div id="categoryBoxesDiv" class="category-wise-sales-boxes"></div>
    `;

    // Hide the bill panel
    billPanel.style.display = 'none'; // Hide the bill panel

    // Fetch categories from the database
    fetchCategoryWiseSalesCategories();

    // Initialize the event listener for the button
    document.querySelector(".showCategorySalesButton").addEventListener("click", () => {
        const startDate = document.getElementById("categoryStartDate").value;
        const endDate = document.getElementById("categoryEndDate").value;

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
function displayCategoryWiseSales(startDate, endDate) {
    // Here you would typically send a request to the main process to get the sales data
    // For now, we will just log the dates
    console.log("Fetching sales data from", startDate, "to", endDate);
}

// Export the loadCategoryWiseSales function
module.exports = { loadCategoryWiseSales };