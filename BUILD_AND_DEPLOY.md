# Build and Deploy to EC2 - Complete Guide

## 🚀 Quick Deployment - One Command Method

### Step 1: SSH into EC2 Instance

```bash
ssh -i your-key.pem ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com
```

**OR if using password authentication:**
```bash
ssh ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com
```

### Step 2: Run This ONE Command

Once connected to EC2, copy and paste this single command:

```bash
curl -fsSL https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh | bash
```

**That's it!** This will:
- ✅ Download the deployment script from GitHub
- ✅ Execute the complete deployment
- ✅ Install all required software
- ✅ Clone code from GitHub
- ✅ Build and deploy the application
- ✅ Seed the database

## 📋 Alternative: Step-by-Step Deployment

If you prefer step-by-step execution:

```bash
# 1. Connect to EC2
ssh ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com

# 2. Download deployment script
cd ~
wget https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh

# 3. Make executable
chmod +x deploy-and-seed.sh

# 4. Run deployment
./deploy-and-seed.sh
```

## 🔧 What Gets Deployed

The script automatically performs these steps:

### 1. System Setup
- Updates system packages
- Installs Node.js 20.x
- Installs MongoDB 7.0
- Installs PM2 process manager
- Installs Git

### 2. Application Setup
- Clones repository: `https://github.com/sivabramhab/bombay.git`
- Installs server dependencies (`npm install`)
- Installs client dependencies (`npm install` in client/)
- Builds Next.js application (`npm run build`)

### 3. Configuration
- Creates `.env` file with:
  - `MONGODB_URI=mongodb://localhost:27017/marketplace`
  - `CLIENT_URL=http://ec2-54-236-21-8.compute-1.amazonaws.com:3000`
  - `JWT_SECRET` (auto-generated)
  - Other required environment variables

### 4. Database Setup
- Starts MongoDB service
- Seeds database with products from `server/scripts/seedProducts.js`

### 5. Application Start
- Starts server on port 5000 (PM2: `marketplace-server`)
- Starts client on port 3000 (PM2: `marketplace-client`)
- Configures PM2 to start on system reboot

## ✅ Verification Steps

After deployment completes, verify everything is working:

```bash
# Check PM2 processes
pm2 list

# Should show:
# ┌─────┬────────────────────────┬─────────┬─────────┬──────────┐
# │ id  │ name                   │ mode    │ status  │ restart  │
# ├─────┼────────────────────────┼─────────┼─────────┼──────────┤
# │ 0   │ marketplace-server     │ cluster │ online  │ 0        │
# │ 1   │ marketplace-client     │ fork    │ online  │ 0        │
# └─────┴────────────────────────┴─────────┴─────────┴──────────┘

# Check MongoDB
sudo systemctl status mongod

# Verify database has products
mongosh marketplace --eval "db.products.count()"
# Should return a number > 0

# Test server endpoint
curl http://localhost:5000/api

# Test client endpoint
curl http://localhost:3000
```

## 🌐 Access Your Application

After successful deployment, open your browser:

**Frontend (Client):**
```
http://ec2-54-236-21-8.compute-1.amazonaws.com:3000
```

**Backend API:**
```
http://ec2-54-236-21-8.compute-1.amazonaws.com:5000/api
```

**Products API:**
```
http://ec2-54-236-21-8.compute-1.amazonaws.com:5000/api/products
```

## 📊 Deployment Process Overview

```
┌─────────────────────────────────────┐
│ 1. System Updates & Installations  │
│    - Node.js, MongoDB, PM2, Git    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 2. Clone from GitHub                │
│    https://github.com/.../bombay.git│
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 3. Install Dependencies             │
│    - Server: npm install            │
│    - Client: npm install            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 4. Build Application                │
│    - Next.js build (client)         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 5. Configure Environment            │
│    - Create .env file               │
│    - Set MongoDB URI                │
│    - Set CLIENT_URL                 │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 6. Start Services                   │
│    - MongoDB service                │
│    - Server (PM2)                   │
│    - Client (PM2)                   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 7. Seed Database                    │
│    - Run seedProducts.js            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ ✅ Deployment Complete!             │
└─────────────────────────────────────┘
```

## 🔍 Troubleshooting

### SSH Connection Issues

**Problem:** Cannot connect to EC2
**Solution:**
1. Check Security Group allows port 22 (SSH)
2. Verify SSH key file permissions: `chmod 400 your-key.pem`
3. Try different username: `ubuntu`, `ec2-user`, `admin`

### Deployment Script Fails

**Problem:** Script exits with error
**Solution:**
```bash
# Run with verbose output to see errors
bash -x deploy-and-seed.sh

# Or check specific step manually
# Each step can be run individually if needed
```

### MongoDB Not Starting

**Problem:** MongoDB service fails
**Solution:**
```bash
sudo systemctl status mongod
sudo journalctl -u mongod -n 50
sudo systemctl restart mongod
```

### Port Already in Use

**Problem:** Port 5000 or 3000 already in use
**Solution:**
```bash
# Find process using port
sudo lsof -i :5000
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 <PID>

# Or stop PM2 processes
pm2 delete all
```

### Build Fails

**Problem:** npm build fails
**Solution:**
```bash
cd ~/bombay-marketplace/client
rm -rf node_modules .next
npm install
npm run build
```

## 📝 Post-Deployment Tasks

1. **Update OAuth Credentials** (if you have them):
   ```bash
   nano ~/bombay-marketplace/.env
   # Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
   pm2 restart all
   ```

2. **Update Razorpay Credentials** (if you have them):
   ```bash
   nano ~/bombay-marketplace/.env
   # Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
   pm2 restart all
   ```

3. **Verify Application**:
   - Open browser: http://ec2-54-236-21-8.compute-1.amazonaws.com:3000
   - Test registration/login
   - Browse products
   - Test cart functionality

## 🔄 Updating Deployment

To update the application after code changes:

```bash
cd ~/bombay-marketplace
git pull origin main
npm install
cd client
npm install
npm run build
cd ..
pm2 restart all
```

## 📞 Useful Commands

```bash
# View all PM2 logs
pm2 logs

# View specific service logs
pm2 logs marketplace-server
pm2 logs marketplace-client

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Monitor services
pm2 monit

# Check MongoDB status
sudo systemctl status mongod

# Access MongoDB shell
mongosh marketplace
```

## ✅ Deployment Checklist

- [ ] Security Groups configured (ports 3000, 5000, 22)
- [ ] SSH access to EC2 instance
- [ ] Deployment script downloaded from GitHub
- [ ] Node.js installed
- [ ] MongoDB installed and running
- [ ] Code cloned from GitHub
- [ ] Dependencies installed
- [ ] Application built
- [ ] Environment variables configured
- [ ] Server started (port 5000)
- [ ] Client started (port 3000)
- [ ] Database seeded with products
- [ ] Application accessible in browser

---

**Ready to deploy?** Run this command on your EC2 instance:

```bash
curl -fsSL https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh | bash
```

