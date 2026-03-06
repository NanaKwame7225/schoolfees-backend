const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true, uppercase: true, trim: true },
  password:    { type: String, required: true },
  displayName: { type: String, required: true, trim: true },
  role:        { type: String, enum: ['master', 'admin'], default: 'admin' },
  active:      { type: Boolean, default: true },
}, { timestamps: true });

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Never return password
UserSchema.set('toJSON', {
  transform: (_, obj) => { delete obj.password; return obj; }
});

module.exports = mongoose.model('User', UserSchema);
