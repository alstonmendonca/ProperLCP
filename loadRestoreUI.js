const { ipcRenderer } = require("electron");

function loadRestoreUI(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    mainContent.innerHTML = `
        <style>
            .restore-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                padding: 40px;
                font-family: Arial, sans-serif;
            }

            .section-title h2 {
                margin-bottom: 30px;
                color: #333;
            }

            #restoreButton {
                padding: 12px 24px;
                font-size: 16px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                transition: background-color 0.3s ease;
            }

            #restoreButton:hover {
                background-color: #0056b3;
            }

            #restoreMessage {
                margin-top: 20px;
                font-size: 14px;
                color: #555;
            }

            #restoreStatus {
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
                border-top: 4px solid #007bff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>

        <div class="restore-container">
            <div class='section-title'>
            
                <h2><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down-from-line-icon lucide-arrow-down-from-line"><path d="M19 3H5"/><path d="M12 21V7"/><path d="m6 15 6 6 6-6"/></svg>Restore Database</h2>
            </div>
            <button id="restoreButton">Restore Database</button>
            <p id="restoreMessage">Click the button to restore your database.</p>
            <div id="restoreStatus">
                <div class="spinner"></div>
                <p>Authorizing and restoring...</p>
            </div>
        </div>
    `;

    const restoreButton = document.getElementById('restoreButton');
    const statusDiv = document.getElementById('restoreStatus');
    const message = document.getElementById('restoreMessage');

    restoreButton.addEventListener('click', () => {
        message.innerText = '';
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = `
            <div class="spinner"></div>
            <p>Authorizing and restoring...</p>
        `;

        ipcRenderer.send('restore-database');
    });

    ipcRenderer.on('restore-completed', (event, success) => {
        statusDiv.innerHTML = success
            ? `<p style="color:green;">✅ Restore completed successfully!</p>`
            : `<p style="color:red;">❌ Restore failed. Please try again.</p>`;

        // Hide spinner message after 5 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
            message.innerText = 'Click the button to restore your database.';
        }, 5000);
    });
}

module.exports = { loadRestoreUI };
