# PowerShell Script to Deploy to EC2
# This script will SSH into EC2 and run the deployment

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "EC2 Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$EC2_HOST = "ec2-54-236-21-8.compute-1.amazonaws.com"
$EC2_USER = "ubuntu"
$DEPLOY_COMMANDS = @"
cd ~
wget -q https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh
chmod +x deploy-and-seed.sh
./deploy-and-seed.sh
"@

Write-Host "Connecting to EC2 instance..." -ForegroundColor Yellow
Write-Host "Host: $EC2_HOST" -ForegroundColor Gray
Write-Host "User: $EC2_USER" -ForegroundColor Gray
Write-Host ""
Write-Host "Please run these commands manually:" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "1. SSH into EC2:" -ForegroundColor Cyan
Write-Host "   ssh $EC2_USER@$EC2_HOST" -ForegroundColor White
Write-Host ""
Write-Host "2. Once connected, run:" -ForegroundColor Cyan
Write-Host $DEPLOY_COMMANDS -ForegroundColor White
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Alternative: Run SSH command directly" -ForegroundColor Yellow
Write-Host "ssh $EC2_USER@$EC2_HOST 'bash -s' < deploy-and-seed.sh" -ForegroundColor White
Write-Host ""

# Option to execute SSH command directly (uncomment if you want)
# $SSH_COMMAND = "ssh $EC2_USER@$EC2_HOST `"$DEPLOY_COMMANDS`""
# Write-Host "Executing: $SSH_COMMAND" -ForegroundColor Yellow
# Invoke-Expression $SSH_COMMAND

