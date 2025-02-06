const { ipcRenderer } = require("electron");

function fetchCategoriesList() {
    ipcRenderer.send("get-categories-list");
}

// Receive categories from the main process and update the UI
ipcRenderer.on("categories-list-response", (event, data) => {
    const categories = data.categories;
    const categoriesTabDiv = document.getElementById("categoriesTabDiv");
    categoriesTabDiv.innerHTML = ""; // Clear previous content

    if (categories.length === 0) {
        categoriesTabDiv.innerHTML = "<p>No categories found.</p>";
        return;
    }

    // Create a table to display categories
    let tableHTML = `
        <table class="order-history-table">
            <thead>
                <tr>
                    <th>Category ID</th>
                    <th>Category Name</th>
                    <th>Active</th>
                </tr>
            </thead>
            <tbody>
    `;

    categories.forEach(category => {
        tableHTML += `
            <tr>
                <td>${category.catid}</td>
                <td>${category.catname}</td>
                <td>${category.active === 1 ? "✅ Active" : "❌ Inactive"}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    categoriesTabDiv.innerHTML = tableHTML;
})

// Export function so it can be used in `renderer.js`
module.exports = { fetchCategoriesList };
