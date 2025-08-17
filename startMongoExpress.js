// startMongoExpressserver.js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const bcrypt = require('bcrypt');
const app = express();
const dotenv = require('dotenv');
const fs = require('fs');
app.use(express.json());
// Only main.js has access to app, so we need relative path in child
const envPath = process.env.APP_ENV_PATH || path.join(__dirname, ".env");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`✅ Child loaded env from: ${envPath}`);
} else {
  console.warn(`⚠️ Child .env not found at: ${envPath}`);
}

const MONGO_PORT = process.env.MONGO_PORT;
const MONGO_URL = process.env.MONGO_DB_URL;

let db;

async function connectToMongo() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db('LC'); // your DB name
  console.log('✅ Connected to MongoDB');
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

    // Skip hash check if hash is missing or empty (for development/test only)
    if (!hash || (Array.isArray(hash) && hash.length === 0)) {
      return res.status(401).json({ success: false, message: 'No password hash set for user' });
    }

    const match = await bcrypt.compare(password, hash);

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
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
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

// after your other app.* routes, before connectToMongo().then(...)
app.post('/sync/fooditems', async (req, res) => {
  try {
    const items = req.body; // expect an array of { fid, fname, category, cost, sgst, cgst, tax, active, is_on, veg, depend_inv }
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Request body must be an array of food items' });
    }

    const collection = db.collection('FoodItem');

    // 1. Remove all existing documents
    await collection.deleteMany({});

    // 2. Map SQLite fields to your Mongo schema and insert
    const docs = items.map(item => ({
      fid:             item.fid,
      fname:           item.fname,
      category:        item.category,
      cost:            item.cost,
      sgst:            item.sgst,
      cgst:            item.cgst,
      tax:             item.tax,
      active:          item.active === 1,
      is_on:           item.is_on === 1,
      veg:             item.veg === 1,
      depend_inv:      item.depend_inv ? item.depend_inv.split(',').map(x => parseInt(x,10)) : [],
      createdAt:       new Date(),
      updatedAt:       new Date()
    }));

    const result = await collection.insertMany(docs);

    res.json({
      success: true,
      message: `Synced ${result.insertedCount} food items to MongoDB.`
    });
  } catch (err) {
    console.error('Error syncing food items:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all users except _id and password_hash
app.get('/users', async (req, res) => {
  try {
    const collection = db.collection('LCPUsers');
    
    // Projection to exclude _id and password_hash
    const users = await collection.find({}, { projection: { _id: 0, password_hash: 0 } }).toArray();

    res.json({
      success: true,
      users
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Edit user profile
app.post('/edituser', async (req, res) => {
  try {
    const { userid, name, email, username } = req.body;

    if (!userid || !name || !email || !username) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID, name, email, and username are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }

    // Check if email is already taken by another user
    const existingEmailUser = await db.collection('LCPUsers').findOne({ 
      email: email, 
      userid: { $ne: userid } 
    });

    if (existingEmailUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email address is already in use by another user' 
      });
    }

    // Check if username is already taken by another user
    const existingUsernameUser = await db.collection('LCPUsers').findOne({ 
      username: username, 
      userid: { $ne: userid } 
    });

    if (existingUsernameUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username is already taken by another user' 
      });
    }

    // Update user profile
    const result = await db.collection('LCPUsers').updateOne(
      { userid: userid },
      { 
        $set: { 
          uname: name,
          username: username,
          email: email,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (result.modifiedCount === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No changes were made to the profile' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Profile updated successfully. Please login again.',
      user: {
        userid: userid,
        name: name,
        username: username,
        email: email
      }
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
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
