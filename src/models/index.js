const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── User ──────────────────────────────────────────────────────
const UserSchema = new Schema({
  username:    { type: String, required: true, unique: true, uppercase: true, trim: true },
  password:    { type: String, required: true },      // bcrypt hash
  displayName: { type: String, required: true },
  role:        { type: String, enum: ['master', 'admin'], default: 'admin' },
  active:      { type: Boolean, default: true }
}, { timestamps: true });

// ── Student ───────────────────────────────────────────────────
const StudentSchema = new Schema({
  id:         { type: String, required: true, unique: true },  // NMS-0001
  name:       { type: String, required: true },
  class_:     { type: String, required: true },
  gender:     { type: String },
  dob:        { type: String },
  parent:     { type: String },
  contact:    { type: String },
  paymode:    { type: String, default: 'Cash' },
  withdrawn:  { type: Boolean, default: false },
  photo:      { type: String, default: '' },
  registered: { type: String },
  // Fees & paid per term
  t1f: { type: Number, default: 0 }, t1p: { type: Number, default: 0 },
  t2f: { type: Number, default: 0 }, t2p: { type: Number, default: 0 },
  t3f: { type: Number, default: 0 }, t3p: { type: Number, default: 0 },
}, { timestamps: true });

// ── Payment ───────────────────────────────────────────────────
const PaymentSchema = new Schema({
  txn:       { type: String, required: true, unique: true },
  studentId: { type: String, required: true },
  name:      { type: String, required: true },
  class_:    { type: String },
  term:      { type: String },
  mode:      { type: String },
  amount:    { type: Number, required: true },
  date:      { type: String },
  cashier:   { type: String },
  remarks:   { type: String, default: '' }
}, { timestamps: true });

// ── Staff ─────────────────────────────────────────────────────
const StaffSchema = new Schema({
  id:           { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  role:         { type: String },
  gender:       { type: String },
  dob:          { type: String },
  contact:      { type: String },
  email:        { type: String, default: '' },
  dateEmployed: { type: String },
  status:       { type: String, default: 'Active' },
  salary:       { type: Number, default: 0 },
  ssnitNo:      { type: String, default: '' },
  otherDeduct:  { type: Number, default: 0 },
  notes:        { type: String, default: '' },
  photo:        { type: String, default: '' }
}, { timestamps: true });

// ── Levy Type ─────────────────────────────────────────────────
const LevyTypeSchema = new Schema({
  id:            { type: String, required: true, unique: true },
  name:          { type: String, required: true },
  icon:          { type: String, default: '💰' },
  defaultAmount: { type: Number, default: 0 },
  note:          { type: String, default: '' }
}, { timestamps: true });

// ── Student Levy ──────────────────────────────────────────────
const StudentLevySchema = new Schema({
  id:           { type: String, required: true, unique: true },
  studentId:    { type: String, required: true },
  studentName:  { type: String },
  class_:       { type: String },
  levyTypeId:   { type: String, required: true },
  levyName:     { type: String },
  levyIcon:     { type: String, default: '💰' },
  amount:       { type: Number, required: true },
  academicYear: { type: String }
}, { timestamps: true });

// ── Levy Payment ──────────────────────────────────────────────
const LevyPaymentSchema = new Schema({
  id:          { type: String, required: true, unique: true },
  levyId:      { type: String, required: true },
  levyName:    { type: String },
  studentId:   { type: String, required: true },
  studentName: { type: String },
  class_:      { type: String },
  amount:      { type: Number, required: true },
  date:        { type: String },
  mode:        { type: String },
  cashier:     { type: String },
  remarks:     { type: String, default: '' },
  academicYear:{ type: String }
}, { timestamps: true });

// ── Audit Log ─────────────────────────────────────────────────
const AuditSchema = new Schema({
  time:   { type: String, required: true },
  user:   { type: String },
  action: { type: String },
  detail: { type: String }
}, { timestamps: true });

// ── Fraud Inbox ───────────────────────────────────────────────
const FraudSchema = new Schema({
  id:     { type: String, required: true, unique: true },
  time:   { type: String },
  level:  { type: String, enum: ['fraud', 'warning', 'info'] },
  actor:  { type: String },
  action: { type: String },
  detail: { type: String },
  read:   { type: Boolean, default: false }
}, { timestamps: true });

// ── Settings (single doc) ─────────────────────────────────────
const SettingsSchema = new Schema({
  schoolName:    { type: String, default: 'NOVELTY MONTESSORI SCHOOL' },
  address:       { type: String, default: 'P.O. Box 1, Accra' },
  phone:         { type: String, default: '0244 000 000' },
  email:         { type: String, default: 'info@myschool.edu.gh' },
  bankName:      { type: String, default: '' },
  bankAccount:   { type: String, default: '' },
  academicYear:  { type: String, default: '2024/2025' },
  currentTerm:   { type: String, default: 'Term 1' },
  proprietor:    { type: String, default: '' },
  proprietorTitle:{ type: String, default: 'Proprietor' },
  schoolInitials:{ type: String, default: 'NMS' },
  t1Default:     { type: Number, default: 0 },
  t2Default:     { type: Number, default: 0 },
  t3Default:     { type: Number, default: 0 },
  logo:          { type: String, default: '' }
}, { timestamps: true });

module.exports = {
  User:         mongoose.model('User',         UserSchema),
  Student:      mongoose.model('Student',      StudentSchema),
  Payment:      mongoose.model('Payment',      PaymentSchema),
  Staff:        mongoose.model('Staff',        StaffSchema),
  LevyType:     mongoose.model('LevyType',     LevyTypeSchema),
  StudentLevy:  mongoose.model('StudentLevy',  StudentLevySchema),
  LevyPayment:  mongoose.model('LevyPayment',  LevyPaymentSchema),
  Audit:        mongoose.model('Audit',        AuditSchema),
  Fraud:        mongoose.model('Fraud',        FraudSchema),
  Settings:     mongoose.model('Settings',     SettingsSchema),
};
