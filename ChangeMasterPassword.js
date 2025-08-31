const { ipcRenderer } = require("electron");

async function ChangeMasterPassword(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = "none";

    let currentStep = 1;

    mainContent.innerHTML = `
        <style>
            .change-password-container {
                max-width: 500px;
                margin: 50px auto;
                padding: 40px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(13, 59, 102, 0.1);
                border: 1px solid #e2e8f0;
            }

            .change-password-title {
                text-align: center;
                color: #0D3B66;
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 10px;
                letter-spacing: -0.02em;
            }

            .change-password-subtitle {
                text-align: center;
                color: #64748b;
                font-size: 16px;
                margin-bottom: 40px;
                line-height: 1.5;
            }

            .form-group {
                margin-bottom: 25px;
            }

            .form-label {
                display: block;
                color: #0D3B66;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 8px;
                letter-spacing: 0.02em;
            }

            .form-input {
                width: 100%;
                padding: 16px 50px 16px 16px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                font-size: 16px;
                transition: all 0.3s ease;
                background: white;
                color: #1e293b;
                box-sizing: border-box;
            }

            .form-input:focus {
                outline: none;
                border-color: #0D3B66;
                box-shadow: 0 0 0 3px rgba(13, 59, 102, 0.1);
            }

            .form-input:disabled {
                background: #f8fafc;
                color: #94a3b8;
                cursor: not-allowed;
            }

            .btn-group {
                display: flex;
                gap: 15px;
                margin-top: 40px;
            }

            .btn {
                flex: 1;
                padding: 16px 24px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                letter-spacing: 0.02em;
            }

            .btn-primary {
                background: #0D3B66;
                color: white;
            }

            .btn-primary:hover {
                background: #0a2d4d;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(13, 59, 102, 0.3);
            }

            .btn-primary:disabled {
                background: #94a3b8;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            .btn-secondary {
                background: white;
                color: #0D3B66;
                border: 2px solid #0D3B66;
            }

            .btn-secondary:hover {
                background: #0D3B66;
                color: white;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(13, 59, 102, 0.2);
            }

            .error-message {
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #dc2626;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                margin-top: 15px;
                display: none;
            }

            .success-message {
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                color: #16a34a;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                margin-top: 15px;
                display: none;
            }

            .loading-spinner {
                display: none;
                text-align: center;
                margin: 20px 0;
            }

            .spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #0D3B66;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .step {
                display: none;
            }

            .step.active {
                display: block;
            }

            .step-indicator {
                display: flex;
                justify-content: center;
                margin-bottom: 30px;
                gap: 10px;
            }

            .step-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #e2e8f0;
                transition: all 0.3s ease;
            }

            .step-dot.active {
                background: #0D3B66;
            }

            .toggle-password {
                position: absolute;
                right: 16px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: #64748b;
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .toggle-password:hover {
                color: #0D3B66;
            }

            .toggle-password svg {
                width: 18px;
                height: 18px;
            }

            .input-wrapper {
                position: relative;
            }
        </style>

        <div class="change-password-header">
            <h2>Change Master Password</h2>
            <p class="change-password-subtitle">Secure your POS system with a new master password</p>
        </div>

        <div class="change-password-container">
            <div class="step-indicator">
                <div class="step-dot active" id="step-dot-1"></div>
                <div class="step-dot" id="step-dot-2"></div>
            </div>

            <form id="change-password-form">
                <!-- Step 1: Verify Current Password -->
                <div class="step active" id="step-1">
                    <div class="form-group">
                        <label for="current-password" class="form-label">Current Master Password</label>
                        <div class="input-wrapper">
                            <input 
                                type="password" 
                                id="current-password" 
                                class="form-input" 
                                placeholder="Enter your current master password"
                                required
                            >
                            <button type="button" class="toggle-password" id="toggle-current">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="btn-group">
                        <button type="button" class="btn btn-secondary" id="cancel-btn">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-primary" id="verify-btn">
                            Verify Password
                        </button>
                    </div>
                </div>

                <!-- Step 2: Set New Password -->
                <div class="step" id="step-2">
                    <div class="form-group">
                        <label for="new-password" class="form-label">New Master Password</label>
                        <div class="input-wrapper">
                            <input 
                                type="password" 
                                id="new-password" 
                                class="form-input" 
                                placeholder="Enter new master password"
                                required
                            >
                            <button type="button" class="toggle-password" id="toggle-new">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="confirm-password" class="form-label">Confirm New Password</label>
                        <div class="input-wrapper">
                            <input 
                                type="password" 
                                id="confirm-password" 
                                class="form-input" 
                                placeholder="Confirm new master password"
                                required
                            >
                            <button type="button" class="toggle-password" id="toggle-confirm">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="btn-group">
                        <button type="button" class="btn btn-secondary" id="back-btn">
                            Back
                        </button>
                        <button type="button" class="btn btn-primary" id="change-btn">
                            Change Password
                        </button>
                    </div>
                </div>

                <div class="loading-spinner" id="loading-spinner">
                    <div class="spinner"></div>
                    <p>Processing...</p>
                </div>

                <div class="error-message" id="error-message"></div>
                <div class="success-message" id="success-message"></div>
            </form>
        </div>
    `;

    // Helper functions
    function showStep(step) {
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.step-dot').forEach(dot => dot.classList.remove('active'));
        
        document.getElementById('step-' + step).classList.add('active');
        for (let i = 1; i <= step; i++) {
            document.getElementById('step-dot-' + i).classList.add('active');
        }
        
        currentStep = step;
    }

    function togglePasswordVisibility(inputId, buttonElement) {
        const input = document.getElementById(inputId);
        const isPassword = input.type === 'password';
        
        input.type = isPassword ? 'text' : 'password';
        
        // Update SVG icon
        buttonElement.innerHTML = isPassword ? 
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>` :
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>`;
    }

    function showLoading() {
        document.getElementById('loading-spinner').style.display = 'block';
        document.querySelectorAll('.btn').forEach(btn => btn.disabled = true);
    }

    function hideLoading() {
        document.getElementById('loading-spinner').style.display = 'none';
        document.querySelectorAll('.btn').forEach(btn => btn.disabled = false);
    }

    function showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        hideLoading();
    }

    function showSuccess(message) {
        const successDiv = document.getElementById('success-message');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        hideLoading();
    }

    function clearMessages() {
        document.getElementById('error-message').style.display = 'none';
        document.getElementById('success-message').style.display = 'none';
    }

    async function verifyCurrentPassword() {
        const currentPassword = document.getElementById('current-password').value.trim();
        
        if (!currentPassword) {
            showError('Please enter your current master password');
            return;
        }

        showLoading();
        clearMessages();

        try {
            const storedPassword = await ipcRenderer.invoke('get-master-password');
            
            if (!storedPassword) {
                showError('No master password is currently set');
                return;
            }

            if (currentPassword !== storedPassword) {
                showError('Current password is incorrect');
                return;
            }

            hideLoading();
            showStep(2);
            
        } catch (error) {
            showError('Failed to verify current password: ' + error);
        }
    }

    async function changePassword() {
        const newPassword = document.getElementById('new-password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();

        clearMessages();

        if (!newPassword || !confirmPassword) {
            showError('Please fill in all password fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            showError('New passwords do not match');
            return;
        }

        showLoading();

        try {
            console.log('Attempting to set new password...');
            await ipcRenderer.invoke('set-master-password', newPassword);
            console.log('Password set successfully in IPC call');
            
            // Verify the password was actually saved
            const verifyPassword = await ipcRenderer.invoke('get-master-password');
            console.log('Verification - password retrieved:', verifyPassword ? 'Password exists' : 'No password found');
            
            if (verifyPassword === newPassword) {
                showSuccess('Master password changed successfully!');
                
                setTimeout(() => {
                    document.getElementById('change-password-form').reset();
                    showStep(1);
                    clearMessages();
                }, 2000);
            } else {
                showError('Password was not saved correctly. Please try again.');
            }
            
        } catch (error) {
            console.error('Error changing password:', error);
            showError('Failed to change password: ' + error);
        }
    }

    // Event listeners
    document.getElementById('toggle-current').addEventListener('click', (e) => {
        togglePasswordVisibility('current-password', e.currentTarget);
    });

    document.getElementById('toggle-new').addEventListener('click', (e) => {
        togglePasswordVisibility('new-password', e.currentTarget);
    });

    document.getElementById('toggle-confirm').addEventListener('click', (e) => {
        togglePasswordVisibility('confirm-password', e.currentTarget);
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
        updateMainContent('Settings');
    });

    document.getElementById('verify-btn').addEventListener('click', verifyCurrentPassword);

    document.getElementById('back-btn').addEventListener('click', () => {
        showStep(1);
        clearMessages();
    });

    document.getElementById('change-btn').addEventListener('click', changePassword);

    // Handle Enter key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            
            if (currentStep === 1) {
                verifyCurrentPassword();
            } else if (currentStep === 2) {
                changePassword();
            }
        }
    });
}

module.exports = { ChangeMasterPassword };