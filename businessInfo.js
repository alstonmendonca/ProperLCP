const { ipcRenderer } = require('electron');

async function loadBusinessInfo(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';
    let businessData = await ipcRenderer.invoke('load-business-info');
    
    if(!businessData){
        businessData = {
            name: "Lassi Corner",
            tagline: "Lorem Ipsum Default Hardcoded Values for Lassi Corner",
            description: "This App was created by Alston and Reevan, once upon a time. Please edit this default message.",
            address: "Vamanjoor, Mangalore, Karnataka 575028",
            phone: "+91 9876543210",
            email: "contact@lassicorner.com",
            hours: {
                weekdays: "9:00 AM - 10:00 PM",
                saturday: "10:00 AM - 11:00 PM",
                sunday: "Timings not available"
            },
            owner: {
                name: "Ajay Anchan",
                position: "Founder & CEO",
                initials: "AA"
            }
        };
    }

    const saveBusinessInfo = () => {
        businessData = {
            name: document.getElementById('business-name').value,
            tagline: document.getElementById('business-tagline').value,
            description: document.getElementById('business-description').value,
            address: document.getElementById('business-address').value,
            phone: document.getElementById('business-phone').value,
            email: document.getElementById('business-email').value,
            hours: {
                weekdays: document.getElementById('business-hours-weekdays').value,
                saturday: document.getElementById('business-hours-saturday').value,
                sunday: document.getElementById('business-hours-sunday').value
            },
            owner: {
                name: document.getElementById('owner-name').value,
                position: document.getElementById('owner-position').value,
                initials: document.getElementById('owner-initials').value
            }
        };

        ipcRenderer.send('save-business-info', businessData);

        // Exit edit mode
        const editToggle = document.getElementById('edit-toggle');
        editToggle.checked = false;
        toggleEditMode();

        // Enhanced visual feedback
        const saveBtn = document.getElementById('save-btn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = `
            <svg class="success-icon" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span>Saved Successfully!</span>
        `;
        saveBtn.classList.add('saved');
        
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.classList.remove('saved');
        }, 3000);
    };

    const toggleEditMode = () => {
        const isEditMode = document.getElementById('edit-toggle').checked;
        const inputs = document.querySelectorAll('.editable-field');
        const container = document.querySelector('.business-info-container');
        
        inputs.forEach(input => {
            input.disabled = !isEditMode;
            if (isEditMode) {
                input.style.backgroundColor = '#f8fafc';
                input.style.border = '2px solid #e2e8f0';
                input.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.06)';
            } else {
                input.style.backgroundColor = 'transparent';
                input.style.border = '2px solid transparent';
                input.style.boxShadow = 'none';
            }
        });
        
        const saveBtn = document.getElementById('save-btn');
        saveBtn.style.display = isEditMode ? 'flex' : 'none';
        
        // Add visual feedback for edit mode
        if (isEditMode) {
            container.classList.add('edit-mode');
        } else {
            container.classList.remove('edit-mode');
        }
    };

    mainContent.innerHTML = `
        <div class="business-info-container">
            <!-- Header with Edit Toggle -->
            <div class="header-section">
                <div class="header-content">
                    <input id="business-name" class="editable-field header-input" value="${businessData.name}" disabled>
                    <div class="header-divider"></div>
                    <input id="business-tagline" class="editable-field tagline-input" value="${businessData.tagline}" disabled>
                </div>
                
                <!-- Enhanced Edit Toggle -->
                <div class="edit-toggle-container">
                    <label class="toggle-switch">
                        <input type="checkbox" id="edit-toggle" onchange="toggleEditMode()">
                        <span class="slider"></span>
                    </label>
                    <span class="edit-label">Edit Mode</span>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="content-grid">
                <!-- About Section -->
                <div class="content-card">
                    <div class="card-header">
                        <svg class="card-icon" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <h2>About Us</h2>
                    </div>
                    <textarea id="business-description" class="editable-field description-textarea" disabled>${businessData.description}</textarea>
                </div>

                <!-- Contact Section -->
                <div class="content-card">
                    <div class="card-header">
                        <svg class="card-icon" viewBox="0 0 24 24">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                        </svg>
                        <h2>Contact Information</h2>
                    </div>
                    <div class="contact-grid">
                        <div class="contact-item">
                            <div class="contact-label">
                                <svg class="contact-icon" viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                                <span>Address</span>
                            </div>
                            <input id="business-address" class="editable-field" value="${businessData.address}" disabled>
                        </div>
                        <div class="contact-item">
                            <div class="contact-label">
                                <svg class="contact-icon" viewBox="0 0 24 24">
                                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                                </svg>
                                <span>Phone</span>
                            </div>
                            <input id="business-phone" class="editable-field" value="${businessData.phone}" disabled>
                        </div>
                        <div class="contact-item">
                            <div class="contact-label">
                                <svg class="contact-icon" viewBox="0 0 24 24">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                </svg>
                                <span>Email</span>
                            </div>
                            <input id="business-email" class="editable-field" value="${businessData.email}" disabled>
                        </div>
                    </div>
                </div>

                <!-- Business Hours Section -->
                <div class="content-card">
                    <div class="card-header">
                        <svg class="card-icon" viewBox="0 0 24 24">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                        </svg>
                        <h2>Business Hours</h2>
                    </div>
                    <div class="hours-grid">
                        <div class="hours-item">
                            <div class="hours-label">Monday - Friday</div>
                            <input id="business-hours-weekdays" class="editable-field" value="${businessData.hours.weekdays}" disabled>
                        </div>
                        <div class="hours-item">
                            <div class="hours-label">Saturday</div>
                            <input id="business-hours-saturday" class="editable-field" value="${businessData.hours.saturday}" disabled>
                        </div>
                        <div class="hours-item">
                            <div class="hours-label">Sunday</div>
                            <input id="business-hours-sunday" class="editable-field" value="${businessData.hours.sunday}" disabled>
                        </div>
                    </div>
                </div>

                <!-- Owner Section -->
                <div class="content-card owner-card">
                    <div class="card-header">
                        <svg class="card-icon" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        <h2>Owner Information</h2>
                    </div>
                    <div class="owner-profile">
                        <div class="owner-avatar">
                            <span>${businessData.owner.initials}</span>
                        </div>
                        <div class="owner-details">
                            <div class="owner-name-group">
                                <div class="owner-label">Name</div>
                                <input id="owner-name" class="editable-field" value="${businessData.owner.name}" disabled>
                            </div>
                            <div class="owner-position-group">
                                <div class="owner-label">Position</div>
                                <input id="owner-position" class="editable-field" value="${businessData.owner.position}" disabled>
                            </div>
                            <div class="owner-initials-group">
                                <div class="owner-label">Initials</div>
                                <input id="owner-initials" class="editable-field" value="${businessData.owner.initials}" disabled>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Enhanced Save Button -->
            <button id="save-btn" onclick="saveBusinessInfo()" class="save-button">
                <svg class="save-icon" viewBox="0 0 24 24">
                    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                </svg>
                <span>Save Changes</span>
            </button>
        </div>

        <style>
            :root {
                --primary: #0D3B66;
                --primary-light: #1e5a8a;
                --primary-dark: #0a2d4d;
                --secondary: #f59e0b;
                --secondary-light: #fbbf24;
                --background: #f8fafc;
                --surface: #ffffff;
                --text: #1e293b;
                --text-light: #64748b;
                --text-muted: #94a3b8;
                --border: #e2e8f0;
                --border-light: #f1f5f9;
                --success: #10b981;
                --error: #ef4444;
                --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }

            .business-info-container {
                max-width: 1200px;
                margin: 2rem auto;
                padding: 2rem;
                background: var(--surface);
                border-radius: 1.5rem;
                box-shadow: var(--shadow-lg);
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: var(--text);
                position: relative;
                animation: slideIn 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                transition: all 0.3s ease;
            }

            .business-info-container:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-xl);
            }

            .business-info-container.edit-mode {
                box-shadow: 0 0 0 3px rgba(13, 59, 102, 0.1);
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Header Section */
            .header-section {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 3rem;
                padding-bottom: 2rem;
                border-bottom: 2px solid var(--border-light);
            }

            .header-content {
                flex: 1;
                text-align: center;
            }

            .header-input {
                color: var(--text);
                font-size: 2.5rem;
                font-weight: 800;
                border: none;
                text-align: center;
                width: 100%;
                padding: 0.5rem;
                background: transparent;
                transition: all 0.3s ease;
                margin-bottom: 1rem;
            }

            .header-divider {
                height: 4px;
                width: 120px;
                background: linear-gradient(90deg, var(--primary), var(--primary));
                margin: 0 auto 1.5rem;
                border-radius: 2px;
                animation: dividerExpand 0.8s ease-out;
            }

            @keyframes dividerExpand {
                from { width: 0; opacity: 0; }
                to { width: 120px; opacity: 1; }
            }

            .tagline-input {
                color: var(--text-light);
                font-size: 1.25rem;
                font-weight: 500;
                border: none;
                text-align: center;
                width: 100%;
                padding: 0.5rem;
                background: transparent;
                transition: all 0.3s ease;
            }

            /* Edit Toggle */
            .edit-toggle-container {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                background: var(--background);
                padding: 0.75rem 1rem;
                border-radius: 2rem;
                box-shadow: var(--shadow);
            }

            .toggle-switch {
                position: relative;
                display: inline-block;
                width: 52px;
                height: 28px;
            }

            .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: var(--border);
                transition: 0.4s;
                border-radius: 34px;
            }

            .slider:before {
                position: absolute;
                content: "";
                height: 22px;
                width: 22px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: 0.4s;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }

            input:checked + .slider {
                background-color: var(--primary);
            }

            input:checked + .slider:before {
                transform: translateX(24px);
            }

            .edit-label {
                font-size: 0.9rem;
                color: var(--text-light);
                font-weight: 600;
                user-select: none;
            }

            /* Content Grid */
            .content-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 2rem;
                margin-bottom: 2rem;
            }

            .content-card {
                background: var(--surface);
                border: 2px solid var(--border-light);
                border-radius: 1rem;
                padding: 1.5rem;
                transition: all 0.3s ease;
            }

            .content-card:hover {
                border-color: var(--border);
                transform: translateY(-2px);
                box-shadow: var(--shadow);
            }

            .card-header {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid var(--border-light);
            }

            .card-icon {
                width: 24px;
                height: 24px;
                fill: var(--primary);
            }

            .card-header h2 {
                color: var(--primary);
                font-size: 1.25rem;
                font-weight: 700;
                margin: 0;
            }

            /* Contact Grid */
            .contact-grid {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .contact-item {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .contact-label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--text-light);
                font-weight: 600;
                font-size: 0.9rem;
            }

            .contact-icon {
                width: 16px;
                height: 16px;
                fill: var(--text-muted);
            }

            /* Hours Grid */
            .hours-grid {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .hours-item {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .hours-label {
                color: var(--text-light);
                font-weight: 600;
                font-size: 0.9rem;
            }

            /* Owner Section */
            .owner-card {
                grid-column: span 2;
            }

            .owner-profile {
                display: flex;
                align-items: flex-start;
                gap: 1.5rem;
            }

            .owner-avatar {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, var(--primary), var(--primary));
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.75rem;
                color: white;
                font-weight: 700;
                box-shadow: var(--shadow);
                transition: transform 0.3s ease;
                flex-shrink: 0;
            }

            .owner-avatar:hover {
                transform: scale(1.05);
            }

            .owner-details {
                flex: 1;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }

            .owner-name-group,
            .owner-position-group,
            .owner-initials-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .owner-label {
                color: var(--text-light);
                font-weight: 600;
                font-size: 0.9rem;
            }

            /* Form Fields */
            .editable-field {
                padding: 0.875rem 1rem;
                border: 2px solid transparent;
                border-radius: 0.75rem;
                color: var(--text);
                transition: all 0.3s ease;
                font-family: inherit;
                background: transparent;
                font-size: 0.95rem;
            }

            .editable-field:disabled {
                cursor: default;
                color: var(--text);
            }

            .editable-field:enabled {
                background: var(--background) !important;
                border-color: var(--border) !important;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
            }

            .editable-field:focus {
                outline: none;
                border-color: var(--primary) !important;
                box-shadow: 0 0 0 3px rgba(13, 59, 102, 0.1);
            }

            .description-textarea {
                width: 100%;
                min-height: 120px;
                resize: vertical;
                line-height: 1.6;
            }

            /* Save Button */
            .save-button {
                display: none;
                margin-top: 2rem;
                padding: 1rem 2rem;
                background: linear-gradient(135deg, var(--primary), var(--primary));
                color: white;
                border: none;
                border-radius: 0.75rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                font-size: 1rem;
                position: relative;
                overflow: hidden;
            }

            .save-button:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-lg);
                background: linear-gradient(135deg, var(--primary), var(--primary));
            }

            .save-button:active {
                transform: translateY(0);
            }

            .save-icon {
                width: 20px;
                height: 20px;
                fill: currentColor;
            }

            .success-icon {
                width: 20px;
                height: 20px;
                fill: currentColor;
                animation: checkmark 0.5s ease-in-out;
            }

            @keyframes checkmark {
                0% {
                    transform: scale(0) rotate(-45deg);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.2) rotate(-45deg);
                    opacity: 1;
                }
                100% {
                    transform: scale(1) rotate(0deg);
                    opacity: 1;
                }
            }

            .save-button.saved {
                background: linear-gradient(135deg, var(--success), #059669);
            }

            /* Responsive Design */
            @media (max-width: 1024px) {
                .owner-card {
                    grid-column: span 1;
                }
                
                .owner-profile {
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                
                .owner-details {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 768px) {
                .business-info-container {
                    padding: 1.5rem;
                    margin: 1rem;
                }
                
                .header-section {
                    flex-direction: column;
                    gap: 1rem;
                    align-items: center;
                }
                
                .content-grid {
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                }
                
                .header-input {
                    font-size: 2rem;
                }
                
                .tagline-input {
                    font-size: 1.1rem;
                }
            }

            @media (max-width: 480px) {
                .business-info-container {
                    padding: 1rem;
                    margin: 0.5rem;
                }
                
                .header-input {
                    font-size: 1.75rem;
                }
                
                .content-card {
                    padding: 1rem;
                }
            }
        </style>
    `;

    window.toggleEditMode = toggleEditMode;
    window.saveBusinessInfo = saveBusinessInfo;
}

module.exports = { loadBusinessInfo };