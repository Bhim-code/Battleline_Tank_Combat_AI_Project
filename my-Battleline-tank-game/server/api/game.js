/* ============================================================
   api/game.js — /api/game routes: save score and load stats
   ============================================================ */

const express = require('express');
const router = express.Router();
const GameStats = require('../models/GameStats');
const { isScorePlausible } = require('../game/scoreService');
const { protect } = require('../utils/middleware');

function sanitizeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

router.post('/save', protect, async (req, res) => {
  try {
    const score = Math.max(0, Math.floor(sanitizeNumber(req.body.score, 0)));
    const kills = Math.max(0, Math.floor(sanitizeNumber(req.body.kills, 0)));
    const wave = Math.max(1, Math.floor(sanitizeNumber(req.body.wave, 1)));
    const userId = req.user.id;

    if (!isScorePlausible(score, kills, wave)) {
      return res.status(400).json({ message: 'Submitted score looks invalid.' });
    }

    let stats = await GameStats.findOne({ user: userId });
    if (!stats) stats = new GameStats({ user: userId });

    stats.latestScore = score;
    stats.highScore = Math.max(stats.highScore, score);
    stats.totalKills += kills;
    stats.bestWave = Math.max(stats.bestWave, wave);
    stats.gamesPlayed += 1;
    stats.sessions.push({ score, kills, wave, playedAt: new Date() });
    if (stats.sessions.length > 20) stats.sessions = stats.sessions.slice(-20);

    await stats.save();

    res.json({
      message: 'Score saved.',
      highScore: stats.highScore,
      gamesPlayed: stats.gamesPlayed
    });
  } catch (err) {
    console.error('[Game] Save error:', err.message);
    res.status(500).json({ message: 'Failed to save score.' });
  }
});

router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await GameStats.findOne({ user: req.user.id });

    if (!stats) {
      return res.json({
        highScore: 0,
        latestScore: 0,
        totalKills: 0,
        bestWave: 1,
        gamesPlayed: 0,
        sessions: []
      });
    }

    res.json({
      highScore: stats.highScore,
      latestScore: stats.latestScore,
      totalKills: stats.totalKills,
      bestWave: stats.bestWave,
      gamesPlayed: stats.gamesPlayed,
      sessions: [...stats.sessions].reverse()
    });
  } catch (err) {
    console.error('[Game] Stats error:', err.message);
    res.status(500).json({ message: 'Failed to load stats.' });
  }
});

module.exports = router;
