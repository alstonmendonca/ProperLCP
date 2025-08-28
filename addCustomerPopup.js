const { ipcRenderer } = require("electron");
const { createTextPopup } = require("./textPopup");

// Function to show the Add Customer popup
function showAddCustomerPopup() {

    // Check if popup already exists
    if (document.getElementById("addNewCustomerModal")) {
        return; // Prevent duplicate popups
    }

    // Create the popup container
    const popup = document.createElement("div");
    popup.id = "addNewCustomerModal";
    popup.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            #addNewCustomerModal {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(13, 59, 102, 0.15) !important;
                backdrop-filter: blur(12px) !important;
                z-index: 10000 !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                animation: overlayFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                font-family: 'Inter', sans-serif !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
            }
            
            @keyframes overlayFadeIn {
                from { 
                    opacity: 0; 
                    backdrop-filter: blur(0px); 
                }
                to { 
                    opacity: 1; 
                    backdrop-filter: blur(12px); 
                }
            }
            
            .add-new-customer-modal-content {
                background: white !important;
                border-radius: 20px !important;
                padding: 2.5rem !important;
                width: 90% !important;
                max-width: 500px !important;
                position: relative !important;
                box-shadow: 
                    0 25px 50px rgba(13, 59, 102, 0.25),
                    0 10px 25px rgba(13, 59, 102, 0.15),
                    0 0 0 1px rgba(13, 59, 102, 0.1) !important;
                animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
                overflow: hidden !important;
                margin: 0 !important;
                box-sizing: border-box !important;
            }
            
            .add-new-customer-modal-content::before {
                content: '' !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                height: 6px !important;
                background: linear-gradient(90deg, #0D3B66, rgba(13, 59, 102, 0.8), #0D3B66) !important;
                animation: shimmer 3s infinite !important;
            }
            
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            @keyframes modalSlideIn {
                0% { 
                    opacity: 0; 
                    transform: translateY(-30px) scale(0.9); 
                }
                100% { 
                    opacity: 1; 
                    transform: translateY(0) scale(1); 
                }
            }
            
            .add-new-customer-modal-content h2 {
                margin: 0 0 2rem 0 !important;
                color: #0D3B66 !important;
                font-size: 1.75rem !important;
                font-weight: 700 !important;
                text-align: center !important;
                position: relative !important;
                padding-bottom: 1rem !important;
            }
            
            .add-new-customer-modal-content h2::after {
                content: '' !important;
                position: absolute !important;
                bottom: 0 !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                width: 60px !important;
                height: 3px !important;
                background: linear-gradient(90deg, transparent, #0D3B66, transparent) !important;
                border-radius: 2px !important;
            }
            
            .add-new-customer-modal-content label {
                display: block !important;
                margin-bottom: 0.5rem !important;
                color: #0D3B66 !important;
                font-weight: 600 !important;
                font-size: 0.9rem !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
            }
            
            .add-new-customer-modal-content input {
                width: 100% !important;
                padding: 1rem 1.25rem !important;
                margin-bottom: 1.5rem !important;
                border: 2px solid rgba(13, 59, 102, 0.15) !important;
                border-radius: 12px !important;
                font-size: 1rem !important;
                font-family: 'Inter', sans-serif !important;
                color: #0D3B66 !important;
                background: white !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                box-sizing: border-box !important;
            }
            
            .add-new-customer-modal-content input:focus {
                outline: none !important;
                border-color: #0D3B66 !important;
                box-shadow: 
                    0 0 0 4px rgba(13, 59, 102, 0.1),
                    0 4px 12px rgba(13, 59, 102, 0.15) !important;
                transform: translateY(-2px) !important;
            }
            
            .add-new-customer-modal-content input:hover {
                border-color: rgba(13, 59, 102, 0.3) !important;
            }
            
            .add-new-customer-modal-content input::placeholder {
                color: rgba(13, 59, 102, 0.5) !important;
            }
            
            .add-new-customer-modal-buttons {
                display: flex !important;
                gap: 1rem !important;
                margin-top: 2rem !important;
                justify-content: center !important;
            }
            
            .add-new-customer-modal-buttons button {
                flex: 1 !important;
                padding: 1rem 2rem !important;
                border: none !important;
                border-radius: 12px !important;
                font-size: 1rem !important;
                font-weight: 600 !important;
                font-family: 'Inter', sans-serif !important;
                cursor: pointer !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                position: relative !important;
                overflow: hidden !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
            }
            
            #confirmAddNewCustomer {
                background: linear-gradient(135deg, #0D3B66 0%, rgba(13, 59, 102, 0.9) 100%) !important;
                color: white !important;
                box-shadow: 0 8px 20px rgba(13, 59, 102, 0.3) !important;
            }
            
            #confirmAddNewCustomer::before {
                content: '' !important;
                position: absolute !important;
                top: 0 !important;
                left: -100% !important;
                width: 100% !important;
                height: 100% !important;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent) !important;
                transition: left 0.5s !important;
            }
            
            #confirmAddNewCustomer:hover::before {
                left: 100% !important;
            }
            
            #confirmAddNewCustomer:hover {
                transform: translateY(-3px) !important;
                box-shadow: 0 12px 28px rgba(13, 59, 102, 0.4) !important;
            }
            
            #confirmAddNewCustomer:active {
                transform: translateY(-1px) !important;
            }
            
            #cancelAddNewCustomer {
                background: white !important;
                color: #0D3B66 !important;
                border: 2px solid #0D3B66 !important;
                box-shadow: 0 4px 12px rgba(13, 59, 102, 0.15) !important;
            }
            
            #cancelAddNewCustomer:hover {
                background: #0D3B66 !important;
                color: white !important;
                transform: translateY(-3px) !important;
                box-shadow: 0 12px 28px rgba(13, 59, 102, 0.3) !important;
            }
            
            #cancelAddNewCustomer:active {
                transform: translateY(-1px) !important;
            }
            
            /* Input focus effects */
            .add-new-customer-modal-content input:focus + label,
            .add-new-customer-modal-content input:not(:placeholder-shown) + label {
                color: #0D3B66 !important;
                transform: translateY(-2px) !important;
            }
            
            /* Responsive design */
            @media (max-width: 600px) {
                .add-new-customer-modal-content {
                    margin: 1rem !important;
                    padding: 2rem !important;
                }
                
                .add-new-customer-modal-buttons {
                    flex-direction: column !important;
                }
                
                .add-new-customer-modal-buttons button {
                    width: 100% !important;
                }
            }
            
            /* Loading state for buttons */
            .add-new-customer-modal-buttons button:disabled {
                opacity: 0.7 !important;
                cursor: not-allowed !important;
                transform: none !important;
            }
            
            .add-new-customer-modal-buttons button:disabled:hover {
                transform: none !important;
                box-shadow: initial !important;
            }
        </style>
        <div class="add-new-customer-modal-content">
            <h2>Add New Customer</h2>
            <label>Name:</label>
            <input type="text" id="newCustomerName" placeholder="Enter customer name" required>
            <label>Phone:</label>
            <input type="text" id="newCustomerPhone" placeholder="Enter phone number" required>
            <label>Address:</label>
            <input type="text" id="newCustomerAddress" placeholder="Enter address (optional)">
            <div class="add-new-customer-modal-buttons">
                <button id="confirmAddNewCustomer">Add Customer</button>
                <button id="cancelAddNewCustomer">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    function handleConfirmClick() {
        const cname = document.getElementById("newCustomerName").value.trim();
        const phone = document.getElementById("newCustomerPhone").value.trim();
        const address = document.getElementById("newCustomerAddress").value.trim();

        if (!cname || !phone) {
            createTextPopup("Name and phone number are required!");
            return;
        }

        // Send data to main process
        ipcRenderer.send("add-customer", { cname, phone, address });

        // Wait for response before closing popup
        ipcRenderer.once("customer-added-response", (event, response) => {
            if (response.success) {
                closeAddCustomerPopup(); // Close only if addition is successful
                setTimeout(() => {
                    ipcRenderer.send("get-customers"); // Refresh customer list
                }, 100);
            } else {
                createTextPopup("Failed to add customer: " + response.error);
            }
        });
    }

    function closeAddCustomerPopup() {
        const popup = document.getElementById("addNewCustomerModal");
        if (popup) {
            document.getElementById("confirmAddNewCustomer").removeEventListener("click", handleConfirmClick);
            document.getElementById("cancelAddNewCustomer").removeEventListener("click", closeAddCustomerPopup);
            popup.remove();
        }
    }

    document.getElementById("confirmAddNewCustomer").addEventListener("click", handleConfirmClick);
    document.getElementById("cancelAddNewCustomer").addEventListener("click", closeAddCustomerPopup);
}

// Export function so it can be used in ui.js
module.exports = { showAddCustomerPopup };
