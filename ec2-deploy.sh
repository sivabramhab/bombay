#!/bin/bash
# Complete EC2 Deployment Script
# Run this script on your EC2 instance after SSH connection

set -e  # Exit on any error

echo "=========================================="
echo "AWS EC2 Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$HOME/bombay-marketplace"
MONGODB_URI="mongodb://localhost:27017/marketplace"
INSTANCE_URL="ec2-54-236-21-8.compute-1.amazonaws.com"

# Step 1: Update System
echo -e "${GREEN}[1/15]${NC} Updating system packages..."
sudo apt-get update -y > /dev/null 2>&1
echo -e "${GREEN}✓${NC} System updated"

# Step 2: Install Node.js
if ! command -v node &> /dev/null; then
    echo -e "${GREEN}[2/15]${NC} Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y nodejs > /dev/null 2>&1
    echo -e "${GREEN}✓${NC} Node.js $(node --version) installed"
else
    echo -e "${GREEN}[2/15]${NC} Node.js already installed: $(node --version)"
fi

# Step 3: Install MongoDB
if ! command -v mongod &> /dev/null; then
    echo -e "${GREEN}[3/15]${NC} Installing MongoDB..."
    
    # Import MongoDB GPG key
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor > /dev/null 2>&1
    
    # Add MongoDB repository
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list > /dev/null
    
    # Update and install
    sudo apt-get update -y > /dev/null 2>&1
    sudo apt-get install -y mongodb-org > /dev/null 2>&1
    
    echo -e "${GREEN}✓${NC} MongoDB installed"
else
    echo -e "${GREEN}[3/15]${NC} MongoDB already installed"
fi

# Step 4: Start MongoDB
echo -e "${GREEN}[4/15]${NC} Starting MongoDB service..."
sudo systemctl start mongod > /dev/null 2>&1
sudo systemctl enable mongod > /dev/null 2>&1
sleep 2

if sudo systemctl is-active --quiet mongod; then
    echo -e "${GREEN}✓${NC} MongoDB is running"
else
    echo -e "${RED}✗${NC} MongoDB failed to start. Check logs: sudo journalctl -u mongod"
    exit 1
fi

# Step 5: Install PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${GREEN}[5/15]${NC} Installing PM2..."
    sudo npm install -g pm2 > /dev/null 2>&1
    echo -e "${GREEN}✓${NC} PM2 installed"
else
    echo -e "${GREEN}[5/15]${NC} PM2 already installed"
fi

# Step 6: Install Git
if ! command -v git &> /dev/null; then
    echo -e "${GREEN}[6/15]${NC} Installing Git..."
    sudo apt-get install -y git > /dev/null 2>&1
    echo -e "${GREEN}✓${NC} Git installed"
else
    echo -e "${GREEN}[6/15]${NC} Git already installed"
fi

# Step 7: Clone/Update Repository
echo -e "${GREEN}[7/15]${NC} Cloning repository from GitHub..."
cd "$HOME"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}⚠${NC} Directory exists, pulling latest changes..."
    cd "$PROJECT_DIR"
    git pull origin main > /dev/null 2>&1 || echo -e "${YELLOW}⚠${NC} Git pull failed, continuing..."
else
    git clone https://github.com/sivabramhab/bombay.git "$PROJECT_DIR" > /dev/null 2>&1
    cd "$PROJECT_DIR"
    echo -e "${GREEN}✓${NC} Repository cloned"
fi

# Step 8: Install Server Dependencies
echo -e "${GREEN}[8/15]${NC} Installing server dependencies..."
npm install > /dev/null 2>&1
echo -e "${GREEN}✓${NC} Server dependencies installed"

# Step 9: Install Client Dependencies
echo -e "${GREEN}[9/15]${NC} Installing client dependencies..."
cd client
npm install > /dev/null 2>&1
echo -e "${GREEN}✓${NC} Client dependencies installed"

