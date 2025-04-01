const usb = require('usb');

function loadPrinterConfig(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    try {
        // Get all connected USB devices
        const devices = usb.getDeviceList();
        
        let deviceListHTML = `
            <div class='section-title'>
                <h2>Connected USB Devices</h2>
            </div>
            <ul>
        `;

        if (devices.length === 0) {
            deviceListHTML += `<li>No USB devices found.</li>`;
        } else {
            devices.forEach(device => {
                const deviceDescriptor = device.deviceDescriptor;
                deviceListHTML += `
                    <li>
                        Vendor ID: 0x${deviceDescriptor.idVendor.toString(16)}, 
                        Product ID: 0x${deviceDescriptor.idProduct.toString(16)}
                    </li>
                `;
            });
        }

        deviceListHTML += `</ul>`;
        mainContent.innerHTML = deviceListHTML;
    } catch (error) {
        console.error('Error detecting USB devices:', error);
        mainContent.innerHTML = `<div class='error'>Error detecting USB devices: ${error.message}</div>`;
    }
}

module.exports = { loadPrinterConfig };