# Quick Start Guide

Get the marketplace running in 5 minutes!

## 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install --legacy-peer-deps
cd ..
```

## 2. Create .env File

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/competitive-marketplace
JWT_SECRET=change-this-to-a-random-string
CLIENT_URL=http://localhost:3000
```

**Note**: The minimum required variables. Others (Google OAuth, Razorpay, Twilio) are optional for basic testing.

## 3. Start MongoDB

### Windows:
```bash
net start MongoDB
```

### macOS/Linux:
```bash
sudo systemctl start mongod
```

Or use MongoDB Atlas (cloud) - just update MONGODB_URI in .env

## 4. Start the Application

```bash
npm run dev
```

## 5. Open Your Browser

Navigate to: `http://localhost:3000`

## What's Working Out of the Box

✅ User registration with email/password  
✅ Mobile OTP verification (OTP logged to console in dev mode)  
✅ Product browsing  
✅ Product search and filters  
✅ User authentication  
✅ Seller registration  
✅ Product creation (as seller)  
✅ Order management  
✅ Challenge system  
✅ Bargaining system  

## What Requires Setup (Optional)

⚠️ Google OAuth - Need Google Cloud Console credentials  
⚠️ Razorpay Payments - Need Razorpay test/production keys  
⚠️ SMS OTP - Need Twilio credentials (dev mode logs OTP to console)  

## Test User Flow

1. **Register**: Go to `/register` and create an account
2. **Verify OTP**: Check terminal/console for OTP (in development)
3. **Browse Products**: Go to `/products`
4. **Become a Seller**: Register as seller (no GST needed for close-knit sellers)
5. **Create Product**: Add products through seller dashboard
6. **Create Challenge**: List a deal from Amazon/Flipkart and challenge sellers

## Need Help?

Check `SETUP.md` for detailed setup instructions or `README.md` for API documentation.

