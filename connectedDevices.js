// connectedDevices.js
const { ipcRenderer } = require('electron');
const usb = require('usb');
const { createTextPopup } = require("./textPopup");

function loadConnectedDevices(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    mainContent.innerHTML = `
        <div class='section-title'>
            <h2>Connected USB Devices</h2>
        </div>
        <div id="usbDevicesList" style="margin-top: 20px;"></div>
    `;

    // Load USB devices list (showing both decimal and hex values)
    try {
        const devices = usb.getDeviceList();
        const devicesList = document.getElementById('usbDevicesList');
        
        if (devices.length === 0) {
            devicesList.innerHTML = `<p>No USB devices found.</p>`;
        } else {
            let deviceListHTML = `
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f5f5f5;">
                                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Device</th>
                                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Vendor ID</th>
                                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Product ID</th>
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
                
                deviceListHTML += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 8px;">USB Device ${index + 1}</td>
                        <td style="padding: 8px;">
                            ${vendorDec} (${vendorHex})
                        </td>
                        <td style="padding: 8px;">
                            ${productDec} (${productHex})
                        </td>
                    </tr>
                `;
            });
            
            deviceListHTML += `</tbody></table></div>`;
            devicesList.innerHTML = deviceListHTML;
        }
    } catch (error) {
        console.error('Error detecting USB devices:', error);
        document.getElementById('usbDevicesList').innerHTML = 
            `<p style="color: red;">Error detecting USB devices: ${error.message}</p>`;
    }
}

module.exports = { loadConnectedDevices };