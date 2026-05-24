const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body ?? {};

    if (!username || !password)
      return res.status(400).json({ error: 'Username and password are required' });

    const uname = username.toString().trim();
    const pwd   = password.toString();

    if (uname.length < 3 || uname.length > 20)
      return res.status(400).json({ error: 'Username must be 3–20 characters' });

    if (!/^[a-zA-Z0-9_]+$/.test(uname))
      return res.status(400).json({ error: 'Username may only contain letters, numbers and underscores' });

    if (pwd.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ username: uname });
    if (existing)
      return res.status(400).json({ error: 'Username already taken' });

    const passwordHash = await bcrypt.hash(pwd, 10);
    const user = new User({ username: uname, passwordHash });
    await user.save();

    const token = signToken(user);
    res.status(201).json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body ?? {};

    if (!username || !password)
      return res.status(400).json({ error: 'Username and password are required' });

    const user = await User.findOne({ username: username.toString().trim() });
    if (!user)
      return res.status(400).json({ error: 'Invalid username or password' });

    const ok = await bcrypt.compare(password.toString(), user.passwordHash);
    if (!ok)
      return res.status(400).json({ error: 'Invalid username or password' });

    const token = signToken(user);
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

module.exports = router;
