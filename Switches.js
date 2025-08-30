const { ipcRenderer } = require("electron");

async function Switches(mainContent, billPanel){
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = "none";
    
    // Load current switches
    const switches = await ipcRenderer.invoke("load-switches");
    
    mainContent.innerHTML = `
        <div style="padding: 20px;">
        <div class="section-title">
            <h2>System Switches</h2>
        </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="margin-bottom: 15px; color: #555;">Interface Settings</h3>
                
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: white; border-radius: 8px; margin-bottom: 10px;">
                    <div>
                        <label style="font-weight: bold; color: #333;">Show "All" Button</label>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Toggle visibility of the "All" button in the category panel</p>
                    </div>
                    <label class="switch" style="position: relative; display: inline-block; width: 60px; height: 34px;">
                        <input type="checkbox" id="showAllButton" ${switches.showAllButton ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                        <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${switches.showAllButton ? '#4CAF50' : '#ccc'}; transition: .4s; border-radius: 34px;">
                            <span style="position: absolute; content: ''; height: 26px; width: 26px; left: ${switches.showAllButton ? '30px' : '4px'}; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%;"></span>
                        </span>
                    </label>
                </div>
                
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: white; border-radius: 8px; margin-bottom: 10px;">
                    <div>
                        <label style="font-weight: bold; color: #333;">Show "Frequent" Button</label>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Toggle visibility of the "Frequent" button for frequently marked items</p>
                    </div>
                    <label class="switch" style="position: relative; display: inline-block; width: 60px; height: 34px;">
                        <input type="checkbox" id="showFrequentButton" ${switches.showFrequentButton ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                        <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${switches.showFrequentButton ? '#4CAF50' : '#ccc'}; transition: .4s; border-radius: 34px;">
                            <span style="position: absolute; content: ''; height: 26px; width: 26px; left: ${switches.showFrequentButton ? '30px' : '4px'}; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%;"></span>
                        </span>
                    </label>
                </div>
                
                <!-- Placeholder for future switches -->
                <div style="padding: 15px; background: #e9ecef; border-radius: 8px; border: 2px dashed #ced4da; text-align: center; color: #6c757d;">
                    <p style="margin: 0; font-style: italic;">More switches will be added here in future updates</p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <button id="saveChanges" style="background: #007bff; color: white; border: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; cursor: pointer; margin-right: 10px;">
                    Save Changes
                </button>
                <button id="resetDefaults" style="background: #6c757d; color: white; border: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; cursor: pointer;">
                    Reset to Defaults
                </button>
            </div>
        </div>
    `;

    // Add event listeners
    const showAllButton = document.getElementById('showAllButton');
    const showFrequentButton = document.getElementById('showFrequentButton');
    const saveChanges = document.getElementById('saveChanges');
    const resetDefaults = document.getElementById('resetDefaults');

    // Toggle switch styling for All button
    showAllButton.addEventListener('change', (e) => {
        const slider = e.target.nextElementSibling;
        const sliderButton = slider.querySelector('span:last-child');
        
        if (e.target.checked) {
            slider.style.backgroundColor = '#4CAF50';
            sliderButton.style.left = '30px';
        } else {
            slider.style.backgroundColor = '#ccc';
            sliderButton.style.left = '4px';
        }
    });

    // Toggle switch styling for Frequent button
    showFrequentButton.addEventListener('change', (e) => {
        const slider = e.target.nextElementSibling;
        const sliderButton = slider.querySelector('span:last-child');
        
        if (e.target.checked) {
            slider.style.backgroundColor = '#4CAF50';
            sliderButton.style.left = '30px';
        } else {
            slider.style.backgroundColor = '#ccc';
            sliderButton.style.left = '4px';
        }
    });

    // Save changes
    saveChanges.addEventListener('click', async () => {
        const newSwitches = {
            showAllButton: showAllButton.checked,
            showFrequentButton: showFrequentButton.checked
        };

        // Save to file
        ipcRenderer.send('save-switches', newSwitches);
        
        // Listen for response
        ipcRenderer.once('save-switches-response', (event, response) => {
            if (response.success) {
                // Show success message
                showSuccessMessage();
            } else {
                alert('Failed to save switches: ' + response.message);
            }
        });
    });

    // Reset to defaults
    resetDefaults.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all switches to their default values?')) {
            const defaultSwitches = {
                showAllButton: true,
                showFrequentButton: true
            };

            // Reset the UI for All button
            showAllButton.checked = true;
            const allSlider = showAllButton.nextElementSibling;
            const allSliderButton = allSlider.querySelector('span:last-child');
            allSlider.style.backgroundColor = '#4CAF50';
            allSliderButton.style.left = '30px';

            // Reset the UI for Frequent button
            showFrequentButton.checked = true;
            const frequentSlider = showFrequentButton.nextElementSibling;
            const frequentSliderButton = frequentSlider.querySelector('span:last-child');
            frequentSlider.style.backgroundColor = '#4CAF50';
            frequentSliderButton.style.left = '30px';

            // Save defaults
            ipcRenderer.send('save-switches', defaultSwitches);
            
            ipcRenderer.once('save-switches-response', (event, response) => {
                if (response.success) {
                    showSuccessMessage();
                } else {
                    alert('Failed to reset switches: ' + response.message);
                }
            });
        }
    });

    function showSuccessMessage() {
        const message = document.createElement('div');
        message.innerHTML = '✓ Changes saved successfully!';
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000;
            font-weight: bold;
        `;
        document.body.appendChild(message);
        
        setTimeout(() => {
            document.body.removeChild(message);
        }, 3000);
    }
}

module.exports = { Switches };