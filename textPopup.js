//textPopup.js
// for a popup with only ok button
function createTextPopup(message) {
    // Remove existing popup if it exists
    let existingPopup = document.getElementById("custom-popup");
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create popup container
    const popup = document.createElement("div");
    popup.id = "custom-popup";
    popup.classList.add("edit-popup");

    popup.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;

    popup.innerHTML = `
        <div style="
            background: #ffffff;
            padding: 32px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(13, 59, 102, 0.15);
            width: 400px;
            max-width: 90%;
            text-align: center;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            border: 2px solid #0D3B66;
            position: relative;
            animation: popupSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">
            <style>
                @keyframes popupSlideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.8) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                
                .popup-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(13, 59, 102, 0.3);
                    background: #0D3B66 !important;
                }
                
                .popup-btn:active {
                    transform: translateY(0);
                }
            </style>
            
            <div style="
                width: 64px;
                height: 64px;
                background: #0D3B66;
                border-radius: 50%;
                margin: 0 auto 24px auto;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 8px 24px rgba(13, 59, 102, 0.2);
            ">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="m9 12 2 2 4-4"/>
                </svg>
            </div>
            
            <p style="
                font-size: 18px;
                line-height: 1.5;
                margin-bottom: 28px;
                color: #0D3B66;
                font-weight: 600;
                letter-spacing: -0.01em;
            ">${message}</p>

            <button id="textPopup_closePopup" class="popup-btn" style="
                background: #0D3B66;
                color: white;
                border: none;
                border-radius: 12px;
                padding: 14px 32px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow: 0 4px 16px rgba(13, 59, 102, 0.2);
                font-family: inherit;
                letter-spacing: 0.02em;
            ">OK</button>
        </div>
    `;

    document.body.appendChild(popup);

    // Add event listener for closing popup
    document.getElementById("textPopup_closePopup").addEventListener("click", () => {
        popup.remove();
    });
}
// for ok and cancel buttons
function createConfirmPopup(message, callback) {
    // Remove existing popup if it exists
    let existingPopup = document.getElementById("custom-confirm-popup");
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create popup container
    const popup = document.createElement("div");
    popup.id = "custom-confirm-popup";
    popup.classList.add("confirm-popup");

    popup.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;

    popup.innerHTML = `
        <div style="
            background: #ffffff;
            padding: 32px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(13, 59, 102, 0.15);
            width: 420px;
            max-width: 90%;
            text-align: center;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            border: 2px solid #0D3B66;
            position: relative;
            animation: popupSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">
            <style>
                @keyframes popupSlideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.8) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                
                .confirm-btn:hover {
                    transform: translateY(-2px);
                }
                
                .confirm-btn:active {
                    transform: translateY(0);
                }
                
                .ok-btn:hover {
                    box-shadow: 0 8px 24px rgba(13, 59, 102, 0.3);
                    background: #0D3B66 !important;
                    color: white !important;
                }
                
                .cancel-btn:hover {
                    box-shadow: 0 8px 24px rgba(13, 59, 102, 0.3);
                    background: #0D3B66 !important;
                    color: white !important;
                }
            </style>
            
            <div style="
                width: 64px;
                height: 64px;
                background: white;
                border: 3px solid #0D3B66;
                border-radius: 50%;
                margin: 0 auto 24px auto;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 8px 24px rgba(13, 59, 102, 0.2);
            ">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D3B66" stroke-width="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
            </div>
            
            <p style="
                font-size: 18px;
                line-height: 1.5;
                margin-bottom: 32px;
                color: #0D3B66;
                font-weight: 600;
                letter-spacing: -0.01em;
            ">${message}</p>

            <div style="
                display: flex;
                gap: 16px;
                justify-content: center;
                flex-wrap: wrap;
            ">
                <button id="confirmPopup_okButton" class="confirm-btn ok-btn" style="
                    background: #0D3B66;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 14px 28px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 4px 16px rgba(13, 59, 102, 0.2);
                    font-family: inherit;
                    letter-spacing: 0.02em;
                    min-width: 120px;
                ">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px; vertical-align: middle;">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    OK
                </button>

                <button id="confirmPopup_cancelButton" class="confirm-btn cancel-btn" style="
                    background: white;
                    color: #0D3B66;
                    border: 2px solid #0D3B66;
                    border-radius: 12px;
                    padding: 14px 28px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 4px 16px rgba(13, 59, 102, 0.1);
                    font-family: inherit;
                    letter-spacing: 0.02em;
                    min-width: 120px;
                ">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px; vertical-align: middle;">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Cancel
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Add event listeners for both buttons
    document.getElementById("confirmPopup_okButton").addEventListener("click", () => {
        popup.remove(); // Close the popup
        callback(true); // Call the callback with 'true' (OK clicked)
    });

    document.getElementById("confirmPopup_cancelButton").addEventListener("click", () => {
        popup.remove(); // Close the popup
        callback(false); // Call the callback with 'false' (Cancel clicked)
    });
}


module.exports = { createTextPopup, createConfirmPopup};
