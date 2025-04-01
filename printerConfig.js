const usb = require('usb'); // Make sure to install the usb package

// Function to load the Printer Configuration content
async function loadPrinterConfig(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';
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
        // Iterate through each device and get its details
        for (const device of devices) {
            try {
                // Open the device to access its descriptors
                device.open();
                
                // Get the device name (string descriptor)
                const deviceName = await getDeviceName(device);
                
                deviceListHTML += `
                    <li>
                        Name: ${deviceName}, 
                        Vendor ID: ${device.deviceDescriptor.idVendor}, 
                        Product ID: ${device.deviceDescriptor.idProduct}, 
                        Device Class: ${device.deviceDescriptor.bDeviceClass}
                    </li>
                `;
            } catch (error) {
                console.error(`Error retrieving device info: ${error}`);
                deviceListHTML += `
                    <li>
                        Error retrieving info for Vendor ID: ${device.deviceDescriptor.idVendor}, 
                        Product ID: ${device.deviceDescriptor.idProduct}
                    </li>
                `;
            } finally {
                // Close the device after accessing its descriptors
                device.close();
            }
        }
    }

    deviceListHTML += `</ul>`;
    
    // Update the main content with the device list
    mainContent.innerHTML = deviceListHTML;
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