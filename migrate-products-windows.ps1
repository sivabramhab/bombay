# PowerShell script to migrate products from local MongoDB to EC2
$ErrorActionPreference = "Continue"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Product Migration: Local to EC2" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$LOCAL_URI = "mongodb://localhost:27017/competitive-marketplace"
$EC2_HOST = "ec2-54-236-21-8.compute-1.amazonaws.com"
$EC2_USER = "ubuntu"
$EC2_URI = "mongodb://localhost:27017/marketplace"
$PEM_FILE = "C:\Users\user\Desktop\Bella\bellapro.pem"

# Check if mongoexport exists
$mongoExport = Get-Command mongoexport -ErrorAction SilentlyContinue
$mongoSh = Get-Command mongosh -ErrorAction SilentlyContinue

if (-not $mongoExport) {
    Write-Host "mongoexport not found. Trying alternative method..." -ForegroundColor Yellow
    
    # Use Node.js script instead
    Write-Host "Using Node.js migration script..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run this command:" -ForegroundColor Cyan
    Write-Host "  node migrate-products-to-ec2.js" -ForegroundColor White
    Write-Host ""
    Write-Host "Or install MongoDB Database Tools:" -ForegroundColor Yellow
    Write-Host "  Download from: https://www.mongodb.com/try/download/database-tools" -ForegroundColor Gray
    exit 1
}

Write-Host "Step 1: Exporting products from local database..." -ForegroundColor Yellow
mongoexport --uri="$LOCAL_URI" --collection=products --out=products.json --jsonArray

if (-not (Test-Path "products.json")) {
    Write-Host "Error: Failed to export products" -ForegroundColor Red
    exit 1
}

$productCount = (Get-Content products.json | ConvertFrom-Json).Count
Write-Host "✓ Exported $productCount products" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Transferring to EC2..." -ForegroundColor Yellow
scp -i $PEM_FILE products.json ${EC2_USER}@${EC2_HOST}:~/products.json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to transfer file to EC2" -ForegroundColor Red
    exit 1
}

Write-Host "✓ File transferred successfully" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Importing to EC2 database..." -ForegroundColor Yellow
ssh -i $PEM_FILE ${EC2_USER}@${EC2_HOST} @"
cd ~
mongoimport --uri='$EC2_URI' --collection=products --file=~/products.json --jsonArray --drop
mongosh marketplace --eval 'db.products.countDocuments()' --quiet
rm ~/products.json
echo 'Import complete!'
"@

Write-Host ""
Write-Host "Step 4: Cleaning up..." -ForegroundColor Yellow
Remove-Item products.json -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ Migration Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

