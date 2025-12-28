# Complete Database Export/Import Script: Local to EC2
$ErrorActionPreference = "Continue"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Database Migration: Local to EC2" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$LOCAL_URI = "mongodb://localhost:27017/competitive-marketplace"
$EC2_HOST = "ec2-54-236-21-8.compute-1.amazonaws.com"
$EC2_USER = "ubuntu"
$EC2_URI = "mongodb://localhost:27017/marketplace"
$PEM_FILE = "C:\Users\user\Desktop\Bella\bellapro.pem"

# Step 1: Export database from local
Write-Host "Step 1: Exporting database from local MongoDB..." -ForegroundColor Yellow
Write-Host "Source: $LOCAL_URI" -ForegroundColor Gray
Write-Host ""

node export-database-local.js

if ($LASTEXITCODE -ne 0 -or -not (Test-Path "database-export")) {
    Write-Host "Error: Failed to export database" -ForegroundColor Red
    exit 1
}

$manifest = Get-Content "database-export/manifest.json" | ConvertFrom-Json
Write-Host ""
Write-Host "✓ Exported $($manifest.totalDocuments) documents from $($manifest.collections.Count) collections" -ForegroundColor Green
Write-Host ""

# Step 2: Create archive
Write-Host "Step 2: Creating archive..." -ForegroundColor Yellow
Compress-Archive -Path "database-export" -DestinationPath "database-export.zip" -Force
Write-Host "✓ Archive created" -ForegroundColor Green
Write-Host ""

# Step 3: Transfer to EC2
Write-Host "Step 3: Transferring to EC2..." -ForegroundColor Yellow
scp -i $PEM_FILE database-export.zip ${EC2_USER}@${EC2_HOST}:~/database-export.zip

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to transfer archive" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Archive transferred successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Import to EC2
Write-Host "Step 4: Importing to EC2 database..." -ForegroundColor Yellow
Write-Host "Destination: $EC2_URI" -ForegroundColor Gray
Write-Host ""

ssh -i $PEM_FILE ${EC2_USER}@${EC2_HOST} @"
cd ~/bombay-marketplace
unzip -q -o ~/database-export.zip -d ~/
IMPORT_DIR=~/database-export MONGODB_URI=$EC2_URI node import-database-ec2.js
rm -rf ~/database-export ~/database-export.zip
"@

Write-Host ""
Write-Host "Cleaning up..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "database-export" -ErrorAction SilentlyContinue
Remove-Item "database-export.zip" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ Database Migration Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "All collections from local database have been imported to EC2" -ForegroundColor White

