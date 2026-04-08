/* ============================================================
   api/users.js — /api/users routes: profile
   ============================================================ */

const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');
const { protect } = require('../utils/middleware');

// ── GET /api/users/profile ────────────────────────────────────
// Returns the logged-in user's name, email, and join date.
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({
      id:        user._id,
      name:      user.name,
      email:     user.email,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error('[Users] Profile error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
