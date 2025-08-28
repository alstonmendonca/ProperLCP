const { app } = require('electron');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// You must import or define these two if you're using them from backup.js:
const { getAccessTokenViaElectron, getOrCreateBackupFolder } = require('./backup');

async function restoreLCdb(dbPath = null) {
    try {
        await app.whenReady();
        const auth = await getAccessTokenViaElectron();
        const drive = google.drive({ version: 'v3', auth });

        // Get folder ID
        const folderId = await getOrCreateBackupFolder(drive, 'LassiCornerDatabaseBackups');

        // Get list of backup files in the folder
        const res = await drive.files.list({
            q: `'${folderId}' in parents and mimeType='application/octet-stream' and trashed=false`,
            fields: 'files(id, name, createdTime, modifiedTime)',
            orderBy: 'modifiedTime desc', // or 'createdTime desc'
            pageSize: 1,
        });

        const latestFile = res.data.files[0];

        if (!latestFile) {
            console.log('❌ No backup files found.');
            return false;  // Return false if no backup file found
        }

        // Use provided path or fall back to default logic
        const destPath = dbPath || (app.isPackaged 
            ? path.join(app.getPath('userData'), 'LC.db')  // User data for packaged app
            : path.join(process.resourcesPath, 'LC.db'));   // Resources for dev

        console.log(`🔄 Restoring database to: ${destPath}`);
        
        // Ensure the directory exists
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        const dest = fs.createWriteStream(destPath);

        const download = await drive.files.get(
            { fileId: latestFile.id, alt: 'media' },
            { responseType: 'stream' }
        );

        await new Promise((resolve, reject) => {
            download.data
                .on('end', () => {
                    console.log(`✅ Restored "${latestFile.name}" to local LC.db`);
                    resolve();
                })
                .on('error', (err) => {
                    console.error('❌ Error downloading file:', err);
                    reject(err);
                })
                .pipe(dest);
        });

        return true;  // Return true if restore is successful
    } catch (error) {
        console.error('❌ Restore failed:', error);
        return false;  // Return false if error occurs
    }
}

module.exports = { restoreLCdb };
