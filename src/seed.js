/**
 * SEED SCRIPT — run once to create the master admin account
 * Usage:  node src/seed.js
 *
 * Set MASTER_PASSWORD env var or it defaults to SCHOOL2025
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Settings, LevyType } = require('./models');

const DEFAULT_LEVY_TYPES = [
  { id: 'LV001', name: 'Textbooks',   icon: '📚', defaultAmount: 0, note: 'Annual' },
  { id: 'LV002', name: 'Stationery',  icon: '✏️',  defaultAmount: 0, note: 'Annual' },
  { id: 'LV003', name: 'PTA Levy',    icon: '👨‍👩‍👧', defaultAmount: 0, note: 'Annual' },
  { id: 'LV004', name: 'Uniform',     icon: '👕',  defaultAmount: 0, note: 'As needed' },
  { id: 'LV005', name: 'Excursion',   icon: '🚌',  defaultAmount: 0, note: 'As needed' },
  { id: 'LV006', name: 'Exam Levy',   icon: '📝',  defaultAmount: 0, note: 'Annual' },
  { id: 'LV007', name: 'Sports Levy', icon: '⚽',  defaultAmount: 0, note: 'Annual' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Master admin
  const masterPassword = process.env.MASTER_PASSWORD || 'SCHOOL2025';
  const hash = await bcrypt.hash(masterPassword, 10);
  await User.findOneAndUpdate(
    { username: 'ADMIN' },
    { username: 'ADMIN', password: hash, displayName: 'Master Admin', role: 'master', active: true },
    { upsert: true, new: true }
  );
  console.log(`✅ Master admin created — username: ADMIN  password: ${masterPassword}`);

  // Default settings
  const existing = await Settings.findOne();
  if (!existing) { await Settings.create({}); console.log('✅ Default settings created'); }

  // Levy types
  for (const lt of DEFAULT_LEVY_TYPES) {
    await LevyType.findOneAndUpdate({ id: lt.id }, lt, { upsert: true });
  }
  console.log('✅ Default levy types seeded');

  await mongoose.disconnect();
  console.log('\n🎉 Seed complete! You can now start the server.');
}

seed().catch(e => { console.error('Seed failed:', e.message); process.exit(1); });
