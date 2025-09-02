const { ipcRenderer } = require("electron");

async function loadUserProfile(mainContent, billPanel) {
  billPanel.style.display = "none";

  const user = await ipcRenderer.invoke("get-session-user");

  if (!user) {
    mainContent.innerHTML = `
      <div class="profile-empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2>No Active Session</h2>
        <p>Please log in to view your profile</p>
        <button id="loginRedirectBtn" class="action-btn primary">
          Go to Login
        </button>
      </div>
    `;
    
    document.getElementById("loginRedirectBtn").addEventListener("click", () => {
      window.location.href = "login.html";
    });
    return;
  }

  // Generate initials for avatar
  const initials = user.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : '??';

  // Format role name
  const roleName = user.role ? 
    user.role.charAt(0).toUpperCase() + user.role.slice(1) : 
    'Unknown';

  mainContent.innerHTML = `
  <style>
  :root {
    --primary: #0D3B66;
    --primary-light: rgba(13, 59, 102, 0.1);
    --white: #ffffff;
    --light-gray: #f8f9fa;
    --border-gray: #e2e8f0;
    --text-dark: #1e293b;
    --text-gray: #64748b;
    --shadow: 0 4px 20px rgba(13, 59, 102, 0.15);
    --shadow-hover: 0 8px 30px rgba(13, 59, 102, 0.25);
    --transition: all 0.3s ease;
  }
          #loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(13, 59, 102, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            display: none;
            backdrop-filter: blur(5px);
        }

        .spinner {
            border: 6px solid rgba(255, 255, 255, 0.2);
            border-top: 6px solid #FFFFFF;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            animation: spin 1s linear infinite;
        }

  .profile-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 3rem 2rem;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
    background: var(--white);
  }
  
  .profile-header {
    text-align: center;
    margin-bottom: 3rem;
    padding: 2rem;
    background: var(--white);
    border-radius: 20px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-gray);
  }
  
  .avatar-container {
    position: relative;
    display: inline-block;
    margin-bottom: 2rem;
  }
  
  .user-avatar {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: var(--primary);
    color: var(--white);
    font-size: 3.2rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    box-shadow: var(--shadow);
    border: 4px solid var(--white);
  }
  
  .role-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: var(--primary);
    color: var(--white);
    padding: 8px 16px;
    border-radius: 25px;
    font-size: 0.85rem;
    font-weight: 700;
    box-shadow: var(--shadow);
    border: 3px solid var(--white);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .admin-badge, .staff-badge, .manager-badge, .default-badge { 
    background: var(--primary);
    color: var(--white);
  }
  
  .profile-header h1 {
    font-size: 2.4rem;
    margin-bottom: 0.5rem;
    color: var(--primary);
    font-weight: 700;
  }
  
  .profile-header p {
    color: var(--text-gray);
    font-size: 1.2rem;
    font-weight: 500;
  }
  
  .profile-details {
    background: var(--white);
    border-radius: 20px;
    padding: 2.5rem;
    box-shadow: var(--shadow);
    margin-bottom: 2.5rem;
    border: 1px solid var(--border-gray);
  }
  
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
  
  .detail-item {
    display: flex;
    padding: 1.5rem;
    border-radius: 15px;
    background: var(--light-gray);
    border: 1px solid var(--border-gray);
    transition: var(--transition);
  }
  
  .detail-item:hover {
    background: var(--white);
    box-shadow: var(--shadow);
    transform: translateY(-2px);
  }
  
  .detail-icon {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    margin-right: 1.2rem;
    color: var(--primary);
    background: var(--primary-light);
    border-radius: 8px;
    padding: 6px;
  }
  
  .detail-content {
    flex: 1;
  }
  
  .detail-title {
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-gray);
    margin-bottom: 0.5rem;
    font-weight: 600;
  }
  
  .detail-value {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-dark);
  }
  
  .profile-actions {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    flex-wrap: wrap;
    padding: 2rem;
    background: var(--white);
    border-radius: 20px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-gray);
  }
  
  .action-btn {
    padding: 1.2rem 2.5rem;
    border-radius: 15px;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    transition: var(--transition);
    border: 2px solid transparent;
    min-width: 180px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .primary {
    background: var(--primary);
    color: var(--white);
    border-color: var(--primary);
  }
  
  .primary:hover {
    background: var(--white);
    color: var(--primary);
    border-color: var(--primary);
    transform: translateY(-3px);
    box-shadow: var(--shadow-hover);
  }
  
  .secondary {
    background: var(--white);
    color: var(--primary);
    border-color: var(--primary);
  }
  
  .secondary:hover {
    background: var(--primary);
    color: var(--white);
    transform: translateY(-3px);
    box-shadow: var(--shadow-hover);
  }
  
  .profile-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: 3rem;
    background: var(--white);
    border-radius: 20px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-gray);
  }
  
  .empty-icon {
    width: 100px;
    height: 100px;
    background: var(--primary-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
    border: 3px solid var(--primary);
  }
  
  .empty-icon svg {
    width: 50px;
    height: 50px;
    color: var(--primary);
  }
  
  .profile-empty-state h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: var(--primary);
    font-weight: 700;
  }
  
  .profile-empty-state p {
    color: var(--text-gray);
    margin-bottom: 2rem;
    max-width: 400px;
    line-height: 1.8;
    font-size: 1.1rem;
  }
  
  @media (max-width: 600px) {
    .profile-details {
      padding: 1.5rem;
    }
    
    .profile-actions {
      flex-direction: column;
    }
    
    .action-btn {
      width: 100%;
    }
  }
</style>
<div id="loading-overlay">
    <div class="spinner"></div>
</div>
<div class="profile-container">
  <div class="profile-header">
    <div class="avatar-container">
      <div class="user-avatar">${initials}</div>
      <div class="role-badge ${user.role || 'default'}-badge">${roleName}</div>
    </div>
    <h1>Welcome, ${user.name || "User"}</h1>
    <p>Here's your account information</p>
  </div>

  <div class="profile-details">
    <div class="detail-grid">
      <div class="detail-item">
        <svg class="detail-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
        <div class="detail-content">
          <div class="detail-title">User ID</div>
          <div class="detail-value">${user.userid || "Unknown"}</div>
        </div>
      </div>
      
      <div class="detail-item">
        <svg class="detail-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <div class="detail-content">
          <div class="detail-title">Username</div>
          <div class="detail-value">${user.username || "Unknown"}</div>
        </div>
      </div>
      
      <div class="detail-item">
        <svg class="detail-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <div class="detail-content">
          <div class="detail-title">Email</div>
          <div class="detail-value">${user.email || "Not provided"}</div>
        </div>
      </div>
      
      <div class="detail-item">
        <svg class="detail-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <div class="detail-content">
          <div class="detail-title">Access Type</div>
          <div class="detail-value">${user.role.toUpperCase() || "Unknown"}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="profile-actions">
    <button id="editProfileBtn" class="action-btn secondary">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      Edit Profile
    </button>
    <button id="changePasswordBtn" class="action-btn secondary">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2l-4.257-2.257A6 6 0 0117 9zm-6 7a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      Change Password
    </button>
    ${user.role === 'admin' ? `
    <button id="addUserBtn" class="action-btn secondary">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
      Add User
    </button>
    ` : ''}
    <button id="logoutBtn" class="action-btn primary">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Log Out
    </button>
  </div>
</div>
  `;

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    const { ipcRenderer } = require("electron");
    const overlay = document.getElementById('loading-overlay');
    setTimeout(() => {
      overlay.style.display = 'flex';
    },2000);
    overlay.style.display = 'flex';
    await ipcRenderer.invoke("logout");
    window.location.href = "login.html";
  });

  document.getElementById("editProfileBtn").addEventListener("click", () => {
    showEditProfileModal(user);
  });

  document.getElementById("changePasswordBtn").addEventListener("click", () => {
    showChangePasswordModal(user);
  });

  // Add event listener for Add User button (only for admin users)
  if (user.role === 'admin') {
    document.getElementById("addUserBtn").addEventListener("click", () => {
      showAddUserModal(user);
    });
  }
}

