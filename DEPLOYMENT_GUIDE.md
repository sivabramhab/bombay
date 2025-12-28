# AWS EC2 Deployment Guide

This guide will help you deploy the Marketplace application to AWS EC2.

## Prerequisites
- AWS EC2 instance running Ubuntu
- SSH access to the EC2 instance
- GitHub repository access

## EC2 Instance Details
- **Instance**: ec2-54-236-21-8.compute-1.amazonaws.com
- **Instance ID**: i-0f75a79829213e975
- **GitHub URL**: https://github.com/sivabramhab/bombay.git

## Step 1: SSH into EC2 Instance

```bash
ssh team@svgnai.com@ec2-54-236-21-8.compute-1.amazonaws.com
# Or if using key file:
# ssh -i your-key.pem ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com
```

## Step 2: Run Deployment Script

### Option A: Manual Deployment (Copy and paste commands)

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

# Update MongoDB URI (if .env exists)
sed -i 's|MONGODB_URI=.*|MONGODB_URI=mongodb://localhost:27017/marketplace|' .env

# Start server
pm2 start server/index.js --name "marketplace-server"

# Start client
cd client
pm2 start npm --name "marketplace-client" -- start
cd ..

# Save PM2 configuration
pm2 save
pm2 startup
```

### Option B: Using Deployment Script

1. Copy the `deploy.sh` script to your EC2 instance:
```bash
# On your local machine, copy the script
scp deploy.sh team@svgnai.com@ec2-54-236-21-8.compute-1.amazonaws.com:~/deploy.sh

# SSH into EC2
ssh team@svgnai.com@ec2-54-236-21-8.compute-1.amazonaws.com

# Make script executable and run
chmod +x deploy.sh
./deploy.sh
```

## Step 3: Configure Security Groups

Make sure your EC2 Security Group allows inbound traffic on:
- **Port 22** (SSH)
- **Port 80** (HTTP) - if using nginx
- **Port 443** (HTTPS) - if using SSL
- **Port 3000** (Client)
- **Port 5000** (Server API)

### AWS Console:
1. Go to EC2 → Security Groups
2. Select your instance's security group
3. Edit Inbound Rules
4. Add rules for ports 3000 and 5000

### Using AWS CLI:
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

## Step 4: Update Environment Variables

After deployment, update the `.env` file with your actual credentials:

```bash
nano .env
# or
vim .env
```

Update these fields:
- `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret
- `RAZORPAY_KEY_ID` - Your Razorpay Key ID
- `RAZORPAY_KEY_SECRET` - Your Razorpay Key Secret

After updating, restart PM2 processes:
```bash
pm2 restart all
```

## Step 5: Verify Deployment

### Check MongoDB:
```bash
sudo systemctl status mongod
mongo --eval "db.adminCommand('listDatabases')"
```

### Check PM2 Processes:
```bash
pm2 list
pm2 logs
```

### Test the Application:
- Server API: http://ec2-54-236-21-8.compute-1.amazonaws.com:5000/api
- Client: http://ec2-54-236-21-8.compute-1.amazonaws.com:3000

## Useful Commands

### MongoDB Commands:
```bash
# Start MongoDB
sudo systemctl start mongod

# Stop MongoDB
sudo systemctl stop mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check MongoDB status
sudo systemctl status mongod

# Access MongoDB shell
mongosh
```

### PM2 Commands:
```bash
# List all processes
pm2 list

# View logs
pm2 logs

# Restart all processes
pm2 restart all

# Stop all processes
pm2 stop all

# Delete all processes
pm2 delete all

# Monitor
pm2 monit
```

### Application Commands:
```bash
# View server logs
pm2 logs marketplace-server

# View client logs
pm2 logs marketplace-client

# Restart server
pm2 restart marketplace-server

# Restart client
pm2 restart marketplace-client
```

## Troubleshooting

### MongoDB connection issues:
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

### Port already in use:
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>
```

### PM2 issues:
```bash
# Clear PM2 logs
pm2 flush

# Restart with fresh start
pm2 delete all
pm2 start server/index.js --name "marketplace-server"
cd client && pm2 start npm --name "marketplace-client" -- start
```

### Application errors:
```bash
# Check application logs
pm2 logs marketplace-server --lines 50
pm2 logs marketplace-client --lines 50

# Check if all dependencies are installed
cd ~/bombay-marketplace && npm install
cd client && npm install
```

## Optional: Setup Nginx as Reverse Proxy

For production, consider using Nginx as a reverse proxy:

```bash
# Install Nginx
sudo apt-get install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/marketplace

# Add configuration (example):
# server {
#     listen 80;
#     server_name ec2-54-236-21-8.compute-1.amazonaws.com;
#
#     location /api {
#         proxy_pass http://localhost:5000;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_cache_bypass $http_upgrade;
#     }
#
#     location / {
#         proxy_pass http://localhost:3000;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_cache_bypass $http_upgrade;
#     }
# }

# Enable site
sudo ln -s /etc/nginx/sites-available/marketplace /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Database Setup

The MongoDB URI is automatically set to: `mongodb://localhost:27017/marketplace`

To seed the database with initial products:
```bash
cd ~/bombay-marketplace
node server/scripts/seedProducts.js
```

## Security Recommendations

1. **Firewall**: Configure UFW firewall
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 3000/tcp
   sudo ufw allow 5000/tcp
   sudo ufw enable
   ```

2. **SSL/HTTPS**: Set up SSL certificate using Let's Encrypt

3. **Environment Variables**: Never commit `.env` file to Git

4. **MongoDB Security**: Enable authentication for MongoDB in production

5. **Regular Updates**: Keep system packages updated
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

## Notes

- The application uses PM2 for process management
- MongoDB runs as a system service
- Both server and client run as PM2 processes
- PM2 automatically restarts processes on failure
- PM2 starts on system reboot (after `pm2 startup`)

