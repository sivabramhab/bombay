# PowerShell Script to Deploy to EC2 using PEM file
$ErrorActionPreference = "Continue"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "EC2 Deployment using PEM File" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$PEM_FILE = "C:\Users\user\Desktop\Bella\bellapro.pem"
$EC2_HOST = "ec2-54-236-21-8.compute-1.amazonaws.com"
$EC2_USER = "ubuntu"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  PEM File: $PEM_FILE" -ForegroundColor Gray
Write-Host "  EC2 Host: $EC2_HOST" -ForegroundColor Gray
Write-Host "  EC2 User: $EC2_USER" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path $PEM_FILE)) {
    Write-Host "Error: PEM file not found" -ForegroundColor Red
    exit 1
}

Write-Host "PEM file found" -ForegroundColor Green
Write-Host ""
Write-Host "Testing SSH connection..." -ForegroundColor Yellow

$testCmd = "echo 'Connection successful'"
$null = ssh -i $PEM_FILE -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${EC2_USER}@${EC2_HOST}" $testCmd 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Trying with ec2-user..." -ForegroundColor Gray
    $EC2_USER = "ec2-user"
    $null = ssh -i $PEM_FILE -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${EC2_USER}@${EC2_HOST}" $testCmd 2>&1
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Could not connect to EC2" -ForegroundColor Red
    exit 1
}

Write-Host "SSH connection successful" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Starting Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will take 5-10 minutes..." -ForegroundColor Yellow
Write-Host ""

$deployCmd = 'curl -fsSL https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh | bash'
ssh -i $PEM_FILE -o StrictHostKeyChecking=no "${EC2_USER}@${EC2_HOST}" $deployCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "Deployment Successful!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Start-Sleep -Seconds 3
    ssh -i $PEM_FILE -o StrictHostKeyChecking=no "${EC2_USER}@${EC2_HOST}" "pm2 list"
    Write-Host ""
    Write-Host "Opening browser..." -ForegroundColor Cyan
    Start-Process "http://ec2-54-236-21-8.compute-1.amazonaws.com:3000"
} else {
    Write-Host ""
    Write-Host "Deployment completed with warnings" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done." -ForegroundColor Gray

