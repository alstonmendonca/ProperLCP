const { ipcRenderer } = require("electron");

// Function to fetch categories and update the left panel
function updateCategoryPanel() {
    ipcRenderer.send("fetch-categories");
}

// Listen for fetched categories and update the UI
ipcRenderer.on("categories-fetched", (event, categories) => {
    const categoryPanel = document.getElementById("category-panel");

    if (categories.length === 0) {
        categoryPanel.innerHTML = `<p style="text-align: center;" id="AddFirstCategory">No categories added</p>`;
    } else {
        categoryPanel.innerHTML = categories
            .map(cat => `<button class="category" onclick="updateMainContent('${cat.catname}')">${cat.catname}</button>`)
            .join("");
    }
});

// Export the function for use in `renderer.js`
module.exports = { updateCategoryPanel };
