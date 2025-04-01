const { ipcRenderer } = require('electron');

// Function to load receipt editor
function loadReceiptEditor(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';
    mainContent.innerHTML = `
        <div class="receipt-editor-container">
            <h2>Receipt Format Editor</h2>
            <div class="receipt-preview-container">
                <div class="receipt-controls">
                    <button id="saveReceiptFormat">Save Format</button>
                    <button id="resetReceiptFormat">Reset to Default</button>
                    <button id="testPrint">Test Print</button>
                </div>
                
                <div class="editor-columns">
                    <div class="format-editor">
                        <h3>Customer Receipt Format</h3>
                        <textarea id="customerReceiptFormat" spellcheck="false"></textarea>
                        
                        <h3>Kitchen Receipt (KOT) Format</h3>
                        <textarea id="kotReceiptFormat" spellcheck="false"></textarea>
                    </div>
                    
                    <div class="preview-section">
                        <h3>Live Preview</h3>
                        <div class="receipt-preview">
                            <pre id="receiptPreview"></pre>
                        </div>
                    </div>
                </div>
            </div>
            
            // Replace the format-help section in loadReceiptEditor with:
            <div class="format-help">
                <h3>Available Variables:</h3>
                <ul>
                    <li><strong>{{shopName}}</strong> - Restaurant name</li>
                    <li><strong>{{shopAddress}}</strong> - Restaurant address</li>
                    <li><strong>{{kotNumber}}</strong> - KOT number</li>
                    <li><strong>{{orderId}}</strong> - Bill number</li>
                    <li><strong>{{dateTime}}</strong> - Current date and time</li>
                    <li><strong>{{items}}</strong> - List of ordered items</li>
                    <li><strong>{{totalAmount}}</strong> - Total bill amount</li>
                </ul>
                
                // In the loadReceiptEditor function, update the command reference table:
                <div class="command-reference">
                    <h3>Formatting Commands:</h3>
                    <table>
                        <tr><th>Command</th><th>Hex Code</th><th>Description</th></tr>
                        <tr><td>[INIT]</td><td>1B 40</td><td>Initialize printer</td></tr>
                        <tr><td>[ALIGN_CENTER]</td><td>1B 61 01</td><td>Center align text</td></tr>
                        <tr><td>[ALIGN_LEFT]</td><td>1B 61 00</td><td>Left align text</td></tr>
                        <tr><td>[TEXT_LARGE]</td><td>1D 21 11</td><td>Double height/width text</td></tr>
                        <tr><td>[TEXT_NORMAL]</td><td>1D 21 00</td><td>Normal text size</td></tr>
                        <tr><td>[BOLD_ON]</td><td>1B 45 01</td><td>Bold text</td></tr>
                        <tr><td>[BOLD_OFF]</td><td>1B 45 00</td><td>Normal weight text</td></tr>
                        <tr><td>[CUT_PAPER]</td><td>1D 56 41 10</td><td>Partial paper cut</td></tr>
                    </table>
                    <p>Any unknown control characters will be shown as [0xXX] where XX is the hex code.</p>
                </div>
            </div>
    `;

    // Load current format
    // Load current format
    ipcRenderer.invoke('get-receipt-format').then(format => {
        // Handle case where format doesn't exist yet
        if (!format || typeof format !== 'object') {
            format = {
                customerReceipt: null,
                kotReceipt: null
            };
        }

        // Apply cleanFormat to both receipts
        const customerText = format.customerReceipt ? 
            cleanFormat(format.customerReceipt) : 
            getDefaultCustomerFormat();
        
        const kotText = format.kotReceipt ? 
            cleanFormat(format.kotReceipt) : 
            getDefaultKOTFormat();

        // Set values directly
        const customerTextarea = document.getElementById('customerReceiptFormat');
        const kotTextarea = document.getElementById('kotReceiptFormat');
        
        customerTextarea.value = customerText;
        kotTextarea.value = kotText;
        
        // Ensure textareas are properly formatted
        customerTextarea.style.whiteSpace = 'pre';
        customerTextarea.style.fontFamily = 'Courier New, monospace';
        kotTextarea.style.whiteSpace = 'pre';
        kotTextarea.style.fontFamily = 'Courier New, monospace';
        
        updatePreview();
    }).catch(err => {
        console.error('Error loading receipt format:', err);
        // Fallback to defaults if there's an error
        document.getElementById('customerReceiptFormat').value = getDefaultCustomerFormat();
        document.getElementById('kotReceiptFormat').value = getDefaultKOTFormat();
        updatePreview();
    });

    // Add event listeners
    document.getElementById('saveReceiptFormat').addEventListener('click', saveFormat);
    document.getElementById('resetReceiptFormat').addEventListener('click', resetToDefault);
    document.getElementById('testPrint').addEventListener('click', testPrint);
    
    // Update preview when format changes
    document.getElementById('customerReceiptFormat').addEventListener('input', updatePreview);
    document.getElementById('kotReceiptFormat').addEventListener('input', updatePreview);
}

