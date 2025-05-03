const { ipcRenderer } = require("electron");

function loadRestoreUI(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
            mainContent.style.marginRight = "0px";
            billPanel.style.display = 'none';
        
            mainContent.innerHTML = `
                <div class='section-title'>
                    <h2>RESTORE DATABASE</h2>
                </div>
                <button id="restoreButton">Restore Database</button>
                <p id="restoreMessage">Click the button to restore your database.</p>
            `;
        
            const restoreButton = document.getElementById('restoreButton');
        
            // Restore button click handler
            restoreButton.addEventListener('click', () => {
                const message = document.getElementById('restoreMessage');
                message.innerText = 'Restoring... Please wait.';
        
                // Trigger restore process from main process
                ipcRenderer.send('restore-database');
            });
        
            // Listen for the completion response from the main process
            ipcRenderer.once('restore-completed', (event, success) => {
                const message = document.getElementById('restoreMessage');
                message.innerText = success
                    ? '✅ Restore completed successfully!'
                    : '❌ Restore failed. Please try again.';
            });
}
module.exports = {loadRestoreUI};