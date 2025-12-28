const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  subcategory: String,
  images: [String],
  basePrice: {
    type: Number,
    required: true,
  },
  sellingPrice: {
    type: Number,
    required: true,
  },
  competitivePrice: {
    flipkart: Number,
    amazon: Number,
    other: {
      platform: String,
      price: Number,
    },
  },
  priceDiscount: {
    type: Number,
    default: 0,
  },
  allowBargaining: {
    type: Boolean,
    default: false,
  },
  minBargainPrice: Number,
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  brand: String,
  specifications: mongoose.Schema.Types.Mixed,
  warranty: {
    hasWarranty: Boolean,
    duration: String,
    type: {
      type: String,
      enum: ['manufacturer', 'seller', 'marketplace'],
    },
    details: String,
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
  },
  sales: {
    type: Number,
    default: 0,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, allowBargaining: 1 });

module.exports = mongoose.model('Product', productSchema);

