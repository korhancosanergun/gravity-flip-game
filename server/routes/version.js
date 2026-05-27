const router = require('express').Router();
const path   = require('path');
const fs     = require('fs');

// GET /api/version — returns the currently deployed bundle version
router.get('/version', (_req, res) => {
  try {
    const file = path.join(__dirname, '../version.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    res.json({ version: data.version ?? '0' });
  } catch {
    res.status(503).json({ error: 'Version unavailable' });
  }
});

module.exports = router;
