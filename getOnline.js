const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { exec } = require('child_process');
const axios = require('axios');
const net = require('net');
require('dotenv').config();


const MAX_RESTART_ATTEMPTS = 5;

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let connectedClients = [];

// Utility to delay for ms milliseconds
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function getRandomPort(min = 10024, max = 65535) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const PORT = getRandomPort();


wss.on('connection', (ws) => {
  console.log('Backend server connected via WebSocket');
  connectedClients.push(ws);

  // Optional: store last pong timestamp if needed
  ws.isAlive = true;

  // Respond to pings from the backend
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Periodically send pings
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      if (!ws.isAlive) {
        console.log('Client not responding to ping, terminating...');
        clearInterval(pingInterval);
        ws.terminate(); // forcefully close the connection
        connectedClients = connectedClients.filter(c => c !== ws);
        return;
      }

      ws.isAlive = false;
      ws.ping();
    }
  }, 30000); // every 30 seconds

  // Cleanup on close
  ws.on('close', () => {
    console.log('Backend server disconnected');
    clearInterval(pingInterval);
    connectedClients = connectedClients.filter((c) => c !== ws);
  });

  ws.on('message', (msg) => {
    try {
      const message = JSON.parse(msg);
      if (message.event === 'newOrder') {
        console.log('Received new order:', message.data);

        // Send message to parent process (main) so it can save to DB
        if (process.send) {
          process.send({
            type: 'newOrder',
            data: message.data,
          });
        }

      } else {
        console.log('Message from backend:', msg.toString());
      }
    } catch (e) {
      console.log('Malformed message:', msg.toString());
    }
  });
});

async function getFreePort(startPort = getRandomPort()) {
  let port = startPort;
  while (true) {
    try {
      await new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', reject);
        server.once('listening', () => {
          server.close(() => resolve());
        });
        server.listen(port);
      });
      return port;
    } catch {
      port++;
      if (port > 65535) throw new Error('No free ports available');
    }
  }
}


// Function to start the tunnel and handle communication
async function startTunnel(restartAttempt = 0) {
  if (restartAttempt > MAX_RESTART_ATTEMPTS) {
    console.error('Max tunnel restart attempts reached. Giving up.');
    return;
  }

  console.log(`Starting Cloudflare tunnel (attempt ${restartAttempt + 1})`);

  const metricsPort = await getFreePort();
  console.log(`Using metrics port: ${metricsPort}`);

  const tunnelCmd = `npx cloudflared tunnel --url http://localhost:${PORT} --metrics localhost:${metricsPort}`;
  const tunnelProcess = exec(tunnelCmd);

  let tunnelUrlSent = false;

  tunnelProcess.stderr.on('data', async (data) => {
    const text = data.toString();
    console.error(`Tunnel stderr: ${text}`);

    if (tunnelUrlSent) return;

    const urlMatch = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (urlMatch) {
      tunnelUrlSent = true;
      const tunnelUrl = urlMatch[0];
      console.log('Tunnel URL:', tunnelUrl);

      if (!process.env.ONLINE_SERVER_URL) {
        console.error('Error: ONLINE_SERVER_URL environment variable is not set');
        return;
      }

      try {
        console.log('Waiting 10 seconds before sending tunnel URL to backend...');
        await delay(10000); // Wait 10 seconds

        console.log("Sending tunnel URL to backend at:", process.env.ONLINE_SERVER_URL);
        await axios.post(`${process.env.ONLINE_SERVER_URL}/api/register-electron-tunnel`, {
          wsUrl: tunnelUrl.replace('https://', 'wss://'),
        });
        console.log('Tunnel URL sent to backend successfully');
      } catch (err) {
        console.error('Failed to send tunnel URL:', err.message, err.response?.data || '');
      }
    }
  });

  tunnelProcess.on('exit', async (code, signal) => {
    console.log(`Tunnel process exited with code ${code} signal ${signal}`);
    connectedClients.forEach(ws => ws.close(1011, 'Tunnel process stopped'));
    connectedClients = [];

    console.log('Restarting tunnel after exit...');
    await delay(5000); // Wait a bit before restarting
    startTunnel(restartAttempt + 1);
  });

  tunnelProcess.on('error', async (err) => {
    console.error('Tunnel process error:', err);
    connectedClients.forEach(ws => ws.close(1011, 'Tunnel process error'));
    connectedClients = [];

    console.log('Restarting tunnel after error...');
    await delay(5000); // Wait a bit before restarting
    startTunnel(restartAttempt + 1);
  });

  return tunnelProcess;
}

server.listen(PORT, async () => {
  console.log(`Local WebSocket server running on port ${PORT}`);
  startTunnel();
});
