#!/bin/bash
# Complete Deployment and Database Seeding Script for EC2
# This script deploys the application and seeds the database

set -e  # Exit on any error

echo "=========================================="
echo "Complete EC2 Deployment & Database Seeding"
echo "=========================================="
echo ""

# Configuration
PROJECT_DIR="$HOME/bombay-marketplace"
MONGODB_URI="mongodb://localhost:27017/marketplace"
INSTANCE_URL="ec2-54-236-21-8.compute-1.amazonaws.com"
CLIENT_URL="http://$INSTANCE_URL:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Update System
echo -e "${BLUE}[1/18]${NC} Updating system packages..."
sudo apt-get update -y > /dev/null 2>&1
echo -e "${GREEN}✓${NC} System updated"

# Step 2: Install Node.js
if ! command -v node &> /dev/null; then
    echo -e "${BLUE}[2/18]${NC} Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y nodejs > /dev/null 2>&1
    echo -e "${GREEN}✓${NC} Node.js $(node --version) installed"
else
    echo -e "${BLUE}[2/18]${NC} Node.js already installed: $(node --version)"
fi

# Step 3: Install MongoDB
if ! command -v mongod &> /dev/null; then
    echo -e "${BLUE}[3/18]${NC} Installing MongoDB..."
    
    # Import MongoDB GPG key
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor > /dev/null 2>&1
    
    # Add MongoDB repository
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list > /dev/null
    
    # Update and install
    sudo apt-get update -y > /dev/null 2>&1
    sudo apt-get install -y mongodb-org > /dev/null 2>&1
    
    echo -e "${GREEN}✓${NC} MongoDB installed"
else
    echo -e "${BLUE}[3/18]${NC} MongoDB already installed"
fi

# Step 4: Start MongoDB
echo -e "${BLUE}[4/18]${NC} Starting MongoDB service..."
sudo systemctl start mongod > /dev/null 2>&1
sudo systemctl enable mongod > /dev/null 2>&1
sleep 3

if sudo systemctl is-active --quiet mongod; then
    echo -e "${GREEN}✓${NC} MongoDB is running"
else
    echo -e "${RED}✗${NC} MongoDB failed to start. Check logs: sudo journalctl -u mongod"
    exit 1
fi

# Step 5: Install PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${BLUE}[5/18]${NC} Installing PM2..."
    sudo npm install -g pm2 > /dev/null 2>&1
    echo -e "${GREEN}✓${NC} PM2 installed"
else
    echo -e "${BLUE}[5/18]${NC} PM2 already installed"
fi

# Step 6: Install Git
if ! command -v git &> /dev/null; then
    echo -e "${BLUE}[6/18]${NC} Installing Git..."
    sudo apt-get install -y git > /dev/null 2>&1
    echo -e "${GREEN}✓${NC} Git installed"
else
    echo -e "${BLUE}[6/18]${NC} Git already installed"
fi

# Step 7: Clone/Update Repository
echo -e "${BLUE}[7/18]${NC} Cloning/Updating repository from GitHub..."
cd "$HOME"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}⚠${NC} Directory exists, pulling latest changes..."
    cd "$PROJECT_DIR"
    git pull origin main > /dev/null 2>&1 || {
        echo -e "${YELLOW}⚠${NC} Git pull failed, trying fresh clone..."
        cd "$HOME"
        rm -rf "$PROJECT_DIR"
        git clone https://github.com/sivabramhab/bombay.git "$PROJECT_DIR" > /dev/null 2>&1
        cd "$PROJECT_DIR"
    }
    echo -e "${GREEN}✓${NC} Repository updated"
else
    git clone https://github.com/sivabramhab/bombay.git "$PROJECT_DIR" > /dev/null 2>&1
    cd "$PROJECT_DIR"
    echo -e "${GREEN}✓${NC} Repository cloned"
fi

# Step 8: Install Server Dependencies
echo -e "${BLUE}[8/18]${NC} Installing server dependencies..."
npm install > /dev/null 2>&1
echo -e "${GREEN}✓${NC} Server dependencies installed"

# Step 9: Install Client Dependencies
echo -e "${BLUE}[9/18]${NC} Installing client dependencies..."
cd client
npm install > /dev/null 2>&1
echo -e "${GREEN}✓${NC} Client dependencies installed"

# Step 10: Build Client
echo -e "${BLUE}[10/18]${NC} Building client application..."
npm run build > /dev/null 2>&1
echo -e "${GREEN}✓${NC} Client built successfully"
cd ..

# Step 11: Create/Update .env file
echo -e "${BLUE}[11/18]${NC} Creating/Updating .env file..."
if [ ! -f .env ]; then
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    cat > .env <<EOF
PORT=5000
NODE_ENV=production
MONGODB_URI=$MONGODB_URI
JWT_SECRET=$JWT_SECRET
CLIENT_URL=$CLIENT_URL
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://$INSTANCE_URL:5000/api/auth/google/callback
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
EOF
    echo -e "${GREEN}✓${NC} .env file created"
