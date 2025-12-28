#!/bin/bash
# Quick deployment commands for EC2
# Run these commands directly on EC2 instance

# 1. Update system
sudo apt-get update -y

# 2. Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update -y
sudo apt-get install -y mongodb-org

# 4. Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 5. Install PM2
sudo npm install -g pm2

# 6. Install Git
sudo apt-get install -y git

# 7. Clone repository
cd ~
git clone https://github.com/sivabramhab/bombay.git bombay-marketplace
cd bombay-marketplace

# 8. Install server dependencies
npm install

# 9. Install client dependencies and build
cd client
npm install
npm run build
cd ..

# 10. Create .env file with MongoDB URI
cat > .env <<'EOF'
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/marketplace
JWT_SECRET=
CLIENT_URL=http://ec2-54-236-21-8.compute-1.amazonaws.com:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://ec2-54-236-21-8.compute-1.amazonaws.com:5000/api/auth/google/callback
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
EOF

# 11. Generate JWT secret and update .env
JWT_SECRET=$(openssl rand -base64 32)
sed -i "s/JWT_SECRET=/JWT_SECRET=$JWT_SECRET/" .env

# 12. Update MongoDB URI (ensure it's correct)
sed -i 's|MONGODB_URI=.*|MONGODB_URI=mongodb://localhost:27017/marketplace|' .env

# 13. Start server with PM2
pm2 start server/index.js --name "marketplace-server"

# 14. Start client with PM2
cd client
pm2 start npm --name "marketplace-client" -- start
cd ..

# 15. Save PM2 configuration
pm2 save

# 16. Setup PM2 to start on reboot
pm2 startup systemd -u $USER --hp /home/$USER | grep "sudo" | bash || true

echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo "MongoDB URI: mongodb://localhost:27017/marketplace"
echo "Server: http://ec2-54-236-21-8.compute-1.amazonaws.com:5000"
echo "Client: http://ec2-54-236-21-8.compute-1.amazonaws.com:3000"
echo ""
echo "PM2 Status:"
pm2 list
echo ""
echo "MongoDB Status:"
sudo systemctl status mongod --no-pager | head -3