# Step 10: Build Client
echo -e "${GREEN}[10/15]${NC} Building client application..."
npm run build > /dev/null 2>&1
echo -e "${GREEN}✓${NC} Client built successfully"
cd ..

# Step 11: Create/Update .env file
echo -e "${GREEN}[11/15]${NC} Creating .env file..."
if [ ! -f .env ]; then
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    cat > .env <<EOF
PORT=5000
NODE_ENV=production
MONGODB_URI=$MONGODB_URI
JWT_SECRET=$JWT_SECRET
CLIENT_URL=http://$INSTANCE_URL:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://$INSTANCE_URL:5000/api/auth/google/callback
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
EOF
    echo -e "${GREEN}✓${NC} .env file created"
else
    # Update MongoDB URI if .env exists
    if grep -q "MONGODB_URI=" .env; then
        sed -i "s|MONGODB_URI=.*|MONGODB_URI=$MONGODB_URI|" .env
        echo -e "${GREEN}✓${NC} MongoDB URI updated in .env file"
    else
        echo "MONGODB_URI=$MONGODB_URI" >> .env
        echo -e "${GREEN}✓${NC} MongoDB URI added to .env file"
    fi
fi

# Display MongoDB URI
echo -e "${YELLOW}MongoDB URI:${NC} $(grep MONGODB_URI .env | cut -d '=' -f2)"

# Step 12: Stop existing PM2 processes
echo -e "${GREEN}[12/15]${NC} Stopping existing PM2 processes..."
pm2 delete all > /dev/null 2>&1 || true
echo -e "${GREEN}✓${NC} Existing processes stopped"

# Step 13: Start Server
echo -e "${GREEN}[13/15]${NC} Starting server with PM2..."
pm2 start server/index.js --name "marketplace-server" --env production > /dev/null 2>&1
sleep 2
if pm2 list | grep -q "marketplace-server.*online"; then
    echo -e "${GREEN}✓${NC} Server started successfully"
else
    echo -e "${RED}✗${NC} Server failed to start. Check logs: pm2 logs marketplace-server"
fi

# Step 14: Start Client
echo -e "${GREEN}[14/15]${NC} Starting client with PM2..."
cd client
pm2 start npm --name "marketplace-client" -- start > /dev/null 2>&1
cd ..
sleep 3
if pm2 list | grep -q "marketplace-client.*online"; then
    echo -e "${GREEN}✓${NC} Client started successfully"
else
    echo -e "${YELLOW}⚠${NC} Client may still be starting. Check logs: pm2 logs marketplace-client"
fi

# Step 15: Setup PM2 Startup
echo -e "${GREEN}[15/15]${NC} Setting up PM2 startup..."
pm2 save > /dev/null 2>&1
# Try to setup startup script
pm2 startup systemd -u $USER --hp $HOME 2>&1 | grep "sudo" | bash > /dev/null 2>&1 || true
echo -e "${GREEN}✓${NC} PM2 startup configured"

# Final Summary
echo ""
echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo -e "${GREEN}Application URLs:${NC}"
echo "  Client:  http://$INSTANCE_URL:3000"
echo "  Server:  http://$INSTANCE_URL:5000"
echo ""
echo -e "${GREEN}MongoDB:${NC}"
echo "  URI:     $MONGODB_URI"
echo "  Status:  $(sudo systemctl is-active mongod)"
echo ""
echo -e "${GREEN}PM2 Processes:${NC}"
pm2 list
echo ""
echo -e "${YELLOW}Important Next Steps:${NC}"
echo "  1. Configure Security Group to allow ports 3000 and 5000"
echo "  2. Update OAuth and Razorpay credentials in .env file"
echo "  3. Seed database: cd $PROJECT_DIR && node server/scripts/seedProducts.js"
echo ""
echo -e "${GREEN}Useful Commands:${NC}"
echo "  View logs:     pm2 logs"
echo "  Restart:       pm2 restart all"
echo "  Status:        pm2 list"
echo "  MongoDB:       sudo systemctl status mongod"
echo ""
echo "=========================================="

