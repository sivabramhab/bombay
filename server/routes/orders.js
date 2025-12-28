const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Seller = require('../models/Seller');

const router = express.Router();

// Generate unique order ID
const generateOrderId = () => {
  return `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

// Create order
router.post('/', auth, [
  body('items').isArray({ min: 1 }),
  body('items.*.productId').isMongoId(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('paymentMethod').isIn(['online', 'cod']),
  body('deliveryOption').isIn(['dabbawala', 'metro', 'seller_pickup', 'rapido', 'uber']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, paymentMethod, deliveryOption, deliveryDetails, addressId } = req.body;

    let subtotal = 0;
    const orderItems = [];

    // Validate items and calculate total
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Product ${item.productId} not found or inactive` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${product.name}` });
      }

      const itemTotal = (item.finalPrice || product.sellingPrice) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.sellingPrice,
        finalPrice: item.finalPrice || product.sellingPrice,
        bargainAccepted: item.bargainAccepted || false,
      });

      // Update stock
      product.stock -= item.quantity;
      product.sales += item.quantity;
      await product.save();
    }

    // Get seller from first product
    const firstProduct = await Product.findById(items[0].productId);
    const seller = await Seller.findById(firstProduct.sellerId);

    // Calculate delivery charge based on option
    let deliveryCharge = 0;
    if (deliveryOption === 'seller_pickup') {
      deliveryCharge = 0;
    } else if (deliveryOption === 'metro') {
      deliveryCharge = 50;
    } else if (deliveryOption === 'dabbawala') {
      deliveryCharge = 30;
    } else {
      deliveryCharge = 100; // Rapido/Uber
    }

    const total = subtotal + deliveryCharge;

    const order = new Order({
      orderId: generateOrderId(),
      userId: req.user._id,
      sellerId: seller._id,
      items: orderItems,
      subtotal,
      deliveryCharge,
      total,
      paymentMethod,
      deliveryOption,
      deliveryDetails: {
        address: addressId,
        ...deliveryDetails,
      },
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        notes: 'Order created',
      }],
    });

    await order.save();

    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('sellerId', 'businessName')
      .populate('items.productId', 'name images')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get seller orders
router.get('/seller-orders', auth, async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(403).json({ message: 'Not a seller' });
    }

    const orders = await Order.find({ sellerId: seller._id })
      .populate('userId', 'name email mobile')
      .populate('items.productId', 'name images')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email mobile')
      .populate('sellerId', 'businessName')
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    const isOwner = order.userId._id.toString() === req.user._id.toString();
    const seller = await Seller.findOne({ userId: req.user._id });
    const isSeller = seller && order.sellerId._id.toString() === seller._id.toString();

    if (!isOwner && !isSeller && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status
router.put('/:id/status', auth, [
  body('status').isIn(['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    const seller = await Seller.findOne({ userId: req.user._id });
    const isSeller = seller && order.sellerId.toString() === seller._id.toString();
    
    if (!isSeller && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update order status' });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      notes: notes || '',
    });

    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

