# Complete Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** - Either:
  - Local MongoDB installation, or
  - MongoDB Atlas account (free tier available)
- **Git** (optional, for version control)

## Step-by-Step Setup

### 1. Install Dependencies

Open a terminal in the project root directory and run:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install --legacy-peer-deps
cd ..
```

### 2. Set Up Environment Variables

#### Backend (.env file in root directory)

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/competitive-marketplace
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/competitive-marketplace

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-use-random-string

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Razorpay (Get from Razorpay Dashboard)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Twilio for OTP (Optional - for production)
TWILIO_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Client URL
CLIENT_URL=http://localhost:3000
```

#### Frontend (Optional - .env.local in client directory)

Create a `.env.local` file in the `client` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Set Up MongoDB

#### Option A: Local MongoDB

1. Install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB

   # macOS/Linux
   sudo systemctl start mongod
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address (or 0.0.0.0/0 for development)
5. Get the connection string and update `MONGODB_URI` in `.env`

### 4. Set Up Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### 5. Set Up Razorpay (Optional for development)

1. Create account at [razorpay.com](https://razorpay.com/)
2. Get Test API keys from Dashboard → Settings → API Keys
3. Add keys to `.env`

**Note**: For development, you can use test keys. The payment flow will work but won't process real payments.

### 6. Set Up Twilio for OTP (Optional)

1. Create account at [twilio.com](https://www.twilio.com/)
2. Get Account SID and Auth Token from Dashboard
3. Get a phone number from Twilio
4. Add credentials to `.env`

**Note**: For development, OTP will be logged to console. Twilio setup is only needed for production SMS.

### 7. Start the Application

#### Development Mode (Both servers)

From the root directory:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend server on `http://localhost:3000`

#### Individual Servers

Backend only:
```bash
npm run server
```

Frontend only (from root):
```bash
npm run client
```

Or from client directory:
```bash
cd client
npm run dev
```

### 8. Verify Installation

1. Open browser and go to `http://localhost:3000`
2. You should see the marketplace homepage
3. Try registering a new account
4. Check backend logs for any errors

## Testing the Application

### Create Test User

1. Go to `/register`
2. Fill in the registration form
3. Enter mobile number
4. Check console/terminal for OTP (development mode)
5. Enter OTP to verify

### Create Test Seller

1. Register/Login as a user
2. Navigate to seller registration (or create endpoint)
3. Fill seller details
4. As admin, verify the seller

### Admin Access

To create an admin user, you can either:
1. Manually update MongoDB document
2. Use MongoDB shell:
   ```javascript
   use competitive-marketplace
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "admin" } }
   )
   ```

## Troubleshooting

### MongoDB Connection Error

- Ensure MongoDB is running (local) or connection string is correct (Atlas)
- Check firewall settings if using Atlas
- Verify credentials in connection string

### Port Already in Use

- Change `PORT` in `.env` for backend
- Change port for frontend in `package.json` scripts

### OTP Not Working

- Check console logs (development mode logs OTP)
- Verify Twilio credentials if using production
- Check mobile number format (should be 10 digits for India)

### Google OAuth Not Working

- Verify redirect URI matches exactly
- Check Client ID and Secret
- Ensure Google+ API is enabled

### Payment Gateway Issues

- Use test keys for development
- Verify Razorpay keys are correct
- Check Razorpay webhook configuration for production

## Next Steps

1. Explore the application features
2. Create test products as a seller
3. Test the bargaining feature
4. Create challenges
5. Test order flow
6. Explore admin panel

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use secure JWT secret
3. Set up proper MongoDB database
4. Configure production OAuth redirect URIs
5. Set up Twilio for SMS
6. Use production Razorpay keys
7. Set up proper domain for CLIENT_URL
8. Enable HTTPS
9. Set up environment variables on hosting platform
10. Consider using PM2 or similar for process management

## Support

If you encounter any issues:
1. Check the console/terminal logs
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check MongoDB connection
5. Review the README.md for API documentation

