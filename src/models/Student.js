const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  id:         { type: String, required: true, unique: true, trim: true },
  name:       { type: String, required: true, trim: true },
  class_:     { type: String, required: true },
  gender:     { type: String, enum: ['Male', 'Female'] },
  dob:        String,
  parent:     String,
  contact:    String,
  paymode:    String,
  withdrawn:  { type: Boolean, default: false },
  // Term fees
  t1f: { type: Number, default: 0 }, t1p: { type: Number, default: 0 },
  t2f: { type: Number, default: 0 }, t2p: { type: Number, default: 0 },
  t3f: { type: Number, default: 0 }, t3p: { type: Number, default: 0 },
  photo:      { type: String, default: '' }, // base64
  registered: { type: String, default: () => new Date().toISOString().split('T')[0] },
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
