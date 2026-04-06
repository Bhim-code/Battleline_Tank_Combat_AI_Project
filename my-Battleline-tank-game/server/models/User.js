/* ============================================================
   models/User.js — MongoDB user schema
   ============================================================ */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }   // bcrypt hash, never plain text
  },
  { timestamps: true }   // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model('User', userSchema);
