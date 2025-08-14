const { ipcRenderer } = require("electron");

function loadBackupUI(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    mainContent.innerHTML = `
        <style>
            .backup-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                padding: 40px;
                font-family: Arial, sans-serif;
            }

            .section-title {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 30px;
                color: #333;
            }

            /* Adjusting the SVG size */
            .section-title svg {
                width: 75px !important; /* Ensure the SVG has the desired size */
                height: 75px !important; /* Ensure the SVG has the desired size */

            }

            #backupButton {
                padding: 12px 24px;
                font-size: 16px;
                background-color: #0D3B66;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                transition: background-color 0.3s ease;
            }

            #backupButton:hover {
                background-color: #010a67ff;
            }

            #backupMessage {
                margin-top: 20px;
                font-size: 14px;
                color: #555;
            }

            #backupStatus {
                margin-top: 20px;
                display: none;
                font-size: 16px;
                color: #444;
                text-align: center;
            }

            .spinner {
                margin: 16px auto;
                width: 32px;
                height: 32px;
                border: 4px solid #ccc;
                border-top: 4px solid #28a745;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>

        <div class="backup-container">
            <div class='section-title'>
                <h2>                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-upload-icon lucide-cloud-upload"><path d="M12 13v8"/><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="m8 17 4-4 4 4"/></svg>
Back Up Database</h2>
            </div>
            <button id="backupButton">Back Up Database</button>
            <p id="backupMessage">Click the button to back up your database.</p>
            <div id="backupStatus">
                <div class="spinner"></div>
                <p>Authorizing and uploading...</p>
            </div>
        </div>
    `;


    const backupButton = document.getElementById('backupButton');
    const statusDiv = document.getElementById('backupStatus');
    const message = document.getElementById('backupMessage');

    backupButton.addEventListener('click', () => {
        message.innerText = '';
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = `
            <div class="spinner"></div>
            <p>Authorizing and uploading...</p>
        `;

        ipcRenderer.send('backup-database');
    });

    ipcRenderer.removeAllListeners('backup-completed');

    ipcRenderer.on('backup-completed', (event, success) => {
        statusDiv.innerHTML = success
            ? `<p style="color:green;">✅ Backup completed successfully!</p>`
            : `<p style="color:red;">❌ Backup failed. Please try again.</p>`;

        setTimeout(() => {
            statusDiv.style.display = 'none';
            message.innerText = 'Click the button to back up your database.';
        }, 5000);
    });
}

module.exports = { loadBackupUI };
