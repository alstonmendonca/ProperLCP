// startMongoExpress.js
// Express wrapper used by the packaged exe. Uses bcryptjs (pure JS) instead of native bcrypt.
//always convert to pkg exe using pkg startMongoExpress.js --target node18-win-x64 --output startMongoExpress.exe

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

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

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

app.post('/change-password', async (req, res) => {
  try {
    const { userid, currentPassword, newPassword } = req.body;

    if (!userid || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'User ID, current password, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    // Find the user
    const user = await db.collection('LCPUsers').findOne({ userid: userid });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const currentHash = user.password_hash;
    if (!currentHash || (Array.isArray(currentHash) && currentHash.length === 0)) {
      return res.status(400).json({ success: false, message: 'No password set for user' });
    }

    const isCurrentPasswordValid = bcrypt.compareSync(currentPassword, currentHash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash the new password
    const saltRounds = 12;
    const newPasswordHash = bcrypt.hashSync(newPassword, saltRounds);

    // Update the password
    const result = await db.collection('LCPUsers').updateOne(
      { userid: userid },
      { $set: { password_hash: newPasswordHash, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ success: false, message: 'Failed to update password' });
    }

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again with your new password.'
    });
  } catch (err) {
    console.error('[startMongoExpress] Error changing password:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/add-user', async (req, res) => {
  try {
    const { name, username, email, password, role, adminUserId } = req.body;

    if (!name || !username || !email || !password || !role || !adminUserId) {
      return res.status(400).json({ success: false, message: 'Name, username, email, password, role, and admin user ID are required' });
    }

    // Verify the requesting user is an admin
    const adminUser = await db.collection('LCPUsers').findOne({ userid: adminUserId });
    if (!adminUser || adminUser.isadmin !== 1) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    if (!['admin', 'staff'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be either "admin" or "staff"' });
    }

    // Check if username already exists
    const existingUsername = await db.collection('LCPUsers').findOne({ username: username });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    // Check if email already exists
    const existingEmail = await db.collection('LCPUsers').findOne({ email: email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email address is already in use' });
    }

    // Generate new userid - find the highest existing userid and increment
    const lastUser = await db.collection('LCPUsers').findOne({}, { sort: { userid: -1 } });
    const newUserId = lastUser ? lastUser.userid + 1 : 1;

    // Hash the password
    const saltRounds = 12;
    const passwordHash = bcrypt.hashSync(password, saltRounds);

    // Create new user object
    const newUser = {
      userid: newUserId,
      uname: name,
      username: username,
      email: email,
      password_hash: passwordHash,
      isadmin: role === 'admin' ? 1 : 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the new user
    const result = await db.collection('LCPUsers').insertOne(newUser);

    if (!result.insertedId) {
      return res.status(500).json({ success: false, message: 'Failed to create user' });
    }

    res.json({
      success: true,
      message: 'User created successfully!',
      user: {
        userid: newUserId,
        name: name,
        username: username,
        email: email,
        role: role
      }
    });
  } catch (err) {
    console.error('[startMongoExpress] Error creating user:', err);
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
