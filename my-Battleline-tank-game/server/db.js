/* ============================================================
   db.js — MongoDB connection via Mongoose
   ============================================================ */

const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/tankfrontline';

  try {
    await mongoose.connect(uri);
    console.log(`[DB] MongoDB connected: ${uri}`);
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
