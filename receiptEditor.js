// receiptEditor.js
const { ipcRenderer } = require("electron");

function loadReceiptEditor(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    let isEditMode = false;

    // Get saved template or use defaults
    const template = ipcRenderer.sendSync('get-receipt-template', {
        title: 'THE LASSI CORNER',
        subtitle: 'SJEC, VAMANJOOR',
        footer: 'Thank you for visiting!',
        kotTitle: 'KITCHEN ORDER',  
        itemHeader: 'ITEM',         
        qtyHeader: 'QTY',           
        priceHeader: 'PRICE',       
        totalText: 'TOTAL: Rs.',
        kotItemHeader: 'ITEM',
        kotQtyHeader: 'QTY'
    });

    // Create a sample bill data structure
    const sampleBill = {
        kot: 1234,
        orderId: 5678,
        dateTime: new Date().toLocaleString(),
        items: [
            { name: "Cheeseburger", quantity: 2, price: 120.00 },
            { name: "French Fries", quantity: 1, price: 60.00 },
            { name: "Coke", quantity: 2, price: 40.00 }
        ],
        totalAmount: 260.00
    };

    mainContent.innerHTML = `
        <div class="section-title">
            <h2>Receipt Preview</h2>
        </div>

        <button id="editReceiptBtn" class="edit-receipt-btn">Edit Receipt</button>
        
        <div class="receipt-container">
            <div class="receipt-scaler">
                <div class="receipt-paper">
                    <div class="receipt-content">
                        <div class="receipt-header">
                            <h3 class="receipt-title">${template.title}</h3>
                            <p class="receipt-subtitle">${template.subtitle}</p>
                        </div>
                        
                        <div class="receipt-details">
                            <p class="kot-title"><strong>Token:</strong> ${sampleBill.kot}</p>
                            <p><strong>Date:</strong> ${sampleBill.dateTime}</p>
                            <p><strong>BILL #:</strong> ${sampleBill.orderId}</p>
                        </div>
                        
                        <div class="receipt-divider">${'-'.repeat(49)}</div>
                        
                        <table class="receipt">
                            <thead>
                                <tr>
                                <th class="margin:100px;">ITEM</th>
                                <th>QTY</th>
                                <th>PRICE</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sampleBill.items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td style="text-align:center;">${item.quantity}</td>
                                    <td style="text-align:right;">${item.price.toFixed(2)}</td>
                                </tr>
                                `).join('')}
                            </tbody>
                            </table>

                        
                        <div class="receipt-divider">${'-'.repeat(49)}</div>
                        
                        <div class="receipt-total">
                            <strong class="total-text">TOTAL: Rs. ${sampleBill.totalAmount.toFixed(2)}</strong>
                        </div>
                        
                        <div class="receipt-footer">
                            <p>${template.footer}</p>
                        </div>
                        
                        <div class="receipt-cut-line">••••••••••••••••••••••••••••••••</div>
                        
                        <div class="kot-section">
                            <h4 class="kot-title">123</h4>
                            <div class="kot-items-header">
                                <span class="kot-item-header"><strong>Time:</strong> ${new Date().toLocaleTimeString()}</span>
                                <span class="kot-qty-header">Rs 100</span>
                            </div>
                            <div class="receipt-divider">${'-'.repeat(49)}</div>
                            
                            <div class="kot-items-header">
                                <span class="kot-item-header">ITEM</span>
                                <span class="kot-qty-header">QTY</span>
                            </div>
                            
                            <div class="kot-items">
                                ${sampleBill.items.map(item => `
                                    <div class="kot-item">
                                        <span class="item-name">${item.name.substring(0, 14).padEnd(14)}</span>
                                        <span class="item-qty">${item.quantity.toString().padStart(3)}</span>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div class="receipt-divider">${'-'.repeat(49)}</div>
                        </div>
                        
                        <div class="receipt-cut-line">••••••••••••••••••••••••••••••••</div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .receipt-container {
                display: flex;
                justify-content: center;
                padding: 20px;
                overflow: visible; /* Ensure scaled content isn't clipped */
            }

            .receipt-scaler {
                transform: scale(1.5); /* Adjust this value as needed (1.5 = 150%) */
                transform-origin: top center;
                width: 384px; /* Original width */
            }
            
            .receipt-paper {
                width: 384px; /* Standard thermal paper width (80mm) in pixels */
                background: white;
                padding: 15px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                font-family: 'Courier New', monospace; /* More printer-like font */
                font-size: 12px; /* Base font size */
                line-height: 1.2;
                margin-bottom: 30px;
            }

            .receipt-header {
                text-align: center;
                margin-bottom: 8px;
            }
            
            .receipt-title {
                font-size: 16px;
                font-weight: bold;
                margin: 0;
                letter-spacing: 0.5px;
            }
            
            .receipt-subtitle {
                font-size: 14px;
                margin: 3px 0 0 0;
            }
            
            .receipt-details {
                margin: 8px 0;
                font-size: 12px;
            }
            
            .receipt-divider {
                text-align: center;
                margin: 5px 0;
                font-size: 12px;
                color: #555;
            }
            
            .receipt-items-header, .receipt-item, .kot-items-header, .kot-item {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                line-height: 1.5;
                font-weight: bold;
            }
            
            .item-name {
                width: 60%;
                text-align: left;
            }
            
            .item-qty {
                width: 15%;
                text-align: right;
            }
            
            .item-price {
                width: 25%;
                text-align: right;
            }
            
            .kot-items-header .item-name, .kot-item .item-name {
                width: 75%;
            }
            
            .kot-items-header .item-qty, .kot-item .item-qty {
                width: 25%;
            }
            
            .receipt-total {
                text-align: right;
                font-size: 12px;
                margin: 10px 0;
            }
            
            .receipt-footer {
                text-align: center;
                font-size: 12px;
                margin: 10px 0;
            }
            
            .receipt-cut-line {
                text-align: center;
                color: #999;
                letter-spacing: 2px;
                margin: 15px 0;
                font-size: 14px;
            }
            
            .kot-section {
                margin-top: 20px;
            }
            
            .kot-title {
                text-align: center;
                margin: 5px 0;
                font-size: 16px;
            }

            .edit-receipt-btn {
                display: block;
                margin: 0 auto 20px auto; /* Center button with margin below */
                padding: 10px 20px;
                background-color: #1DB954;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 16px;
                cursor: pointer;
            }

            .edit-receipt-btn:hover {
                background-color: #169c46;
            }

        </style>
    `;

    // Modify your button click handler:
document.getElementById('editReceiptBtn').addEventListener('click', () => {
    isEditMode = !isEditMode; // Toggle edit mode
    
    if (isEditMode) {
        // Enter edit mode
        document.getElementById('editReceiptBtn').textContent = 'Save Changes';
        enableReceiptEditing();
    } else {
        // Exit edit mode
        document.getElementById('editReceiptBtn').textContent = 'Edit Receipt';
        saveReceiptChanges();
    }
});
}



function enableReceiptEditing() {
    // Existing fields
    const title = document.querySelector('.receipt-title');
    const subtitle = document.querySelector('.receipt-subtitle');
    const footer = document.querySelector('.receipt-footer p');
    
    // Make editable
    [title, subtitle, footer].forEach(el => {
        el.contentEditable = true;
        el.style.backgroundColor = '#f0f8ff';
        el.style.outline = '2px dashed #1DB954';
    });
    
    title.focus();
}

function saveReceiptChanges() {
    // Get all editable elements
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    
    // Disable editing and remove styling
    editableElements.forEach(el => {
        el.contentEditable = false;
        el.style.backgroundColor = 'transparent';
        el.style.outline = 'none';
    });
    
    // Get updated values
    const updates = {
        title: document.querySelector('.receipt-title').textContent,
        subtitle: document.querySelector('.receipt-subtitle').textContent,
        footer: document.querySelector('.receipt-footer p').textContent,
    };
    
    // Validate required fields
    if (!updates.title) {
        createTextPopup("Required fields cannot be empty");
        return;
    }
    
    // Save to main process
    ipcRenderer.send('update-receipt-template', updates);
}

module.exports = { loadReceiptEditor };