const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');

router.get('/reset-admin', async (req, res) => {
  if(req.query.secret !== 'SETUP2026') return res.status(403).json({ error: 'Forbidden' });
  try {
    const hash = await bcrypt.hash('SCHOOL2025', 10);
    await User.findOneAndUpdate(
      { username: 'ADMIN' },
      { username: 'ADMIN', password: hash, displayName: 'Master Admin', role: 'master', active: true },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'Admin reset. Login with ADMIN / SCHOOL2025' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
