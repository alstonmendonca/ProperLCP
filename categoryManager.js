const { ipcRenderer } = require("electron");

function loadCategories(categories = null) {
    console.log("Running loadCategories()", categories); // Debugging log

    if (!categories) {
        console.log("Requesting categories from main process..."); // Debugging log
        ipcRenderer.send("getCategories"); // Request categories
        return;
    }

    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
        console.error("Error: 'main-content' not found!");
        return;
    }

    mainContent.innerHTML = `
        <table class="category-table">
            <thead>
                <tr>
                    <th>Category Name</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody id="categoryTableBody">
                ${categories.map(category => `
                    <tr>
                        <td>${category.catname}</td>
                        <td>
                            <button class="delete-btn" data-id="${category.catid}">−</button>
                        </td>
                    </tr>
                `).join("")}
                <tr>
                    <td colspan="2">
                        <button id="addCategoryRow" class="add-category-row">+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    `;

    console.log("Categories UI updated successfully."); // Debugging log

    // Attach event listeners
    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", (event) => {
            const catId = event.target.getAttribute("data-id");
            confirmDeleteCategory(catId);
        });
    });

    document.getElementById("addCategoryRow").addEventListener("click", addCategoryPrompt);
}

// Listen for category data from the main process
ipcRenderer.on("categories-data", (event, categories) => {
    console.log("Received categories:", categories);
    loadCategories(categories); // Reuse loadCategories to avoid duplicate UI logic
});
module.exports = { loadCategories };
