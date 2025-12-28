const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  businessName: {
    type: String,
    required: true,
  },
  gstNumber: {
    type: String,
    sparse: true,
  },
  gstVerified: {
    type: Boolean,
    default: false,
  },
  isCloseKnit: {
    type: Boolean,
    default: false,
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  verificationNotes: String,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: Date,
  pickupLocations: [{
    name: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
    },
    coordinates: {
      lat: Number,
      lng: Number,
    },
    timings: String,
    isActive: Boolean,
  }],
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String,
  },
  rating: {
    average: {
      type: Number,
      default: 0,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  totalSales: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Seller', sellerSchema);

