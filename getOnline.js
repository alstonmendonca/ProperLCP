const WebSocket = require('ws');
const fs = require('fs');
// Only main.js has access to app, so we need relative path in child
const envPath = process.env.APP_ENV_PATH || path.join(__dirname, ".env");
const dotenv = require('dotenv');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`✅ Child loaded env from: ${envPath}`);
} else {
  console.warn(`⚠️ Child .env not found at: ${envPath}`);
}
let socket;
let reconnectTimeout = null;
const RECONNECT_DELAY = 5000;

// Handle messages from server
function handleMessage(msg) {
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
      console.log('Message from server:', msg.toString());
    }
  } catch (e) {
    console.log('Malformed message:', msg.toString());
  }
}

// Connect to online backend WebSocket
function connectToBackend() {
  if (!process.env.ONLINE_SERVER_URL) {
    console.error('Missing ONLINE_SERVER_URL in .env');
    return;
  }

  console.log('Connecting to online backend WebSocket...');
  socket = new WebSocket(process.env.ONLINE_SERVER_URL);

  socket.on('open', () => {
    console.log('Connected to online backend WebSocket');
  });

  socket.on('message', handleMessage);

  socket.on('close', (code, reason) => {
    console.log(`WebSocket closed: ${code} - ${reason}`);
    attemptReconnect();
  });

  socket.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    attemptReconnect();
  });

  // Optional ping-pong keep-alive
  const pingInterval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.ping();
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);
}

function attemptReconnect() {
  if (reconnectTimeout) return;
  console.log(`Reconnecting in ${RECONNECT_DELAY / 1000} seconds...`);
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    connectToBackend();
  }, RECONNECT_DELAY);
}

// Start connection
connectToBackend();

// Optional: exit cleanup
process.on('SIGTERM', () => {
  console.log("Received SIGTERM. Cleaning up...");
  socket?.close();
  process.exit(0);
});