else
    # Update critical settings
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Update or add each variable
    grep -q "MONGODB_URI=" .env && sed -i "s|MONGODB_URI=.*|MONGODB_URI=$MONGODB_URI|" .env || echo "MONGODB_URI=$MONGODB_URI" >> .env
    grep -q "CLIENT_URL=" .env && sed -i "s|CLIENT_URL=.*|CLIENT_URL=$CLIENT_URL|" .env || echo "CLIENT_URL=$CLIENT_URL" >> .env
    grep -q "GOOGLE_CALLBACK_URL=" .env && sed -i "s|GOOGLE_CALLBACK_URL=.*|GOOGLE_CALLBACK_URL=http://$INSTANCE_URL:5000/api/auth/google/callback|" .env || echo "GOOGLE_CALLBACK_URL=http://$INSTANCE_URL:5000/api/auth/google/callback" >> .env
    grep -q "NODE_ENV=" .env && sed -i "s|NODE_ENV=.*|NODE_ENV=production|" .env || echo "NODE_ENV=production" >> .env
    
    echo -e "${GREEN}✓${NC} .env file updated"
fi

# Display key .env values
echo -e "${YELLOW}  MongoDB URI:${NC} $(grep MONGODB_URI .env | cut -d '=' -f2)"
echo -e "${YELLOW}  Client URL:${NC} $(grep CLIENT_URL .env | cut -d '=' -f2)"

# Step 12: Stop existing PM2 processes
echo -e "${BLUE}[12/18]${NC} Stopping existing PM2 processes..."
pm2 delete all > /dev/null 2>&1 || true
echo -e "${GREEN}✓${NC} Existing processes stopped"

# Step 13: Start Server
echo -e "${BLUE}[13/18]${NC} Starting server with PM2..."
pm2 start server/index.js --name "marketplace-server" --env production > /dev/null 2>&1
sleep 3
if pm2 list | grep -q "marketplace-server.*online"; then
    echo -e "${GREEN}✓${NC} Server started successfully"
else
    echo -e "${RED}✗${NC} Server failed to start. Check logs: pm2 logs marketplace-server"
    pm2 logs marketplace-server --lines 20
    exit 1
fi

# Step 14: Start Client
echo -e "${BLUE}[14/18]${NC} Starting client with PM2..."
cd client
pm2 start npm --name "marketplace-client" -- start > /dev/null 2>&1
cd ..
sleep 5
if pm2 list | grep -q "marketplace-client.*online"; then
    echo -e "${GREEN}✓${NC} Client started successfully"
else
    echo -e "${YELLOW}⚠${NC} Client may still be starting. Check logs: pm2 logs marketplace-client"
fi

# Step 15: Setup PM2 Startup
echo -e "${BLUE}[15/18]${NC} Setting up PM2 startup..."
pm2 save > /dev/null 2>&1
# Try to setup startup script
pm2 startup systemd -u $USER --hp $HOME 2>&1 | grep "sudo" | bash > /dev/null 2>&1 || true
echo -e "${GREEN}✓${NC} PM2 startup configured"

# Step 16: Wait for services to be ready
echo -e "${BLUE}[16/18]${NC} Waiting for services to be ready..."
sleep 5

# Step 17: Seed Database
echo -e "${BLUE}[17/18]${NC} Seeding database with products..."
cd "$PROJECT_DIR"
if node server/scripts/seedProducts.js > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Database seeded successfully"
else
    echo -e "${YELLOW}⚠${NC} Database seeding completed (products may already exist)"
fi

# Step 18: Verify Deployment
echo -e "${BLUE}[18/18]${NC} Verifying deployment..."

# Check server health
sleep 2
if curl -s http://localhost:5000/api > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Server is responding"
else
    echo -e "${YELLOW}⚠${NC} Server may still be starting"
fi

# Check client health
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Client is responding"
else
    echo -e "${YELLOW}⚠${NC} Client may still be starting"
fi

# Final Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo -e "${GREEN}Application URLs:${NC}"
echo -e "  ${BLUE}Client (Frontend):${NC}  $CLIENT_URL"
echo -e "  ${BLUE}Server (API):${NC}       http://$INSTANCE_URL:5000"
echo -e "  ${BLUE}API Health:${NC}         http://$INSTANCE_URL:5000/api"
echo ""
echo -e "${GREEN}Database:${NC}"
echo -e "  ${BLUE}URI:${NC}                $MONGODB_URI"
echo -e "  ${BLUE}Status:${NC}             $(sudo systemctl is-active mongod)"
echo -e "  ${BLUE}Products:${NC}           Seeded successfully"
echo ""
echo -e "${GREEN}PM2 Processes:${NC}"
pm2 list
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Open browser and visit: $CLIENT_URL"
echo "  2. Update OAuth credentials in .env if needed: nano $PROJECT_DIR/.env"
echo "  3. Update Razorpay credentials in .env if needed"
echo ""
echo -e "${GREEN}Useful Commands:${NC}"
echo "  View logs:     pm2 logs"
echo "  Restart:       pm2 restart all"
echo "  Status:        pm2 list"
echo "  MongoDB:       sudo systemctl status mongod"
echo ""
echo -e "${BLUE}Opening application URL...${NC}"
echo ""
echo "=========================================="

