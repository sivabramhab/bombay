const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'addresses', 'preferences'];
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key) && updates[key] !== undefined) {
        req.user[key] = updates[key];
      }
    });

    await req.user.save();
    res.json({ message: 'Profile updated successfully', user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add address
router.post('/addresses', auth, [
  body('type').isIn(['home', 'work', 'other']),
  body('street').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('state').trim().notEmpty(),
  body('pincode').isLength({ min: 6, max: 6 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const address = req.body;

    // If this is set as default, remove default from others
    if (address.isDefault) {
      req.user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    req.user.addresses.push(address);
    await req.user.save();

    res.json({ message: 'Address added successfully', addresses: req.user.addresses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

