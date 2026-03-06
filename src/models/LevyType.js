const mongoose = require('mongoose');

const LevyTypeSchema = new mongoose.Schema({
  id:            { type: String, required: true, unique: true },
  name:          { type: String, required: true },
  icon:          { type: String, default: '💰' },
  defaultAmount: { type: Number, default: 0 },
  note:          String,
}, { timestamps: true });

module.exports = mongoose.model('LevyType', LevyTypeSchema);
