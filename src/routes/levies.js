const router = require('express').Router();
const { LevyType, StudentLevy, LevyPayment, Student, Audit } = require('../models');
const { requireAuth } = require('../middleware/auth');

// ── Levy Types ────────────────────────────────────────────────
router.get('/types',      requireAuth, async (req, res) => { try { res.json(await LevyType.find()); } catch (e) { res.status(500).json({ error: e.message }); } });
router.post('/types',     requireAuth, async (req, res) => { try { res.status(201).json(await LevyType.create(req.body)); } catch (e) { res.status(500).json({ error: e.message }); } });
router.patch('/types/:id',requireAuth, async (req, res) => { try { res.json(await LevyType.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })); } catch (e) { res.status(500).json({ error: e.message }); } });
router.delete('/types/:id',requireAuth, async (req, res) => {
  try {
    const inUse = await StudentLevy.exists({ levyTypeId: req.params.id });
    if (inUse) return res.status(400).json({ error: 'Levy type is assigned to students — cannot delete' });
    await LevyType.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Student Levies ────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const levies = await StudentLevy.find().sort({ createdAt: -1 });
    // Attach paid amounts
    const payments = await LevyPayment.find();
    const result = levies.map(l => {
      const paid = payments.filter(p => p.levyId === l.id).reduce((a, p) => a + p.amount, 0);
      return { ...l.toObject(), paid, balance: l.amount - paid };
    });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Assign levy to one student
router.post('/', requireAuth, async (req, res) => {
  try {
    const { studentId, levyTypeId, amount, academicYear } = req.body;
    const exists = await StudentLevy.findOne({ studentId, levyTypeId, academicYear });
    if (exists) return res.status(409).json({ error: 'Levy already assigned for this academic year' });
    const levy = await StudentLevy.create({ ...req.body, id: 'LEV' + Date.now() });
    res.status(201).json(levy);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Assign levy to entire class
router.post('/assign-class', requireAuth, async (req, res) => {
  try {
    const { class_, levyTypeId, levyName, levyIcon, amount, academicYear } = req.body;
    const students = await Student.find({ class_, withdrawn: { $ne: true } });
    let added = 0, skipped = 0;
    for (const s of students) {
      const exists = await StudentLevy.findOne({ studentId: s.id, levyTypeId, academicYear });
      if (exists) { skipped++; continue; }
      await StudentLevy.create({ id: 'LEV' + Date.now() + Math.floor(Math.random() * 9999), studentId: s.id, studentName: s.name, class_: s.class_, levyTypeId, levyName, levyIcon, amount, academicYear });
      added++;
    }
    await Audit.create({ time: new Date().toISOString(), user: req.user.displayName, action: 'LEVY_ASSIGNED', detail: `${levyName} → ${class_} · ${added} students · GHS ${amount} · ${academicYear}` });
    res.json({ added, skipped });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await StudentLevy.findOneAndDelete({ id: req.params.id });
    await LevyPayment.deleteMany({ levyId: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Levy Payments ─────────────────────────────────────────────
router.get('/payments', requireAuth, async (req, res) => { try { res.json(await LevyPayment.find().sort({ createdAt: -1 })); } catch (e) { res.status(500).json({ error: e.message }); } });

router.post('/payments', requireAuth, async (req, res) => {
  try {
    const { levyId, amount } = req.body;
    const levy = await StudentLevy.findOne({ id: levyId });
    if (!levy) return res.status(404).json({ error: 'Levy not found' });
    const already = await LevyPayment.aggregate([{ $match: { levyId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    const paid = already[0]?.total || 0;
    if (amount > levy.amount - paid && !(req.body.forceOverpay))
      return res.status(400).json({ error: 'OVERPAYMENT', balance: levy.amount - paid });
    const payment = await LevyPayment.create({ ...req.body, id: 'LPAY' + Date.now(), cashier: req.user.displayName });
    await Audit.create({ time: new Date().toISOString(), user: req.user.displayName, action: 'LEVY_PAYMENT', detail: `${levy.levyName} · ${levy.studentName} · GHS ${amount}` });
    res.status(201).json(payment);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
