// printerConfiguration.js
const { ipcRenderer } = require('electron');
const { createTextPopup } = require("./textPopup");

function loadPrinterConfiguration(mainContent, billPanel, mode = 'auto') {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    // Create tabbed interface
    mainContent.innerHTML = `
        <div class='section-title'>
            <h2>Thermal Printer Configuration</h2>
        </div>
        
        <div class="printer-tabs" style="margin-bottom: 20px;">
            <button class="tab-btn ${mode === 'auto' ? 'active' : ''}" data-mode="auto">Automatic Detection</button>
            <button class="tab-btn ${mode === 'manual' ? 'active' : ''}" data-mode="manual">Manual Configuration</button>
        </div>
        
        <div id="autoConfigSection" style="display: ${mode === 'auto' ? 'block' : 'none'};">
            <!-- Auto detection content will be loaded here -->
        </div>
        
        <div id="manualConfigSection" style="display: ${mode === 'manual' ? 'block' : 'none'};">
            <!-- Manual config content will be loaded here -->
        </div>
    `;

    // Add tab switching functionality
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.getElementById('autoConfigSection').style.display = mode === 'auto' ? 'block' : 'none';
            document.getElementById('manualConfigSection').style.display = mode === 'manual' ? 'block' : 'none';
            
            // Reload content when switching tabs
            if (mode === 'auto') loadAutoConfig();
            else loadManualConfig();
        });
    });

    // Load initial content based on mode
    if (mode === 'auto') loadAutoConfig();
    else loadManualConfig();
}

async function loadAutoConfig() {
    const section = document.getElementById('autoConfigSection');
    
    try {
        // Get available printers and saved printer config
        const [printers, savedPrinter] = await Promise.all([
            ipcRenderer.invoke('get-available-printers'),
            ipcRenderer.invoke('get-saved-printer')
        ]);

        // Create printer dropdown options
        const printerOptions = printers.map(printer => 
            `<option value="${printer.name}" ${savedPrinter === printer.name ? 'selected' : ''}>
                ${printer.displayName} (${printer.status})
            </option>`
        ).join('');

        // Create help links for common printers
        const helpSection = printers.length === 0 ? `
            <div class="printer-help" style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 4px;">
                <h3 style="color: #856404;">⚠️ No printers found</h3>
                <p>Make sure your printer is connected and drivers are installed.</p>
                
                <h4>Need help? Download drivers:</h4>
                <ul style="list-style-type: none; padding-left: 0;">
                    <li>• TVS RP3220 STAR – <a href="https://www.tvs-e.in/downloads/thermal-printer-drivers" target="_blank">Download</a></li>
                    <li>• Epson TM-T88IV – <a href="https://epson.com/Support/Printers/Point-of-Sale/TM-series/Epson-TM-T88IV/s/SPT_C31CA85011" target="_blank">Download</a></li>
                    <li>• POS-X EVO – <a href="https://www.pos-x.com/support/downloads" target="_blank">Download</a></li>
                </ul>
            </div>
        ` : '';

        section.innerHTML = `
            <div class="printer-config-container" style="margin-top: 20px;">
                <form id="autoPrinterConfigForm">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                            Select Thermal Printer:
                        </label>
                        <select id="printerSelect" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            ${printerOptions.length ? printerOptions : '<option disabled selected>No printers available</option>'}
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <button type="button" id="testPrinterBtn" style="
                            background-color: #17a2b8;
                            color: white;
                            border: none;
                            padding: 8px 15px;
                            border-radius: 4px;
                            cursor: pointer;
                            margin-right: 10px;
                        ">
                            Test Printer
                        </button>
                        <span id="printerStatus" style="font-weight: bold;"></span>
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
                
                ${helpSection}
            </div>
        `;

        // Test printer button
        document.getElementById('testPrinterBtn').addEventListener('click', async () => {
            const printerName = document.getElementById('printerSelect').value;
            if (!printerName) {
                createTextPopup('Please select a printer first');
                return;
            }

            const statusElement = document.getElementById('printerStatus');
            statusElement.textContent = 'Testing...';
            statusElement.style.color = '#17a2b8';

            try {
                const success = await ipcRenderer.invoke('test-printer', {
                    printerName,
                    testData: {
                        items: [
                            { name: "Test Item 1", quantity: 1, price: 10.00 },
                            { name: "Test Item 2", quantity: 2, price: 20.00 }
                        ],
                        totalAmount: 30.00,
                        kot: "TEST123",
                        orderId: "TEST456"
                    }
                });
                
                if (success) {
                    statusElement.textContent = '✓ Printer test successful';
                    statusElement.style.color = '#28a745';
                } else {
                    statusElement.textContent = '✗ Printer test failed';
                    statusElement.style.color = '#dc3545';
                }
            } catch (error) {
                statusElement.textContent = `Error: ${error.message}`;
                statusElement.style.color = '#dc3545';
            }
        });

        // Save printer config
        document.getElementById('autoPrinterConfigForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const printerName = document.getElementById('printerSelect').value;
            
            if (!printerName) {
                createTextPopup('Please select a printer');
                return;
            }

            try {
                await ipcRenderer.invoke('save-printer-configuration', printerName);
                createTextPopup('Printer configuration saved successfully!');
            } catch (error) {
                createTextPopup(`Error saving config: ${error.message}`);
            }
        });

    } catch (error) {
        section.innerHTML = `
            <div style="color: #dc3545; margin-top: 20px;">
                Error loading printer configuration: ${error.message}
            </div>
        `;
    }
}

function loadManualConfig() {
    const section = document.getElementById('manualConfigSection');

    // Get printer config via IPC
    ipcRenderer.invoke('get-printer-config').then(config => {
        // Convert hex values to decimal for display
        const defaultVendorId = config.vendorId ? parseInt(config.vendorId, 16) : 1317;
        const defaultProductId = config.productId ? parseInt(config.productId, 16) : 42752;

        section.innerHTML = `
            <div style="margin-top: 20px;">
                <form id="manualPrinterConfigForm">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 10px; font-weight: bold; text-align: center;">
                            Vendor ID (Decimal):
                        </label>
                        <input type="number" id="vendorId" value="${defaultVendorId}" 
                            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                            min="0" max="65535" step="1"
                            title="Enter decimal value between 0 and 65535">
                        <small style="color: #666;">Common values: 1317 (0x0525), 1155 (0x0483)</small>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 10px; font-weight: bold; text-align: center;">
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
        document.getElementById('manualPrinterConfigForm').addEventListener('submit', (e) => {
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

module.exports = { loadPrinterConfiguration };