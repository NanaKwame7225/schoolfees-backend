const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  role:         String,
  gender:       String,
  dob:          String,
  contact:      String,
  email:        String,
  dateEmployed: String,
  status:       { type: String, default: 'Active' },
  salary:       { type: Number, default: 0 },
  ssnitNo:      String,
  otherDeduct:  { type: Number, default: 0 },
  notes:        String,
  photo:        { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Staff', StaffSchema);
