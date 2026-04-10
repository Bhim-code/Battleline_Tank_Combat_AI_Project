/* ============================================================
   models/GameStats.js — Per-user game stats and session history
   ============================================================ */

const mongoose = require('mongoose');

// One record per individual game session
const sessionSchema = new mongoose.Schema({
  score:    { type: Number, default: 0 },
  kills:    { type: Number, default: 0 },
  wave:     { type: Number, default: 1 },
  playedAt: { type: Date,   default: Date.now }
}, { _id: false });

// One document per user — updated after every game
const gameStatsSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    highScore:   { type: Number, default: 0 },
    latestScore: { type: Number, default: 0 },
    totalKills:  { type: Number, default: 0 },
    bestWave:    { type: Number, default: 1  },
    gamesPlayed: { type: Number, default: 0  },
    sessions:    { type: [sessionSchema], default: [] }  // last 20 sessions kept
  },
  { timestamps: true }
);

module.exports = mongoose.model('GameStats', gameStatsSchema);
