const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const Seller = require('../models/Seller');
const User = require('../models/User');

const router = express.Router();

// Register as seller
router.post('/register', auth, [
  body('businessName').trim().notEmpty(),
  body('gstNumber').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
  body('isCloseKnit').isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { businessName, gstNumber, isCloseKnit, pickupLocations, bankDetails } = req.body;

    // Check if user is already a seller
    const existingSeller = await Seller.findOne({ userId: req.user._id });
    if (existingSeller) {
      return res.status(400).json({ message: 'User is already registered as a seller' });
    }

    // Close-knit sellers don't need GST
    if (!isCloseKnit && !gstNumber) {
      return res.status(400).json({ message: 'GST number is required for regular sellers' });
    }

    const seller = new Seller({
      userId: req.user._id,
      businessName,
      gstNumber: isCloseKnit ? undefined : gstNumber,
      isCloseKnit,
      verificationStatus: isCloseKnit ? 'approved' : 'pending',
      pickupLocations: pickupLocations || [],
      bankDetails: bankDetails || {},
    });

    await seller.save();

    // Update user role
    req.user.isSeller = true;
    req.user.role = 'seller';
    await req.user.save();

    res.status(201).json({
      message: 'Seller registration submitted successfully',
      seller,
    });
  } catch (error) {
    console.error('Seller registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get seller profile
router.get('/profile', auth, async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id })
      .populate('userId', 'name email mobile');

    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    res.json(seller);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update seller profile
router.put('/profile', auth, async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        seller[key] = updates[key];
      }
    });

    await seller.save();
    res.json({ message: 'Profile updated successfully', seller });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all sellers (for admin/verifiers)
router.get('/', auth, authorize('admin', 'verifier'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { verificationStatus: status } : {};

    const sellers = await Seller.find(query)
      .populate('userId', 'name email mobile')
      .populate('verifiedBy', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Seller.countDocuments(query);

    res.json({
      sellers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify seller (for verifiers/admins)
router.put('/:id/verify', auth, authorize('admin', 'verifier'), [
  body('verificationStatus').isIn(['approved', 'rejected']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { verificationStatus, verificationNotes } = req.body;

    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.verificationStatus = verificationStatus;
    seller.verificationNotes = verificationNotes;
    seller.verifiedBy = req.user._id;
    seller.verifiedAt = new Date();

    if (verificationStatus === 'approved') {
      seller.gstVerified = true;
    }

    await seller.save();

    res.json({ message: 'Seller verification updated', seller });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

