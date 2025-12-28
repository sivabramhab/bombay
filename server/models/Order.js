const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
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
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: String,
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    finalPrice: Number,
    bargainAccepted: Boolean,
  }],
  subtotal: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  deliveryCharge: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'cod'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  deliveryOption: {
    type: String,
    enum: ['dabbawala', 'metro', 'seller_pickup', 'rapido', 'uber'],
    required: true,
  },
  deliveryDetails: {
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User.addresses',
    },
    metroStation: String,
    pickupLocation: String,
    deliveryPartner: String,
    deliveryPartnerId: String,
    estimatedDelivery: Date,
    trackingId: String,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
  },
  statusHistory: [{
    status: String,
    timestamp: Date,
    notes: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deliveredAt: Date,
});

module.exports = mongoose.model('Order', orderSchema);

