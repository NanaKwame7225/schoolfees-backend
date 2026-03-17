const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { User, Settings, Audit } = require('../models');
const { requireAuth, requireMaster } = require('../middleware/auth');

const sign = (user) => jwt.sign(
  { id: user._id, username: user.username, displayName: user.displayName, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password, adminName } = req.body;
    if (!username || !password || !adminName)
      return res.status(400).json({ error: 'username, password and adminName are required' });

    const user = await User.findOne({ username: username.toUpperCase() });
    if (!user || !user.active)
      return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Log login
    await Audit.create({ time: new Date().toISOString(), user: adminName, action: 'LOGIN', detail: `${adminName} logged in as ${user.username}` });

    const settings = await Settings.findOne() || {};
    res.json({ token: sign(user), user: { username: user.username, displayName: user.displayName, role: user.role }, settings });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/auth/users  [master only]
router.get('/users', requireAuth, requireMaster, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/users  [master only]
router.post('/users', requireAuth, requireMaster, async (req, res) => {
  try {
    const { username, password, displayName, role } = req.body;
    if (!username || !password || !displayName)
      return res.status(400).json({ error: 'username, password and displayName required' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username: username.toUpperCase(), password: hash, displayName, role: role || 'admin' });
    res.status(201).json({ ...user.toObject(), password: undefined });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Username already exists' });
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/auth/users/:username  [master only]
router.patch('/users/:username', requireAuth, requireMaster, async (req, res) => {
  try {
    const { active, newPassword, displayName } = req.body;
    const user = await User.findOne({ username: req.params.username.toUpperCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'master' && active === false)
      return res.status(400).json({ error: 'Cannot deactivate master admin' });
    if (active !== undefined) user.active = active;
    if (displayName)  user.displayName = displayName;
    if (newPassword)  user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/auth/users/:username  [master only]
router.delete('/users/:username', requireAuth, requireMaster, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toUpperCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'master') return res.status(400).json({ error: 'Cannot delete master admin' });
    await user.deleteOne();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// TEMP TEST — remove after fixing
router.get('/test-password', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const hash = '$2a$10$n/XhPkKR1W6kYhk4ltoLFOUmgxXlPP1IiMQ8v4IbBkMLD6yCNnwZy';
  const result = await bcrypt.compare('SCHOOL2025', hash);
  res.json({ match: result, hash });
});
module.exports = router;
