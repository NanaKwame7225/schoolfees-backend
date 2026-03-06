const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  time:   { type: Date, default: Date.now },
  user:   String,
  action: String,
  detail: String,
}, { timestamps: false });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
