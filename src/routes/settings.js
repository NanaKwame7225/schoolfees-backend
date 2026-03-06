const router = require('express').Router();
const { Settings, Audit } = require('../models');
const { requireAuth, requireMaster } = require('../middleware/auth');

// GET /api/settings
router.get('/', requireAuth, async (req, res) => {
  try {
    let s = await Settings.findOne();
    if (!s) s = await Settings.create({});
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/settings  [master only]
router.patch('/', requireAuth, requireMaster, async (req, res) => {
  try {
    let s = await Settings.findOne();
    if (!s) s = await Settings.create({});
    Object.assign(s, req.body);
    await s.save();
    await Audit.create({ time: new Date().toISOString(), user: req.user.displayName, action: 'SETTINGS_UPDATED', detail: 'School settings updated' });
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
