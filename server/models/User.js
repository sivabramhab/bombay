const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'],
    index: true,
  },
  password: {
    type: String,
    select: false,
    minlength: [6, 'Password must be at least 6 characters'],
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
    index: true,
  },
  mobileVerified: {
    type: Boolean,
    default: false,
  },
  googleId: {
    type: String,
    sparse: true,
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'verifier', 'admin'],
    default: 'buyer',
  },
  isSeller: {
    type: Boolean,
    default: false,
  },
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
    },
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
    isDefault: Boolean,
  }],
  preferences: {
    deliveryOption: {
      type: String,
      enum: ['dabbawala', 'metro', 'seller_pickup', 'rapido', 'uber'],
      default: 'dabbawala',
    },
    preferredMetroStation: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 10
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ mobile: 1 });
userSchema.index({ googleId: 1 });

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

