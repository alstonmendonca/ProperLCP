const { ipcRenderer } = require("electron");

function fetchCategories() {
    ipcRenderer.send("get-categories-event");
}

// Receive the categories from the main process and populate the dropdown
ipcRenderer.on("categories-response", (event, data) => {
    console.log("Received categories:", data);
    const categoryDropdown = document.getElementById("categoryDropdown");
    categoryDropdown.innerHTML = `<option value="">Select Category</option>`; // Default option

    if (data.categories.length > 0) {
        data.categories.forEach(category => {
            let option = document.createElement("option");
            option.value = category.catid;
            option.textContent = category.catname;
            categoryDropdown.appendChild(option);
        });

        // ✅ Set the first category as the default
        categoryDropdown.value = data.categories[0].catid;

        // ✅ Fetch food items for this default category
        fetchFoodItems(data.categories[0].catid);
    }
});

module.exports = { fetchCategories };
