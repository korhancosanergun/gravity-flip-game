require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');

const authRoutes        = require('./routes/auth');
const leaderboardRoutes = require('./routes/leaderboard');

const app       = express();
const PORT      = process.env.PORT      || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gravitygame';
const ORIGIN    = process.env.ALLOWED_ORIGIN || 'https://gravitygame.tomris.games';

app.use(cors({ origin: ORIGIN, optionsSuccessStatus: 200 }));
app.use(express.json({ limit: '10kb' }));

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/auth', authRoutes);
app.use('/api',      leaderboardRoutes);

// Generic error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected:', MONGO_URI);
    app.listen(PORT, '127.0.0.1', () =>
      console.log(`Gravity Flip API running on 127.0.0.1:${PORT}`)
    );
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
