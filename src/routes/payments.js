const router = require('express').Router();
const { Payment, Student, Audit, Fraud } = require('../models');
const { requireAuth } = require('../middleware/auth');

// GET /api/payments
router.get('/', requireAuth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.term) filter.term = req.query.term;
    res.json(await Payment.find(filter).sort({ createdAt: -1 }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/payments
router.post('/', requireAuth, async (req, res) => {
  try {
    const { studentId, term, amount, mode, date, remarks } = req.body;
    const cashier = req.user.displayName; // always the logged-in user

    // Re-verify student exists and is not withdrawn
    const student = await Student.findOne({ id: studentId });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (student.withdrawn) {
      // Report to fraud inbox
      await Fraud.create({
        id: 'FRD' + Date.now(),
        time: new Date().toISOString(),
        level: 'warning',
        actor: cashier,
        action: 'WITHDRAWN_STUDENT_PAYMENT_ATTEMPT',
        detail: `${cashier} attempted payment of GHS ${amount} for withdrawn student ${student.name} (${student.id})`
      });
      return res.status(403).json({ error: 'WITHDRAWN', message: 'Cannot record payment — student is withdrawn. Administrator has been notified.' });
    }

    // Check fees set for term
    const feeMap = { 'Term 1': student.t1f, 'Term 2': student.t2f, 'Term 3': student.t3f };
    if (!feeMap[term] || feeMap[term] <= 0)
      return res.status(400).json({ error: 'No fees set for this term' });

    // Generate TXN number
    const count = await Payment.countDocuments();
    const txn = `TXN${String(count + 1).padStart(4, '0')}`;

    // Save payment
    const payment = await Payment.create({ txn, studentId, name: student.name, class_: student.class_, term, mode, amount, date, cashier, remarks: remarks || '' });

    // Update student paid amount
    const paidField = { 'Term 1': 't1p', 'Term 2': 't2p', 'Term 3': 't3p' }[term];
    await Student.updateOne({ id: studentId }, { $inc: { [paidField]: amount } });

    await Audit.create({ time: new Date().toISOString(), user: cashier, action: 'PAYMENT_RECORDED', detail: `${txn} · ${student.name} (${studentId}) · ${term} · GHS ${amount}` });

    res.status(201).json(payment);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/payments/:txn  [master only — reversal]
router.delete('/:txn', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'master') return res.status(403).json({ error: 'Master admin only' });
    const p = await Payment.findOneAndDelete({ txn: req.params.txn });
    if (!p) return res.status(404).json({ error: 'Payment not found' });
    // Reverse student paid amount
    const paidField = { 'Term 1': 't1p', 'Term 2': 't2p', 'Term 3': 't3p' }[p.term];
    if (paidField) await Student.updateOne({ id: p.studentId }, { $inc: { [paidField]: -p.amount } });
    await Audit.create({ time: new Date().toISOString(), user: req.user.displayName, action: 'PAYMENT_REVERSED', detail: `${p.txn} · ${p.name} · GHS ${p.amount} REVERSED` });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
