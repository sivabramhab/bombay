const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  productUrl: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    enum: ['flipkart', 'amazon', 'other'],
    required: true,
  },
  currentPrice: {
    type: Number,
    required: true,
  },
  description: String,
  category: String,
  images: [String],
  challengePrice: {
    type: Number,
    required: true,
  },
  deliveryTime: {
    type: String,
    required: true,
  },
  location: {
    city: String,
    pincode: String,
  },
  status: {
    type: String,
    enum: ['active', 'accepted', 'expired', 'completed'],
    default: 'active',
  },
  responses: [{
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
    },
    offeredPrice: Number,
    deliveryTime: String,
    message: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    respondedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  acceptedBy: {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Challenge', challengeSchema);

