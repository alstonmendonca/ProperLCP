const { app, BrowserWindow } = require('electron');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');

// Function to get the appropriate file path (user data if exists, otherwise resources)
function getFilePath(filename) {
    const userDataPath = app.getPath('userData');
    const userDataFile = path.join(userDataPath, filename);
    const resourceFile = app.isPackaged
        ? path.join(process.resourcesPath, filename)
        : path.join(__dirname, filename);
    
    // Prefer user data file if it exists, otherwise fall back to resources
    return fs.existsSync(userDataFile) ? userDataFile : resourceFile;
}

const envPath = getFilePath('.env');
dotenv.config({path:envPath});
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// ✅ Prevent multiple auth windows from opening
let authInProgress = false;

async function createAuthWindow(authUrl) {
  const authWin = new BrowserWindow({
    width: 500,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
    },
  });
  authWin.loadURL(authUrl);
  
}

async function getAccessTokenViaElectron() {
    if (authInProgress) {
      return Promise.reject(new Error('Authorization already in progress.'));
    }
  
    authInProgress = true;
  
    const appServer = express();
    let authWin;  // Declare authWin here to close it later
  
    return new Promise((resolve, reject) => {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
  
      // Create the authorization window
      authWin = new BrowserWindow({
        width: 500,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
        },
      });
      authWin.loadURL(authUrl);
      // ✅ Detect manual window closure
      authWin.on('closed', () => {
        if (authInProgress) {
          authInProgress = false;
          reject(new Error('Authorization window closed by user.'));
        }
      });
      const server = appServer.listen(3000, () => {
        // At this point, the auth window should be open and ready
      });
  
      // Handle the callback after the user grants permission
      appServer.get('/oauth2callback', async (req, res) => {
        const code = req.query.code;
  
        // Close the Express server after receiving the callback
        server.close();
  
        try {
          // Get the tokens using the provided authorization code
          const { tokens } = await oAuth2Client.getToken(code);
          oAuth2Client.setCredentials(tokens);
          authInProgress = false;
  
          // Close the auth window once we have the token
          if (authWin) {
            authWin.close(); // Ensure the auth window is closed here
          }
  
          resolve(oAuth2Client);  // Resolve with the OAuth client
        } catch (err) {
          authInProgress = false;
          console.error('Error during authorization:', err);
          if (authWin) {
            authWin.close(); // Close the window if there was an error
          }
          reject(err);  // Reject the promise if something goes wrong
        }
      });
    });
  }
  

async function getOrCreateBackupFolder(drive, folderName) {
  const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  const folder = await drive.files.create({
    resource: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });

  return folder.data.id;
}

function getFormattedTimestamp() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
}

async function backupLCdb(dbPath = null) {
  try {
    await app.whenReady();

    const auth = await getAccessTokenViaElectron();
    const drive = google.drive({ version: 'v3', auth });

    const folderId = await getOrCreateBackupFolder(drive, 'LassiCornerDatabaseBackups');

    const timestamp = getFormattedTimestamp();
    const fileName = `DatabaseBackup-${timestamp}.db`;

    // Use provided path or fall back to default logic
    const filePath = dbPath || (app.isPackaged 
      ? path.join(app.getPath('userData'), 'LC.db')  // User data for packaged app
      : path.join(process.resourcesPath, 'LC.db'));   // Resources for dev

    console.log(`🔄 Backing up database from: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Database file not found at: ${filePath}`);
    }

    const media = {
      mimeType: 'application/octet-stream',
      body: fs.createReadStream(filePath),
    };

    await drive.files.create({
      resource: {
        name: fileName,
        parents: [folderId],
      },
      media,
      fields: 'id',
    });

    console.log(`✅ Backup uploaded as "${fileName}" to folder ID ${folderId}`);
    return true;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    return false;
  }
}

async function backupLCdbLocal(destinationPath) {
  try {
    await app.whenReady();

    // Get the source database path
    const userDataPath = app.getPath('userData');
    const sourceDbPath = path.join(userDataPath, 'LC.db');

    console.log(`🔄 Backing up database from: ${sourceDbPath}`);
    console.log(`📁 Saving to: ${destinationPath}`);
    
    if (!fs.existsSync(sourceDbPath)) {
      throw new Error(`Database file not found at: ${sourceDbPath}`);
    }

    // Ensure the destination directory exists
    const destDir = path.dirname(destinationPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Copy the database file
    await fs.promises.copyFile(sourceDbPath, destinationPath);

    console.log(`✅ Local backup saved successfully to: ${destinationPath}`);
    return true;
  } catch (error) {
    console.error('❌ Local backup failed:', error);
    return false;
  }
}

module.exports = {
  backupLCdb,
  backupLCdbLocal,
  getAccessTokenViaElectron,
  getOrCreateBackupFolder,
};
