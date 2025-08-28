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
    --primary-light: #0D3B66;
    --secondary: #0D3B66;
    --success: #10b981;
    --danger: #ef4444;
    --warning: #f59e0b;
    --dark: #1e293b;
    --light: #f8fafc;
    --gray: #64748b;
    --border: #e2e8f0;
    --card-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 5px 10px -5px rgba(0, 0, 0, 0.02);
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
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
  }
  
  .profile-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }
  
  .avatar-container {
    position: relative;
    display: inline-block;
    margin-bottom: 1.5rem;
  }
  
  .user-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
    font-size: 2.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    box-shadow: var(--card-shadow);
  }
  
  .role-badge {
    position: absolute;
    bottom: 0;
    right: 0;
    background: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .admin-badge { background: var(--danger); color: white; }
  .staff-badge { background: var(--success); color: white; }
  .manager-badge { background: var(--warning); color: white; }
  .default-badge { background: var(--gray); color: white; }
  
  .profile-header h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: var(--dark);
  }
  
  .profile-header p {
    color: var(--gray);
    font-size: 1.1rem;
  }
  
  .profile-details {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: var(--card-shadow);
    margin-bottom: 2rem;
  }
  
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }
  
  .detail-item {
    display: flex;
    padding: 1rem 0;
    border-bottom: 1px solid var(--border);
  }
  
  .detail-item:last-child {
    border-bottom: none;
  }
  
  .detail-icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    margin-right: 1rem;
    color: var(--primary);
  }
  
  .detail-content {
    flex: 1;
  }
  
  .detail-title {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--gray);
    margin-bottom: 0.25rem;
  }
  
  .detail-value {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--dark);
  }
  
  .profile-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
  
  .action-btn {
    padding: 0.85rem 2rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: var(--transition);
    border: none;
  }
  
  .primary {
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
    box-shadow: 0 4px 6px rgba(67, 97, 238, 0.2);
  }
  
  .primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(67, 97, 238, 0.25);
  }
  
  .secondary {
    background: var(--light);
    color: var(--gray);
    border: 1px solid var(--border);
  }
  
  .secondary:hover {
    background: white;
    border-color: var(--primary);
    color: var(--primary);
  }
  
  .profile-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: 2rem;
  }
  
  .empty-icon {
    width: 80px;
    height: 80px;
    background: var(--primary-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
  }
  
  .empty-icon svg {
    width: 40px;
    height: 40px;
    color: var(--primary);
  }
  
  .profile-empty-state h2 {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
    color: var(--dark);
  }
  
  .profile-empty-state p {
    color: var(--gray);
    margin-bottom: 1.5rem;
    max-width: 400px;
    line-height: 1.6;
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
}

// Edit Profile Modal Functionality
function showEditProfileModal(user) {
  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
  `;

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 2rem;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    position: relative;
    animation: modalSlideIn 0.3s ease;
  `;

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .modal-input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 1rem;
      transition: all 0.3s ease;
    }
    
    .modal-input:focus {
      outline: none;
      border-color: #0D3B66;
      box-shadow: 0 0 0 3px rgba(13, 59, 102, 0.1);
    }
    
    .modal-input:disabled {
      background-color: #f8f9fa;
      color: #6c757d;
      cursor: not-allowed;
    }
    
    .modal-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .modal-buttons {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }
    
    .modal-btn {
      flex: 1;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .modal-btn-primary {
      background: #0D3B66;
      color: white;
    }
    
    .modal-btn-primary:hover {
      background: #0A2E4D;
      transform: translateY(-1px);
    }
    
    .modal-btn-secondary {
      background: #f8f9fa;
      color: #6c757d;
      border: 1px solid #e2e8f0;
    }
    
    .modal-btn-secondary:hover {
      background: #e9ecef;
    }
    
    .modal-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    
    .modal-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6c757d;
      padding: 0.5rem;
      border-radius: 50%;
      transition: all 0.3s ease;
    }
    
    .modal-close:hover {
      background: #f8f9fa;
      color: #374151;
    }
    
    .error-message {
      color: #dc2626;
      font-size: 14px;
      margin-top: 0.5rem;
      display: none;
    }
    
    .success-message {
      color: #059669;
      font-size: 14px;
      margin-top: 0.5rem;
      display: none;
    }
  `;
  document.head.appendChild(style);

  modalContent.innerHTML = `
    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
    <h2 style="margin-bottom: 1.5rem; color: #0D3B66; font-size: 1.5rem; font-weight: 600;">Edit Profile</h2>
    
    <div style="margin-bottom: 1.5rem;">
      <label class="modal-label">User ID</label>
      <input type="text" class="modal-input" value="${user.userid || ''}" disabled>
    </div>
    
         <div style="margin-bottom: 1.5rem;">
       <label class="modal-label">Username *</label>
       <input type="text" id="editUsername" class="modal-input" value="${user.username || ''}" placeholder="Enter your username">
     </div>
    
    <div style="margin-bottom: 1.5rem;">
      <label class="modal-label">Role</label>
      <input type="text" class="modal-input" value="${user.role ? user.role.toUpperCase() : ''}" disabled>
    </div>
    
    <div style="margin-bottom: 1.5rem;">
      <label class="modal-label">Name *</label>
      <input type="text" id="editName" class="modal-input" value="${user.name || ''}" placeholder="Enter your full name">
    </div>
    
    <div style="margin-bottom: 1.5rem;">
      <label class="modal-label">Email *</label>
      <input type="email" id="editEmail" class="modal-input" value="${user.email || ''}" placeholder="Enter your email address">
    </div>
    
    <div id="errorMessage" class="error-message"></div>
    <div id="successMessage" class="success-message"></div>
    
    <div class="modal-buttons">
      <button class="modal-btn modal-btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="modal-btn modal-btn-primary" id="confirmEditBtn">Confirm Changes</button>
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

    // Clear previous messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Get values
    const name = nameInput.value.trim();
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();

    // Validation
    if (!name) {
      errorMessage.textContent = 'Name is required';
      errorMessage.style.display = 'block';
      return;
    }

    if (!username) {
      errorMessage.textContent = 'Username is required';
      errorMessage.style.display = 'block';
      return;
    }

    if (!email) {
      errorMessage.textContent = 'Email is required';
      errorMessage.style.display = 'block';
      return;
    }

    // Username validation (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      errorMessage.textContent = 'Username can only contain letters, numbers, and underscores';
      errorMessage.style.display = 'block';
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorMessage.textContent = 'Please enter a valid email address';
      errorMessage.style.display = 'block';
      return;
    }

    // Disable button and show loading
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Updating...';

    try {
      // Get MONGO_PORT from environment or use default
      const MONGO_PORT = process.env.MONGO_PORT;
      
      const response = await fetch(`http://localhost:${MONGO_PORT}/edituser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userid: user.userid,
          name: name,
          username: username,
          email: email
        })
      });

      const result = await response.json();

      if (result.success) {
        successMessage.textContent = result.message || 'Profile updated successfully! Please login again.';
        successMessage.style.display = 'block';
        
        // Update the user object in localStorage
        const updatedUser = { ...user, name: name, username: username, email: email };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Close modal after 2 seconds
        setTimeout(() => {
          modalOverlay.remove();
          // Reload the profile to show updated information
          document.getElementById("logoutBtn").click();
        }, 3000);
      } else {
        errorMessage.textContent = result.message || 'Failed to update profile';
        errorMessage.style.display = 'block';
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Changes';
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      errorMessage.textContent = 'Network error. Please try again.';
      errorMessage.style.display = 'block';
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm Changes';
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