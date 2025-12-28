# Database Dependencies & Validation Guide

## Overview
This document outlines all database dependencies, validations, and data storage requirements for the marketplace application.

## Database Dependencies

### Core Dependencies
- **Mongoose** (`^7.5.0`) - MongoDB ODM for Node.js
- **bcryptjs** (`^2.4.3`) - Password hashing
- **express-validator** (`^7.0.1`) - Request validation middleware

### Database Connection
- **MongoDB URI**: `mongodb://localhost:27017/competitive-marketplace` (default)
- **Connection Config**: Configured in `server/config/db.js`
- **Connection Status**: Automatically logged on server start

## User Registration & Login

### Registration Flow

#### 1. Registration Endpoint: `POST /api/auth/register`

**Required Fields:**
- `name` (String, 2-100 characters)
- `email` (String, valid email format)
- `password` (String, minimum 6 characters)
- `mobile` (String, 10-digit Indian mobile number starting with 6-9)

**Validations Performed:**
- ✅ Email format validation
- ✅ Email normalization and trimming
- ✅ Password length validation (min 6 characters)
- ✅ Name length validation (2-100 characters)
- ✅ Mobile number format validation (Indian format)
- ✅ Duplicate email check
- ✅ Duplicate mobile number check

**Database Storage:**
```javascript
{
  name: String (trimmed),
  email: String (lowercase, trimmed, unique, indexed),
  password: String (hashed with bcrypt, 10 rounds),
  mobile: String (trimmed, unique, indexed),
  mobileVerified: Boolean (default: false),
  role: String (default: 'buyer'),
  isSeller: Boolean (default: false),
  createdAt: Date,
  addresses: Array,
  preferences: Object
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify mobile OTP.",
  "data": {
    "userId": "...",
    "email": "...",
    "name": "...",
    "mobile": "..."
  },
  "otpSent": true
}
```

#### 2. OTP Verification: `POST /api/auth/verify-otp`

**Required Fields:**
- `mobile` (String, valid 10-digit Indian mobile number)
- `otp` (String, exactly 6 digits)

**Validations Performed:**
- ✅ Mobile number format validation
- ✅ OTP format validation (6 digits, numbers only)
- ✅ User existence check
- ✅ OTP verification (against stored OTP)

**Database Updates:**
- Sets `mobileVerified: true`
- Updates user record

**Response Format:**
```json
{
  "success": true,
  "message": "Mobile verified successfully",
  "token": "JWT_TOKEN",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "mobile": "...",
    "role": "...",
    "mobileVerified": true
  }
}
```

#### 3. Login Endpoint: `POST /api/auth/login`

**Required Fields:**
- `email` (String, valid email format)
- `password` (String, non-empty)

**Validations Performed:**
- ✅ Email format validation
- ✅ Email normalization
- ✅ Password non-empty check
- ✅ User existence check
- ✅ Password comparison (bcrypt)

**Database Updates:**
- Updates `lastLogin` timestamp

**Response Format:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "JWT_TOKEN",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "mobile": "...",
    "role": "...",
    "mobileVerified": true
  }
}
```

#### 4. Resend OTP: `POST /api/auth/resend-otp`

**Required Fields:**
- `mobile` (String, valid 10-digit Indian mobile number)

**Validations Performed:**
- ✅ Mobile number format validation
- ✅ User existence check

## Data Validation Details

### Email Validation
- Format: Standard email regex pattern
- Normalization: Converted to lowercase
- Trimming: Whitespace removed
- Uniqueness: Enforced at database level

### Mobile Number Validation
- Format: Indian mobile numbers only
- Pattern: `/^[6-9]\d{9}$/`
- Length: Exactly 10 digits
- First digit: Must be 6, 7, 8, or 9
- Uniqueness: Enforced at database level

### Password Validation
- Minimum length: 6 characters
- Hashing: bcrypt with 10 salt rounds
- Storage: Never stored in plain text

### Name Validation
- Minimum length: 2 characters
- Maximum length: 100 characters
- Trimming: Whitespace removed

## Database Models

### User Model (`server/models/User.js`)

**Schema Fields:**
```javascript
{
  name: { required: true, min: 2, max: 100 },
  email: { required: true, unique: true, lowercase: true, indexed },
  password: { required: false, min: 6, select: false },
  mobile: { required: true, unique: true, indexed, pattern: /^[6-9]\d{9}$/ },
  mobileVerified: { default: false },
  googleId: { sparse: true, indexed },
  role: { enum: ['buyer', 'seller', 'verifier', 'admin'], default: 'buyer' },
  isSeller: { default: false },
  addresses: [{
    type: { enum: ['home', 'work', 'other'] },
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
    isDefault: Boolean
  }],
  preferences: {
    deliveryOption: { enum: ['dabbawala', 'metro', 'seller_pickup', 'rapido', 'uber'] },
    preferredMetroStation: String
  },
  createdAt: { default: Date.now },
  lastLogin: Date
}
```

**Pre-save Hooks:**
- Password hashing before save (if password is modified)

**Indexes:**
- `email` (unique)
- `mobile` (unique)
- `googleId` (sparse)

### Seller Model (`server/models/Seller.js`)

**Schema Fields:**
```javascript
{
  userId: { required: true, unique: true, ref: 'User' },
  businessName: { required: true },
  gstNumber: { sparse: true, pattern: GST format },
  gstVerified: { default: false },
  isCloseKnit: { default: false },
  verificationStatus: { enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  verificationNotes: String,
  verifiedBy: { ref: 'User' },
  verifiedAt: Date,
  pickupLocations: Array,
  bankDetails: Object,
  rating: { average: Number, count: Number },
  totalSales: { default: 0 },
  createdAt: { default: Date.now }
}
```

## Error Handling

### Validation Errors
- Format: Structured error response with field-level messages
- HTTP Status: 400 Bad Request
- Response includes specific field errors

### Database Errors
- Duplicate Key: Handled with specific error messages
- Validation Errors: Field-level error reporting
- Connection Errors: Automatic retry and logging

### Security Features
- Password hashing with bcrypt
- JWT token generation
- Input sanitization
- SQL injection prevention (NoSQL, but still sanitized)

## Testing Database Connections

### Check MongoDB Connection
```bash
# The server automatically checks connection on startup
# Look for: "✅ MongoDB Connected Successfully!"
```

### Verify Data Storage
1. Register a user via `/api/auth/register`
2. Check MongoDB database for user document
3. Verify password is hashed
4. Verify OTP verification updates `mobileVerified` field

## Common Issues & Solutions

### Issue: Duplicate Email/Mobile
**Solution**: Check for existing user before creating new one

### Issue: Password Not Hashing
**Solution**: Ensure password is modified before save (handled by pre-save hook)

### Issue: OTP Not Working
**Solution**: Check OTP service and ensure mobile number is correctly formatted

### Issue: Validation Failing
**Solution**: Check input format matches validation rules (see validation details above)

## Best Practices

1. **Always validate input** before database operations
2. **Hash passwords** before storage
3. **Use indexes** for frequently queried fields
4. **Normalize email** to lowercase
5. **Trim strings** to remove whitespace
6. **Handle errors** gracefully with proper status codes
7. **Log errors** for debugging (development mode)

## API Response Standards

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "...",
  "errors": [{
    "field": "...",
    "message": "..."
  }]
}
```

