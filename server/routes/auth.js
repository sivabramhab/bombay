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
    }).select('+password'); // Include password for verification

    // If user exists and trying to register as seller
    if (existingUser && userType === 'seller') {
      // Verify both email AND mobile number match (password can be wrong)
      const emailMatches = existingUser.email === email.toLowerCase().trim();
      const mobileMatches = existingUser.mobile === mobile.trim();
      
      if (emailMatches && mobileMatches) {
        // Both email and mobile match - upgrade user to seller (ignore password)
        // Check if seller record exists
        const Seller = require('../models/Seller');
        let seller = await Seller.findOne({ userId: existingUser._id });
        
        if (!seller) {
          // Create seller record
          seller = new Seller({
            userId: existingUser._id,
            businessName: name.trim() || existingUser.name || 'My Business',
            isCloseKnit: true,
            verificationStatus: 'approved',
          });
          await seller.save();
        }
        
        // Update user to have seller capabilities (if not already a seller)
        if (!existingUser.isSeller) {
          existingUser.isSeller = true;
          existingUser.role = 'seller';
          // Keep userType as 'user' so they remain both user and seller
          if (!existingUser.userType || existingUser.userType === 'user') {
            existingUser.userType = 'user'; // Keep as user for dual capabilities
          }
          await existingUser.save();
        }
        
        // Generate token
        const token = generateToken(existingUser._id);
        
        return res.status(200).json({
          success: true,
          message: existingUser.isSeller ? 'Welcome back! You already have seller access.' : 'Account upgraded to seller successfully. You now have both user and seller access.',
          token,
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            mobile: existingUser.mobile,
            role: existingUser.role,
            userType: existingUser.userType,
            mobileVerified: existingUser.mobileVerified,
            isSeller: existingUser.isSeller,
          },
        });
      } else {
        // Email or mobile doesn't match
        return res.status(400).json({ 
          success: false,
          message: 'Email and mobile number must match your existing account to upgrade to seller.',
        });
      }
    }

    // If user exists and NOT trying to upgrade to seller, return error
    if (existingUser) {
      if (existingUser.email === email.toLowerCase().trim()) {
        return res.status(400).json({ 
          success: false,
          message: 'User with this email already exists. Please login instead.',
        });
      }
      if (existingUser.mobile === mobile.trim()) {
        return res.status(400).json({ 
          success: false,
          message: 'User with this mobile number already exists. Please login instead.',
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
    try {
      const savedUser = await user.save();
      console.log('User saved successfully:', savedUser._id);
      
      // If registering as seller, create seller record
      if (userType === 'seller') {
        const Seller = require('../models/Seller');
        const seller = new Seller({
          userId: savedUser._id,
          businessName: name.trim() || 'My Business',
          isCloseKnit: true,
          verificationStatus: 'approved',
        });
        await seller.save();
        console.log('Seller record created for user:', savedUser._id);
      }
      
      // Generate token using saved user ID
      const token = generateToken(savedUser._id);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
          mobile: savedUser.mobile,
          role: savedUser.role,
          userType: savedUser.userType,
          mobileVerified: savedUser.mobileVerified,
          isSeller: savedUser.isSeller,
        },
      });
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      throw saveError; // Re-throw to be caught by outer catch block
    }
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle duplicate key error (MongoDB duplicate key)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `User with this ${field} already exists. Please login instead.`,
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
    }
    
    // Handle document not found (shouldn't happen during creation, but handle it)
    if (error.name === 'DocumentNotFoundError') {
      console.error('DocumentNotFoundError during registration - possible database sync issue');
      return res.status(500).json({
        success: false,
        message: 'An error occurred during registration. Please try again.',
      });
    }
    
    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.',
      error: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production' ? error.message : 'Internal server error',
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

