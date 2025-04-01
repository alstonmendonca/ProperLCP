// Function to load the Theme Toggle
function loadThemeToggle(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    
    mainContent.innerHTML = `
        <div class='section-title'>
            <h2>Theme Toggle</h2>
        </div>
        <label class="dark-mode-toggle">
            <input type="checkbox" id="darkModeToggle">
            <span class="slider"></span>
        </label>
    `;

    billPanel.style.display = 'none';

    const toggleButton = document.getElementById("darkModeToggle");

    // Check if dark mode was previously enabled
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
        toggleButton.checked = true;
    }

    // Add event listener for the toggle button
    toggleButton.addEventListener("change", function() {
        if (this.checked) {
            document.body.classList.add("dark-mode");
            localStorage.setItem("theme", "dark");
        } else {
            document.body.classList.remove("dark-mode");
            localStorage.setItem("theme", "light");
        }
    });
}

// Export the loadThemeToggle function
module.exports = { loadThemeToggle };