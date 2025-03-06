const { ipcRenderer } = require("electron");

function fetchFoodItems(categoryId) {
    ipcRenderer.send("get-food-items-for-item-history", { categoryId });
}

// Receive the food items from the main process and populate the dropdown
ipcRenderer.on("food-items-response-for-item-history", (event, data) => {
    const foodItemDropdown = document.getElementById("foodItemDropdown");
    foodItemDropdown.innerHTML = `<option value="">Select Food Item</option>`; // Default option

    if (data.success && data.foodItems.length > 0) {
        data.foodItems.forEach(item => {
            let option = document.createElement("option");
            option.value = item.fid;
            option.textContent = item.fname;
            foodItemDropdown.appendChild(option);
        });

        // ✅ Set the first food item as the default
        foodItemDropdown.value = data.foodItems[0].fid;
        
        // ✅ Enable the dropdown
        foodItemDropdown.disabled = false;

        // ✅ Automatically fetch history for the default selection
        const today = new Date().toISOString().split("T")[0];
        fetchItemHistory(today, today, data.foodItems[0].fid);
    }
});

module.exports = { fetchFoodItems };
