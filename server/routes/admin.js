const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Challenge = require('../models/Challenge');

const router = express.Router();

// All routes require admin or verifier role
router.use(auth);
router.use(authorize('admin', 'verifier'));

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalSellers,
      pendingSellers,
      totalProducts,
      totalOrders,
      totalChallenges,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments(),
      Seller.countDocuments(),
      Seller.countDocuments({ verificationStatus: 'pending' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Challenge.countDocuments(),
      Order.find().populate('userId', 'name').populate('sellerId', 'businessName').sort({ createdAt: -1 }).limit(10),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalSellers,
        pendingSellers,
        totalProducts,
        totalOrders,
        totalChallenges,
      },
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const query = role ? { role } : {};

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role (admin only)
router.put('/users/:id/role', authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;

    if (!['buyer', 'seller', 'verifier', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'User role updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