// Edit Profile Modal Functionality
function showEditProfileModal(user) {
  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';

  modalContent.innerHTML = `
    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
    <h2 style="margin-bottom: 1.25rem; color: #0D3B66; font-size: 1.25rem; font-weight: 600;">Edit Profile</h2>
    
    <div style="margin-bottom: 1rem;">
      <label class="modal-label">User ID</label>
      <input type="text" class="modal-input" value="${user.userid || ''}" disabled>
    </div>
    
    <div style="margin-bottom: 1rem;">
      <label class="modal-label">Username *</label>
      <input type="text" id="editUsername" class="modal-input" value="${user.username || ''}" placeholder="Enter username">
    </div>
    
    <div style="margin-bottom: 1rem;">
      <label class="modal-label">Role</label>
      <input type="text" class="modal-input" value="${user.role ? user.role.toUpperCase() : ''}" disabled>
    </div>
    
    <div style="margin-bottom: 1rem;">
      <label class="modal-label">Name *</label>
      <input type="text" id="editName" class="modal-input" value="${user.name || ''}" placeholder="Enter full name">
    </div>
    
    <div style="margin-bottom: 1rem;">
      <label class="modal-label">Email *</label>
      <input type="email" id="editEmail" class="modal-input" value="${user.email || ''}" placeholder="Enter email address">
    </div>
    
    <div id="errorMessage" class="error-message"></div>
    <div id="successMessage" class="success-message"></div>
    
    <div class="modal-buttons">
      <button class="modal-btn modal-btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="modal-btn modal-btn-primary" id="confirmEditBtn">
        <span class="btn-text-edit">Confirm Changes</span>
        <div class="loading-spinner-edit" style="display: none;"></div>
      </button>
    </div>
  `;

  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  // Handle confirm button click
  document.getElementById('confirmEditBtn').addEventListener('click', async () => {
    const nameInput = document.getElementById('editName');
    const usernameInput = document.getElementById('editUsername');
    const emailInput = document.getElementById('editEmail');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const confirmBtn = document.getElementById('confirmEditBtn');
    const btnText = confirmBtn.querySelector('.btn-text-edit');
    const spinner = confirmBtn.querySelector('.loading-spinner-edit');

    // Clear previous messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Get values
    const name = nameInput.value.trim();
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();

    function setLoadingState(loading) {
      confirmBtn.disabled = loading;
      if (loading) {
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        // Disable inputs during loading
        nameInput.disabled = true;
        usernameInput.disabled = true;
        emailInput.disabled = true;
      } else {
        btnText.style.display = 'block';
        spinner.style.display = 'none';
        // Re-enable inputs
        nameInput.disabled = false;
        usernameInput.disabled = false;
        emailInput.disabled = false;
      }
    }

    // Validation
    if (!name) {
      errorMessage.textContent = 'Name is required';
      errorMessage.style.display = 'block';
      nameInput.focus();
      return;
    }

    if (!username) {
      errorMessage.textContent = 'Username is required';
      errorMessage.style.display = 'block';
      usernameInput.focus();
      return;
    }

    if (!email) {
      errorMessage.textContent = 'Email is required';
      errorMessage.style.display = 'block';
      emailInput.focus();
      return;
    }

    // Username validation (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      errorMessage.textContent = 'Username can only contain letters, numbers, and underscores';
      errorMessage.style.display = 'block';
      usernameInput.focus();
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorMessage.textContent = 'Please enter a valid email address';
      errorMessage.style.display = 'block';
      emailInput.focus();
      return;
    }

    // Show loading state
    setLoadingState(true);

    try {
      // Use IPC handler instead of direct fetch
      const result = await ipcRenderer.invoke("edit-user-profile", {
        userid: user.userid,
        name: name,
        username: username,
        email: email
      });

      if (result.success) {
        successMessage.textContent = result.message || 'Profile updated successfully! Please login again.';
        successMessage.style.display = 'block';
        
        // Update the user object in localStorage
        const updatedUser = { ...user, name: name, username: username, email: email };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Close modal after 3 seconds
        setTimeout(() => {
          modalOverlay.remove();
          // Reload the profile to show updated information
          document.getElementById("logoutBtn").click();
        }, 3000);
      } else {
        setLoadingState(false);
        errorMessage.textContent = result.message || 'Failed to update profile';
        errorMessage.style.display = 'block';
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setLoadingState(false);
      errorMessage.textContent = 'Network error. Please try again.';
      errorMessage.style.display = 'block';
    }
  });

  // Close modal when clicking outside
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.remove();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function closeModal(e) {
    if (e.key === 'Escape') {
      modalOverlay.remove();
      document.removeEventListener('keydown', closeModal);
    }
  });
}

