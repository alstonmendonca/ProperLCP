const { ipcRenderer } = require("electron");

function loadBackupUI(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    mainContent.innerHTML = `
        <style>
            .backup-container {
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

            .backup-card {
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

            .backup-description {
                color: #7f8c8d;
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 40px;
                max-width: 400px;
            }

            #backupButton, #localBackupButton {
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

            #backupButton:hover, #localBackupButton:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 35px rgba(13, 59, 102, 0.4);
            }

            #backupButton:active, #localBackupButton:active {
                transform: translateY(0);
                box-shadow: 0 6px 20px rgba(13, 59, 102, 0.3);
            }

            #backupButton:disabled, #localBackupButton:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
            }

            #backupMessage, #localBackupMessage {
                margin-top: 30px;
                font-size: 15px;
                color: #95a5a6;
                font-weight: 500;
            }

            #backupStatus {
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

            #localBackupStatus {
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

            .backup-info {
                margin-top: 30px;
                padding: 20px;
                background: rgba(13, 59, 102, 0.05);
                border-radius: 15px;
                border-left: 4px solid #0D3B66;
            }

            .backup-info h3 {
                margin: 0 0 10px 0;
                color: #2c3e50;
                font-size: 18px;
                font-weight: 600;
            }

            .backup-info p {
                margin: 0;
                color: #7f8c8d;
                font-size: 14px;
                line-height: 1.5;
            }

            @media (max-width: 1200px) {
                .backup-container {
                    flex-direction: column;
                    align-items: center;
                }
                
                .backup-card {
                    max-width: 500px;
                    min-width: auto;
                }
            }

            @media (max-width: 768px) {
                .backup-container {
                    padding: 30px 20px;
                    flex-direction: column;
                }
                
                .backup-card {
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

        <div class="backup-container">
            <div class="backup-card">
                <div class="card-content-top">
                    <div class='section-title'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-upload-icon lucide-cloud-upload"><path d="M12 13v8"/><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="m8 17 4-4 4 4"/></svg>
                        <h2>Cloud Database Backup</h2>
                    </div>
                    
                    <p class="backup-description">
                        Backup your local database file to your Google Drive.
                        Login and authorize to your Google Account to start the backup process.
                    </p>
                    
                    <button id="backupButton">Create Cloud Backup</button>
                    
                    <p id="backupMessage">Click the button above to start the cloud backup process.</p>
                    
                    <div id="backupStatus">
                        <div class="spinner"></div>
                        <p>Authorizing and uploading your database...</p>
                    </div>
                </div>
                
                <div class="backup-info">
                    <h3>What gets backed up?</h3>
                    <p>• All customer data and order history<br>
                    • Product inventory and categories<br>
                    • Sales and analytics data</p>
                </div>
            </div>

            <div class="backup-card">
                <div class="card-content-top">
                    <div class='section-title'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hard-drive"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>
                        <h2>Local Database Backup</h2>
                    </div>
                    
                    <p class="backup-description">
                        Save your database file to your local computer.
                        Choose where to save your backup file for safekeeping.
                    </p>
                    
                    <button id="localBackupButton">Create Local Backup</button>
                    
                    <p id="localBackupMessage">Click the button above to save a local backup.</p>
                    
                    <div id="localBackupStatus">
                        <div class="spinner"></div>
                        <p>Saving database to your computer...</p>
                    </div>
                </div>
                
                <div class="backup-info">
                    <h3>Local Backup Benefits</h3>
                    <p>• Quick and offline backup solution<br>
                    • Full control over backup location<br>
                    • No internet connection required</p>
                </div>
            </div>
        </div>
    `;

    const backupButton = document.getElementById('backupButton');
    const statusDiv = document.getElementById('backupStatus');
    const message = document.getElementById('backupMessage');
    
    // Local backup elements
    const localBackupButton = document.getElementById('localBackupButton');
    const localStatusDiv = document.getElementById('localBackupStatus');
    const localMessage = document.getElementById('localBackupMessage');

    backupButton.addEventListener('click', () => {
        message.innerText = '';
        backupButton.disabled = true;
        backupButton.textContent = 'Creating Cloud Backup...';
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = `
            <div class="spinner"></div>
            <p>Authorizing and uploading your database...</p>
        `;

        ipcRenderer.send('backup-database');
    });

    // Local backup button event listener
    localBackupButton.addEventListener('click', () => {
        localMessage.innerText = '';
        localBackupButton.disabled = true;
        localBackupButton.textContent = 'Creating Local Backup...';
        localStatusDiv.style.display = 'block';
        localStatusDiv.innerHTML = `
            <div class="spinner"></div>
            <p>Saving database to your computer...</p>
        `;

        ipcRenderer.send('backup-database-local');
    });

    ipcRenderer.removeAllListeners('backup-completed');
    ipcRenderer.removeAllListeners('backup-local-completed');

    ipcRenderer.on('backup-completed', (event, success) => {
        backupButton.disabled = false;
        backupButton.textContent = 'Create Cloud Backup';
        
        statusDiv.innerHTML = success
            ? `<div class="status-success">
                <span class="status-icon">✅</span>
                <span>Cloud backup completed successfully!</span>
               </div>`
            : `<div class="status-error">
                <span class="status-icon">❌</span>
                <span>Cloud backup failed. Please try again.</span>
               </div>`;

        if (success) {
            // Show shutdown message after 2 seconds
            setTimeout(() => {
                statusDiv.innerHTML = `
                    <div class="status-success">
                        <span class="status-icon">🔄</span>
                        <span>Shutting down application...<br>  
                        Please Restart the Application</span>
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
                message.innerText = 'Click the button above to start the cloud backup process.';
            }, 5000);
        }
    });

    // Local backup completion handler
    ipcRenderer.on('backup-local-completed', (event, success, filePath) => {
        localBackupButton.disabled = false;
        localBackupButton.textContent = 'Create Local Backup';
        
        localStatusDiv.innerHTML = success
            ? `<div class="status-success">
                <span class="status-icon">✅</span>
                <span>Local backup saved successfully!<br>
                <small style="opacity: 0.8;">Saved to: ${filePath || 'Selected location'}</small></span>
               </div>`
            : `<div class="status-error">
                <span class="status-icon">❌</span>
                <span>Local backup failed. Please try again.</span>
               </div>`;

        setTimeout(() => {
            localStatusDiv.style.display = 'none';
            localMessage.innerText = 'Click the button above to save a local backup.';
        }, 5000);
    });
}

module.exports = { loadBackupUI };
