const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendOTP, verifyOTP } = require('../services/otpService');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d',
  });
};

// Register with email
router.post('/register', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('mobile')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian mobile number')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Mobile number must be a valid 10-digit number starting with 6-9')
    .trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
        })),
      });
    }

    const { email, password, name, mobile, userType = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { mobile: mobile.trim() }
      ],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase().trim()) {
        return res.status(400).json({ 
          success: false,
          message: 'User with this email already exists',
        });
      }
      if (existingUser.mobile === mobile.trim()) {
        return res.status(400).json({ 
          success: false,
          message: 'User with this mobile number already exists',
        });
      }
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase().trim(),
      password: password,
      name: name.trim(),
      mobile: mobile.trim(),
      mobileVerified: true, // Auto-verify - OTP disabled
      userType: userType === 'seller' ? 'seller' : 'user',
      role: userType === 'seller' ? 'seller' : 'buyer',
      isSeller: userType === 'seller',
    });

    // Save user to database
    await user.save();

    // OTP disabled - auto-verify mobile
    // Generate token immediately
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        userType: user.userType,
        mobileVerified: user.mobileVerified,
        isSeller: user.isSeller,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `User with this ${field} already exists`,
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
});

// Verify mobile OTP
router.post('/verify-otp', [
  body('mobile')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian mobile number')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Mobile number must be a valid 10-digit number')
    .trim(),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .matches(/^\d{6}$/)
    .withMessage('OTP must contain only numbers'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
        })),
      });
    }

    const { mobile, otp } = req.body;

    // Find user first
    const user = await User.findOne({ mobile: mobile.trim() });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found with this mobile number',
      });
    }

    // Verify OTP
    const verification = verifyOTP(mobile.trim(), otp);
    if (!verification.success) {
      return res.status(400).json({ 
        success: false,
        message: verification.message || 'Invalid or expired OTP',
      });
    }

    // OTP verification disabled - auto-verify and update user
    user.mobileVerified = true;
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        userType: user.userType,
        mobileVerified: user.mobileVerified,
        isSeller: user.isSeller,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during OTP verification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
});

// Resend OTP
router.post('/resend-otp', [
  body('mobile')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian mobile number')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Mobile number must be a valid 10-digit number')
    .trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
        })),
      });
    }

    const { mobile } = req.body;

    // Check if user exists
    const user = await User.findOne({ mobile: mobile.trim() });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found with this mobile number',
      });
    }

    // Send OTP
    const result = await sendOTP(mobile.trim());
    
    res.json({
      success: result.success,
      message: result.message || 'OTP sent successfully',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while sending OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
});

// Login with email
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
        })),
      });
    }

    const { email, password } = req.body;

    // Find user with password field included
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        userType: user.userType,
        mobileVerified: user.mobileVerified,
        isSeller: user.isSeller,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
});

// Google OAuth
router.get('/google', (req, res, next) => {
  // Check if OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || 
      process.env.GOOGLE_CLIENT_ID === 'your-google-client-id' ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      process.env.GOOGLE_CLIENT_SECRET === 'your-google-client-secret') {
    return res.status(400).json({
      success: false,
      message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file.',
      help: 'See SETUP_GOOGLE_OAUTH.md or STEP_BY_STEP_OAUTH.md for instructions.',
    });
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const token = generateToken(req.user._id);
      
      // Send OTP for mobile verification
      if (req.user.mobile) {
        await sendOTP(req.user.mobile);
      }

      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}&mobileVerified=${req.user.mobileVerified}`);
    } catch (error) {
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/error`);
    }
  }
);

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate({
        path: 'addresses',
        select: 'type street city state pincode landmark isDefault',
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
});

module.exports = router;