// Change Password Modal Functionality
function showChangePasswordModal(user) {
  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'password-modal-overlay';

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'password-modal-content';

  modalContent.innerHTML = `
    <button class="password-modal-close" onclick="this.closest('.password-modal-overlay').remove()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    
    <div class="password-header">
      <h2>
        <svg class="password-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <circle cx="12" cy="16" r="1"></circle>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        Change Password
      </h2>
    </div>
    
    <div>
      <label class="password-modal-label">Current Password</label>
      <input type="password" id="currentPassword" class="password-modal-input" placeholder="Enter current password" autocomplete="current-password">
    </div>
    
    <div>
      <label class="password-modal-label">New Password</label>
      <input type="password" id="newPassword" class="password-modal-input" placeholder="Enter new password" autocomplete="new-password">
      <div class="password-help">Password must be at least 6 characters</div>
    </div>
    
    <div>
      <label class="password-modal-label">Confirm New Password</label>
      <input type="password" id="confirmPassword" class="password-modal-input" placeholder="Confirm new password" autocomplete="new-password">
    </div>
    
    <div id="passwordErrorMessage" class="password-error"></div>
    <div id="passwordSuccessMessage" class="password-success"></div>
    
    <div class="password-modal-buttons">
      <button class="password-modal-btn password-modal-btn-secondary" onclick="this.closest('.password-modal-overlay').remove()">
        Cancel
      </button>
      <button class="password-modal-btn password-modal-btn-primary" id="confirmPasswordBtn">
        <span class="password-btn-text">Change Password</span>
        <div class="password-loading" style="display: none;"></div>
      </button>
    </div>
  `;

  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  // Handle confirm button click
  document.getElementById('confirmPasswordBtn').addEventListener('click', async () => {
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const errorMessage = document.getElementById('passwordErrorMessage');
    const successMessage = document.getElementById('passwordSuccessMessage');
    const confirmBtn = document.getElementById('confirmPasswordBtn');
    const btnText = confirmBtn.querySelector('.password-btn-text');
    const spinner = confirmBtn.querySelector('.password-loading');

    // Clear previous messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Get values
    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    // Validation
    if (!currentPassword) {
      showError('Current password is required');
      currentPasswordInput.focus();
      return;
    }

    if (!newPassword) {
      showError('New password is required');
      newPasswordInput.focus();
      return;
    }

    if (newPassword.length < 6) {
      showError('New password must be at least 6 characters long');
      newPasswordInput.focus();
      return;
    }

    if (!confirmPassword) {
      showError('Please confirm your new password');
      confirmPasswordInput.focus();
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('New passwords do not match');
      confirmPasswordInput.focus();
      return;
    }

    if (currentPassword === newPassword) {
      showError('New password must be different from current password');
      newPasswordInput.focus();
      return;
    }

    // Show loading state
    setLoadingState(true);

    function showError(message) {
      errorMessage.textContent = message;
      errorMessage.style.display = 'block';
      errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function showSuccess(message) {
      successMessage.textContent = message;
      successMessage.style.display = 'block';
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function setLoadingState(loading) {
      confirmBtn.disabled = loading;
      if (loading) {
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        confirmBtn.style.cursor = 'not-allowed';
        // Disable all inputs during loading
        currentPasswordInput.disabled = true;
        newPasswordInput.disabled = true;
        confirmPasswordInput.disabled = true;
      } else {
        btnText.style.display = 'block';
        spinner.style.display = 'none';
        confirmBtn.style.cursor = 'pointer';
        // Re-enable inputs
        currentPasswordInput.disabled = false;
        newPasswordInput.disabled = false;
        confirmPasswordInput.disabled = false;
      }
    }

    try {
      // Use IPC handler instead of direct fetch
      const requestBody = {
        userid: user.userid,
        currentPassword: currentPassword,
        newPassword: newPassword
      };
      console.log('Change password - Request body:', requestBody);
      
      const result = await ipcRenderer.invoke("change-user-password", requestBody);
      console.log('Change password - Response result:', result);

      if (result.success) {
        showSuccess(result.message || 'Password changed successfully! Logging out in 3 seconds...');
        
        // Close modal and logout after 3 seconds
        setTimeout(() => {
          modalOverlay.remove();
          // Automatically logout since password changed
          document.getElementById("logoutBtn").click();
        }, 3000);
      } else {
        setLoadingState(false);
        showError(result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setLoadingState(false);
      showError('Network error. Please try again.');
    }
  });

  // Close modal when clicking outside
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.remove();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function closeModal(e) {
    if (e.key === 'Escape') {
      modalOverlay.remove();
      document.removeEventListener('keydown', closeModal);
    }
  });
}

// Add User Modal Functionality
function showAddUserModal(user) {
  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'add-user-modal-overlay';

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'add-user-modal-content';

  modalContent.innerHTML = `
    <button class="add-user-close" onclick="this.closest('.add-user-modal-overlay').remove()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    
    <div class="add-user-header">
      <h2>
        <svg class="add-user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <line x1="20" y1="8" x2="20" y2="14"></line>
          <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>
        Add New User
      </h2>
    </div>
    
    <div>
      <label class="add-user-label">Full Name</label>
      <input type="text" id="addUserName" class="add-user-input" placeholder="Enter full name" autocomplete="name">
    </div>
    
    <div>
      <label class="add-user-label">Username</label>
      <input type="text" id="addUserUsername" class="add-user-input" placeholder="Enter username" autocomplete="username">
      <div class="add-user-help">Username must be unique</div>
    </div>
    
    <div>
      <label class="add-user-label">Email Address</label>
      <input type="email" id="addUserEmail" class="add-user-input" placeholder="Enter email address" autocomplete="email">
    </div>
    
    <div>
      <label class="add-user-label">Password</label>
      <input type="password" id="addUserPassword" class="add-user-input" placeholder="Enter password" autocomplete="new-password">
      <div class="add-user-help">Password must be at least 6 characters</div>
    </div>
    
    <div>
      <label class="add-user-label">Role</label>
      <select id="addUserRole" class="add-user-select">
        <option value="">Select role</option>
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
      </select>
    </div>
    
    <div id="addUserErrorMessage" class="add-user-error"></div>
    <div id="addUserSuccessMessage" class="add-user-success"></div>
    
    <div class="add-user-buttons">
      <button class="add-user-btn add-user-btn-secondary" onclick="this.closest('.add-user-modal-overlay').remove()">
        Cancel
      </button>
      <button class="add-user-btn add-user-btn-primary" id="confirmAddUserBtn">
        <span class="add-user-btn-text">Create User</span>
        <div class="add-user-loading" style="display: none;"></div>
      </button>
    </div>
  `;

  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  // Handle confirm button click
  document.getElementById('confirmAddUserBtn').addEventListener('click', async () => {
    const nameInput = document.getElementById('addUserName');
    const usernameInput = document.getElementById('addUserUsername');
    const emailInput = document.getElementById('addUserEmail');
    const passwordInput = document.getElementById('addUserPassword');
    const roleInput = document.getElementById('addUserRole');
    const errorMessage = document.getElementById('addUserErrorMessage');
    const successMessage = document.getElementById('addUserSuccessMessage');
    const confirmBtn = document.getElementById('confirmAddUserBtn');

    // Hide previous messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Get form values
    const name = nameInput.value.trim();
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const role = roleInput.value;

    // Basic validation
    if (!name) {
      errorMessage.textContent = 'Please enter a full name';
      errorMessage.style.display = 'block';
      nameInput.focus();
      return;
    }

    if (!username) {
      errorMessage.textContent = 'Please enter a username';
      errorMessage.style.display = 'block';
      usernameInput.focus();
      return;
    }

    if (!email) {
      errorMessage.textContent = 'Please enter an email address';
      errorMessage.style.display = 'block';
      emailInput.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorMessage.textContent = 'Please enter a valid email address';
      errorMessage.style.display = 'block';
      emailInput.focus();
      return;
    }

    if (!password) {
      errorMessage.textContent = 'Please enter a password';
      errorMessage.style.display = 'block';
      passwordInput.focus();
      return;
    }

    if (password.length < 6) {
      errorMessage.textContent = 'Password must be at least 6 characters long';
      errorMessage.style.display = 'block';
      passwordInput.focus();
      return;
    }

    if (!role) {
      errorMessage.textContent = 'Please select a role';
      errorMessage.style.display = 'block';
      roleInput.focus();
      return;
    }

    // Show loading state
    const btnText = confirmBtn.querySelector('.add-user-btn-text');
    const spinner = confirmBtn.querySelector('.add-user-loading');
    
    function setLoadingState(loading) {
      if (loading) {
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        confirmBtn.disabled = true;
        [nameInput, usernameInput, emailInput, passwordInput, roleInput].forEach(input => {
          input.disabled = true;
        });
      } else {
        btnText.style.display = 'block';
        spinner.style.display = 'none';
        confirmBtn.disabled = false;
        [nameInput, usernameInput, emailInput, passwordInput, roleInput].forEach(input => {
          input.disabled = false;
        });
      }
    }

    setLoadingState(true);

    try {
      // Use IPC handler instead of direct fetch
      const result = await ipcRenderer.invoke("add-new-user", {
        name: name,
        username: username,
        email: email,
        password: password,
        role: role,
        adminUserId: user.userid
      });

      setLoadingState(false);

      if (result.success) {
        successMessage.textContent = result.message || 'User created successfully!';
        successMessage.style.display = 'block';
        
        // Clear form
        nameInput.value = '';
        usernameInput.value = '';
        emailInput.value = '';
        passwordInput.value = '';
        roleInput.value = '';
        
        // Auto-close modal after 2 seconds
        setTimeout(() => {
          modalOverlay.remove();
        }, 2000);
      } else {
        errorMessage.textContent = result.message || 'Failed to create user. Please try again.';
        errorMessage.style.display = 'block';
      }

    } catch (error) {
      setLoadingState(false);
      console.error('Error creating user:', error);
      errorMessage.textContent = 'Network error. Please check your connection and try again.';
      errorMessage.style.display = 'block';
    }
  });

  // Close modal when clicking outside
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.remove();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function closeModal(e) {
    if (e.key === 'Escape') {
      modalOverlay.remove();
      document.removeEventListener('keydown', closeModal);
    }
  });
}

module.exports = { loadUserProfile };