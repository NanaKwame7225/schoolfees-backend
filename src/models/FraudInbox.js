const mongoose = require('mongoose');

const FraudInboxSchema = new mongoose.Schema({
  id:     { type: String, required: true, unique: true },
  time:   { type: Date, default: Date.now },
  level:  { type: String, enum: ['fraud', 'warning', 'info'] },
  actor:  String,
  action: String,
  detail: String,
  read:   { type: Boolean, default: false },
});

module.exports = mongoose.model('FraudInbox', FraudInboxSchema);
