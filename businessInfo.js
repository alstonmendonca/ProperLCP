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
        <div class="business-info-container" style="
            max-width: 900px;
            margin: 2rem auto;
            padding: 2.5rem;
            background: #ffffff;
            border-radius: 1rem;
            box-shadow: 0 8px 24px rgba(0,0,0,0.06);
            font-family: 'Inter', system-ui, sans-serif;
            color: #334155;
            position: relative;
        ">
            <!-- Edit Toggle -->
            <div style="position: absolute; top: 1.5rem; right: 1.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                    <input type="checkbox" id="edit-toggle" style="cursor: pointer; width: 1.1rem; height: 1.1rem;" onchange="toggleEditMode()">
                    <span style="font-size: 0.9rem; color: #64748b; font-weight: 500;">Edit Mode</span>
                </label>
            </div>
            
            <!-- Header Section -->
            <div style="text-align: center; margin-bottom: 2rem;">
                <input id="business-name" class="editable-field" value="${businessData.name}" disabled style="
                    color: #1e293b;
                    font-size: 2.25rem;
                    margin-bottom: 0.75rem;
                    font-weight: 700;
                    border: none;
                    text-align: center;
                    width: 100%;
                    padding: 0.5rem;
                    background: transparent;
                    font-family: inherit;
                    letter-spacing: -0.025em;
                ">
                <div style="
                    height: 4px;
                    width: 140px;
                    background: linear-gradient(90deg, #f59e0b, #d97706);
                    margin: 0 auto 1.5rem;
                    border-radius: 2px;
                "></div>
                <input id="business-tagline" class="editable-field" value="${businessData.tagline}" disabled style="
                    font-size: 1.05rem;
                    color: #64748b;
                    margin-bottom: 0.5rem;
                    border: none;
                    text-align: center;
                    width: 100%;
                    padding: 0.5rem;
                    background: transparent;
                    font-family: inherit;
                ">
            </div>

            <!-- Two Column Layout -->
            <div style="display: flex; gap: 2.5rem; flex-wrap: wrap;">
                <!-- Left Column -->
                <div style="flex: 1; min-width: 300px;">
                    <h2 style="
                        color: #d97706;
                        font-size: 1.25rem;
                        margin-bottom: 1rem;
                        border-bottom: 2px solid #f1f5f9;
                        padding-bottom: 0.5rem;
                        font-weight: 600;
                        letter-spacing: -0.01em;
                    ">About Us</h2>
                    <textarea id="business-description" class="editable-field" disabled style="
                        line-height: 1.6;
                        margin-bottom: 1.5rem;
                        width: 100%;
                        min-height: 120px;
                        padding: 0.75rem;
                        border: 1px solid transparent;
                        border-radius: 0.75rem;
                        resize: vertical;
                        font-family: inherit;
                        background: transparent;
                        color: #475569;
                    ">${businessData.description}</textarea>
                    
                    <h2 style="
                        color: #d97706;
                        font-size: 1.25rem;
                        margin-bottom: 1rem;
                        border-bottom: 2px solid #f1f5f9;
                        padding-bottom: 0.5rem;
                        font-weight: 600;
                        letter-spacing: -0.01em;
                    ">Contact</h2>
                    <div style="margin-bottom: 1rem; display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
                        <strong style="display: inline-block; width: 100px; color: #475569;">Address:</strong>
                        <input id="business-address" class="editable-field" value="${businessData.address}" disabled style="
                            flex: 1;
                            min-width: 200px;
                            padding: 0.65rem 1rem;
                            border: 1px solid transparent;
                            border-radius: 0.5rem;
                            color: #475569;
                        ">
                    </div>
                    <div style="margin-bottom: 1rem; display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
                        <strong style="display: inline-block; width: 100px; color: #475569;">Phone:</strong>
                        <input id="business-phone" class="editable-field" value="${businessData.phone}" disabled style="
                            flex: 1;
                            min-width: 200px;
                            padding: 0.65rem 1rem;
                            border: 1px solid transparent;
                            border-radius: 0.5rem;
                            color: #475569;
                        ">
                    </div>
                    <div style="margin-bottom: 1rem; display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
                        <strong style="display: inline-block; width: 100px; color: #475569;">Email:</strong>
                        <input id="business-email" class="editable-field" value="${businessData.email}" disabled style="
                            flex: 1;
                            min-width: 200px;
                            padding: 0.65rem 1rem;
                            border: 1px solid transparent;
                            border-radius: 0.5rem;
                            color: #475569;
                        ">
                    </div>
                </div>

                <!-- Right Column -->
                <div style="flex: 1; min-width: 300px;">
                    <h2 style="
                        color: #d97706;
                        font-size: 1.25rem;
                        margin-bottom: 1rem;
                        border-bottom: 2px solid #f1f5f9;
                        padding-bottom: 0.5rem;
                        font-weight: 600;
                        letter-spacing: -0.01em;
                    ">Business Hours</h2>
                    <div style="margin-bottom: 1rem; display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
                        <strong style="display: inline-block; width: 120px; color: #475569;">Mon-Fri:</strong>
                        <input id="business-hours-weekdays" class="editable-field" value="${businessData.hours.weekdays}" disabled style="
                            flex: 1;
                            min-width: 200px;
                            padding: 0.65rem 1rem;
                            border: 1px solid transparent;
                            border-radius: 0.5rem;
                            color: #475569;
                        ">
                    </div>
                    <div style="margin-bottom: 1rem; display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
                        <strong style="display: inline-block; width: 120px; color: #475569;">Saturday:</strong>
                        <input id="business-hours-saturday" class="editable-field" value="${businessData.hours.saturday}" disabled style="
                            flex: 1;
                            min-width: 200px;
                            padding: 0.65rem 1rem;
                            border: 1px solid transparent;
                            border-radius: 0.5rem;
                            color: #475569;
                        ">
                    </div>
                    <div style="margin-bottom: 1rem; display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
                        <strong style="display: inline-block; width: 120px; color: #475569;">Sunday:</strong>
                        <input id="business-hours-sunday" class="editable-field" value="${businessData.hours.sunday}" disabled style="
                            flex: 1;
                            min-width: 200px;
                            padding: 0.65rem 1rem;
                            border: 1px solid transparent;
                            border-radius: 0.5rem;
                            color: #475569;
                        ">
                    </div>

                    <h2 style="
                        color: #d97706;
                        font-size: 1.25rem;
                        margin-bottom: 1rem;
                        margin-top: 2rem;
                        border-bottom: 2px solid #f1f5f9;
                        padding-bottom: 0.5rem;
                        font-weight: 600;
                        letter-spacing: -0.01em;
                    ">Owner</h2>
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                        <div style="
                            width: 64px;
                            height: 64px;
                            background: linear-gradient(135deg, #f59e0b, #d97706);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.5rem;
                            color: white;
                            font-weight: 600;
                            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                        ">${businessData.owner.initials}</div>
                        <div style="flex: 1;">
                            <input id="owner-name" class="editable-field" value="${businessData.owner.name}" disabled style="
                                font-weight: 600; 
                                font-size: 1.1rem;
                                border: none;
                                padding: 0.25rem;
                                width: 100%;
                                background: transparent;
                                color: #1e293b;
                            ">
                            <input id="owner-position" class="editable-field" value="${businessData.owner.position}" disabled style="
                                color: #64748b; 
                                font-size: 0.9rem;
                                border: none;
                                padding: 0.25rem;
                                width: 100%;
                                background: transparent;
                            ">
                        </div>
                    </div>
                    <div style="margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
                        <strong style="display: inline-block; width: 120px; color: #475569;">Initials:</strong>
                        <input id="owner-initials" class="editable-field" value="${businessData.owner.initials}" disabled style="
                            flex: 1;
                            min-width: 60px;
                            max-width: 80px;
                            padding: 0.65rem 1rem;
                            border: 1px solid transparent;
                            border-radius: 0.5rem;
                            text-align: center;
                            font-weight: 600;
                            color: #1e293b;
                        ">
                    </div>
                </div>
            </div>
            
            <!-- Save Button -->
            <button id="save-btn" onclick="saveBusinessInfo()" style="
                display: none;
                margin-top: 2rem;
                padding: 0.875rem 2rem;
                background-color: #e67e22;
                color: white;
                border: none;
                border-radius: 0.75rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                width: 100%;
                font-size: 1rem;
                letter-spacing: 0.01em;
            ">
                Save Changes
            </button>
        </div>
        
        <style>
            .editable-field {
                transition: all 0.2s ease;
            }
            .editable-field:disabled {
                cursor: default;
                color: inherit;
            }
            .editable-field:enabled {
                background: #f8fafc !important;
                border: 1px solid #cbd5e1 !important;
                box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
            }
            .editable-field:focus {
                outline: none;
                border-color: #f59e0b !important;
                box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
            }
            #save-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(230, 126, 34, 0.25);
            }
            #save-btn:active {
                transform: translateY(0);
                box-shadow: none;
            }
        </style>
    `;

    window.toggleEditMode = toggleEditMode;
    window.saveBusinessInfo = saveBusinessInfo;
}

module.exports = { loadBusinessInfo };