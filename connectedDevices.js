// connectedDevices.js
const { ipcRenderer } = require('electron');
const usb = require('usb');
const { createTextPopup } = require("./textPopup");

function loadConnectedDevices(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    mainContent.innerHTML = `
        <div class="section-title">
            <h2>Connected USB Devices</h2>
        </div>
        <div id="usbDevicesList" style="margin-top: 20px;"></div>
    `;

    // Load USB devices list (showing both decimal and hex values)
    try {
        const devices = usb.getDeviceList();
        const devicesList = document.getElementById('usbDevicesList');
        
        if (devices.length === 0) {
            devicesList.innerHTML = `
                <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; color: #6c757d;">
                    <svg style="width: 48px; height: 48px; margin-bottom: 10px; fill: #adb5bd;" viewBox="0 0 24 24">
                        <path d="M7 19v-2h10v2H7zm0-4v-2h10v2H7zm0-4V9h10v2H7zm12-6h-4.18C14.4 3.84 13.3 3 12 3c-1.3 0-2.4.84-2.82 2H5c-.14 0-.27.01-.4.04-.39.08-.74.28-1.01.55-.18.18-.33.4-.43.64-.1.23-.16.49-.16.77v14c0 .27.06.54.16.78s.25.45.43.64c.27.27.62.47 1.01.55.13.02.26.03.4.03h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-7-.25c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75zM19 19H5V7h14v12z"/>
                    </svg>
                    <p style="margin: 0; font-size: 16px;">No USB devices found</p>
                </div>
            `;
        } else {
            let deviceListHTML = `
                <div style="background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="padding: 12px 16px; text-align: left; font-size: 14px; font-weight: 600; color: #495057; border-bottom: 1px solid #e9ecef;">Device</th>
                                <th style="padding: 12px 16px; text-align: left; font-size: 14px; font-weight: 600; color: #495057; border-bottom: 1px solid #e9ecef;">Vendor ID</th>
                                <th style="padding: 12px 16px; text-align: left; font-size: 14px; font-weight: 600; color: #495057; border-bottom: 1px solid #e9ecef;">Product ID</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            devices.forEach((device, index) => {
                const deviceDescriptor = device.deviceDescriptor;
                const vendorDec = deviceDescriptor.idVendor;
                const productDec = deviceDescriptor.idProduct;
                const vendorHex = '0x' + vendorDec.toString(16).toUpperCase().padStart(4, '0');
                const productHex = '0x' + productDec.toString(16).toUpperCase().padStart(4, '0');
                
                const rowColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                
                deviceListHTML += `
                    <tr style="background-color: ${rowColor}; transition: background-color 0.2s;">
                        <td style="padding: 12px 16px; border-bottom: 1px solid #e9ecef; font-size: 14px; color: #212529;">
                            <div style="display: flex; align-items: center;">
                                <svg style="width: 20px; height: 20px; margin-right: 10px; fill: #4dabf7;" viewBox="0 0 24 24">
                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                </svg>
                                USB Device ${index + 1}
                            </div>
                        </td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #e9ecef; font-size: 14px; color: #212529;">
                            <span style="font-family: 'Courier New', monospace;">${vendorDec}</span>
                            <span style="color: #868e96; margin-left: 5px;">(${vendorHex})</span>
                        </td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #e9ecef; font-size: 14px; color: #212529;">
                            <span style="font-family: 'Courier New', monospace;">${productDec}</span>
                            <span style="color: #868e96; margin-left: 5px;">(${productHex})</span>
                        </td>
                    </tr>
                `;
            });
            
            deviceListHTML += `</tbody></table></div>`;
            devicesList.innerHTML = deviceListHTML;
        }
    } catch (error) {
        console.error('Error detecting USB devices:', error);
        document.getElementById('usbDevicesList').innerHTML = `
            <div style="background: #fff3bf; border-left: 4px solid #ffd43b; padding: 16px; border-radius: 4px; display: flex; align-items: center;">
                <svg style="width: 24px; height: 24px; margin-right: 12px; fill: #f08c00;" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <div>
                    <p style="margin: 0; font-weight: 500; color: #212529;">Error detecting USB devices</p>
                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #495057;">${error.message}</p>
                </div>
            </div>
        `;
    }
}

module.exports = { loadConnectedDevices };