const mongoose = require('mongoose');

const StudentLevySchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true },
  studentId:    { type: String, required: true },
  studentName:  String,
  class_:       String,
  levyTypeId:   String,
  levyName:     String,
  levyIcon:     String,
  amount:       { type: Number, required: true },
  academicYear: String,
}, { timestamps: true });

module.exports = mongoose.model('StudentLevy', StudentLevySchema);
