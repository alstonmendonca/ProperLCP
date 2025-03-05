const { ipcRenderer } = require("electron");

function fetchCategories() {
    ipcRenderer.send("get-categories-event");
}

// Receive the categories from the main process and populate the dropdown
ipcRenderer.on("categories-response", (event, data) => {
    console.log("Received categories:", data);
    const categoryDropdown = document.getElementById("categoryDropdown");
    categoryDropdown.innerHTML = `<option value="">Select Category</option>`; // Default option

    data.categories.forEach(category => {
        let option = document.createElement("option");
        option.value = category.catid;
        option.textContent = category.catname;
        categoryDropdown.appendChild(option);
    });

    // Set the first category as the default selected value
    if (data.categories.length > 0) {
        categoryDropdown.value = data.categories[0].catid; // Set the first category as default
    }
});

// Export function so it can be used in renderer.js
module.exports = { fetchCategories };