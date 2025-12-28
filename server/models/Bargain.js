const mongoose = require('mongoose');

const bargainSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
  },
  originalPrice: {
    type: Number,
    required: true,
  },
  buyerOffer: {
    type: Number,
    required: true,
  },
  sellerCounterOffer: Number,
  finalPrice: Number,
  status: {
    type: String,
    enum: ['pending', 'countered', 'accepted', 'rejected', 'expired'],
    default: 'pending',
  },
  messages: [{
    sender: {
      type: String,
      enum: ['buyer', 'seller'],
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Bargain', bargainSchema);

