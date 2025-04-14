const { ipcRenderer } = require("electron");
const  {createTextPopup} = require("./textPopup");

// Function to load the User Profile UI
function loadUserProfile(mainContent, billPanel) {
    mainContent.innerHTML = `
        <div class="display-settings-header">
            <h2>User Profile</h2>
        </div>
        <div class="user-profile-actions">
            <!-- Add User Buttons -->
            <button id="addUserButton" class="add-user-btn">Add User</button>

            <!-- Remove User Buttons -->
            <button id="removeUserButton" class="add-user-btn">Remove User</button>
        </div>
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
            <h2 style="margin-bottom: 15px; text-align: center;">ADMINS</h2>
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

    // Display staff inside a grid
    if (staff.length > 0) {
        staffGrid.innerHTML = `
            <h2 style="margin-top: 30px; margin-bottom: 15px; text-align: center;">STAFF MEMBERS</h2>
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
    popup.classList.add("edit-user-popup");
    popup.innerHTML = `
        <div class="user-popup-content">
            <h3>Edit Staff</h3>
            <label>Username:</label>
            <input type="text" id="editUname" value="${uname}">
            <label>Password:</label>
            <input type="text" id="editPassword" value="${password}">
            <div class="user-popup-buttons">
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

    // Close popup when clicking outside
    popup.addEventListener("click", (e) => {
        if (e.target === popup) {
            document.body.removeChild(popup);
        }
    });
}

// Listen for "user-updated" event from main process
ipcRenderer.on("user-updated", () => {
    // Close the Edit User Popup
    document.querySelector(".edit-user-popup")?.remove();

    // Refresh the user list in the mainContent
    ipcRenderer.send("get-users");
});

// Function to open the Add User popup
function openAddUserPopup() {
    const popup = document.createElement("div");
    popup.classList.add("add-user-popup");
    popup.innerHTML = `
        <div class="user-popup-content">
            <h3>Add New User</h3>
            <label>Username:</label>
            <input type="text" id="newUname" placeholder="Enter username">
            <label>Password:</label>
            <input type="password" id="newPassword" placeholder="Enter password">
            <div class="user-toggle-switch-container">
                <label>Role:</label>
                <label class="user-toggle-switch">
                    <input type="checkbox" id="user-roleToggle">
                    <span class="user-slider"></span>
                </label>
                <span id="user-roleLabel">Staff</span>
            </div>
            <div class="user-popup-buttons">
                <button id="confirmAddUser">Add User</button>
                <button id="closePopup">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Toggle role between Admin and Staff
    const roleToggle = popup.querySelector("#user-roleToggle");
    const roleLabel = popup.querySelector("#user-roleLabel");

    roleToggle.addEventListener("change", () => {
        if (roleToggle.checked) {
            roleLabel.textContent = "Admin";
        } else {
            roleLabel.textContent = "Staff";
        }
    });

    // Add user event
    popup.querySelector("#confirmAddUser").addEventListener("click", () => {
        const uname = popup.querySelector("#newUname").value.trim();
        const password = popup.querySelector("#newPassword").value.trim();
        const isadmin = roleToggle.checked ? 1 : 0;

        if (uname && password) {
            ipcRenderer.send("add-user", { uname, password, isadmin });
        }
    });

    // Close popup
    popup.querySelector("#closePopup").addEventListener("click", () => {
        document.body.removeChild(popup);
    });

    // Close popup when clicking outside
    popup.addEventListener("click", (e) => {
        if (e.target === popup) {
            document.body.removeChild(popup);
        }
    });
}

// Function to open the Remove User popup
function openRemoveUserPopup() {
    const popup = document.createElement("div");
    popup.classList.add("remove-user-popup");
    popup.innerHTML = `
        <div class="user-popup-content">
            <h3>Select Users to Remove</h3>
            <div class="user-list" id="userList"></div>
            <div class="user-popup-buttons">
                <button id="removeUsers">Remove Selected Users</button>
                <button id="closePopup">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Fetch users from the main process
    ipcRenderer.send("get-users");

    ipcRenderer.on("users-response", (event, users) => {
        const userList = popup.querySelector("#userList");
        userList.innerHTML = ""; // Clear previous content

        users.forEach(user => {
            const userItem = document.createElement("div");
            userItem.classList.add("user-item");
            userItem.setAttribute("data-id", user.userid); // Store user ID for selection
            userItem.innerHTML = `
                <span>${user.uname} (${user.isadmin ? "Admin" : "Staff"})</span>
            `;

            // Toggle selection on click
            userItem.addEventListener("click", () => {
                userItem.classList.toggle("selected");
            });

            userList.appendChild(userItem);
        });
    });

    // Handle remove users
    popup.querySelector("#removeUsers").addEventListener("click", () => {
        const selectedUsers = Array.from(popup.querySelectorAll(".user-item.selected"))
            .map(userItem => userItem.getAttribute("data-id"));

        if (selectedUsers.length === 0) {
            createTextPopup("Please select at least one user to remove.");
            return;
        }

        ipcRenderer.send("remove-users", selectedUsers);
    });

    // Close popup
    popup.querySelector("#closePopup").addEventListener("click", () => {
        document.body.removeChild(popup);
    });

    // Close popup when clicking outside
    popup.addEventListener("click", (e) => {
        if (e.target === popup) {
            document.body.removeChild(popup);
        }
    });
}

// Listen for "users-deleted" event from main process
ipcRenderer.on("users-deleted", () => {
    // Close the Remove User Popup
    document.querySelector(".remove-user-popup")?.remove();

    // Refresh the user list in the mainContent
    ipcRenderer.send("get-users");
});

// Listen for user added confirmation from `main.js`
ipcRenderer.on("user-added", () => {
    document.querySelector(".add-user-popup")?.remove(); // Close the popup
    ipcRenderer.send("get-users"); // **Force refresh**
});

// Listen for user addition failure
ipcRenderer.on("user-add-failed", (event, data) => {
    createTextPopup(`Error: ${data.error}`);
});

module.exports = { loadUserProfile };