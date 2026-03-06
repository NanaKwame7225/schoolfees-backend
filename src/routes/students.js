const router = require('express').Router();
const { Student, Audit, Fraud } = require('../models');
const { requireAuth, requireMaster } = require('../middleware/auth');

// GET /api/students
router.get('/', requireAuth, async (req, res) => {
  try { res.json(await Student.find().sort({ id: 1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/students
router.post('/', requireAuth, async (req, res) => {
  try {
    const s = await Student.create(req.body);
    await Audit.create({ time: new Date().toISOString(), user: req.body.cashier || req.user.displayName, action: 'STUDENT_ADDED', detail: `${s.name} (${s.id}) · ${s.class_}` });
    res.status(201).json(s);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Student ID already exists' });
    res.status(500).json({ error: e.message });
  }
});

// POST /api/students/bulk
router.post('/bulk', requireAuth, async (req, res) => {
  try {
    const students = req.body.students;
    if (!Array.isArray(students) || !students.length)
      return res.status(400).json({ error: 'students array required' });
    const inserted = await Student.insertMany(students, { ordered: false });
    await Audit.create({ time: new Date().toISOString(), user: req.user.displayName, action: 'BULK_ADMISSION', detail: `${inserted.length} students admitted` });
    res.status(201).json({ inserted: inserted.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/students/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const s = await Student.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!s) return res.status(404).json({ error: 'Student not found' });
    await Audit.create({ time: new Date().toISOString(), user: req.user.displayName, action: 'STUDENT_UPDATED', detail: `${s.name} (${s.id})` });
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/students/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const s = await Student.findOneAndDelete({ id: req.params.id });
    if (!s) return res.status(404).json({ error: 'Student not found' });
    await Audit.create({ time: new Date().toISOString(), user: req.user.displayName, action: 'STUDENT_DELETED', detail: `${s.name} (${s.id})` });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/students/:id/withdraw  — flags + reports to master
router.post('/:id/withdraw', requireAuth, async (req, res) => {
  try {
    const s = await Student.findOneAndUpdate({ id: req.params.id }, { withdrawn: req.body.withdrawn }, { new: true });
    if (!s) return res.status(404).json({ error: 'Student not found' });
    const action = req.body.withdrawn ? 'STUDENT_WITHDRAWN' : 'STUDENT_REINSTATED';
    await Audit.create({ time: new Date().toISOString(), user: req.user.displayName, action, detail: `${s.name} (${s.id})` });
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
