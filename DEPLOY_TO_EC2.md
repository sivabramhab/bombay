# Deploy to AWS EC2 - Step by Step Guide

## Prerequisites
- EC2 Instance: ec2-54-236-21-8.compute-1.amazonaws.com
- SSH Access: team@svgnai.com / Theteamofbella@123
- GitHub Repository: https://github.com/sivabramhab/bombay.git

## Quick Deployment Steps

### Step 1: Connect to EC2 Instance

**Option A: Using SSH with password (if configured)**
```bash
ssh team@svgnai.com@ec2-54-236-21-8.compute-1.amazonaws.com
# Password: Theteamofbella@123
```

**Option B: Using SSH key file**
```bash
ssh -i your-key.pem ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com
# or
ssh -i your-key.pem ec2-user@ec2-54-236-21-8.compute-1.amazonaws.com
```

**Note**: The username might be `ubuntu`, `ec2-user`, or `admin` depending on your EC2 instance AMI.

### Step 2: Run Deployment Commands

Once connected to EC2, copy and paste these commands one by one:

```bash
# Update system
sudo apt-get update -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update -y
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod

# Install PM2 for process management
sudo npm install -g pm2

# Install Git if not present
sudo apt-get install -y git

# Navigate to home directory and clone repository
cd ~
git clone https://github.com/sivabramhab/bombay.git bombay-marketplace
cd bombay-marketplace

# Install server dependencies
npm install

# Install client dependencies
cd client
npm install

# Build client application
npm run build

# Go back to root directory
cd ..

# Create .env file with MongoDB URI
cat > .env <<'ENVFILE'
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
ENVFILE

# Generate and update JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32)
sed -i "s/JWT_SECRET=/JWT_SECRET=$JWT_SECRET/" .env

# Verify MongoDB URI is set correctly
grep MONGODB_URI .env

# Start server with PM2
pm2 start server/index.js --name "marketplace-server"

# Start client with PM2
cd client
pm2 start npm --name "marketplace-client" -- start
cd ..

# Save PM2 process list
pm2 save

# Setup PM2 to start on system reboot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Check PM2 status
pm2 list
pm2 logs --lines 20
```

### Step 3: Configure Security Groups

**Important**: Make sure your EC2 Security Group allows inbound traffic on:
- Port 22 (SSH)
- Port 3000 (Client/Next.js)
- Port 5000 (Server API)

**Via AWS Console:**
1. Go to AWS Console → EC2 → Instances
2. Select your instance: i-0f75a79829213e975
3. Click on Security tab
4. Click on Security Group
5. Click "Edit Inbound Rules"
6. Add rules:
   - Type: Custom TCP, Port: 3000, Source: 0.0.0.0/0
   - Type: Custom TCP, Port: 5000, Source: 0.0.0.0/0

**Via AWS CLI:**
```bash
aws ec2 authorize-security-group-ingress \
    --group-id <your-security-group-id> \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id <your-security-group-id> \
    --protocol tcp \
    --port 5000 \
    --cidr 0.0.0.0/0
```

### Step 4: Verify Deployment

1. **Check MongoDB:**
```bash
mongosh --eval "db.adminCommand('listDatabases')"
```

2. **Check PM2 Processes:**
```bash
pm2 list
pm2 logs
```

3. **Test the Application:**
   - Server API: http://ec2-54-236-21-8.compute-1.amazonaws.com:5000/api
   - Client: http://ec2-54-236-21-8.compute-1.amazonaws.com:3000

4. **Seed Database (Optional):**
```bash
cd ~/bombay-marketplace
node server/scripts/seedProducts.js
```

### Step 5: Update Environment Variables (Optional)

If you have Google OAuth and Razorpay credentials, update the `.env` file:

```bash
nano ~/bombay-marketplace/.env
# or
vim ~/bombay-marketplace/.env
```

Update these lines with your actual credentials:
```
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
RAZORPAY_KEY_ID=your_actual_razorpay_key_id
RAZORPAY_KEY_SECRET=your_actual_razorpay_key_secret
```

After updating, restart PM2:
```bash
pm2 restart all
```

## Troubleshooting

### MongoDB not starting:
```bash
sudo systemctl status mongod
sudo journalctl -u mongod -n 50
sudo systemctl restart mongod
```

### Port already in use:
```bash
# Find process using port 5000
sudo lsof -i :5000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

### PM2 processes not running:
```bash
pm2 list
pm2 logs marketplace-server
pm2 logs marketplace-client
pm2 restart all
```

### Application errors:
```bash
# View server logs
pm2 logs marketplace-server --lines 50

# View client logs
pm2 logs marketplace-client --lines 50

# Restart specific process
pm2 restart marketplace-server
pm2 restart marketplace-client
```

### MongoDB connection error:
```bash
# Check MongoDB is running
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test MongoDB connection
mongosh mongodb://localhost:27017/marketplace
```

## Useful Commands Reference

### MongoDB:
```bash
sudo systemctl start mongod      # Start MongoDB
sudo systemctl stop mongod       # Stop MongoDB
sudo systemctl restart mongod    # Restart MongoDB
sudo systemctl status mongod     # Check status
mongosh                          # Access MongoDB shell
```

### PM2:
```bash
pm2 list                         # List all processes
pm2 logs                         # View all logs
pm2 logs marketplace-server      # View server logs
pm2 logs marketplace-client      # View client logs
pm2 restart all                  # Restart all processes
pm2 stop all                     # Stop all processes
pm2 delete all                   # Delete all processes
pm2 monit                        # Monitor processes
pm2 save                         # Save current process list
```

### Application:
```bash
cd ~/bombay-marketplace          # Navigate to project
pm2 restart marketplace-server   # Restart server
pm2 restart marketplace-client   # Restart client
pm2 logs --lines 100             # View last 100 lines
```

## Next Steps

1. ✅ Code deployed from GitHub
2. ✅ MongoDB installed and running
3. ✅ MongoDB URI configured in .env
4. ✅ Application running with PM2
5. ⚠️ Update Security Groups (ports 3000, 5000)
6. ⚠️ Update OAuth and Payment credentials in .env
7. ⚠️ Test the application endpoints

## Application URLs

- **Client (Frontend)**: http://ec2-54-236-21-8.compute-1.amazonaws.com:3000
- **Server (API)**: http://ec2-54-236-21-8.compute-1.amazonaws.com:5000
- **API Health Check**: http://ec2-54-236-21-8.compute-1.amazonaws.com:5000/api

## Security Notes

- MongoDB is running on localhost (secure)
- Application runs on ports 3000 and 5000
- PM2 ensures automatic restart on failure
- PM2 starts processes on system reboot
- Remember to configure Security Groups to restrict access if needed

