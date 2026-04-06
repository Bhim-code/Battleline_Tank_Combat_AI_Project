/* ============================================================
   utils/auth.js — Password hashing and JWT helpers
   ============================================================ */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const SALT_ROUNDS = 10;

// Hash a plain-text password before storing in MongoDB
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// Compare a plain-text password against the stored hash
async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// Sign a JWT for the logged-in user
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '7d' }
  );
}

// Verify an incoming JWT and return the payload (throws on failure)
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken };
