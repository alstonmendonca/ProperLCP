const { ipcRenderer } = require("electron");
const  {createTextPopup} = require("./textPopup");

function showEditCustomerPopup(customer) {
    // Prevent duplicate popups
    if (document.getElementById("editCustomerPopup")) {
        return;
    }

    const popup = document.createElement("div");
    popup.id = "editCustomerPopup";
    popup.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            #editCustomerPopup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(13, 59, 102, 0.15);
                backdrop-filter: blur(12px);
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
                animation: overlayFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: 'Inter', sans-serif;
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
            
            .edit-customer-popup-content {
                background: white;
                border-radius: 20px;
                padding: 2.5rem;
                width: 90%;
                max-width: 500px;
                position: relative;
                box-shadow: 
                    0 25px 50px rgba(13, 59, 102, 0.25),
                    0 10px 25px rgba(13, 59, 102, 0.15),
                    0 0 0 1px rgba(13, 59, 102, 0.1);
                animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                overflow: hidden;
            }
            
            .edit-customer-popup-content::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 6px;
                background: linear-gradient(90deg, #0D3B66, rgba(13, 59, 102, 0.8), #0D3B66);
                animation: shimmer 3s infinite;
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
            
            .edit-customer-popup-content h2 {
                margin: 0 0 2rem 0;
                color: #0D3B66;
                font-size: 1.75rem;
                font-weight: 700;
                text-align: center;
                position: relative;
                padding-bottom: 1rem;
            }
            
            .edit-customer-popup-content h2::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 60px;
                height: 3px;
                background: linear-gradient(90deg, transparent, #0D3B66, transparent);
                border-radius: 2px;
            }
            
            .edit-customer-popup-content label {
                display: block;
                margin-bottom: 0.5rem;
                color: #0D3B66;
                font-weight: 600;
                font-size: 0.9rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .edit-customer-popup-content input {
                width: 100%;
                padding: 1rem 1.25rem;
                margin-bottom: 1.5rem;
                border: 2px solid rgba(13, 59, 102, 0.15);
                border-radius: 12px;
                font-size: 1rem;
                font-family: 'Inter', sans-serif;
                color: #0D3B66;
                background: white;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-sizing: border-box;
            }
            
            .edit-customer-popup-content input:focus {
                outline: none;
                border-color: #0D3B66;
                box-shadow: 
                    0 0 0 4px rgba(13, 59, 102, 0.1),
                    0 4px 12px rgba(13, 59, 102, 0.15);
                transform: translateY(-2px);
            }
            
            .edit-customer-popup-content input:hover {
                border-color: rgba(13, 59, 102, 0.3);
            }
            
            .edit-customer-popup-content input::placeholder {
                color: rgba(13, 59, 102, 0.5);
            }
            
            .edit-customer-popup-buttons {
                display: flex;
                gap: 1rem;
                margin-top: 2rem;
                justify-content: center;
            }
            
            .edit-customer-popup-buttons button {
                flex: 1;
                padding: 1rem 2rem;
                border: none;
                border-radius: 12px;
                font-size: 1rem;
                font-weight: 600;
                font-family: 'Inter', sans-serif;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            #confirmEditCustomer {
                background: linear-gradient(135deg, #0D3B66 0%, rgba(13, 59, 102, 0.9) 100%);
                color: white;
                box-shadow: 0 8px 20px rgba(13, 59, 102, 0.3);
            }
            
            #confirmEditCustomer::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: left 0.5s;
            }
            
            #confirmEditCustomer:hover::before {
                left: 100%;
            }
            
            #confirmEditCustomer:hover {
                transform: translateY(-3px);
                box-shadow: 0 12px 28px rgba(13, 59, 102, 0.4);
            }
            
            #confirmEditCustomer:active {
                transform: translateY(-1px);
            }
            
            #cancelEditCustomer {
                background: white;
                color: #0D3B66;
                border: 2px solid #0D3B66;
                box-shadow: 0 4px 12px rgba(13, 59, 102, 0.15);
            }
            
            #cancelEditCustomer:hover {
                background: #0D3B66;
                color: white;
                transform: translateY(-3px);
                box-shadow: 0 12px 28px rgba(13, 59, 102, 0.3);
            }
            
            #cancelEditCustomer:active {
                transform: translateY(-1px);
            }
            
            /* Input focus effects */
            .edit-customer-popup-content input:focus + label,
            .edit-customer-popup-content input:not(:placeholder-shown) + label {
                color: #0D3B66;
                transform: translateY(-2px);
            }
            
            /* Responsive design */
            @media (max-width: 600px) {
                .edit-customer-popup-content {
                    margin: 1rem;
                    padding: 2rem;
                }
                
                .edit-customer-popup-buttons {
                    flex-direction: column;
                }
                
                .edit-customer-popup-buttons button {
                    width: 100%;
                }
            }
            
            /* Loading state for buttons */
            .edit-customer-popup-buttons button:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
            }
            
            .edit-customer-popup-buttons button:disabled:hover {
                transform: none;
                box-shadow: initial;
            }
        </style>
        <div class="edit-customer-popup-content">
            <h2>Edit Customer</h2>
            <label>Name:</label>
            <input type="text" id="editCustomerName" value="${customer.cname}" placeholder="Enter customer name">
            <label>Phone:</label>
            <input type="text" id="editCustomerPhone" value="${customer.phone}" placeholder="Enter phone number">
            <label>Address:</label>
            <input type="text" id="editCustomerAddress" value="${customer.address || ''}" placeholder="Enter address (optional)">
            <div class="edit-customer-popup-buttons">
                <button id="confirmEditCustomer">Save</button>
                <button id="cancelEditCustomer">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    function handleConfirmClick() {
        const updatedCustomer = {
            cid: customer.cid,
            cname: document.getElementById("editCustomerName").value.trim(),
            phone: document.getElementById("editCustomerPhone").value.trim(),
            address: document.getElementById("editCustomerAddress").value.trim()
        };

        ipcRenderer.send("update-customer", updatedCustomer);

        ipcRenderer.once("update-customer-response", (event, response) => {
            if (response.success) {
                closeEditCustomerPopup(); // Now only close when the update is successful
                setTimeout(() => {
                    ipcRenderer.send("get-customers");
                }, 100); // Small delay ensures proper UI update
            } else {
                createTextPopup("Failed to update customer: " + response.error);
            }
        });
    }

    document.getElementById("confirmEditCustomer").addEventListener("click", handleConfirmClick);
    document.getElementById("cancelEditCustomer").addEventListener("click", closeEditCustomerPopup);

    function closeEditCustomerPopup() {
        const popup = document.getElementById("editCustomerPopup");
        if (popup) {
            document.getElementById("confirmEditCustomer").removeEventListener("click", handleConfirmClick);
            document.getElementById("cancelEditCustomer").removeEventListener("click", closeEditCustomerPopup);
            popup.remove();
        }
    }
}

// Remove duplicate event listener
ipcRenderer.on("edit-customer-data", (event, customer) => {
    if (!customer) {
        createTextPopup("Customer not found.");
        return;
    }
    showEditCustomerPopup(customer);
});

module.exports = { showEditCustomerPopup };
