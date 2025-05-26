// driverConfiguration.js
const { ipcRenderer } = require('electron');
const { createTextPopup } = require("./textPopup");

async function loadDriverConfiguration(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

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

        mainContent.innerHTML = `
            <div class='section-title'>
                <h2>Thermal Printer Configuration</h2>
            </div>
            <div class="printer-config-container" style="margin-top: 20px;">
                <form id="printerConfigForm">
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

        // Modify the test printer button event listener in driverConfiguration.js
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
                // Send test print command with sample data
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
        document.getElementById('printerConfigForm').addEventListener('submit', async (e) => {
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
        console.error('Error loading printer config:', error);
        mainContent.innerHTML = `
            <div class='section-title'>
                <h2>Thermal Printer Configuration</h2>
            </div>
            <div style="color: #dc3545; margin-top: 20px;">
                Error loading printer configuration: ${error.message}
            </div>
        `;
    }
}

module.exports = { loadDriverConfiguration };