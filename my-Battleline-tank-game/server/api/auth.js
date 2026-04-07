/* ============================================================
   api/auth.js — /api/auth routes: signup and login
   ============================================================ */

const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { hashPassword, verifyPassword, signToken } = require('../utils/auth');

// ── POST /api/auth/signup ─────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Check if email already registered
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'This email is already registered.' });
    }

    // Hash password and create user
    const hashed = await hashPassword(password);
    const user   = await User.create({ name, email, password: hashed });

    const token = signToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('[Auth] Signup error:', err.message);
    res.status(500).json({ message: 'Server error during signup.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const match = await verifyPassword(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;
