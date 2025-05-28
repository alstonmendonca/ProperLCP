// printerConfiguration.js
const { ipcRenderer } = require('electron');
const { createTextPopup } = require("./textPopup");

function loadPrinterConfiguration(mainContent, billPanel, mode = 'auto') {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    // Create modern tabbed interface
    mainContent.innerHTML = `
        <div class="printer-config-wrapper">
            <div class="printer-header">
                <h2 class="printer-title">Printer Configuration</h2>
                <p class="printer-subtitle">Configure your thermal printer settings for receipts and KOTs</p>
            </div>
            
            <div class="printer-tabs">
                <button class="tab-btn ${mode === 'auto' ? 'active' : ''}" data-mode="auto">
                    <i class="tab-icon fas fa-search"></i>
                    <span>Auto Detect</span>
                </button>
                <button class="tab-btn ${mode === 'manual' ? 'active' : ''}" data-mode="manual">
                    <i class="tab-icon fas fa-cog"></i>
                    <span>Manual Setup</span>
                </button>
            </div>
            
            <div id="autoConfigSection" class="config-section ${mode === 'auto' ? 'active' : ''}">
                <!-- Auto detection content will be loaded here -->
            </div>
            
            <div id="manualConfigSection" class="config-section ${mode === 'manual' ? 'active' : ''}">
                <!-- Manual config content will be loaded here -->
            </div>
        </div>
    `;

    // Tab switching functionality
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.config-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`${mode}ConfigSection`).classList.add('active');
            
            if (mode === 'auto') loadAutoConfig();
            else loadManualConfig();
        });
    });

    // Load initial content
    if (mode === 'auto') loadAutoConfig();
    else loadManualConfig();
}

async function loadAutoConfig() {
    const section = document.getElementById('autoConfigSection');
    
    try {
        const [printers, savedPrinter] = await Promise.all([
            ipcRenderer.invoke('get-available-printers'),
            ipcRenderer.invoke('get-saved-printer')
        ]);

        const printerOptions = printers.map(printer => 
            `<option value="${printer.name}" ${savedPrinter === printer.name ? 'selected' : ''}>
                ${printer.displayName} (${printer.status})
            </option>`
        ).join('');

        const helpSection = printers.length === 0 ? `
            <div class="printer-help">
                <div class="help-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>No printers found</h3>
                </div>
                <p>Make sure your printer is connected and drivers are installed.</p>
                
                <div class="driver-links">
                    <h4>Download Drivers</h4>
                    <div class="driver-grid">
                        <a href="https://www.tvs-e.in/downloads/thermal-printer-drivers" target="_blank" class="driver-card">
                            <i class="fas fa-print"></i>
                            <span>TVS RP3220 STAR</span>
                        </a>
                        <a href="https://epson.com/Support/Printers/Point-of-Sale/TM-series/Epson-TM-T88IV/s/SPT_C31CA85011" target="_blank" class="driver-card">
                            <i class="fas fa-print"></i>
                            <span>Epson TM-T88IV</span>
                        </a>
                        <a href="https://www.pos-x.com/support/downloads" target="_blank" class="driver-card">
                            <i class="fas fa-print"></i>
                            <span>POS-X EVO</span>
                        </a>
                    </div>
                </div>
            </div>
        ` : '';

        section.innerHTML = `
            <div class="printer-config-card">
                <form id="autoPrinterConfigForm">
                    <div class="form-group">
                        <label class="form-label">Select Printer</label>
                        <div class="select-wrapper">
                            <select id="printerSelect" class="form-select">
                                ${printerOptions.length ? printerOptions : '<option disabled selected>No printers available</option>'}
                            </select>
                            <i class="fas fa-chevron-down select-arrow"></i>
                        </div>
                    </div>
                    
                    <div class="button-group">
                        <button type="button" id="testPrinterBtn" class="btn btn-test">
                            <i class="fas fa-paper-plane"></i>
                            Test Printer
                        </button>
                        <span id="printerStatus" class="status-message"></span>
                    </div>
                    
                    <button type="submit" class="btn btn-save">
                        <i class="fas fa-save"></i>
                        Save Configuration
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
            statusElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
            statusElement.className = 'status-message testing';

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
                    statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Printer test successful';
                    statusElement.className = 'status-message success';
                } else {
                    statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Printer test failed';
                    statusElement.className = 'status-message error';
                }
            } catch (error) {
                statusElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error: ${error.message}`;
                statusElement.className = 'status-message error';
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
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                Error loading printer configuration: ${error.message}
            </div>
        `;
    }
}

function loadManualConfig() {
    const section = document.getElementById('manualConfigSection');

    ipcRenderer.invoke('get-printer-config').then(config => {
        const defaultVendorId = config.vendorId ? parseInt(config.vendorId, 16) : 1317;
        const defaultProductId = config.productId ? parseInt(config.productId, 16) : 42752;

        section.innerHTML = `
            <div class="printer-config-card">
                <form id="manualPrinterConfigForm">
                    <div class="form-group">
                        <label class="form-label">Vendor ID (Decimal)</label>
                        <input type="number" id="vendorId" value="${defaultVendorId}" 
                            class="form-input wide-number-input" min="0" max="65535" step="1"
                            title="Enter decimal value between 0 and 65535">
                        <small class="form-hint">Common values: 1317 (0x0525), 1155 (0x0483)</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Product ID (Decimal)</label>
                        <input type="number" id="productId" value="${defaultProductId}" 
                            class="form-input wide-number-input" min="0" max="65535" step="1"
                            title="Enter decimal value between 0 and 65535">
                        <small class="form-hint">Common values: 42752 (0xA700), 22304 (0x5720)</small>
                    </div>
                    
                    <button type="submit" class="btn btn-save">
                        <i class="fas fa-save"></i>
                        Save Configuration
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