# 🚀 DEPLOY NOW - Exact Commands to Run

## Method 1: Direct SSH Command (If you have SSH key)

### Step 1: Open PowerShell/Terminal

### Step 2: Run this ONE command:

**If you have SSH key file:**
```bash
ssh -i path/to/your-key.pem ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com "cd ~ && wget -q https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh && chmod +x deploy-and-seed.sh && ./deploy-and-seed.sh"
```

**If SSH key is in default location (~/.ssh/id_rsa):**
```bash
ssh ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com "cd ~ && wget -q https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh && chmod +x deploy-and-seed.sh && ./deploy-and-seed.sh"
```

## Method 2: Manual SSH Connection (Recommended)

### Step 1: Connect to EC2

```bash
ssh -i your-key.pem ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com
```

**OR if key is in default location:**
```bash
ssh ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com
```

**OR try different username:**
```bash
ssh ec2-user@ec2-54-236-21-8.compute-1.amazonaws.com
```

### Step 2: Once Connected to EC2, Run:

```bash
cd ~
wget https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh
chmod +x deploy-and-seed.sh
./deploy-and-seed.sh
```

## Method 3: Using AWS Systems Manager Session Manager

If you have AWS CLI configured:

```bash
aws ssm start-session --target i-0f75a79829213e975
```

Then run the deployment commands on EC2.

## Method 4: Using AWS Console - EC2 Instance Connect

1. Go to AWS Console → EC2 → Instances
2. Select instance: `i-0f75a79829213e975`
3. Click "Connect" → "EC2 Instance Connect"
4. Run the deployment commands in the browser terminal

## What Happens During Deployment

The `deploy-and-seed.sh` script will:

1. ✅ Update system packages
2. ✅ Install Node.js 20.x
3. ✅ Install MongoDB 7.0
4. ✅ Start MongoDB service
5. ✅ Install PM2 process manager
6. ✅ Clone/update code from GitHub
7. ✅ Install server dependencies
8. ✅ Install client dependencies
9. ✅ Build Next.js client application
10. ✅ Create .env file with:
    - MONGODB_URI=mongodb://localhost:27017/marketplace
    - CLIENT_URL=http://ec2-54-236-21-8.compute-1.amazonaws.com:3000
11. ✅ Start server on port 5000
12. ✅ Start client on port 3000
13. ✅ Seed database with products
14. ✅ Verify deployment

## After Deployment Completes

### 1. Open Browser

Visit:
```
http://ec2-54-236-21-8.compute-1.amazonaws.com:3000
```

### 2. Verify Deployment (On EC2)

```bash
# Check PM2 processes
pm2 list

# View logs
pm2 logs --lines 30

# Verify database has products
mongosh marketplace --eval "db.products.count()"

# Test server
curl http://localhost:5000/api

# Test client
curl http://localhost:3000
```

## Expected Output

You should see:
```
==========================================
✅ Deployment Complete!
==========================================

Application URLs:
  Client (Frontend):  http://ec2-54-236-21-8.compute-1.amazonaws.com:3000
  Server (API):       http://ec2-54-236-21-8.compute-1.amazonaws.com:5000

Database:
  URI:     mongodb://localhost:27017/marketplace
  Status:  active
  Products: Seeded successfully
```

## Troubleshooting

### If SSH Connection Fails:

1. **Check Security Group:**
   - Port 22 (SSH) must be open
   - Source should be your IP or 0.0.0.0/0

2. **Find Your SSH Key:**
   - Check AWS Console → EC2 → Key Pairs
   - Download the .pem file if needed
   - Set permissions: `chmod 400 your-key.pem` (Linux/Mac)

3. **Try Different Username:**
   - `ubuntu` (Ubuntu AMI)
   - `ec2-user` (Amazon Linux)
   - `admin` (Debian)

### If Deployment Script Fails:

1. **Check EC2 Instance:**
   ```bash
   # Check disk space
   df -h
   
   # Check internet connection
   ping google.com
   ```

2. **Run with Verbose Output:**
   ```bash
   bash -x deploy-and-seed.sh
   ```

3. **Check Logs:**
   ```bash
   pm2 logs
   sudo journalctl -u mongod -n 50
   ```

## Quick Reference

**SSH Connection:**
```bash
ssh -i key.pem ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com
```

**Deployment Command:**
```bash
cd ~ && wget https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh && chmod +x deploy-and-seed.sh && ./deploy-and-seed.sh
```

**Application URLs:**
- Frontend: http://ec2-54-236-21-8.compute-1.amazonaws.com:3000
- API: http://ec2-54-236-21-8.compute-1.amazonaws.com:5000

## Next Steps After Deployment

1. ✅ Verify application is accessible
2. ⚠️ Update OAuth credentials in `.env` if needed
3. ⚠️ Update Razorpay credentials in `.env` if needed
4. ⚠️ Test all features (login, products, cart, checkout)

---

**Need Help?** Check the logs: `pm2 logs` on EC2 instance

