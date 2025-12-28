# Complete migration script: Local MongoDB to EC2 MongoDB
$ErrorActionPreference = "Continue"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Product Migration: Local to EC2" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$LOCAL_URI = "mongodb://localhost:27017/competitive-marketplace"
$EC2_HOST = "ec2-54-236-21-8.compute-1.amazonaws.com"
$EC2_USER = "ubuntu"
$PEM_FILE = "C:\Users\user\Desktop\Bella\bellapro.pem"

# Step 1: Export products from local MongoDB using Node.js
Write-Host "Step 1: Exporting products from local database..." -ForegroundColor Yellow
Write-Host "Using Node.js export script..." -ForegroundColor Gray

node -e @"
const mongoose = require('mongoose');
const fs = require('fs');

async function exportProducts() {
  try {
    await mongoose.connect('$LOCAL_URI');
    const Product = mongoose.connection.collection('products');
    const products = await Product.find({}).toArray();
    
    fs.writeFileSync('products-export.json', JSON.stringify(products, null, 2));
    console.log('Exported ' + products.length + ' products');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
exportProducts();
"@

if ($LASTEXITCODE -ne 0 -or -not (Test-Path "products-export.json")) {
    Write-Host "Error: Failed to export products" -ForegroundColor Red
    Write-Host "Make sure MongoDB is running locally and products exist" -ForegroundColor Yellow
    exit 1
}

$productCount = (Get-Content products-export.json | ConvertFrom-Json).Count
Write-Host "✓ Exported $productCount products" -ForegroundColor Green
Write-Host ""

# Step 2: Transfer to EC2
Write-Host "Step 2: Transferring products file to EC2..." -ForegroundColor Yellow
scp -i $PEM_FILE products-export.json ${EC2_USER}@${EC2_HOST}:~/products-export.json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to transfer file" -ForegroundColor Red
    exit 1
}

Write-Host "✓ File transferred successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Import to EC2 MongoDB
Write-Host "Step 3: Importing products to EC2 MongoDB..." -ForegroundColor Yellow
ssh -i $PEM_FILE ${EC2_USER}@${EC2_HOST} @"
cd ~/bombay-marketplace
node -e \"
const mongoose = require('mongoose');
const fs = require('fs');

async function importProducts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/marketplace');
    const Product = mongoose.connection.collection('products');
    
    const products = JSON.parse(fs.readFileSync('../products-export.json', 'utf8'));
    console.log('Importing ' + products.length + ' products...');
    
    // Get existing IDs
    const existing = await Product.find({}).project({_id: 1}).toArray();
    const existingIds = new Set(existing.map(p => p._id.toString()));
    
    // Filter new products
    const newProducts = products.filter(p => !existingIds.has(p._id.toString()));
    
    if (newProducts.length > 0) {
      await Product.insertMany(newProducts, { ordered: false });
      console.log('Imported ' + newProducts.length + ' new products');
    } else {
      console.log('All products already exist');
    }
    
    const total = await Product.countDocuments();
    console.log('Total products: ' + total);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
importProducts();
\"
rm ~/products-export.json
"@

Write-Host ""
Write-Host "Cleaning up..." -ForegroundColor Yellow
Remove-Item products-export.json -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ Migration Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

