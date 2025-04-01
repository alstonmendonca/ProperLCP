const usbDetect = require('usb');

// Function to load the Printer Configuration content
async function loadPrinterConfig(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    try {
        const devices = await usbDetect.find();
        
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
                deviceListHTML += `
                    <li>
                        Name: ${device.deviceName || 'Unknown'}, 
                        Vendor ID: 0x${device.vendorId.toString(16)}, 
                        Product ID: 0x${device.productId.toString(16)}
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


// Function to get the device name from the string descriptor
function getDeviceName(device) {
    return new Promise((resolve, reject) => {
        device.getStringDescriptor(device.deviceDescriptor.iProduct, (err, name) => {
            if (err) {
                reject(err);
            } else {
                resolve(name || "Unknown Device");
            }
        });
    });
}

// Export the loadPrinterConfig function
module.exports = { loadPrinterConfig };