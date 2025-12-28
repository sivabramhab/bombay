const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'razorpay_secret',
});

const createOrder = async (amount, currency = 'INR', receipt) => {
  try {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    return { success: true, order };
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return { success: false, error: error.message };
  }
};

const verifyPayment = (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
  try {
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'razorpay_secret')
      .update(text)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      return { success: true, verified: true };
    } else {
      return { success: false, verified: false, message: 'Invalid signature' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { createOrder, verifyPayment };

