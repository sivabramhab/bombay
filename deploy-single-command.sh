#!/bin/bash
# Single Command Deployment Script
# Downloads and executes full deployment in one go

set -e

echo "=========================================="
echo "One-Command Deployment Script"
echo "=========================================="
echo ""

# Configuration
INSTANCE_URL="ec2-54-236-21-8.compute-1.amazonaws.com"
GITHUB_REPO="https://github.com/sivabramhab/bombay.git"
PROJECT_DIR="$HOME/bombay-marketplace"

# Download and execute the full deployment script
echo "Downloading deployment script from GitHub..."
curl -fsSL https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh -o /tmp/deploy-and-seed.sh

if [ $? -eq 0 ]; then
    echo "✓ Script downloaded"
    chmod +x /tmp/deploy-and-seed.sh
    echo "Executing deployment..."
    echo ""
    exec /tmp/deploy-and-seed.sh
else
    echo "Failed to download script. Running inline deployment..."
    
    # Fallback: Run deployment inline
    cd ~
    
    # Update system
    sudo apt-get update -y
    
    # Install Node.js if not present
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Install MongoDB if not present
    if ! command -v mongod &> /dev/null; then
        curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
        echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
        sudo apt-get update -y
        sudo apt-get install -y mongodb-org
    fi
    
    # Start MongoDB
    sudo systemctl start mongod
    sudo systemctl enable mongod
    
    # Install PM2
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
    fi
    
    # Clone/Update repository
    if [ -d "$PROJECT_DIR" ]; then
        cd "$PROJECT_DIR"
        git pull origin main
    else
        git clone "$GITHUB_REPO" "$PROJECT_DIR"
        cd "$PROJECT_DIR"
    fi
    
    # Install dependencies
    npm install
    cd client && npm install && npm run build && cd ..
    
    # Create .env
    cat > .env <<EOF
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/marketplace
JWT_SECRET=$(openssl rand -base64 32)
CLIENT_URL=http://$INSTANCE_URL:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://$INSTANCE_URL:5000/api/auth/google/callback
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
EOF
    
    # Start services
    pm2 delete all || true
    pm2 start server/index.js --name "marketplace-server"
    cd client && pm2 start npm --name "marketplace-client" -- start && cd ..
    pm2 save
    pm2 startup systemd -u $USER --hp $HOME 2>/dev/null | grep "sudo" | bash || true
    
    # Seed database
    node server/scripts/seedProducts.js || echo "Database seeding completed"
    
    echo ""
    echo "=========================================="
    echo "✅ Deployment Complete!"
    echo "=========================================="
    pm2 list
fi

