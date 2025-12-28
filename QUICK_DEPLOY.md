# Quick Deploy to EC2 - Complete Guide

## ✅ Prerequisites Completed
- ✅ Security Groups configured (ports 3000, 5000)
- ✅ Code pushed to GitHub
- ✅ CLIENT_URL updated to: http://ec2-54-236-21-8.compute-1.amazonaws.com:3000

## 🚀 Deployment Steps

### Step 1: SSH into EC2 Instance

```bash
ssh ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com
# If ubuntu doesn't work, try:
# ssh ec2-user@ec2-54-236-21-8.compute-1.amazonaws.com
# ssh admin@ec2-54-236-21-8.compute-1.amazonaws.com
```

**Note:** If using password authentication:
- Username: team@svgnai.com (or ubuntu/ec2-user)
- Password: Theteamofbella@123

### Step 2: Download and Run Deployment Script

Once connected to EC2, run these commands:

```bash
# Download the complete deployment script
cd ~
wget https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh

# Make it executable
chmod +x deploy-and-seed.sh

# Run the deployment script (this will take 5-10 minutes)
./deploy-and-seed.sh
```

### Alternative: Manual Deployment (if script fails)

If the script doesn't work, run these commands one by one:

```bash
# Update system
sudo apt-get update -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update -y
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt-get install -y git

# Clone repository
cd ~
git clone https://github.com/sivabramhab/bombay.git bombay-marketplace
cd bombay-marketplace

# Install server dependencies
npm install

# Install client dependencies and build
cd client
npm install
npm run build
cd ..

# Create .env file
cat > .env <<EOF
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/marketplace
JWT_SECRET=$(openssl rand -base64 32)
CLIENT_URL=http://ec2-54-236-21-8.compute-1.amazonaws.com:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://ec2-54-236-21-8.compute-1.amazonaws.com:5000/api/auth/google/callback
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
EOF

# Stop existing PM2 processes
pm2 delete all || true

# Start server
pm2 start server/index.js --name "marketplace-server"

# Start client
cd client
pm2 start npm --name "marketplace-client" -- start
cd ..

# Save PM2 configuration
pm2 save
pm2 startup

# Seed database
cd ~/bombay-marketplace
node server/scripts/seedProducts.js

# Check status
pm2 list
```

### Step 3: Verify Deployment

```bash
# Check PM2 processes
pm2 list

# Check logs
pm2 logs --lines 50

# Check MongoDB
sudo systemctl status mongod

# Test server
curl http://localhost:5000/api

# Test client
curl http://localhost:3000
```

### Step 4: Open Application in Browser

Once deployment is complete, open your browser and visit:

**Frontend (Client):**
```
http://ec2-54-236-21-8.compute-1.amazonaws.com:3000
```

**Backend API:**
```
http://ec2-54-236-21-8.compute-1.amazonaws.com:5000/api
```

## 📋 What the Script Does

1. ✅ Updates system packages
2. ✅ Installs Node.js 20.x
3. ✅ Installs MongoDB 7.0
4. ✅ Starts MongoDB service
5. ✅ Installs PM2 (process manager)
6. ✅ Clones/updates code from GitHub
7. ✅ Installs all dependencies
8. ✅ Builds Next.js client
9. ✅ Creates .env file with correct CLIENT_URL
10. ✅ Updates MongoDB URI
11. ✅ Starts server with PM2
12. ✅ Starts client with PM2
13. ✅ Configures PM2 to start on reboot
14. ✅ Seeds database with products
15. ✅ Verifies deployment

## 🔍 Troubleshooting

### If MongoDB fails to start:
```bash
sudo systemctl status mongod
sudo journalctl -u mongod -n 50
sudo systemctl restart mongod
```

### If PM2 processes fail:
```bash
pm2 logs marketplace-server
pm2 logs marketplace-client
pm2 restart all
```

### If port is already in use:
```bash
# Find process using port 5000
sudo lsof -i :5000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

### If deployment script fails:
```bash
# Check the script output for errors
# Manually run each step from the "Alternative: Manual Deployment" section above
```

## 📊 Verify Database Seeding

After deployment, verify products were seeded:

```bash
mongosh marketplace
# In MongoDB shell:
db.products.count()
db.products.find().limit(5)
exit
```

## 🎯 Expected Results

After successful deployment:
- ✅ Server running on port 5000
- ✅ Client running on port 3000
- ✅ MongoDB running with seeded products
- ✅ PM2 managing both processes
- ✅ Application accessible via browser

## 🔗 Application URLs

- **Homepage:** http://ec2-54-236-21-8.compute-1.amazonaws.com:3000
- **API:** http://ec2-54-236-21-8.compute-1.amazonaws.com:5000
- **Products API:** http://ec2-54-236-21-8.compute-1.amazonaws.com:5000/api/products

## 📝 Next Steps

1. ✅ Application deployed
2. ✅ Database seeded
3. ⚠️ Test the application in browser
4. ⚠️ Update OAuth credentials if needed
5. ⚠️ Update Razorpay credentials if needed

## 💡 Useful Commands

```bash
# View all logs
pm2 logs

# View specific process logs
pm2 logs marketplace-server
pm2 logs marketplace-client

# Restart all
pm2 restart all

# Stop all
pm2 stop all

# Monitor processes
pm2 monit

# Check MongoDB
mongosh marketplace
```

