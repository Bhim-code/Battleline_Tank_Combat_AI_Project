const mongoose = require('mongoose');

const gameStateSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    active: { type: Boolean, default: true },
    status: { type: String, default: 'paused' },
    level:  { type: Number, default: 1 },
    score:  { type: Number, default: 0 },
    kills:  { type: Number, default: 0 },
    message:{ type: String, default: '' },
    player:         { type: mongoose.Schema.Types.Mixed, default: {} },
    enemies:        { type: [mongoose.Schema.Types.Mixed], default: [] },
    bullets:        { type: [mongoose.Schema.Types.Mixed], default: [] },
    particles:      { type: [mongoose.Schema.Types.Mixed], default: [] },
    effects:        { type: [mongoose.Schema.Types.Mixed], default: [] },
    trackMarks:     { type: [mongoose.Schema.Types.Mixed], default: [] },
    pickups:        { type: [mongoose.Schema.Types.Mixed], default: [] },
    dynamicCraters: { type: [mongoose.Schema.Types.Mixed], default: [] },
    killLog:        { type: [mongoose.Schema.Types.Mixed], default: [] },
    damageFlash:    { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('GameState', gameStateSchema);
