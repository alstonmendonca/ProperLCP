const { ipcRenderer } = require("electron");

// Function to load the User Profile UI
function loadUserProfile(mainContent, billPanel) {
    mainContent.innerHTML = `
        <h2>User Profile</h2>

        <!-- Add User Buttons -->
        <button id="addUserButton" class="add-user-btn">Add User</button>

        <!-- Remove User Buttons -->
        <button id="removeUserButton" class="add-user-btn">Remove User</button>

        <!-- Admin Users Bar -->
        <div id="adminBar" class="admin-bar"></div>

        <!-- Staff Members Grid -->
        <div id="staffGrid" class="staff-grid"></div>
    `;

    billPanel.style.display = 'none';

    // Fetch users from the database
    ipcRenderer.send("get-users");

    // Add event listener to "Add User" button
    document.getElementById("addUserButton").addEventListener("click", openAddUserPopup);
    document.getElementById("removeUserButton").addEventListener("click", openRemoveUserPopup);
}

// Handle response from main process
ipcRenderer.on("users-response", (event, users) => {
    const adminBar = document.getElementById("adminBar");
    const staffGrid = document.getElementById("staffGrid");

    // Clear existing content
    adminBar.innerHTML = "";
    staffGrid.innerHTML = "";

    // Separate admins and staff
    const admins = users.filter(user => user.isadmin === 1);
    const staff = users.filter(user => user.isadmin === 0);

    // Display admins inside the rectangular bar
    if (admins.length > 0) {
        adminBar.innerHTML = `
            <h3>Admins</h3>
            <div class="admin-container">
                ${admins.map(admin => `
                    <div class="admin-box">
                        <p><strong>${admin.uname}</strong></p>
                        <p>Password: ${admin.password}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        adminBar.innerHTML = "<p>No Admins Found</p>";
    }

    // Display staff inside a 4-column grid
    if (staff.length > 0) {
        staffGrid.innerHTML = `
            <h3>Staff Members</h3>
            <div class="staff-container">
                ${staff.map(staffMember => `
                    <div class="staff-box" data-id="${staffMember.userid}" data-uname="${staffMember.uname}" data-password="${staffMember.password}">
                        <p><strong>${staffMember.uname}</strong></p>
                        <p>Password: ${staffMember.password}</p>
                    </div>
                `).join('')}
            </div>
        `;

        // Add click event listeners to staff boxes
        document.querySelectorAll(".staff-box").forEach(box => {
            box.addEventListener("click", function () {
                const userid = this.getAttribute("data-id");
                const uname = this.getAttribute("data-uname");
                const password = this.getAttribute("data-password");

                openEditPopup(userid, uname, password);
            });
        });
    } else {
        staffGrid.innerHTML = "<p>No Staff Members Found</p>";
    }
});

// Function to open popup for editing staff details
function openEditPopup(userid, uname, password) {
    const popup = document.createElement("div");
    popup.classList.add("edit-popup");
    popup.innerHTML = `
        <div class="popup-content">
            <h3>Edit Staff</h3>
            <label>Username:</label>
            <input type="text" id="editUname" value="${uname}">
            <label>Password:</label>
            <input type="text" id="editPassword" value="${password}">
            <div class="popup-buttons">
                <button id="saveChanges">Save</button>
                <button id="closePopup">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Close popup
    document.getElementById("closePopup").addEventListener("click", () => {
        document.body.removeChild(popup);
    });

    // Save changes
    document.getElementById("saveChanges").addEventListener("click", () => {
        const newUname = document.getElementById("editUname").value.trim();
        const newPassword = document.getElementById("editPassword").value.trim();

        if (newUname && newPassword) {
            ipcRenderer.send("update-user", { userid, uname: newUname, password: newPassword });
        }
    });
}

// Function to open the Remove User window
function openRemoveUserPopup() {
    ipcRenderer.send("open-remove-user-window");
}

// Listen for "user-updated" event from main process
ipcRenderer.on("user-updated", () => {
    document.body.querySelector(".edit-popup")?.remove(); // Close the popup
    ipcRenderer.send("get-users"); // Refresh the user list
});

// Function to open Add User popup
function openAddUserPopup() {
    ipcRenderer.send("open-add-user-window");
}

// Listen for user added confirmation from `main.js`
ipcRenderer.on("user-added", () => {
    document.querySelector(".popup")?.remove(); // Close the popup
    ipcRenderer.send("get-users"); // **Force refresh**
});

// Listen for user addition failure
ipcRenderer.on("user-add-failed", (event, data) => {
    alert(`Error: ${data.error}`);
});



module.exports = { loadUserProfile };
