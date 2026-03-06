const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  txn:       { type: String, required: true, unique: true },
  studentId: { type: String, required: true },
  name:      String,
  class_:    String,
  term:      { type: String, enum: ['Term 1', 'Term 2', 'Term 3'] },
  mode:      String,
  amount:    { type: Number, required: true },
  date:      String,
  cashier:   String,
  remarks:   String,
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
