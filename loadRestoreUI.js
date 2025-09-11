const { ipcRenderer } = require("electron");

function loadRestoreUI(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    mainContent.innerHTML = `
        <style>
            .restore-container {
                display: flex;
                flex-direction: row;
                align-items: stretch;
                justify-content: center;
                gap: 30px;
                padding: 60px 40px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: #f5f7fa;
                min-height: 100vh;
                flex-wrap: wrap;
            }

            .restore-card {
                background: white;
                border-radius: 20px;
                padding: 50px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                text-align: center;
                max-width: 500px;
                width: 100%;
                flex: 1;
                min-width: 450px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }

            .card-content-top {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
            }

            .card-content-bottom {
                margin-top: auto;
            }

            .section-title {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
                margin-bottom: 40px;
                color: #2c3e50;
            }

            .section-title h2 {
                font-size: 28px;
                font-weight: 600;
                margin: 0;
                color: #0D3B66;
            }

            .section-title svg {
                width: 60px !important;
                height: 60px !important;
                color: #0D3B66;
                filter: drop-shadow(0 4px 8px rgba(13, 59, 102, 0.3));
            }

            .restore-description {
                color: #7f8c8d;
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 40px;
                max-width: 400px;
            }

            #restoreButton, #localRestoreButton {
                padding: 16px 32px;
                font-size: 18px;
                font-weight: 600;
                background: #0D3B66;
                color: white;
                border: none;
                border-radius: 50px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 8px 25px rgba(13, 59, 102, 0.3);
                position: relative;
                overflow: hidden;
                min-width: 200px;
            }

            #restoreButton:hover, #localRestoreButton:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 35px rgba(13, 59, 102, 0.4);
            }

            #restoreButton:active, #localRestoreButton:active {
                transform: translateY(0);
                box-shadow: 0 6px 20px rgba(13, 59, 102, 0.3);
            }

            #restoreButton:disabled, #localRestoreButton:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
            }

            #restoreMessage, #localRestoreMessage {
                margin-top: 30px;
                font-size: 15px;
                color: #95a5a6;
                font-weight: 500;
            }

            #restoreStatus {
                margin-top: 30px;
                display: none;
                font-size: 16px;
                color: #2c3e50;
                text-align: center;
                padding: 20px;
                border-radius: 15px;
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(10px);
            }

            #localRestoreStatus {
                margin-top: 30px;
                display: none;
                font-size: 16px;
                color: #2c3e50;
                text-align: center;
                padding: 20px;
                border-radius: 15px;
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(10px);
            }

            .spinner {
                margin: 20px auto;
                width: 40px;
                height: 40px;
                border: 4px solid #e3f2fd;
                border-top: 4px solid #0D3B66;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                box-shadow: 0 4px 12px rgba(13, 59, 102, 0.2);
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .status-success {
                background: #4CAF50;
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                font-weight: 600;
            }

            .status-error {
                background: #f44336;
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                font-weight: 600;
            }

            .status-icon {
                font-size: 20px;
            }

            .restore-info {
                margin-top: 30px;
                padding: 20px;
                background: rgba(13, 59, 102, 0.05);
                border-radius: 15px;
                border-left: 4px solid #0D3B66;
            }

            .restore-info h3 {
                margin: 0 0 10px 0;
                color: #2c3e50;
                font-size: 18px;
                font-weight: 600;
            }

            .restore-info p {
                margin: 0;
                color: #7f8c8d;
                font-size: 14px;
                line-height: 1.5;
            }

            .warning-box {
                margin-top: 30px;
                padding: 20px;
                background: rgba(255, 193, 7, 0.1);
                border-radius: 15px;
                border-left: 4px solid #ffc107;
            }

            .warning-box h3 {
                margin: 0 0 10px 0;
                color: #856404;
                font-size: 18px;
                font-weight: 600;
            }

            .warning-box p {
                margin: 0;
                color: #856404;
                font-size: 14px;
                line-height: 1.5;
            }

            @media (max-width: 1200px) {
                .restore-container {
                    flex-direction: column;
                    align-items: center;
                }
                
                .restore-card {
                    max-width: 500px;
                    min-width: auto;
                }
            }

            @media (max-width: 768px) {
                .restore-container {
                    padding: 30px 20px;
                    flex-direction: column;
                }
                
                .restore-card {
                    padding: 30px 20px;
                    min-width: auto;
                }
                
                .section-title h2 {
                    font-size: 24px;
                }
                
                .section-title svg {
                    width: 50px !important;
                    height: 50px !important;
                }
            }
        </style>

        <div class="restore-container">
            <div class="restore-card">
                <div class="card-content-top">
                    <div class='section-title'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down-from-line-icon lucide-arrow-down-from-line"><path d="M19 3H5"/><path d="M12 21V7"/><path d="m6 15 6 6 6-6"/></svg>
                        <h2>Cloud Database Restore</h2>
                    </div>
                    
                    <p class="restore-description">
                        Restore your local database from a previous cloud backup. This will replace your current database 
                        with the backup data from Google Drive. Make sure you have a recent backup before proceeding.
                    </p>
                    
                    <button id="restoreButton">Restore from Cloud</button>
                    
                    <p id="restoreMessage">Click the button above to start the cloud restore process.</p>
                    
                    <div id="restoreStatus">
                        <div class="spinner"></div>
                        <p>Authorizing and restoring your database...</p>
                    </div>
                </div>
                
                <div class="card-content-bottom">
                    <div class="warning-box">
                        <h3>⚠️ Important Warning</h3>
                        <p>• This action will replace all current data with backup data<br>
                        • Any changes made since the backup will be lost<br>
                        • Make sure you have saved any important recent work<br>
                        • This process cannot be undone</p>
                    </div>
                    
                    <div class="restore-info">
                        <h3>What gets restored?</h3>
                        <p>• All customer data and order history<br>
                        • Product inventory and categories<br>
                        • Sales and analytics data</p>
                    </div>
                </div>
            </div>

            <div class="restore-card">
                <div class="card-content-top">
                    <div class='section-title'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hard-drive"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>
                        <h2>Local Database Restore</h2>
                    </div>
                    
                    <p class="restore-description">
                        Restore your database from a local backup file. Choose a previously saved database file 
                        from your computer to restore your data.
                    </p>
                    
                    <button id="localRestoreButton">Restore from Local File</button>
                    
                    <p id="localRestoreMessage">Click the button above to select and restore a local backup.</p>
                    
                    <div id="localRestoreStatus">
                        <div class="spinner"></div>
                        <p>Restoring database from local file...</p>
                    </div>
                </div>
                
                <div class="card-content-bottom">
                    <div class="warning-box">
                        <h3>⚠️ Important Warning</h3>
                        <p>• This action will replace all current data with backup data<br>
                        • Any changes made since the backup will be lost<br>
                        • Make sure the backup file is valid and complete<br>
                        • A backup of current data will be created automatically</p>
                    </div>
                    
                    <div class="restore-info">
                        <h3>Local Restore Benefits</h3>
                        <p>• Quick offline restoration<br>
                        • No internet connection required<br>
                        • Current database automatically backed up before restore</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    const restoreButton = document.getElementById('restoreButton');
    const statusDiv = document.getElementById('restoreStatus');
    const message = document.getElementById('restoreMessage');

    // Local restore elements
    const localRestoreButton = document.getElementById('localRestoreButton');
    const localStatusDiv = document.getElementById('localRestoreStatus');
    const localMessage = document.getElementById('localRestoreMessage');

    restoreButton.addEventListener('click', () => {
        message.innerText = '';
        restoreButton.disabled = true;
        restoreButton.textContent = 'Restoring from Cloud...';
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = `
            <div class="spinner"></div>
            <p>Authorizing and restoring your database...</p>
        `;

        ipcRenderer.send('restore-database');
    });

    // Local restore button event listener
    localRestoreButton.addEventListener('click', () => {
        localMessage.innerText = '';
        localRestoreButton.disabled = true;
        localRestoreButton.textContent = 'Selecting File...';
        localStatusDiv.style.display = 'block';
        localStatusDiv.innerHTML = `
            <div class="spinner"></div>
            <p>Please select a database file to restore...</p>
        `;

        ipcRenderer.send('restore-database-local');
    });

    ipcRenderer.removeAllListeners('restore-completed');
    ipcRenderer.removeAllListeners('restore-local-completed');

    ipcRenderer.on('restore-completed', (event, success) => {
        restoreButton.disabled = false;
        restoreButton.textContent = 'Restore from Cloud';
        
        statusDiv.innerHTML = success
            ? `<div class="status-success">
                <span class="status-icon">✅</span>
                <span>Cloud restore completed successfully!</span>
               </div>`
            : `<div class="status-error">
                <span class="status-icon">❌</span>
                <span>Cloud restore failed. Please try again.</span>
               </div>`;

        if (success) {
            // Show shutdown message after 2 seconds
            setTimeout(() => {
                statusDiv.innerHTML = `
                    <div class="status-success">
                        <span class="status-icon">🔄</span>
                        <span>Shutting down application... <br>
                        Please restart the application</span>
                    </div>
                `;
                
                // Shutdown the application after 3 seconds
                setTimeout(() => {
                    ipcRenderer.send('exit-app');
                }, 3000);
            }, 2000);
        } else {
            setTimeout(() => {
                statusDiv.style.display = 'none';
                message.innerText = 'Click the button above to start the cloud restore process.';
            }, 5000);
        }
    });

    // Local restore completion handler
    ipcRenderer.on('restore-local-completed', (event, success, filePath) => {
        localRestoreButton.disabled = false;
        localRestoreButton.textContent = 'Restore from Local File';
        
        localStatusDiv.innerHTML = success
            ? `<div class="status-success">
                <span class="status-icon">✅</span>
                <span>Local restore completed successfully!<br>
                <small style="opacity: 0.8;">Restored from: ${filePath || 'Selected file'}</small></span>
               </div>`
            : `<div class="status-error">
                <span class="status-icon">❌</span>
                <span>Local restore failed. Please try again.</span>
               </div>`;

        if (success) {
            // Show shutdown message after 2 seconds
            setTimeout(() => {
                localStatusDiv.innerHTML = `
                    <div class="status-success">
                        <span class="status-icon">🔄</span>
                        <span>Shutting down application... <br>
                        Please restart the application</span>
                    </div>
                `;
                
                // Shutdown the application after 3 seconds
                setTimeout(() => {
                    ipcRenderer.send('exit-app');
                }, 3000);
            }, 2000);
        } else {
            setTimeout(() => {
                localStatusDiv.style.display = 'none';
                localMessage.innerText = 'Click the button above to select and restore a local backup.';
            }, 5000);
        }
    });
}

module.exports = { loadRestoreUI };
