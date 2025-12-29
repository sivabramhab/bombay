# Run SSL/HTTPS Setup on EC2 Instance
$ErrorActionPreference = "Continue"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setting up SSL/HTTPS on EC2 Instance" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$EC2_HOST = "ec2-54-236-21-8.compute-1.amazonaws.com"
$EC2_USER = "ubuntu"
$PEM_FILE = "C:\Users\user\Desktop\Bella\bellapro.pem"

Write-Host "Step 1: Pulling latest code from GitHub..." -ForegroundColor Yellow
ssh -i $PEM_FILE ${EC2_USER}@${EC2_HOST} @"
cd ~/bombay-marketplace
git pull origin main
echo '✓ Code updated'
"@

Write-Host ""
Write-Host "Step 2: Making setup script executable..." -ForegroundColor Yellow
ssh -i $PEM_FILE ${EC2_USER}@${EC2_HOST} @"
cd ~/bombay-marketplace
chmod +x setup-ssl-https.sh
echo '✓ Script is executable'
"@

Write-Host ""
Write-Host "Step 3: Running SSL/HTTPS setup..." -ForegroundColor Yellow
Write-Host "⚠️  This will install Nginx and configure SSL" -ForegroundColor Yellow
Write-Host "⚠️  For Let's Encrypt, you need a domain name" -ForegroundColor Yellow
Write-Host "⚠️  If you don't have a domain, it will use self-signed certificate" -ForegroundColor Yellow
Write-Host ""

# Run the setup script with automatic responses
ssh -i $PEM_FILE ${EC2_USER}@${EC2_HOST} @"
cd ~/bombay-marketplace
echo 'no' | ./setup-ssl-https.sh
"@

Write-Host ""
Write-Host "Step 4: Checking Nginx status..." -ForegroundColor Yellow
ssh -i $PEM_FILE ${EC2_USER}@${EC2_HOST} @"
sudo systemctl status nginx --no-pager | head -10
echo ''
echo 'Checking if port 80 and 443 are listening:'
sudo netstat -tlnp | grep -E ':80 |:443 ' || echo 'Ports not yet listening'
"@

Write-Host ""
Write-Host "Step 5: Updating .env file with HTTPS URL..." -ForegroundColor Yellow
ssh -i $PEM_FILE ${EC2_USER}@${EC2_HOST} @"
cd ~/bombay-marketplace
if [ -f .env ]; then
    # Backup .env
    cp .env .env.backup.\$(date +%Y%m%d_%H%M%S)
    # Update CLIENT_URL to HTTPS
    sed -i 's|CLIENT_URL=.*|CLIENT_URL=https://ec2-54-236-21-8.compute-1.amazonaws.com|g' .env
    echo '✓ Updated CLIENT_URL to HTTPS in .env'
else
    echo '⚠️  .env file not found'
fi
"@

Write-Host ""
Write-Host "Step 6: Restarting services..." -ForegroundColor Yellow
ssh -i $PEM_FILE ${EC2_USER}@${EC2_HOST} @"
cd ~/bombay-marketplace
pm2 restart all
sleep 3
pm2 list
"@

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ SSL/HTTPS Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Configure AWS Security Group" -ForegroundColor Yellow
Write-Host "   1. Go to AWS EC2 Console" -ForegroundColor White
Write-Host "   2. Select instance: i-0f75a79829213e975" -ForegroundColor White
Write-Host "   3. Open Security Group" -ForegroundColor White
Write-Host "   4. Add Inbound Rules:" -ForegroundColor White
Write-Host "      - HTTP (port 80) from 0.0.0.0/0" -ForegroundColor Gray
Write-Host "      - HTTPS (port 443) from 0.0.0.0/0" -ForegroundColor Gray
Write-Host ""
Write-Host "Your application URLs:" -ForegroundColor Cyan
Write-Host "  HTTPS: https://ec2-54-236-21-8.compute-1.amazonaws.com" -ForegroundColor White
Write-Host "  HTTP:  http://ec2-54-236-21-8.compute-1.amazonaws.com (redirects to HTTPS)" -ForegroundColor White
Write-Host ""

