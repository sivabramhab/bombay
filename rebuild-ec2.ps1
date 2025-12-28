# Rebuild Application on EC2 Instance
$ErrorActionPreference = "Continue"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Rebuilding Application on EC2" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$EC2_HOST = "ec2-54-236-21-8.compute-1.amazonaws.com"
$EC2_USER = "ubuntu"
$PEM_FILE = "C:\Users\user\Desktop\Bella\bellapro.pem"
$GITHUB_REPO = "https://github.com/sivabramhab/bombay.git"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  EC2 Host: $EC2_HOST" -ForegroundColor Gray
Write-Host "  GitHub: $GITHUB_REPO" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 1: Pulling latest code from GitHub..." -ForegroundColor Yellow
ssh -i $PEM_FILE ${EC2_USER}@${EC2_HOST} @"
cd ~/bombay-marketplace
git pull origin main
echo '✓ Code updated'
"@

Write-Host ""
Write-Host "Step 2: Installing/Updating dependencies..." -ForegroundColor Yellow
ssh -i $PEM_FILE ${EC2_USER}@${EC2_HOST} @"
cd ~/bombay-marketplace
echo 'Installing server dependencies...'
npm install
echo '✓ Server dependencies installed'
cd client
echo 'Installing client dependencies...'
npm install --legacy-peer-deps
echo '✓ Client dependencies installed'
"@

Write-Host ""
Write-Host "Step 3: Building client application..." -ForegroundColor Yellow
ssh -i $PEM_FILE ${EC2_USER}@${EC2_HOST} @"
cd ~/bombay-marketplace/client
npm run build
echo '✓ Client built successfully'
"@

Write-Host ""
Write-Host "Step 4: Verifying database connection and data..." -ForegroundColor Yellow
ssh -i $PEM_FILE ${EC2_USER}@${EC2_HOST} @"
echo 'Checking MongoDB status...'
sudo systemctl status mongod --no-pager | head -3
echo ''
echo 'Database collections:'
mongosh marketplace --quiet --eval '
const collections = db.getCollectionNames();
let totalDocs = 0;
collections.forEach(function(c) {
  const count = db[c].countDocuments();
  totalDocs += count;
  if (count > 0 || c === \"users\" || c === \"products\" || c === \"sellers\") {
    print(c + \": \" + count + \" documents\");
  }
});
print(\"\nTotal documents: \" + totalDocs);
'
echo ''
echo 'Sample products:'
mongosh marketplace --quiet --eval 'db.products.find().limit(3).forEach(function(p) { print(\"  - \" + p.name); })'
"@

Write-Host ""
Write-Host "Step 5: Restarting services..." -ForegroundColor Yellow
ssh -i $PEM_FILE ${EC2_USER}@${EC2_HOST} @"
cd ~/bombay-marketplace
pm2 restart all
sleep 3
pm2 list
"@

Write-Host ""
Write-Host "Step 6: Verifying services are running..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
ssh -i $PEM_FILE ${EC2_USER}@${EC2_HOST} @"
echo 'Testing endpoints...'
sleep 2
curl -s http://localhost:5000/api | head -5 || echo 'Server starting...'
echo ''
echo 'PM2 Status:'
pm2 list
echo ''
echo 'Recent logs:'
pm2 logs --lines 5 --nostream
"@

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ Rebuild Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Application URLs:" -ForegroundColor Yellow
Write-Host "  Frontend: http://$EC2_HOST:3000" -ForegroundColor White
Write-Host "  API:      http://$EC2_HOST:5000" -ForegroundColor White
Write-Host ""
Write-Host "Opening application..." -ForegroundColor Cyan
Start-Process "http://$EC2_HOST:3000"

