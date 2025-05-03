const { ipcRenderer } = require("electron");

function loadBackupUI(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
            mainContent.style.marginRight = "0px";
            billPanel.style.display = 'none';

            mainContent.innerHTML = `
                <div class='section-title'>
                    <h2>BACK UP DATABASE</h2>
                </div>
                <button id="backupButton">Back Up Database</button>
                <p id="backupMessage">Click the button to back up your database.</p>
            `;

            const backupButton = document.getElementById('backupButton');

            // Backup button click handler
            backupButton.addEventListener('click', () => {
                const message = document.getElementById('backupMessage');
                message.innerText = 'Backing up... Please wait.';

                // Trigger backup process from main process
                ipcRenderer.send('backup-database');
            });

            // Listen for the completion response from the main process
            ipcRenderer.once('backup-completed', (event, success) => {
                const message = document.getElementById('backupMessage');
                message.innerText = success
                    ? '✅ Backup completed successfully!'
                    : '❌ Backup failed. Please try again.';
            });
}
module.exports = {loadBackupUI};