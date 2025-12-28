const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Challenge = require('../models/Challenge');
const Order = require('../models/Order');
const Seller = require('../models/Seller');

const router = express.Router();

// Create challenge
router.post('/', auth, [
  body('productName').trim().notEmpty(),
  body('productUrl').isURL(),
  body('platform').isIn(['flipkart', 'amazon', 'other']),
  body('currentPrice').isFloat({ min: 0 }),
  body('challengePrice').isFloat({ min: 0 }),
  body('deliveryTime').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      productName,
      productUrl,
      platform,
      currentPrice,
      description,
      category,
      images,
      challengePrice,
      deliveryTime,
      location,
    } = req.body;

    // Challenge price should be at least 10% less
    const minChallengePrice = currentPrice * 0.9;
    if (challengePrice > minChallengePrice) {
      return res.status(400).json({
        message: `Challenge price should be at least 10% less than current price (min: ${minChallengePrice})`,
      });
    }

    const challenge = new Challenge({
      userId: req.user._id,
      productName,
      productUrl,
      platform,
      currentPrice,
      description,
      category,
      images: images || [],
      challengePrice,
      deliveryTime,
      location,
      status: 'active',
    });

    await challenge.save();
    res.status(201).json({ message: 'Challenge created successfully', challenge });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all active challenges
router.get('/', async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 20 } = req.query;

    const challenges = await Challenge.find({ status })
      .populate('userId', 'name')
      .populate('responses.sellerId', 'businessName rating')
      .populate('acceptedBy.sellerId', 'businessName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Challenge.countDocuments({ status });

    res.json({
      challenges,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single challenge
router.get('/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('userId', 'name')
      .populate('responses.sellerId', 'businessName rating pickupLocations')
      .populate('acceptedBy.sellerId', 'businessName');

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Seller respond to challenge
router.post('/:id/respond', auth, [
  body('offeredPrice').isFloat({ min: 0 }),
  body('deliveryTime').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge || challenge.status !== 'active') {
      return res.status(400).json({ message: 'Challenge not found or not active' });
    }

    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller || seller.verificationStatus !== 'approved') {
      return res.status(403).json({ message: 'Not a verified seller' });
    }

    const { offeredPrice, deliveryTime, message } = req.body;

    // Check if seller already responded
    const existingResponse = challenge.responses.find(
      r => r.sellerId.toString() === seller._id.toString()
    );

    if (existingResponse) {
      return res.status(400).json({ message: 'You have already responded to this challenge' });
    }

    challenge.responses.push({
      sellerId: seller._id,
      offeredPrice,
      deliveryTime,
      message,
      status: 'pending',
    });

    await challenge.save();
    res.json({ message: 'Response submitted successfully', challenge });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// User accept challenge response
router.post('/:id/accept/:responseId', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    if (challenge.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const response = challenge.responses.id(req.params.responseId);
    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    challenge.status = 'accepted';
    challenge.acceptedBy = {
      sellerId: response.sellerId,
    };

    response.status = 'accepted';

    // Create order from challenge
    // This would typically trigger order creation
    // For now, just update the challenge

    await challenge.save();
    res.json({ message: 'Challenge response accepted', challenge });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

