const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Bargain = require('../models/Bargain');
const Product = require('../models/Product');
const Seller = require('../models/Seller');

const router = express.Router();

// Create bargain request
router.post('/', auth, [
  body('productId').isMongoId(),
  body('buyerOffer').isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, buyerOffer, message } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.allowBargaining) {
      return res.status(400).json({ message: 'Bargaining not allowed for this product' });
    }

    if (buyerOffer >= product.sellingPrice) {
      return res.status(400).json({ message: 'Buyer offer should be less than selling price' });
    }

    if (product.minBargainPrice && buyerOffer < product.minBargainPrice) {
      return res.status(400).json({ 
        message: `Buyer offer should be at least ${product.minBargainPrice}` 
      });
    }

    // Check for existing pending bargain
    const existingBargain = await Bargain.findOne({
      productId,
      userId: req.user._id,
      status: { $in: ['pending', 'countered'] },
    });

    if (existingBargain) {
      return res.status(400).json({ message: 'You already have an active bargain for this product' });
    }

    const bargain = new Bargain({
      productId,
      userId: req.user._id,
      sellerId: product.sellerId,
      originalPrice: product.sellingPrice,
      buyerOffer,
      status: 'pending',
    });

    if (message) {
      bargain.messages.push({
        sender: 'buyer',
        message,
      });
    }

    await bargain.save();
    res.status(201).json({ message: 'Bargain request created', bargain });
  } catch (error) {
    console.error('Create bargain error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's bargains
router.get('/my-bargains', auth, async (req, res) => {
  try {
    const bargains = await Bargain.find({
      $or: [
        { userId: req.user._id },
        { sellerId: (await Seller.findOne({ userId: req.user._id }))?._id },
      ],
    })
      .populate('productId', 'name images sellingPrice')
      .populate('userId', 'name')
      .populate('sellerId', 'businessName')
      .sort({ createdAt: -1 });

    res.json(bargains);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single bargain
router.get('/:id', auth, async (req, res) => {
  try {
    const bargain = await Bargain.findById(req.params.id)
      .populate('productId', 'name images sellingPrice allowBargaining minBargainPrice')
      .populate('userId', 'name email')
      .populate('sellerId', 'businessName');

    if (!bargain) {
      return res.status(404).json({ message: 'Bargain not found' });
    }

    // Check authorization
    const seller = await Seller.findOne({ userId: req.user._id });
    const isBuyer = bargain.userId._id.toString() === req.user._id.toString();
    const isSeller = seller && bargain.sellerId._id.toString() === seller._id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(bargain);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Seller respond to bargain
router.post('/:id/respond', auth, [
  body('action').isIn(['accept', 'reject', 'counter']),
  body('counterOffer').optional().isFloat({ min: 0 }),
  body('message').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { action, counterOffer, message } = req.body;

    const bargain = await Bargain.findById(req.params.id);
    if (!bargain) {
      return res.status(404).json({ message: 'Bargain not found' });
    }

    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller || bargain.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (bargain.status !== 'pending' && bargain.status !== 'countered') {
      return res.status(400).json({ message: 'Bargain is no longer active' });
    }

    if (action === 'accept') {
      bargain.status = 'accepted';
      bargain.finalPrice = bargain.buyerOffer;
    } else if (action === 'reject') {
      bargain.status = 'rejected';
    } else if (action === 'counter') {
      if (!counterOffer) {
        return res.status(400).json({ message: 'Counter offer is required' });
      }

      if (counterOffer < bargain.buyerOffer) {
        return res.status(400).json({ message: 'Counter offer should be higher than buyer offer' });
      }

      bargain.sellerCounterOffer = counterOffer;
      bargain.status = 'countered';
    }

    if (message) {
      bargain.messages.push({
        sender: 'seller',
        message,
      });
    }

    bargain.updatedAt = new Date();
    await bargain.save();

    res.json({ message: `Bargain ${action}ed successfully`, bargain });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Buyer respond to counter offer
router.post('/:id/counter-response', auth, [
  body('action').isIn(['accept', 'reject']),
], async (req, res) => {
  try {
    const { action } = req.body;

    const bargain = await Bargain.findById(req.params.id);
    if (!bargain) {
      return res.status(404).json({ message: 'Bargain not found' });
    }

    if (bargain.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (bargain.status !== 'countered') {
      return res.status(400).json({ message: 'No counter offer available' });
    }

    if (action === 'accept') {
      bargain.status = 'accepted';
      bargain.finalPrice = bargain.sellerCounterOffer;
    } else {
      bargain.status = 'rejected';
    }

    bargain.updatedAt = new Date();
    await bargain.save();

    res.json({ message: `Counter offer ${action}ed`, bargain });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

