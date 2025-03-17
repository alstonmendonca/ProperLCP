const usb = require('usb'); // Make sure to install the usb package

// Function to load the Printer Configuration content
function loadPrinterConfig(mainContent) {
    // Get the list of USB devices
    const devices = usb.getDeviceList();

    // Create HTML content for displaying devices
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
                    Vendor ID: ${device.deviceDescriptor.idVendor}, 
                    Product ID: ${device.deviceDescriptor.idProduct}, 
                    Device Class: ${device.deviceDescriptor.bDeviceClass}
                </li>
            `;
        });
    }

    deviceListHTML += `</ul>`;
    
    // Update the main content with the device list
    mainContent.innerHTML = deviceListHTML;
}

// Export the loadPrinterConfig function
module.exports = { loadPrinterConfig };