// Move cleanFormat outside the load function so it can be reused
function cleanFormat(text) {
    if (!text) return text;
    
    // First normalize all line endings to \n
    let result = text.replace(/\r\n|\r|\x0A/g, '\n');
    
    // Then process ESC/POS commands
    result = result
        .replace(/\x1B\x40/g, '[INIT]\n')
        .replace(/\x1B\x61\x01/g, '[ALIGN_CENTER]\n')
        .replace(/\x1B\x61\x00/g, '[ALIGN_LEFT]\n')
        .replace(/\x1D\x21\x11/g, '[TEXT_LARGE]\n')
        .replace(/\x1D\x21\x00/g, '[TEXT_NORMAL]\n')
        .replace(/\x1B\x45\x01/g, '[BOLD_ON]\n')
        .replace(/\x1B\x45\x00/g, '[BOLD_OFF]\n')
        .replace(/\x1D\x56\x41\x10/g, '[CUT_PAPER]\n')
        // Convert other control characters (except \n which we want to keep)
        .replace(/[\x00-\x09\x0B-\x1F\x7F-\xFF]/g, (char) => {
            const hex = char.charCodeAt(0).toString(16).toUpperCase();
            return `[0x${hex.padStart(2, '0')}]`;
        });
    
    // Remove any duplicate newlines that might have been created
    return result.replace(/\n\n+/g, '\n');
}

function getDefaultCustomerFormat() {
    return `[INIT]
[ALIGN_CENTER]
[TEXT_LARGE]
THE LASSI CORNER
[TEXT_NORMAL]
SJEC, VAMANJOOR
[BOLD_ON]
Token No: {{kotNumber}}
[BOLD_OFF]
[ALIGN_LEFT]
Date: {{dateTime}}
BILL NUMBER: {{orderId}}
${'-'.repeat(32)}
[BOLD_ON]
ITEM          QTY  PRICE
[BOLD_OFF]
{{items}}
${'-'.repeat(32)}
[BOLD_ON]
TOTAL: Rs. {{totalAmount}}
[BOLD_OFF]
[ALIGN_CENTER]
Thank you for visiting!
[CUT_PAPER]`;
}

function getDefaultKOTFormat() {
    return `[ALIGN_CENTER]
[TEXT_LARGE]
KITCHEN ORDER
[TEXT_NORMAL]
KOT #: {{kotNumber}}
Time: {{dateTime}}
${'-'.repeat(32)}
[ALIGN_LEFT]
[BOLD_ON]
ITEM          QTY
[BOLD_OFF]
{{items}}
${'-'.repeat(32)}
[CUT_PAPER]`;
}

