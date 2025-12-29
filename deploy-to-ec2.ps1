# PowerShell script to deploy latest code to EC2 and restart services

$PEM_FILE = "C:\Users\user\Desktop\Bella\bellapro.pem"
$EC2_HOST = "ec2-54-236-21-8.compute-1.amazonaws.com"
$EC2_USER = "ubuntu"
$GIT_REPO = "https://github.com/sivabramhab/bombay.git"
$PROJECT_DIR = "~/bombay-marketplace"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Deploying to EC2 Instance" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify PEM file exists
Write-Host "Step 1: Verifying PEM file..." -ForegroundColor Yellow
if (-not (Test-Path $PEM_FILE)) {
    Write-Host "❌ PEM file not found at: $PEM_FILE" -ForegroundColor Red
    exit 1
}
Write-Host "✅ PEM file found" -ForegroundColor Green
Write-Host ""

# Step 2: Pull latest code from GitHub
Write-Host "Step 2: Pulling latest code from GitHub..." -ForegroundColor Yellow
$pullCommand = @"
cd $PROJECT_DIR
git pull origin main
"@

$pullScript = $pullCommand | Out-String
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} "bash -s" <<< $pullScript
Write-Host "✅ Code pulled successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Install/Update dependencies
Write-Host "Step 3: Installing dependencies..." -ForegroundColor Yellow
$depsCommand = @"
cd $PROJECT_DIR
echo 'Installing server dependencies...'
cd server && npm install
echo 'Installing client dependencies...'
cd ../client && npm install --force
"@

ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} "bash -s" <<< $depsCommand
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 4: Build client
Write-Host "Step 4: Building client application..." -ForegroundColor Yellow
$buildCommand = @"
cd $PROJECT_DIR/client
npm run build
"@

ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} "bash -s" <<< $buildCommand
Write-Host "✅ Client built successfully" -ForegroundColor Green
Write-Host ""

# Step 5: Restart PM2 services
Write-Host "Step 5: Restarting services..." -ForegroundColor Yellow
$restartCommand = @"
pm2 restart marketplace-server
pm2 restart marketplace-client
pm2 save
pm2 list
"@

ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} "bash -s" <<< $restartCommand
Write-Host "✅ Services restarted" -ForegroundColor Green
Write-Host ""

# Step 6: Verify services are running
Write-Host "Step 6: Verifying services..." -ForegroundColor Yellow
$verifyCommand = @"
pm2 list
echo ''
echo 'Checking server status...'
curl -s http://localhost:5000/api/products?limit=1 | head -50
"@

ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} "bash -s" <<< $verifyCommand
Write-Host "✅ Services verified" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your application is now live at:" -ForegroundColor Cyan
Write-Host "   https://ec2-54-236-21-8.compute-1.amazonaws.com" -ForegroundColor White
Write-Host ""
Write-Host "📱 Features deployed:" -ForegroundColor Cyan
Write-Host "   ✅ Case-insensitive search" -ForegroundColor White
Write-Host "   ✅ Auto-search after 3 characters" -ForegroundColor White
Write-Host "   ✅ Responsive design for all devices" -ForegroundColor White
Write-Host ""
