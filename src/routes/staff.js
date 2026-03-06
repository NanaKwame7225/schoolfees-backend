const router = require('express').Router();
const { Staff, Audit } = require('../models');
const { requireAuth } = require('../middleware/auth');

router.get('/',     requireAuth, async (req, res) => { try { res.json(await Staff.find().sort({ id: 1 })); } catch (e) { res.status(500).json({ error: e.message }); } });

router.post('/',    requireAuth, async (req, res) => {
  try {
    const s = await Staff.create(req.body);
    await Audit.create({ time: new Date().toISOString(), user: req.user.displayName, action: 'STAFF_ADDED', detail: `${s.name} (${s.id})` });
    res.status(201).json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const s = await Staff.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!s) return res.status(404).json({ error: 'Staff not found' });
    await Audit.create({ time: new Date().toISOString(), user: req.user.displayName, action: 'STAFF_UPDATED', detail: `${s.name} (${s.id})` });
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const s = await Staff.findOneAndDelete({ id: req.params.id });
    if (!s) return res.status(404).json({ error: 'Staff not found' });
    await Audit.create({ time: new Date().toISOString(), user: req.user.displayName, action: 'STAFF_DELETED', detail: `${s.name} (${s.id})` });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
