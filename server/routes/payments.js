const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { createOrder, verifyPayment } = require('../services/paymentService');
const Order = require('../models/Order');

const router = express.Router();

// Create Razorpay order
router.post('/create-order', auth, [
  body('amount').isFloat({ min: 1 }),
  body('orderId').isMongoId(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, orderId } = req.body;

    // Verify order belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const razorpayOrder = await createOrder(amount, 'INR', order.orderId);
    
    if (!razorpayOrder.success) {
      return res.status(500).json({ message: 'Failed to create payment order', error: razorpayOrder.error });
    }

    // Update order with Razorpay order ID
    order.razorpayOrderId = razorpayOrder.order.id;
    await order.save();

    res.json({
      message: 'Payment order created',
      orderId: razorpayOrder.order.id,
      amount: razorpayOrder.order.amount,
      currency: razorpayOrder.order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify payment
router.post('/verify', auth, [
  body('razorpay_order_id').notEmpty(),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_signature').notEmpty(),
  body('orderId').isMongoId(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    // Verify payment signature
    const verification = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
    if (!verification.verified) {
      return res.status(400).json({ message: 'Payment verification failed', verification });
    }

    // Update order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.status = 'confirmed';
    
    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      notes: 'Payment received',
    });

    await order.save();

    res.json({
      message: 'Payment verified successfully',
      order,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

