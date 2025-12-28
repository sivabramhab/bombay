#!/bin/bash

# Deployment script for AWS EC2 instance
# This script will be run on the EC2 instance

set -e  # Exit on error

echo "=========================================="
echo "Starting Deployment Process"
echo "=========================================="

# Update system packages
echo "Updating system packages..."
sudo apt-get update -y

# Install Node.js and npm if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Install MongoDB
if ! command -v mongod &> /dev/null; then
    echo "Installing MongoDB..."
    
    # Import MongoDB GPG key
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    
    # Add MongoDB repository
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    # Update package list and install MongoDB
    sudo apt-get update -y
    sudo apt-get install -y mongodb-org
    
    # Start MongoDB service
    sudo systemctl start mongod
    sudo systemctl enable mongod
    
    echo "MongoDB installed and started"
else
    echo "MongoDB is already installed"
    # Ensure MongoDB is running
    sudo systemctl start mongod
    sudo systemctl enable mongod
fi

# Check MongoDB status
echo "MongoDB status:"
sudo systemctl status mongod --no-pager | head -5

# Get MongoDB connection string (localhost)
MONGODB_URI="mongodb://localhost:27017/marketplace"
echo "MongoDB URI: $MONGODB_URI"

# Install PM2 globally for process management
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo "Installing Git..."
    sudo apt-get install -y git
fi

# Clone or update repository
REPO_DIR="bombay-marketplace"
if [ -d "$REPO_DIR" ]; then
    echo "Repository exists, pulling latest changes..."
    cd "$REPO_DIR"
    git pull origin main
else
    echo "Cloning repository..."
    git clone https://github.com/sivabramhab/bombay.git "$REPO_DIR"
    cd "$REPO_DIR"
fi

# Install server dependencies
echo "Installing server dependencies..."
npm install

# Install client dependencies and build
echo "Installing client dependencies..."
cd client
npm install

echo "Building client application..."
npm run build

cd ..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env <<EOF
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=$MONGODB_URI

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)

# Client URL
CLIENT_URL=http://ec2-54-236-21-8.compute-1.amazonaws.com:3000

# Google OAuth (Update these with your credentials)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://ec2-54-236-21-8.compute-1.amazonaws.com:5000/api/auth/google/callback

# Razorpay Configuration (Update these with your credentials)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
EOF
    echo ".env file created"
else
    echo ".env file exists, updating MONGODB_URI..."
    # Update MONGODB_URI in existing .env file
    if grep -q "MONGODB_URI=" .env; then
        sed -i "s|MONGODB_URI=.*|MONGODB_URI=$MONGODB_URI|" .env
    else
        echo "MONGODB_URI=$MONGODB_URI" >> .env
    fi
    echo "MONGODB_URI updated in .env file"
fi

# Display .env file (masking sensitive data)
echo "Current .env configuration:"
cat .env | sed 's/=.*/=***/' | head -10

# Stop existing PM2 processes if running
pm2 delete all || true

# Start server with PM2
echo "Starting server with PM2..."
pm2 start server/index.js --name "marketplace-server" --env production

# Start client with PM2 (if needed for production)
# For production, you might want to use nginx to serve the Next.js static files
# For now, we'll start Next.js in production mode
cd client
pm2 start npm --name "marketplace-client" -- start
cd ..

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system reboot
pm2 startup systemd -u $USER --hp /home/$USER || true

echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo "Server is running on: http://ec2-54-236-21-8.compute-1.amazonaws.com:5000"
echo "Client is running on: http://ec2-54-236-21-8.compute-1.amazonaws.com:3000"
echo ""
echo "PM2 Status:"
pm2 list
echo ""
echo "MongoDB Status:"
sudo systemctl status mongod --no-pager | head -3

