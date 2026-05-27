const router         = require('express').Router();
const Score          = require('../models/Score');
const authMiddleware = require('../middleware/auth');

// GET /api/leaderboard — top 20 best scores (one per user)
router.get('/leaderboard', async (_req, res) => {
  try {
    // Fetch more than needed so we can deduplicate by user
    const scores = await Score
      .find()
      .sort({ levelsCompleted: -1, totalFlips: 1 })
      .limit(200)
      .lean();

    const seen = new Set();
    const top  = [];
    for (const s of scores) {
      const key = s.userId.toString();
      if (!seen.has(key)) {
        seen.add(key);
        top.push({
          rank:            top.length + 1,
          username:        s.username,
          levelsCompleted: s.levelsCompleted,
          totalFlips:      s.totalFlips,
          completedAt:     s.completedAt,
        });
        if (top.length >= 20) break;
      }
    }

    res.json(top);
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    res.status(500).json({ error: 'Could not fetch leaderboard' });
  }
});

// POST /api/score — authenticated; saves a completed run
router.post('/score', authMiddleware, async (req, res) => {
  try {
    const { levelsCompleted, totalFlips } = req.body ?? {};

    if (typeof levelsCompleted !== 'number' || typeof totalFlips !== 'number')
      return res.status(400).json({ error: 'Invalid score data' });

    if (levelsCompleted < 0 || levelsCompleted > 100 || totalFlips < 0 || totalFlips > 99999)
      return res.status(400).json({ error: 'Score data out of range' });

    await Score.create({
      userId:          req.user.id,
      username:        req.user.username,
      levelsCompleted: Math.floor(levelsCompleted),
      totalFlips:      Math.floor(totalFlips),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Score save error:', err.message);
    res.status(500).json({ error: 'Could not save score' });
  }
});

module.exports = router;
