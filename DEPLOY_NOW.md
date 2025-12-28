# DEPLOY NOW - Execute These Commands

## 🚀 Quick Deployment Commands

### Step 1: SSH into Your EC2 Instance

Open your terminal/PowerShell and run:

```bash
ssh ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com
```

**If `ubuntu` doesn't work, try:**
```bash
ssh ec2-user@ec2-54-236-21-8.compute-1.amazonaws.com
```

### Step 2: Once Connected to EC2, Run These Commands:

```bash
# Navigate to home directory
cd ~

# Download the deployment script
wget https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh

# Make it executable
chmod +x deploy-and-seed.sh

# Run the deployment (this will take 5-10 minutes)
./deploy-and-seed.sh
```

**That's it!** The script will:
- ✅ Install all required software (Node.js, MongoDB, PM2)
- ✅ Clone code from GitHub
- ✅ Install dependencies
- ✅ Build the application
- ✅ Configure environment variables
- ✅ Start the server and client
- ✅ Seed the database with products
- ✅ Verify everything is running

### Step 3: After Script Completes

Open your browser and visit:
```
http://ec2-54-236-21-8.compute-1.amazonaws.com:3000
```

## Alternative: If Repository Already Exists

If you've already cloned the repository:

```bash
cd ~/bombay-marketplace
git pull origin main
chmod +x deploy-and-seed.sh
./deploy-and-seed.sh
```

## Verify Deployment

Run these commands on EC2 to verify:

```bash
# Check processes
pm2 list

# View logs
pm2 logs --lines 30

# Check MongoDB
sudo systemctl status mongod

# Verify products seeded
mongosh marketplace --eval "db.products.count()"
```

## Expected Output

The script will show:
- Progress for each of 18 steps
- ✓ Green checkmarks for successful steps
- ⚠ Yellow warnings for non-critical issues
- ✗ Red errors if something fails

At the end, you'll see:
```
✅ Deployment Complete!
Application URLs:
  Client (Frontend):  http://ec2-54-236-21-8.compute-1.amazonaws.com:3000
  Server (API):       http://ec2-54-236-21-8.compute-1.amazonaws.com:5000
```

## Troubleshooting

### If wget fails:
```bash
curl -O https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh
chmod +x deploy-and-seed.sh
./deploy-and-seed.sh
```

### If SSH connection fails:
- Make sure port 22 is open in Security Groups
- Check if you have the correct SSH key
- Try different usernames: `ubuntu`, `ec2-user`, `admin`

### If script fails:
```bash
# Check what step failed
# The script will show the error

# You can also run with verbose output:
bash -x deploy-and-seed.sh
```

