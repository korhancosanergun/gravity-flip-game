const router         = require('express').Router();
const mongoose       = require('mongoose');
const Score          = require('../models/Score');
const authMiddleware = require('../middleware/auth');

// GET /api/leaderboard — top 20 best scores (one per user, enforced by DB unique index)
router.get('/leaderboard', async (_req, res) => {
  try {
    const scores = await Score
      .find()
      .sort({ levelsCompleted: -1, totalFlips: 1 })
      .limit(20)
      .lean();

    const top = scores.map((s, i) => ({
      rank:            i + 1,
      username:        s.username,
      levelsCompleted: s.levelsCompleted,
      totalFlips:      s.totalFlips,
      completedAt:     s.completedAt,
    }));

    res.json(top);
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    res.status(500).json({ error: 'Could not fetch leaderboard' });
  }
});

// POST /api/score — authenticated; upserts best score per user
router.post('/score', authMiddleware, async (req, res) => {
  try {
    const { levelsCompleted, totalFlips } = req.body ?? {};

    if (typeof levelsCompleted !== 'number' || typeof totalFlips !== 'number')
      return res.status(400).json({ error: 'Invalid score data' });

    if (levelsCompleted < 0 || levelsCompleted > 100 || totalFlips < 0 || totalFlips > 99999)
      return res.status(400).json({ error: 'Score data out of range' });

    const lc = Math.floor(levelsCompleted);
    const tf = Math.floor(totalFlips);

    // Explicitly cast to ObjectId so findOne works regardless of JWT id type
    let uid;
    try { uid = new mongoose.Types.ObjectId(req.user.id); }
    catch { return res.status(400).json({ error: 'Invalid user id' }); }

    // Fetch existing record for this user (best one if somehow dupes exist)
    const existing = await Score.findOne({ userId: uid }).sort({ levelsCompleted: -1 });
    console.log(`[score] user=${req.user.username} lc=${lc} tf=${tf} existing=${existing ? `lc:${existing.levelsCompleted} tf:${existing.totalFlips}` : 'none'}`);

    if (!existing) {
      // First submission — create
      await Score.create({
        userId: uid,
        username: req.user.username,
        levelsCompleted: lc,
        totalFlips: tf,
      });
      console.log(`[score] created new record for ${req.user.username}`);
    } else {
      // Update only if this run is strictly better:
      // more levels completed, OR same levels with fewer flips
      const isBetter =
        lc > existing.levelsCompleted ||
        (lc === existing.levelsCompleted && tf < existing.totalFlips);

      if (isBetter) {
        existing.levelsCompleted = lc;
        existing.totalFlips      = tf;
        existing.username        = req.user.username; // keep username in sync
        existing.completedAt     = new Date();
        await existing.save();
        console.log(`[score] updated ${req.user.username} → lc=${lc} tf=${tf}`);
      } else {
        console.log(`[score] not better, skipped for ${req.user.username}`);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Score save error:', err.message);
    res.status(500).json({ error: 'Could not save score' });
  }
});

module.exports = router;
