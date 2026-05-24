const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username:        { type: String, required: true },
  levelsCompleted: { type: Number, default: 0, min: 0, max: 5 },
  totalFlips:      { type: Number, default: 0, min: 0 },
  completedAt:     { type: Date, default: Date.now },
});

// Compound index for leaderboard: best scores first
scoreSchema.index({ levelsCompleted: -1, totalFlips: 1 });

module.exports = mongoose.model('Score', scoreSchema);
