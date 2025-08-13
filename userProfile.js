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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
    await ipcRenderer.invoke("logout");
    window.location.href = "login.html";
  });

  document.getElementById("editProfileBtn").addEventListener("click", () => {
    alert("Edit profile functionality would open here");
    // Implement actual edit functionality
  });
}

module.exports = { loadUserProfile };