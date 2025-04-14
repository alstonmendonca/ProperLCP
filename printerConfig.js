// printerConfig.js
const { ipcRenderer } = require('electron');
const { createTextPopup } = require("./textPopup");

function loadPrinterConfig(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    // Get printer config via IPC
    ipcRenderer.invoke('get-printer-config').then(config => {
        // Convert hex values to decimal for display
        const defaultVendorId = config.vendorId ? parseInt(config.vendorId, 16) : 1317;
        const defaultProductId = config.productId ? parseInt(config.productId, 16) : 42752;

        mainContent.innerHTML = `
            <div class='section-title'>
                <h2>Thermal Printer Configuration</h2>
            </div>
            <div style="margin-top: 20px;">
                <form id="printerConfigForm">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                            Vendor ID (Decimal):
                        </label>
                        <input type="number" id="vendorId" value="${defaultVendorId}" 
                            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                            min="0" max="65535" step="1"
                            title="Enter decimal value between 0 and 65535">
                        <small style="color: #666;">Common values: 1317 (0x0525), 1155 (0x0483)</small>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                            Product ID (Decimal):
                        </label>
                        <input type="number" id="productId" value="${defaultProductId}" 
                            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                            min="0" max="65535" step="1"
                            title="Enter decimal value between 0 and 65535">
                        <small style="color: #666;">Common values: 42752 (0xA700), 22304 (0x5720)</small>
                    </div>
                    <button type="submit" style="
                        background-color: #1DB954;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                    ">
                        Save Printer Configuration
                    </button>
                </form>
            </div>
        `;

        // Handle form submission
        document.getElementById('printerConfigForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const vendorId = document.getElementById('vendorId').value;
            const productId = document.getElementById('productId').value;
            
            // Validate inputs
            if (!vendorId || !productId) {
                createTextPopup('Both Vendor ID and Product ID are required');
                return;
            }

            const vendorNum = parseInt(vendorId);
            const productNum = parseInt(productId);
            
            if (isNaN(vendorNum)) {
                createTextPopup('Please enter a valid number for Vendor ID');
                return;
            }
            
            if (isNaN(productNum)) {
                createTextPopup('Please enter a valid number for Product ID');
                return;
            }

            if (vendorNum < 0 || vendorNum > 65535) {
                createTextPopup('Vendor ID must be between 0 and 65535');
                return;
            }
            
            if (productNum < 0 || productNum > 65535) {
                createTextPopup('Product ID must be between 0 and 65535');
                return;
            }

            // Convert to hex strings for storage
            const vendorHex = '0x' + vendorNum.toString(16).padStart(4, '0');
            const productHex = '0x' + productNum.toString(16).padStart(4, '0');

            // Save via IPC
            ipcRenderer.invoke('save-printer-config', { 
                vendorId: vendorHex, 
                productId: productHex 
            })
            .then(() => createTextPopup('Printer configuration saved successfully!'))
            .catch(err => createTextPopup(`Error saving config: ${err.message}`));
        });
    });
}

module.exports = { loadPrinterConfig };