// receiptEditor.js
const { ipcRenderer } = require("electron");

function loadReceiptEditor(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

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
        
        <div class="receipt-container">
            <div class="receipt-scaler">
                <div class="receipt-paper">
                    <div class="receipt-content">
                        <div class="receipt-header">
                            <h3 class="receipt-title">THE LASSI CORNER</h3>
                            <p class="receipt-subtitle">SJEC, VAMANJOOR</p>
                        </div>
                        
                        <div class="receipt-details">
                            <p><strong>Token No:</strong> ${sampleBill.kot}</p>
                            <p><strong>Date:</strong> ${sampleBill.dateTime}</p>
                            <p><strong>BILL NUMBER:</strong> ${sampleBill.orderId}</p>
                        </div>
                        
                        <div class="receipt-divider">${'-'.repeat(32)}</div>
                        
                        <div class="receipt-items-header">
                            <span class="item-name">ITEM</span>
                            <span class="item-qty">QTY</span>
                            <span class="item-price">PRICE</span>
                        </div>
                        
                        <div class="receipt-items">
                            ${sampleBill.items.map(item => `
                                <div class="receipt-item">
                                    <span class="item-name">${item.name.substring(0, 14).padEnd(14)}</span>
                                    <span class="item-qty">${item.quantity.toString().padStart(3)}</span>
                                    <span class="item-price">${item.price.toFixed(2).padStart(8)}</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="receipt-divider">${'-'.repeat(32)}</div>
                        
                        <div class="receipt-total">
                            <strong>TOTAL: Rs. ${sampleBill.totalAmount.toFixed(2)}</strong>
                        </div>
                        
                        <div class="receipt-footer">
                            <p>Thank you for visiting!</p>
                        </div>
                        
                        <div class="receipt-cut-line">••••••••••••••••••••••••••••••••</div>
                        
                        <div class="kot-section">
                            <h4 class="kot-title">KITCHEN ORDER</h4>
                            <p><strong>KOT #:</strong> ${sampleBill.kot}</p>
                            <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
                            <div class="receipt-divider">${'-'.repeat(32)}</div>
                            
                            <div class="kot-items-header">
                                <span class="item-name">ITEM</span>
                                <span class="item-qty">QTY</span>
                            </div>
                            
                            <div class="kot-items">
                                ${sampleBill.items.map(item => `
                                    <div class="kot-item">
                                        <span class="item-name">${item.name.substring(0, 14).padEnd(14)}</span>
                                        <span class="item-qty">${item.quantity.toString().padStart(3)}</span>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div class="receipt-divider">${'-'.repeat(32)}</div>
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
        </style>
    `;
}

module.exports = { loadReceiptEditor };