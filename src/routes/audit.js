const router = require('express').Router();
const { Audit, Fraud } = require('../models');
const { requireAuth, requireMaster } = require('../middleware/auth');

// GET /api/audit  [master only]
router.get('/', requireAuth, requireMaster, async (req, res) => {
  try { res.json(await Audit.find().sort({ createdAt: -1 }).limit(500)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/audit/fraud  [master only]
router.get('/fraud', requireAuth, requireMaster, async (req, res) => {
  try { res.json(await Fraud.find().sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/audit/fraud/:id/read  [master only]
router.patch('/fraud/:id/read', requireAuth, requireMaster, async (req, res) => {
  try {
    await Fraud.findOneAndUpdate({ id: req.params.id }, { read: true });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/audit/fraud/read-all  [master only]
router.patch('/fraud/read-all', requireAuth, requireMaster, async (req, res) => {
  try { await Fraud.updateMany({}, { read: true }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/audit/fraud  — internal use to log fraud events
router.post('/fraud', requireAuth, async (req, res) => {
  try {
    const f = await Fraud.create({ ...req.body, id: 'FRD' + Date.now() });
    res.status(201).json(f);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
