// startMongoExpressserver.js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(express.json());

const MONGO_PORT = process.env.MONGO_PORT;
const MONGO_URL = process.env.MONGO_DB_URL;

let db;

async function connectToMongo() {
  const client = new MongoClient(MONGO_URL, { useUnifiedTopology: true });
  await client.connect();
  db = client.db('LC'); // your DB name
  console.log('✅ Connected to MongoDB');
}

// API to update order status
app.post('/order/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (![1, 2].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: 'Order not found or status unchanged' });
    }

    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Start server after connecting to Mongo
connectToMongo()
  .then(() => {
    app.listen(MONGO_PORT, () => {
      console.log(`🚀 Express server running on http://localhost:${MONGO_PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });
