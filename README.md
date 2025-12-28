# Competitive Marketplace

A comprehensive marketplace platform with competitive pricing, bargaining features, and multiple delivery options. Built to compete with major e-commerce platforms like Amazon, Flipkart, Zepto, Blinkit, etc.

## Features

### User Features
- **Authentication**: Sign up with Google OAuth or email/password
- **Mobile OTP Verification**: Secure mobile number verification
- **Product Browsing**: Search and browse products with competitive pricing (guaranteed 10% cheaper)
- **Bargaining**: Negotiate prices on select products
- **Challenges**: Create challenges by listing deals from other platforms (Amazon, Flipkart)
- **Multiple Payment Options**: Online payment via Razorpay or Cash on Delivery (COD)
- **Flexible Delivery Options**:
  - Mumbai Dabbawala network
  - Metro station pickup points
  - Seller pickup locations
  - Rapido/Uber delivery integration

### Seller Features
- **Seller Registration**: Register as a seller with or without GST
- **Close-knit Sellers**: Special category for verified sellers (no GST required)
- **Product Management**: Create, update, and manage products
- **Bargain Management**: Respond to buyer bargain requests
- **Challenge Responses**: Respond to competitive challenges
- **Order Management**: Track and manage orders

### Admin Features
- **Seller Verification**: Verify sellers with GST validation
- **Dashboard**: Comprehensive admin dashboard with statistics
- **User Management**: Manage users and roles

## Tech Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- Passport.js for Google OAuth
- Razorpay for payments
- Twilio for OTP (configurable)

### Frontend
- Next.js 16 with TypeScript
- React 19
- Tailwind CSS
- Zustand for state management
- React Query for data fetching
- React Hook Form for form management

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd competitive-marketplace
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Environment Variables**

Create a `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/competitive-marketplace
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
TWILIO_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
CLIENT_URL=http://localhost:3000
```

4. **Start the development server**
```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend (port 3000).

### Individual Server Commands

- Backend only: `npm run server`
- Frontend only: `npm run client`

## Project Structure

```
competitive-marketplace/
├── server/
│   ├── config/
│   │   └── passport.js          # Google OAuth configuration
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Seller.js            # Seller model
│   │   ├── Product.js           # Product model
│   │   ├── Order.js             # Order model
│   │   ├── Challenge.js         # Challenge model
│   │   └── Bargain.js           # Bargain model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── users.js             # User routes
│   │   ├── sellers.js           # Seller routes
│   │   ├── products.js          # Product routes
│   │   ├── orders.js            # Order routes
│   │   ├── challenges.js        # Challenge routes
│   │   ├── bargains.js          # Bargain routes
│   │   ├── payments.js          # Payment routes
│   │   ├── delivery.js          # Delivery routes
│   │   └── admin.js             # Admin routes
│   ├── services/
│   │   ├── otpService.js        # OTP service
│   │   └── paymentService.js    # Payment service
│   └── index.js                 # Server entry point
├── client/
│   ├── app/                     # Next.js app directory
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/
│   │   ├── register/
│   │   ├── products/
│   │   └── ...
│   ├── components/              # React components
│   ├── lib/                     # Utilities
│   └── store/                   # Zustand stores
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-otp` - Verify mobile OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (seller only)
- `PUT /api/products/:id` - Update product (seller only)
- `DELETE /api/products/:id` - Delete product (seller only)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get user orders
- `GET /api/orders/seller-orders` - Get seller orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status

### Challenges
- `POST /api/challenges` - Create challenge
- `GET /api/challenges` - Get all challenges
- `GET /api/challenges/:id` - Get single challenge
- `POST /api/challenges/:id/respond` - Seller respond to challenge
- `POST /api/challenges/:id/accept/:responseId` - Accept challenge response

### Bargains
- `POST /api/bargains` - Create bargain request
- `GET /api/bargains/my-bargains` - Get user bargains
- `GET /api/bargains/:id` - Get single bargain
- `POST /api/bargains/:id/respond` - Seller respond to bargain
- `POST /api/bargains/:id/counter-response` - Buyer respond to counter offer

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment

## Key Features Implementation

### 1. Competitive Pricing
- Products are guaranteed to be at least 10% cheaper than major platforms
- Price comparison tracking with Flipkart and Amazon prices

### 2. Bargaining System
- Sellers can enable bargaining on specific products
- Buyers can initiate bargain requests
- Sellers can accept, reject, or counter offers
- Real-time messaging during negotiations

### 3. Challenge System
- Users can create challenges by listing deals from other platforms
- Challenge price must be at least 10% less than current platform price
- Sellers can respond with competitive offers
- Faster delivery commitments

### 4. Delivery Options
- **Dabbawala Network**: Mumbai-based delivery network
- **Metro Pickup**: Pickup from nearest metro station
- **Seller Pickup**: Direct pickup from seller location
- **Rapido/Uber**: Integration with delivery partners

### 5. Seller Verification
- Regular sellers require GST registration
- Close-knit sellers don't require GST
- Admin/verifier team can verify sellers
- GST validation and verification notes

## Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced search with filters
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Loyalty program
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Integration with more delivery partners

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

