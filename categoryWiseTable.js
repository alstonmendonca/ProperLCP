const { ipcRenderer } = require("electron");

function fetchCategoryWise() {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const category = document.getElementById("categoryDropdown").value; // Get selected category

    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    if (!category) {
        alert("Please select a category.");
        return;
    }

    ipcRenderer.send("get-category-wise", { startDate, endDate, category });
}


// Function to display category-wise sales table
function displayCategoryWiseSales(orders) {
    const orderHistoryDiv = document.getElementById("categoryWiseDiv");
    orderHistoryDiv.innerHTML = ""; // Clear previous content

    if (orders.length === 0) {
        orderHistoryDiv.innerHTML = "<p>No orders found for the selected date range.</p>";
        return;
    }

    // Create a table
    let tableHTML = `
        <table class="order-history-table">
            <thead>
                <tr>
                    <th>Bill No</th>
                    <th>Date</th>
                    <th>Cashier</th>
                    <th>KOT</th>
                    <th>Price (₹)</th>
                    <th>SGST (₹)</th>
                    <th>CGST (₹)</th>
                    <th>Tax (₹)</th>
                    <th>Food Items</th>
                </tr>
            </thead>
            <tbody>
    `;

    orders.forEach(order => {
        tableHTML += `
            <tr>
                <td>${order.billno}</td>
                <td>${order.date}</td>
                <td>${order.cashier_name}</td>
                <td>${order.kot}</td>
                <td>${order.price.toFixed(2)}</td>
                <td>${order.sgst.toFixed(2)}</td>
                <td>${order.cgst.toFixed(2)}</td>
                <td>${order.tax.toFixed(2)}</td>
                <td>${order.food_items || "No items"}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    orderHistoryDiv.innerHTML = tableHTML;

    // ✅ Store the fetched category-wise sales in sessionStorage
    sessionStorage.setItem("categoryWiseData", JSON.stringify(orders));

    // Attach export button functionality
    setTimeout(() => {
        document.getElementById("exportExcelButton").addEventListener("click", () => {
            exportTableToExcel(".order-history-table");
        });
    }, 100);
}

// ✅ Store category-wise sales data and display it
ipcRenderer.on("category-wise-response", (event, data) => {
    displayCategoryWiseSales(data.orders);
});

// Export functions
module.exports = { fetchCategoryWise, displayCategoryWiseSales };