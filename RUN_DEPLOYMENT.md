# Run Deployment - Step by Step Instructions

## Quick Deployment Commands

### Step 1: Connect to EC2 Instance

**Option A: Using SSH (if you have SSH key)**
```bash
ssh ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com
```

**Option B: Using SSH with password (Windows PowerShell)**
```powershell
ssh ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com
# When prompted, enter password if configured
```

**Option C: Using PuTTY (Windows)**
- Host: ec2-54-236-21-8.compute-1.amazonaws.com
- Port: 22
- Username: ubuntu (or ec2-user)

### Step 2: Run Deployment Script

Once connected to EC2, execute these commands:

```bash
# Navigate to home directory
cd ~

# Download the deployment script from GitHub
wget https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh

# Make it executable
chmod +x deploy-and-seed.sh

# Run the deployment script
./deploy-and-seed.sh
```

**OR** if the repository is already cloned:

```bash
cd ~/bombay-marketplace
chmod +x deploy-and-seed.sh
./deploy-and-seed.sh
```

### Step 3: Monitor the Deployment

The script will show progress for each step. It takes approximately 5-10 minutes.

### Step 4: Verify Deployment

After the script completes, verify everything is running:

```bash
# Check PM2 processes
pm2 list

# Check server logs
pm2 logs marketplace-server --lines 20

# Check client logs
pm2 logs marketplace-client --lines 20

# Verify MongoDB
sudo systemctl status mongod

# Check if products were seeded
mongosh marketplace --eval "db.products.count()"
```

### Step 5: Open Application

Open your browser and visit:
- **Frontend:** http://ec2-54-236-21-8.compute-1.amazonaws.com:3000
- **API:** http://ec2-54-236-21-8.compute-1.amazonaws.com:5000/api

## Alternative: Run Commands Directly

If you prefer to run commands directly without the script:

```bash
cd ~
git clone https://github.com/sivabramhab/bombay.git bombay-marketplace
cd bombay-marketplace
bash deploy-and-seed.sh
```

## Troubleshooting

### If wget fails:
```bash
# Use curl instead
curl -O https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh
chmod +x deploy-and-seed.sh
./deploy-and-seed.sh
```

### If script fails at any step:
```bash
# Check the error message
# The script will exit with error code if something fails
# You can manually run each section of the script
```

### To view script contents:
```bash
cat deploy-and-seed.sh
```

