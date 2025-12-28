const twilio = require('twilio');

// For development, use in-memory storage
// In production, use Redis or similar
const otpStore = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (mobile) => {
  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(mobile, { otp, expiresAt });

  // In production, use Twilio or similar service
  // const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({
  //   body: `Your OTP is ${otp}. Valid for 10 minutes.`,
  //   to: mobile,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  // });

  // For development, log OTP
  console.log(`OTP for ${mobile}: ${otp}`);

  return { success: true, message: 'OTP sent successfully' };
};

const verifyOTP = (mobile, otp) => {
  const stored = otpStore.get(mobile);

  if (!stored) {
    return { success: false, message: 'OTP not found or expired' };
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(mobile);
    return { success: false, message: 'OTP expired' };
  }

  if (stored.otp !== otp) {
    return { success: false, message: 'Invalid OTP' };
  }

  otpStore.delete(mobile);
  return { success: true, message: 'OTP verified successfully' };
};

module.exports = { sendOTP, verifyOTP };