function updatePreview() {
    const customerFormat = document.getElementById('customerReceiptFormat').value;
    const kotFormat = document.getElementById('kotReceiptFormat').value;
    
    // Enhanced character conversion for display
    const formatToDisplay = (text) => {
        // First preserve all line breaks
        let result = text.replace(/\n/g, '<br>');
        
        // Then process other commands
        result = result
            // Convert alignment commands to simulated effect
            .replace(/\[ALIGN_CENTER\]/g, '<div style="text-align: center;">')
            .replace(/\[ALIGN_LEFT\]/g, '<div style="text-align: left;">')
            // Convert text size commands
            .replace(/\[TEXT_LARGE\]/g, '<span style="font-size: 1.5em; font-weight: bold;">')
            .replace(/\[TEXT_NORMAL\]/g, '</span>')
            // Convert bold commands
            .replace(/\[BOLD_ON\]/g, '<span style="font-weight: bold;">')
            .replace(/\[BOLD_OFF\]/g, '</span>')
            // Convert cut command
            .replace(/\[CUT_PAPER\]/g, '<div class="cut-marker">───── CUT HERE ─────</div>')
            // Remove INIT as it doesn't affect display
            .replace(/\[INIT\]/g, '')
            // Close any open divs
            .replace(/(<div[^>]*>)/g, '$1') // Just in case we need to handle nested divs
            .replace(/({{[^}]+}})/g, '</div>') // Close divs before variables
            // Convert unknown commands
            .replace(/\[0x([0-9A-F]{2})\]/gi, '[UNKNOWN]');
        
        return result;
    };

    // Simulate variables for preview
    const previewData = {
        shopName: "THE LASSI CORNER",
        shopAddress: "SJEC, VAMANJOOR",
        kotNumber: "123",
        orderId: "456",
        dateTime: new Date().toLocaleString(),
        items: "Lassi          1   50.00<br>Samosa         2   40.00", // Note the <br> here
        totalAmount: "90.00"
    };
    
    // Process customer receipt with variables
    let customerPreview = formatToDisplay(customerFormat)
        .replace(/{{(\w+)}}/g, (match, p1) => previewData[p1] || match);
    
    // Process KOT receipt with variables
    let kotPreview = formatToDisplay(kotFormat)
        .replace(/{{(\w+)}}/g, (match, p1) => previewData[p1] || match);
    
    // Combine both receipts with a cut marker in between
    const combinedPreview = `
        <div class="receipt customer-receipt">
            ${customerPreview}
        </div>
        <div class="receipt kot-receipt">
            ${kotPreview}
        </div>
    `;
    
    document.getElementById('receiptPreview').innerHTML = combinedPreview;
}

function saveFormat() {
    const formatToSave = (text) => {
        return text
            .replace(/\[INIT\]/g, '\x1B\x40')
            .replace(/\[ALIGN_CENTER\]/g, '\x1B\x61\x01')
            .replace(/\[ALIGN_LEFT\]/g, '\x1B\x61\x00')
            .replace(/\[TEXT_LARGE\]/g, '\x1D\x21\x11')
            .replace(/\[TEXT_NORMAL\]/g, '\x1D\x21\x00')
            .replace(/\[BOLD_ON\]/g, '\x1B\x45\x01')
            .replace(/\[BOLD_OFF\]/g, '\x1B\x45\x00')
            .replace(/\[CUT_PAPER\]/g, '\x1D\x56\x41\x10')
            // Convert newlines back to 0x0A
            .replace(/\n/g, '\x0A');
    };

    const format = {
        customerReceipt: formatToSave(document.getElementById('customerReceiptFormat').value),
        kotReceipt: formatToSave(document.getElementById('kotReceiptFormat').value)
    };
    
    ipcRenderer.invoke('save-receipt-format', format).then(() => {
        createTextPopup("Receipt format saved successfully!");
    });
}

// Update the resetToDefault function to ensure preview updates
function resetToDefault() {
    if(confirm("Are you sure you want to reset to default format?")) {
        document.getElementById('customerReceiptFormat').value = getDefaultCustomerFormat();
        document.getElementById('kotReceiptFormat').value = getDefaultKOTFormat();
        updatePreview();
    }
}

function testPrint() {
    ipcRenderer.send('test-print-receipt', {
        customerReceipt: document.getElementById('customerReceiptFormat').value,
        kotReceipt: document.getElementById('kotReceiptFormat').value
    });
}

module.exports = { loadReceiptEditor };