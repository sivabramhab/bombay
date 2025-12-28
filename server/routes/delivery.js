const express = require('express');
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');

const router = express.Router();

// Get delivery options
router.get('/options', async (req, res) => {
  try {
    const { city, pincode } = req.query;

    // Mock data - in production, this would query actual service providers
    const options = {
      dabbawala: {
        available: ['mumbai'].includes(city?.toLowerCase()),
        estimatedTime: '4-6 hours',
        cost: 30,
        description: 'Mumbai Dabbawala network - Fast and reliable local delivery',
      },
      metro: {
        available: true,
        stations: [
          'Metro Station 1',
          'Metro Station 2',
          'Metro Station 3',
        ],
        estimatedTime: 'Same day',
        cost: 50,
        description: 'Pickup from nearest metro station',
      },
      seller_pickup: {
        available: true,
        estimatedTime: 'Immediate',
        cost: 0,
        description: 'Pickup directly from seller location',
      },
      rapido: {
        available: true,
        estimatedTime: '1-2 hours',
        cost: 80,
        description: 'Rapido delivery partner',
      },
      uber: {
        available: true,
        estimatedTime: '1-2 hours',
        cost: 100,
        description: 'Uber delivery service',
      },
    };

    res.json(options);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update delivery tracking
router.put('/:orderId/tracking', auth, async (req, res) => {
  try {
    const { trackingId, status, deliveryPartner, estimatedDelivery } = req.body;

    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    const seller = await Seller.findOne({ userId: req.user._id });
    const isSeller = seller && order.sellerId.toString() === seller._id.toString();
    
    if (!isSeller && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (trackingId) order.deliveryDetails.trackingId = trackingId;
    if (deliveryPartner) order.deliveryDetails.deliveryPartner = deliveryPartner;
    if (estimatedDelivery) order.deliveryDetails.estimatedDelivery = new Date(estimatedDelivery);
    if (status) {
      order.status = status;
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        notes: 'Delivery status updated',
      });
    }

    await order.save();

    res.json({ message: 'Delivery tracking updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

