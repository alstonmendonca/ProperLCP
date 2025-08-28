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
                    <svg class="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="M21 21l-4.35-4.35"></path>
                    </svg>
                    <span>Auto Detect</span>
                </button>
                <button class="tab-btn ${mode === 'manual' ? 'active' : ''}" data-mode="manual">
                    <svg class="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <h3>No printers found</h3>
                </div>
                <p>Make sure your printer is connected and drivers are installed.</p>
                
                <div class="driver-links">
                    <h4>Download Drivers</h4>
                    <div class="driver-grid">
                        <a href="https://www.tvs-e.in/downloads/thermal-printer-drivers" target="_blank" class="driver-card">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                <rect x="6" y="14" width="12" height="8"></rect>
                            </svg>
                            <span>TVS RP3220 STAR</span>
                        </a>
                        <a href="https://epson.com/Support/Printers/Point-of-Sale/TM-series/Epson-TM-T88IV/s/SPT_C31CA85011" target="_blank" class="driver-card">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                <rect x="6" y="14" width="12" height="8"></rect>
                            </svg>
                            <span>Epson TM-T88IV</span>
                        </a>
                        <a href="https://www.pos-x.com/support/downloads" target="_blank" class="driver-card">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                <rect x="6" y="14" width="12" height="8"></rect>
                            </svg>
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
                            <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>
                    
                    <div class="button-group">
                        <button type="button" id="testPrinterBtn" class="btn btn-test">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            Test Printer
                        </button>
                        <span id="printerStatus" class="status-message"></span>
                    </div>
                    
                    <button type="submit" class="btn btn-save">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
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
            statusElement.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"></path></svg> Testing...';
            statusElement.className = 'status-message testing';

            try {
                // Test printer connection first
                await ipcRenderer.invoke('test-printer-connection');
                
                // If connection successful, send test print
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
                    statusElement.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Printer test successful';
                    statusElement.className = 'status-message success';
                } else {
                    statusElement.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Printer test failed';
                    statusElement.className = 'status-message error';
                }
            } catch (error) {
                statusElement.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Error: ${error.message}`;
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
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
                    
                    <div class="button-group">
                        <button type="button" id="testManualPrinterBtn" class="btn btn-test">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            Test Printer
                        </button>
                        <span id="manualPrinterStatus" class="status-message"></span>
                    </div>
                    
                    <button type="submit" class="btn btn-save">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        Save Configuration
                    </button>
                </form>
            </div>
        `;

        // Test printer button for manual config
        document.getElementById('testManualPrinterBtn').addEventListener('click', async () => {
            const vendorId = document.getElementById('vendorId').value;
            const productId = document.getElementById('productId').value;
            
            if (!vendorId || !productId) {
                createTextPopup('Please enter both Vendor ID and Product ID');
                return;
            }

            const vendorNum = parseInt(vendorId);
            const productNum = parseInt(productId);
            
            if (isNaN(vendorNum) || isNaN(productNum)) {
                createTextPopup('Please enter valid numbers for Vendor and Product IDs');
                return;
            }

            const statusElement = document.getElementById('manualPrinterStatus');
            statusElement.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"></path></svg> Testing...';
            statusElement.className = 'status-message testing';

            try {
                // Convert to hex for the test
                const vendorHex = '0x' + vendorNum.toString(16).padStart(4, '0');
                const productHex = '0x' + productNum.toString(16).padStart(4, '0');

                // Test printer connection first
                await ipcRenderer.invoke('test-printer-connection');
                
                // If connection successful, send test print
                const success = await ipcRenderer.invoke('test-printer', {
                    vendorId: vendorHex,
                    productId: productHex,
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
                    statusElement.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Printer test successful';
                    statusElement.className = 'status-message success';
                } else {
                    statusElement.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Printer test failed';
                    statusElement.className = 'status-message error';
                }
            } catch (error) {
                statusElement.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Error: ${error.message}`;
                statusElement.className = 'status-message error';
            }
        });

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