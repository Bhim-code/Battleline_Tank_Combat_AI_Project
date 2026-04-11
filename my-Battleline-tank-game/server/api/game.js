/* ============================================================
   api/game.js — /api/game routes: save score and load stats
   ============================================================ */
const GameState = require('../models/GameState');
const express = require('express');
const router = express.Router();
const GameStats = require('../models/GameStats');
const { isScorePlausible } = require('../game/scoreService');
const { protect } = require('../utils/middleware');

function sanitizeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}
function sanitizeList(list, limit) {
  return Array.isArray(list) ? list.slice(0, limit) : [];
}

function sanitizeCheckpoint(body = {}) {
  const level = Math.max(1, Math.floor(sanitizeNumber(body.level, 1)));
  const score = Math.max(0, Math.floor(sanitizeNumber(body.score, 0)));
  const kills = Math.max(0, Math.floor(sanitizeNumber(body.kills, 0)));
  const status = ['ready', 'running', 'paused', 'lost'].includes(body.status) ? body.status : 'paused';

  return {
    active: true,
    status,
    level,
    score,
    kills,
    message: typeof body.message === 'string' ? body.message.slice(0, 160) : '',
    player: body.player && typeof body.player === 'object' ? body.player : {},
    enemies: [],
    bullets: [],
    particles: [],
    effects: [],
    trackMarks: [],
    pickups: [],
    dynamicCraters: [],
    killLog: [],
    damageFlash: 0
  };
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
    await GameState.findOneAndDelete({ user: userId });

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


const sessions = [...stats.sessions].reverse();

res.json({
  highScore: stats.highScore,
  latestScore: stats.latestScore,
  totalKills: stats.totalKills,
  bestWave: stats.bestWave,
  gamesPlayed: stats.gamesPlayed,
  sessions
});

  } catch (err) {
    console.error('[Game] Stats error:', err.message);
    res.status(500).json({ message: 'Failed to load stats.' });
  }
});

router.get('/state', protect, async (req, res) => {
  try {
    const state = await GameState.findOne({ user: req.user.id, active: true }).lean();
    if (!state) return res.json({ hasSavedGame: false });

    res.json({
      hasSavedGame: true,
      state: {
        status: state.status,
        level: state.level,
        score: state.score,
        kills: state.kills,
        message: state.message,
        player: state.player || {},
        enemies: state.enemies || [],
        bullets: state.bullets || [],
        particles: state.particles || [],
        effects: state.effects || [],
        trackMarks: state.trackMarks || [],
        pickups: state.pickups || [],
        dynamicCraters: state.dynamicCraters || [],
        killLog: state.killLog || [],
        damageFlash: state.damageFlash || 0,
        updatedAt: state.updatedAt
      }
    });
  } catch (err) {
    console.error('[Game] Load state error:', err.message);
    res.status(500).json({ message: 'Failed to load saved game.' });
  }
});

router.post('/state', protect, async (req, res) => {
  try {
    const checkpoint = sanitizeCheckpoint(req.body);
    const state = await GameState.findOneAndUpdate(
      { user: req.user.id },
      { user: req.user.id, ...checkpoint },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      message: 'Game checkpoint saved.',
      level: state.level,
      updatedAt: state.updatedAt
    });
  } catch (err) {
    console.error('[Game] Save state error:', err.message);
    res.status(500).json({ message: 'Failed to save game checkpoint.' });
  }
});

router.delete('/state', protect, async (req, res) => {
  try {
    await GameState.findOneAndDelete({ user: req.user.id });
    res.json({ message: 'Saved game cleared.' });
  } catch (err) {
    console.error('[Game] Clear state error:', err.message);
    res.status(500).json({ message: 'Failed to clear saved game.' });
  }
});



module.exports = router;
