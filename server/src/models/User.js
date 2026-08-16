const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerifiedAt: {
    type: Date,
    default: null,
  },
  emailOtpHash: {
    type: String,
    default: null,
  },
  emailOtpExpiresAt: {
    type: Date,
    default: null,
  },
  emailOtpAttempts: {
    type: Number,
    default: 0,
  },
  emailOtpLastSentAt: {
    type: Date,
    default: null,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  clerkId: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
  },
  mobileNumber: {
    type: String,
    trim: true,
    default: '',
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  phoneOtpHash: {
    type: String,
    default: null,
  },
  phoneOtpExpiresAt: {
    type: Date,
    default: null,
  },
  phoneOtpAttempts: {
    type: Number,
    default: 0,
  },
  phoneOtpLastSentAt: {
    type: Date,
    default: null,
  },
  age: {
    type: Number,
    default: null,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    default: 'prefer_not_to_say',
  },
  birthdate: {
    type: String,
    trim: true,
    default: '',
  },
  addresses: [{
    id: String,
    label: String,
    line1: String,
    line2: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    phone: String,
    isDefault: { type: Boolean, default: false }
  }],
  savedAddress: {
    fullName: { type: String, default: '' },
    mobileNumber: { type: String, default: '' },
    line1: { type: String, default: '' },
    line2: { type: String, default: '' },
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
  },
}, {
  timestamps: true,
});

// `email` is already indexed by its `unique: true` declaration — redeclaring it
// here would build a duplicate index and trigger a Mongoose warning on boot.
userSchema.index({ clerkId: 1 }, { sparse: true });

// Admin dashboard customer count
userSchema.index({ role: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
