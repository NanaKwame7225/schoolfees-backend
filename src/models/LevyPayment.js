const mongoose = require('mongoose');

const LevyPaymentSchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true },
  levyId:       String,
  levyName:     String,
  studentId:    String,
  studentName:  String,
  class_:       String,
  amount:       { type: Number, required: true },
  date:         String,
  mode:         String,
  cashier:      String,
  remarks:      String,
  academicYear: String,
}, { timestamps: true });

module.exports = mongoose.model('LevyPayment', LevyPaymentSchema);
