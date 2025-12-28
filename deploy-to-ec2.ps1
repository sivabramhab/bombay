# PowerShell Script to Deploy to EC2 Instance
# This script automates the deployment process

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "EC2 Deployment Automation Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$EC2_HOST = "ec2-54-236-21-8.compute-1.amazonaws.com"
$EC2_USER = "ubuntu"
$EC2_PASSWORD = "Theteamofbella@123"
$GITHUB_REPO = "https://github.com/sivabramhab/bombay.git"

# Try different usernames if ubuntu doesn't work
$USERNAMES = @("ubuntu", "ec2-user", "admin")

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  EC2 Host: $EC2_HOST" -ForegroundColor Gray
Write-Host "  GitHub: $GITHUB_REPO" -ForegroundColor Gray
Write-Host ""

# Create deployment script content
$deployScript = @"
#!/bin/bash
set -e

echo "=========================================="
echo "Starting Deployment"
echo "=========================================="

# Update system
echo "[1/15] Updating system..."
sudo apt-get update -y

# Install Node.js
if ! command -v node &> /dev/null; then
    echo "[2/15] Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "[2/15] Node.js already installed: \$(node --version)"
fi

# Install MongoDB
if ! command -v mongod &> /dev/null; then
    echo "[3/15] Installing MongoDB..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt-get update -y
    sudo apt-get install -y mongodb-org
else
    echo "[3/15] MongoDB already installed"
fi

# Start MongoDB
echo "[4/15] Starting MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod
sleep 2

# Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "[5/15] Installing PM2..."
    sudo npm install -g pm2
else
    echo "[5/15] PM2 already installed"
fi

# Install Git
if ! command -v git &> /dev/null; then
    echo "[6/15] Installing Git..."
    sudo apt-get install -y git
else
    echo "[6/15] Git already installed"
fi

# Clone/Update Repository
echo "[7/15] Cloning/Updating repository..."
cd ~
if [ -d "bombay-marketplace" ]; then
    cd bombay-marketplace
    git pull origin main || git fetch && git reset --hard origin/main
else
    git clone $GITHUB_REPO bombay-marketplace
    cd bombay-marketplace
fi

# Install server dependencies
echo "[8/15] Installing server dependencies..."
npm install

# Install client dependencies
echo "[9/15] Installing client dependencies..."
cd client
npm install

# Build client
echo "[10/15] Building client..."
npm run build
cd ..

# Create .env file
echo "[11/15] Creating .env file..."
cat > .env <<'ENVEOF'
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
ENVEOF

# Generate JWT secret
JWT_SECRET=\$(openssl rand -base64 32)
sed -i "s/JWT_SECRET=.*/JWT_SECRET=\$JWT_SECRET/" .env

# Stop existing PM2 processes
echo "[12/15] Managing PM2 processes..."
pm2 delete all || true

# Start server
echo "[13/15] Starting server..."
pm2 start server/index.js --name "marketplace-server"

# Start client
echo "[14/15] Starting client..."
cd client
pm2 start npm --name "marketplace-client" -- start
cd ..

# Save PM2 config
pm2 save
pm2 startup systemd -u \$USER --hp \$HOME 2>/dev/null | grep "sudo" | bash || true

# Seed database
echo "[15/15] Seeding database..."
cd ~/bombay-marketplace
node server/scripts/seedProducts.js || echo "Database already seeded or error occurred"

# Final status
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
pm2 list
echo ""
echo "Application URL: http://ec2-54-236-21-8.compute-1.amazonaws.com:3000"
"@

# Save deployment script to temp file
$tempScript = "$env:TEMP\ec2-deploy.sh"
$deployScript | Out-File -FilePath $tempScript -Encoding utf8

Write-Host "Deployment script created: $tempScript" -ForegroundColor Green
Write-Host ""

# Try to connect via SSH
Write-Host "Attempting to connect to EC2 instance..." -ForegroundColor Yellow
Write-Host ""

$connected = $false
$workingUser = ""

foreach ($user in $USERNAMES) {
    Write-Host "Trying username: $user" -ForegroundColor Gray
    
    try {
        # Test SSH connection
        $testResult = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${user}@${EC2_HOST}" "echo 'Connection successful'" 2>&1
        
        if ($LASTEXITCODE -eq 0 -or $testResult -match "successful") {
            $workingUser = $user
            $connected = $true
            Write-Host "✓ Connected as $user" -ForegroundColor Green
            break
        }
    }
    catch {
        Write-Host "  ✗ Failed with $user" -ForegroundColor Red
    }
}

if (-not $connected) {
    Write-Host ""
    Write-Host "⚠ Could not establish SSH connection automatically." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run these commands manually:" -ForegroundColor Cyan
    Write-Host "-----------------------------------" -ForegroundColor Gray
    Write-Host ""
    Write-Host "1. SSH into EC2:" -ForegroundColor Yellow
    Write-Host "   ssh ubuntu@$EC2_HOST" -ForegroundColor White
    Write-Host "   (or try: ssh ec2-user@$EC2_HOST)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Once connected, run:" -ForegroundColor Yellow
    Write-Host "   cd ~" -ForegroundColor White
    Write-Host "   wget https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh" -ForegroundColor White
    Write-Host "   chmod +x deploy-and-seed.sh" -ForegroundColor White
    Write-Host "   ./deploy-and-seed.sh" -ForegroundColor White
    Write-Host ""
    Write-Host "Or copy the deployment script and run:" -ForegroundColor Yellow
    Write-Host "   bash $tempScript" -ForegroundColor White
    Write-Host ""
    exit 1
}

# If connected, run deployment
Write-Host ""
Write-Host "Executing deployment on EC2..." -ForegroundColor Yellow
Write-Host "This will take 5-10 minutes. Please wait..." -ForegroundColor Gray
Write-Host ""

# Copy script to EC2 and execute
$deployScriptContent = Get-Content $tempScript -Raw
$deployScriptContent = $deployScriptContent -replace "`r`n", "`n"  # Convert to Unix line endings

# Use SSH to run the deployment
$sshCommand = "cd ~ && cat > deploy-now.sh << 'DEPLOYEOF'
$deployScript
DEPLOYEOF
chmod +x deploy-now.sh && ./deploy-now.sh"

try {
    Write-Host "Running deployment script..." -ForegroundColor Cyan
    ssh -o StrictHostKeyChecking=no "${workingUser}@${EC2_HOST}" $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "✅ Deployment Successful!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Application URLs:" -ForegroundColor Yellow
        Write-Host "  Frontend: http://$EC2_HOST:3000" -ForegroundColor White
        Write-Host "  API:      http://$EC2_HOST:5000" -ForegroundColor White
        Write-Host ""
        Write-Host "Opening browser..." -ForegroundColor Cyan
        Start-Process "http://$EC2_HOST:3000"
    }
    else {
        Write-Host ""
        Write-Host "⚠ Deployment completed with warnings. Check logs on EC2." -ForegroundColor Yellow
    }
}
catch {
    Write-Host ""
    Write-Host "❌ Error during deployment: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run the deployment manually:" -ForegroundColor Yellow
    Write-Host "  ssh $workingUser@$EC2_HOST" -ForegroundColor White
    Write-Host "  cd ~ && wget https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh" -ForegroundColor White
    Write-Host "  chmod +x deploy-and-seed.sh && ./deploy-and-seed.sh" -ForegroundColor White
}

Write-Host ""
Write-Host "Script execution complete." -ForegroundColor Gray

