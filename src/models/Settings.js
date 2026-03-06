const mongoose = require('mongoose');

// Single document — always _id: 'main'
const SettingsSchema = new mongoose.Schema({
  _id:            { type: String, default: 'main' },
  schoolName:     { type: String, default: 'NOVELTY MONTESSORI SCHOOL' },
  address:        { type: String, default: '' },
  phone:          { type: String, default: '' },
  email:          { type: String, default: '' },
  bankName:       { type: String, default: '' },
  bankAccount:    { type: String, default: '' },
  academicYear:   { type: String, default: '2024/2025' },
  currentTerm:    { type: String, default: 'Term 1' },
  proprietor:     { type: String, default: '' },
  proprietorTitle:{ type: String, default: 'Proprietor' },
  schoolInitials: { type: String, default: 'NMS' },
  t1Default:      { type: Number, default: 0 },
  t2Default:      { type: Number, default: 0 },
  t3Default:      { type: Number, default: 0 },
  logo:           { type: String, default: '' }, // base64
}, { _id: false, timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
