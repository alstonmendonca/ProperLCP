// startMongoExpress.js
// Express wrapper used by the packaged exe. Uses bcryptjs (pure JS) instead of native bcrypt.

console.log('[startMongoExpress] starting script. pid=', process.pid, 'cwd=', __dirname, 'env.MONGO_PORT=', process.env.MONGO_PORT);

// quick module existence checks (fail fast with clear message)
try {
  require.resolve('mongodb');
  require.resolve('bcryptjs');
  console.log('[startMongoExpress] required modules found: mongodb, bcryptjs');
} catch (err) {
  console.error('[startMongoExpress] missing module:', err && err.code ? err.code : err);
  console.error(err);
  process.exit(1);
}

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs'); // pure-JS bcrypt replacement
const app = express();
const fs = require('fs');
const path = require('path');

app.use(express.json());

// Prefer environment port; fallback to same default you used earlier
const MONGO_PORT = Number(process.env.MONGO_PORT || 34235);

// Use your Atlas connection string - keep it in env for production ideally
const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://lassicornersjec:u08BVrU1pMIUajtJ@lassicorner.uusow64.mongodb.net/';

let db;

// connect with a short serverSelectionTimeout so we fail fast on network/SSL issues
async function connectToMongo() {
  const opts = {
    serverSelectionTimeoutMS: 10000, // 10s
    // tls is enabled by default for mongodb+srv but explicitly set if desired:
    // tls: true
  };

  const client = new MongoClient(MONGO_URL, opts);

  try {
    await client.connect();
    db = client.db('LC');
    console.log('[startMongoExpress] ✅ Connected to MongoDB');
  } catch (err) {
    console.error('[startMongoExpress] Failed to connect to MongoDB:', err && err.message ? err.message : err);
    // show full error for debugging
    console.error(err);
    process.exit(1); // exit with non-zero so parent process sees the failure
  }
}

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const user = await db.collection('LCPUsers').findOne({ username });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const hash = user.password_hash;

    if (!hash || (Array.isArray(hash) && hash.length === 0)) {
      return res.status(401).json({ success: false, message: 'No password hash set for user' });
    }

    // bcryptjs: use compareSync for simplicity in this script
    const match = bcrypt.compareSync(password, hash);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      user: {
        name: user.uname,
        role: user.isadmin === 1 ? 'admin' : 'staff',
        username: user.username,
        userid: user.userid,
        email: user.email
      }
    });
  } catch (err) {
    console.error('[startMongoExpress] Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

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
    console.error('[startMongoExpress] order status error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/sync/fooditems', async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Request body must be an array of food items' });
    }

    const collection = db.collection('FoodItem');
    await collection.deleteMany({});

    const docs = items.map(item => ({
      fid: item.fid,
      fname: item.fname,
      category: item.category,
      cost: item.cost,
      sgst: item.sgst,
      cgst: item.cgst,
      tax: item.tax,
      active: item.active === 1,
      is_on: item.is_on === 1,
      veg: item.veg === 1,
      depend_inv: item.depend_inv ? item.depend_inv.split(',').map(x => parseInt(x, 10)) : [],
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const result = await collection.insertMany(docs);

    res.json({
      success: true,
      message: `Synced ${result.insertedCount} food items to MongoDB.`
    });
  } catch (err) {
    console.error('[startMongoExpress] Error syncing food items:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/sync/categories', async (req, res) => {
  try {
    const categories = req.body;
    if (!Array.isArray(categories)) {
      return res.status(400).json({ success: false, message: 'Request body must be an array of categories' });
    }

    const collection = db.collection('Category');
    await collection.deleteMany({});

    const docs = categories.map(cat => ({
      catid: cat.catid,
      catname: cat.catname,
      active: cat.active,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const result = await collection.insertMany(docs);

    res.json({
      success: true,
      message: `Synced ${result.insertedCount} categories to MongoDB.`
    });
  } catch (err) {
    console.error('[startMongoExpress] Error syncing categories:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const collection = db.collection('LCPUsers');
    const users = await collection.find({}, { projection: { _id: 0, password_hash: 0 } }).toArray();

    res.json({ success: true, users });
  } catch (err) {
    console.error('[startMongoExpress] Error fetching users:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/edituser', async (req, res) => {
  try {
    const { userid, name, email, username } = req.body;

    if (!userid || !name || !email || !username) {
      return res.status(400).json({ success: false, message: 'User ID, name, email, and username are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const existingEmailUser = await db.collection('LCPUsers').findOne({ email: email, userid: { $ne: userid } });
    if (existingEmailUser) {
      return res.status(400).json({ success: false, message: 'Email address is already in use by another user' });
    }

    const existingUsernameUser = await db.collection('LCPUsers').findOne({ username: username, userid: { $ne: userid } });
    if (existingUsernameUser) {
      return res.status(400).json({ success: false, message: 'Username is already taken by another user' });
    }

    const result = await db.collection('LCPUsers').updateOne(
      { userid: userid },
      { $set: { uname: name, username: username, email: email, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (result.modifiedCount === 0) {
      return res.status(200).json({ success: true, message: 'No changes were made to the profile' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully. Please login again.',
      user: { userid, name, username, email }
    });
  } catch (err) {
    console.error('[startMongoExpress] Error updating user profile:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Start server after connecting to Mongo
connectToMongo()
  .then(() => {
    app.listen(MONGO_PORT, '127.0.0.1', () => {
      console.log(`[startMongoExpress] 🚀 Express server running on http://127.0.0.1:${MONGO_PORT}`);
    });
  })
  .catch(err => {
    console.error('[startMongoExpress] Failed to connect to MongoDB', err);
    process.exit(1);
  });

// crash handlers so child exits with log
process.on('uncaughtException', (err) => {
  console.error('[startMongoExpress] uncaughtException:', err && err.stack ? err.stack : err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('[startMongoExpress] unhandledRejection:', err && err.stack ? err.stack : err);
  process.exit(1);
});
