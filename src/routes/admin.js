const router     = require('express').Router();
const bcrypt     = require('bcryptjs');
const { auth, masterOnly } = require('../middleware/auth');
const { User, Settings, AuditLog, FraudInbox, PromHistory, Student, Payment, StudentLevy, LevyPayment } = require('../models');

// ══════════════════════════════════════════════════════════════
// USERS  (master only)
// ══════════════════════════════════════════════════════════════
router.get('/users', auth, masterOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/users', auth, masterOnly, async (req, res) => {
  try {
    const { username, password, displayName, role } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ username: username.toUpperCase(), password: hash, displayName, role });
    await AuditLog.create({ user: req.user.displayName, action: 'USER_CREATED', detail: `${username} created` });
    res.status(201).json({ username: user.username, displayName: user.displayName, role: user.role, active: user.active });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Username already exists' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/users/:username/toggle', auth, masterOnly, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toUpperCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'master') return res.status(400).json({ error: 'Cannot disable master admin' });
    user.active = !user.active;
    await user.save();
    res.json({ active: user.active });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/users/:username/reset-password', auth, masterOnly, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toUpperCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.password = await bcrypt.hash(req.body.newPassword, 12);
    await user.save();
    await AuditLog.create({ user: req.user.displayName, action: 'PASSWORD_RESET', detail: `${req.params.username} password reset` });
    res.json({ message: 'Password reset' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/users/:username', auth, masterOnly, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toUpperCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'master') return res.status(400).json({ error: 'Cannot delete master admin' });
    await user.deleteOne();
    await AuditLog.create({ user: req.user.displayName, action: 'USER_DELETED', detail: `${req.params.username} deleted` });
    res.json({ message: 'User deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════
router.get('/settings', auth, async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'main' });
    if (!settings) settings = await Settings.create({ key: 'main' });
    res.json(settings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/settings', auth, async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      { ...req.body, key: 'main' },
      { upsert: true, new: true }
    );
    res.json(settings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════
// AUDIT LOG  (master only)
// ══════════════════════════════════════════════════════════════
router.get('/audit', auth, masterOnly, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(500);
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════
// FRAUD INBOX  (master only)
// ══════════════════════════════════════════════════════════════
router.get('/fraud', auth, masterOnly, async (req, res) => {
  try { res.json(await FraudInbox.find().sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/fraud/:id/read', auth, masterOnly, async (req, res) => {
  try {
    await FraudInbox.findOneAndUpdate({ id: req.params.id }, { read: true });
    res.json({ message: 'Marked read' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/fraud/read-all', auth, masterOnly, async (req, res) => {
  try {
    await FraudInbox.updateMany({}, { read: true });
    res.json({ message: 'All marked read' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════
// PROMOTIONS
// ══════════════════════════════════════════════════════════════
const NEXT_CLASS = {
  'Crèche':'Nursery 1','Nursery 1':'Nursery 2','Nursery 2':'KG 1',
  'KG 1':'KG 2','KG 2':'Primary 1','Primary 1':'Primary 2',
  'Primary 2':'Primary 3','Primary 3':'Primary 4','Primary 4':'Primary 5',
  'Primary 5':'Primary 6','Primary 6':'JHS 1','JHS 1':'JHS 2',
  'JHS 2':'JHS 3','JHS 3':'Graduate'
};

router.post('/promote', auth, async (req, res) => {
  try {
    const { decisions, promotedBy, academicYear } = req.body;
    // decisions: { [studentId]: 'promote' | 'repeat' | 'graduate' }
    let promoted = 0, graduated = 0;
    for (const [sid, decision] of Object.entries(decisions)) {
      const student = await Student.findOne({ id: sid });
      if (!student || student.withdrawn) continue;
      if (decision === 'promote' || decision === 'graduate') {
        const next = NEXT_CLASS[student.class_];
        if (next === 'Graduate') {
          await Student.findOneAndUpdate({ id: sid }, {
            class_: 'Graduate', withdrawn: true,
            t1f: 0, t1p: 0, t2f: 0, t2p: 0, t3f: 0, t3p: 0
          });
          graduated++;
        } else if (next) {
          await Student.findOneAndUpdate({ id: sid }, {
            class_: next,
            t1f: 0, t1p: 0, t2f: 0, t2p: 0, t3f: 0, t3p: 0
          });
          promoted++;
        }
      }
      // 'repeat' = no class change
    }
    const hist = await PromHistory.create({ date: new Date().toISOString(), academicYear, promotedBy, count: promoted, graduated, decisions });
    await AuditLog.create({ user: promotedBy, action: 'PROMOTION_APPLIED', detail: `${promoted} promoted, ${graduated} graduated for ${academicYear}` });
    res.json({ promoted, graduated, historyId: hist._id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/promotions/history', auth, async (req, res) => {
  try { res.json(await PromHistory.find().sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════
// DASHBOARD SUMMARY
// ══════════════════════════════════════════════════════════════
router.get('/dashboard', auth, async (req, res) => {
  try {
    const students  = await Student.find({ withdrawn: { $ne: true } });
    const payments  = await Payment.find();
    const levies    = await StudentLevy.find();
    const levyPays  = await LevyPayment.find();
    const settings  = await Settings.findOne({ key: 'main' }) || {};

    const totalFees    = students.reduce((a, s) => a + s.t1f + s.t2f + s.t3f, 0);
    const totalPaid    = students.reduce((a, s) => a + s.t1p + s.t2p + s.t3p, 0);
    const outstanding  = totalFees - totalPaid;

    const byClass = {};
    students.forEach(s => {
      if (!byClass[s.class_]) byClass[s.class_] = { count: 0, fees: 0, paid: 0 };
      byClass[s.class_].count++;
      byClass[s.class_].fees += s.t1f + s.t2f + s.t3f;
      byClass[s.class_].paid += s.t1p + s.t2p + s.t3p;
    });

    // Fraud unread count
    const fraudCount = await FraudInbox.countDocuments({ read: false, level: { $in: ['fraud','warning'] } });

    res.json({
      totalStudents: students.length,
      totalFees, totalPaid, outstanding,
      byClass,
      fraudUnread: fraudCount,
      currentTerm: settings.currentTerm,
      academicYear: settings.academicYear
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
