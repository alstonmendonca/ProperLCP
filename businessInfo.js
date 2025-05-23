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

        // Visual feedback
        const saveBtn = document.getElementById('save-btn');
        saveBtn.textContent = '✓ Saved!';
        saveBtn.style.backgroundColor = '#10b981';
        setTimeout(() => {
            saveBtn.textContent = 'Save Changes';
            saveBtn.style.backgroundColor = '#e67e22';
        }, 2000);
    };

    const toggleEditMode = () => {
        const isEditMode = document.getElementById('edit-toggle').checked;
        const inputs = document.querySelectorAll('.editable-field');
        
        inputs.forEach(input => {
            input.disabled = !isEditMode;
            if (isEditMode) {
                input.style.backgroundColor = '#f8fafc';
                input.style.border = '1px solid #cbd5e1';
                input.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
            } else {
                input.style.backgroundColor = 'transparent';
                input.style.border = '1px solid transparent';
                input.style.boxShadow = 'none';
            }
        });
        
        document.getElementById('save-btn').style.display = isEditMode ? 'block' : 'none';
    };

    mainContent.innerHTML = `
        <div class="business-info-container">
            <!-- Edit Toggle -->
            <div class="edit-toggle-container">
                <label class="toggle-switch">
                    <input type="checkbox" id="edit-toggle" onchange="toggleEditMode()">
                    <span class="slider"></span>
                </label>
                <span class="edit-label">Edit Mode</span>
            </div>
            
            <!-- Header Section -->
            <div class="header-section">
                <input id="business-name" class="editable-field header-input" value="${businessData.name}" disabled>
                <div class="header-divider"></div>
                <input id="business-tagline" class="editable-field tagline-input" value="${businessData.tagline}" disabled>
            </div>

            <!-- Two Column Layout -->
            <div class="columns-container">
                <!-- Left Column -->
                <div class="content-column">
                    <h2 class="section-header">About Us</h2>
                    <textarea id="business-description" class="editable-field description-textarea" disabled>${businessData.description}</textarea>
                    
                    <h2 class="section-header">Contact</h2>
                    <div class="input-group">
                        <strong>Address:</strong>
                        <input id="business-address" class="editable-field" value="${businessData.address}" disabled>
                    </div>
                    <div class="input-group">
                        <strong>Phone:</strong>
                        <input id="business-phone" class="editable-field" value="${businessData.phone}" disabled>
                    </div>
                    <div class="input-group">
                        <strong>Email:</strong>
                        <input id="business-email" class="editable-field" value="${businessData.email}" disabled>
                    </div>
                </div>

                <!-- Right Column -->
                <div class="content-column">
                    <h2 class="section-header">Business Hours</h2>
                    <div class="input-group">
                        <strong>Mon-Fri:</strong>
                        <input id="business-hours-weekdays" class="editable-field" value="${businessData.hours.weekdays}" disabled>
                    </div>
                    <div class="input-group">
                        <strong>Saturday:</strong>
                        <input id="business-hours-saturday" class="editable-field" value="${businessData.hours.saturday}" disabled>
                    </div>
                    <div class="input-group">
                        <strong>Sunday:</strong>
                        <input id="business-hours-sunday" class="editable-field" value="${businessData.hours.sunday}" disabled>
                    </div>

                    <h2 class="section-header owner-header">Owner</h2>
                    <div class="owner-profile">
                        <div class="owner-avatar">${businessData.owner.initials}</div>
                        <div class="owner-info">
                            <input id="owner-name" class="editable-field" value="${businessData.owner.name}" disabled>
                            <input id="owner-position" class="editable-field" value="${businessData.owner.position}" disabled>
                        </div>
                    </div>
                    <div class="input-group initials-group">
                        <strong>Initials:</strong>
                        <input id="owner-initials" class="editable-field" value="${businessData.owner.initials}" disabled>
                    </div>
                </div>
            </div>
            
            <!-- Save Button -->
            <button id="save-btn" onclick="saveBusinessInfo()" class="save-button">
                <span class="button-content">
                    <svg class="check-icon" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Save Changes
                </span>
            </button>
        </div>

        <style>
            :root {
                --primary: #f59e0b;
                --primary-dark: #d97706;
                --secondary: #3b82f6;
                --background: #f8fafc;
                --text: #1e293b;
                --text-light: #64748b;
                --border: #cbd5e1;
                --shadow: 0 8px 24px rgba(0,0,0,0.06);
            }

            .business-info-container {
                max-width: 900px;
                margin: 2rem auto;
                padding: 2.5rem;
                background: #ffffff;
                border-radius: 1.5rem;
                box-shadow: var(--shadow);
                font-family: 'Inter', system-ui, sans-serif;
                color: var(--text);
                position: relative;
                animation: slideIn 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                transition: transform 0.3s ease;
            }

            .business-info-container:hover {
                transform: translateY(-2px);
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .edit-toggle-container {
                position: absolute;
                top: 1.5rem;
                right: 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .toggle-switch {
                position: relative;
                display: inline-block;
                width: 48px;
                height: 24px;
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
                background-color: #e2e8f0;
                transition: 0.4s;
                border-radius: 34px;
            }

            .slider:before {
                position: absolute;
                content: "";
                height: 20px;
                width: 20px;
                left: 2px;
                bottom: 2px;
                background-color: white;
                transition: 0.4s;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
                font-weight: 500;
                user-select: none;
            }

            .header-section {
                text-align: center;
                margin-bottom: 2rem;
            }

            .header-input {
                color: var(--text);
                font-size: 2.25rem;
                font-weight: 700;
                border: none;
                text-align: center;
                width: 100%;
                padding: 0.5rem;
                background: transparent;
                transition: all 0.3s ease;
            }

            .header-divider {
                height: 4px;
                width: 140px;
                background: linear-gradient(90deg, var(--primary), var(--primary-dark));
                margin: 0 auto 1.5rem;
                border-radius: 2px;
                animation: dividerExpand 0.8s ease-out;
            }

            @keyframes dividerExpand {
                from { width: 0; opacity: 0; }
                to { width: 140px; opacity: 1; }
            }

            .section-header {
                color: var(--primary-dark);
                font-size: 1.25rem;
                margin-bottom: 1.5rem;
                padding-bottom: 0.75rem;
                border-bottom: 2px solid #f1f5f9;
                position: relative;
                transition: all 0.3s ease;
            }

            .section-header:hover {
                color: var(--primary);
                border-color: var(--primary);
            }

            .columns-container {
                display: flex;
                gap: 2.5rem;
                flex-wrap: wrap;
            }

            .content-column {
                flex: 1;
                min-width: 300px;
            }

            .input-group {
                margin-bottom: 1.5rem;
                display: flex;
                flex-wrap: wrap;
                gap: 0.75rem;
                align-items: center;
            }

            .input-group strong {
                width: 100px;
                color: var(--text-light);
            }

            .editable-field {
                flex: 1;
                min-width: 200px;
                padding: 0.75rem 1.25rem;
                border: 1px solid transparent;
                border-radius: 0.75rem;
                color: var(--text);
                transition: all 0.3s ease;
                font-family: inherit;
                background: transparent;
            }

            .editable-field:disabled {
                cursor: default;
            }

            .editable-field:enabled {
                background: var(--background) !important;
                border-color: var(--border) !important;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
            }

            .editable-field:focus {
                outline: none;
                border-color: var(--primary) !important;
                box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
            }

            .description-textarea {
                width: 100%;
                min-height: 120px;
                resize: vertical;
                line-height: 1.6;
            }

            .owner-profile {
                display: flex;
                align-items: center;
                gap: 1.5rem;
                margin-bottom: 1.5rem;
            }

            .owner-avatar {
                width: 64px;
                height: 64px;
                background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                color: white;
                font-weight: 600;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                transition: transform 0.3s ease;
            }

            .owner-avatar:hover {
                transform: scale(1.05);
            }

            .save-button {
                display: none;
                margin-top: 2rem;
                padding: 1rem 2rem;
                background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                color: white;
                border: none;
                border-radius: 0.75rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
                position: relative;
                overflow: hidden;
            }

            .save-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(245, 158, 11, 0.25);
            }

            .save-button:active {
                transform: translateY(0);
            }

            .button-content {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                position: relative;
                z-index: 1;
            }

            .check-icon {
                width: 20px;
                height: 20px;
                fill: currentColor;
                opacity: 0;
                transform: translateY(-5px);
                transition: all 0.3s ease;
            }

            .saved .check-icon {
                opacity: 1;
                transform: translateY(0);
            }

            @media (max-width: 768px) {
                .business-info-container {
                    padding: 1.5rem;
                    margin: 1rem;
                }
                
                .columns-container {
                    flex-direction: column;
                }
            }
        </style>
    `;

    window.toggleEditMode = toggleEditMode;
    window.saveBusinessInfo = saveBusinessInfo;
}

module.exports = { loadBusinessInfo };