const { ipcRenderer } = require("electron");

async function Switches(mainContent, billPanel){
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = "none";
    
    // Load current switches
    const switches = await ipcRenderer.invoke("load-switches");
    
    mainContent.innerHTML = `
        <div style="padding: 30px; max-width: 900px; margin: 0 auto;">
            <div class="section-title" style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #0D3B66; padding-bottom: 15px;">
                <h2 style="color: #0D3B66; font-size: 2.5rem; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 2px;">System Switches</h2>
                <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Configure interface settings and toggle features</p>
            </div>
            
            <div style="background: white; border: 2px solid #0D3B66; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(13, 59, 102, 0.1);">
                <h3 style="margin: 0 0 25px 0; color: #0D3B66; font-size: 1.5rem; font-weight: 600; text-align: center;">Interface Settings</h3>
                
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 10px; margin-bottom: 15px;">
                    <div>
                        <label style="font-weight: 600; color: #0D3B66; font-size: 18px; display: block; margin-bottom: 5px;">Show "All" Button</label>
                        <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.4;">Toggle visibility of the "All" button in the category panel</p>
                    </div>
                    <label class="switch" style="position: relative; display: inline-block; width: 70px; height: 40px;">
                        <input type="checkbox" id="showAllButton" ${switches.showAllButton ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                        <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${switches.showAllButton ? '#0D3B66' : '#ccc'}; transition: .3s; border-radius: 40px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
                            <span style="position: absolute; content: ''; height: 32px; width: 32px; left: ${switches.showAllButton ? '34px' : '4px'}; bottom: 2px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></span>
                        </span>
                    </label>
                </div>
                
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 10px; margin-bottom: 15px;">
                    <div>
                        <label style="font-weight: 600; color: #0D3B66; font-size: 18px; display: block; margin-bottom: 5px;">Show "Frequent" Button</label>
                        <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.4;">Toggle visibility of the "Frequent" button for frequently marked items</p>
                    </div>
                    <label class="switch" style="position: relative; display: inline-block; width: 70px; height: 40px;">
                        <input type="checkbox" id="showFrequentButton" ${switches.showFrequentButton ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                        <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${switches.showFrequentButton ? '#0D3B66' : '#ccc'}; transition: .3s; border-radius: 40px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
                            <span style="position: absolute; content: ''; height: 32px; width: 32px; left: ${switches.showFrequentButton ? '34px' : '4px'}; bottom: 2px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></span>
                        </span>
                    </label>
                </div>
                
                <div style="padding: 25px; background: #f1f3f4; border: 2px dashed #0D3B66; border-radius: 10px; text-align: center; margin-top: 20px;">
                    <div style="color: #0D3B66; font-size: 48px; margin-bottom: 10px;">⚙️</div>
                    <p style="margin: 0; color: #0D3B66; font-size: 16px; font-weight: 500;">More switches coming soon</p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Additional interface toggles will be added in future updates</p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
                <button id="saveChanges" style="background: #0D3B66; color: white; border: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-right: 15px; box-shadow: 0 3px 8px rgba(13, 59, 102, 0.3); transition: all 0.2s ease;">
                    💾 Save Changes
                </button>
                <button id="resetDefaults" style="background: white; color: #0D3B66; border: 2px solid #0D3B66; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                    🔄 Reset to Defaults
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
            slider.style.backgroundColor = '#0D3B66';
            sliderButton.style.left = '34px';
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
            slider.style.backgroundColor = '#0D3B66';
            sliderButton.style.left = '34px';
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
            allSlider.style.backgroundColor = '#0D3B66';
            allSliderButton.style.left = '34px';

            // Reset the UI for Frequent button
            showFrequentButton.checked = true;
            const frequentSlider = showFrequentButton.nextElementSibling;
            const frequentSliderButton = frequentSlider.querySelector('span:last-child');
            frequentSlider.style.backgroundColor = '#0D3B66';
            frequentSliderButton.style.left = '34px';

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

    // Add hover effects for buttons
    const saveBtn = document.getElementById('saveChanges');
    const resetBtn = document.getElementById('resetDefaults');
    
    saveBtn.addEventListener('mouseenter', () => {
        saveBtn.style.backgroundColor = '#11487b';
        saveBtn.style.transform = 'translateY(-2px)';
        saveBtn.style.boxShadow = '0 5px 12px rgba(13, 59, 102, 0.4)';
    });
    
    saveBtn.addEventListener('mouseleave', () => {
        saveBtn.style.backgroundColor = '#0D3B66';
        saveBtn.style.transform = 'translateY(0)';
        saveBtn.style.boxShadow = '0 3px 8px rgba(13, 59, 102, 0.3)';
    });
    
    resetBtn.addEventListener('mouseenter', () => {
        resetBtn.style.backgroundColor = '#0D3B66';
        resetBtn.style.color = 'white';
        resetBtn.style.transform = 'translateY(-2px)';
        resetBtn.style.boxShadow = '0 3px 8px rgba(13, 59, 102, 0.3)';
    });
    
    resetBtn.addEventListener('mouseleave', () => {
        resetBtn.style.backgroundColor = 'white';
        resetBtn.style.color = '#0D3B66';
        resetBtn.style.transform = 'translateY(0)';
        resetBtn.style.boxShadow = 'none';
    });

    function showSuccessMessage() {
        const message = document.createElement('div');
        message.innerHTML = '✅ Changes saved successfully!';
        message.style.cssText = `
            position: fixed;
            top: 30px;
            right: 30px;
            background: #0D3B66;
            color: white;
            padding: 20px 25px;
            border-radius: 10px;
            z-index: 1000;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(13, 59, 102, 0.3);
            border-left: 4px solid white;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                document.body.removeChild(message);
                document.head.removeChild(style);
            }, 300);
        }, 3000);
    }
}

module.exports = { Switches };