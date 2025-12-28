#!/bin/bash
# Script to migrate products from local MongoDB to EC2 MongoDB

set -e

echo "=========================================="
echo "Product Migration Script"
echo "=========================================="
echo ""

LOCAL_URI="mongodb://localhost:27017/competitive-marketplace"
EC2_HOST="ec2-54-236-21-8.compute-1.amazonaws.com"
EC2_URI="mongodb://localhost:27017/marketplace"

# Check if mongodump is available
if ! command -v mongodump &> /dev/null; then
    echo "❌ mongodump not found. Please install MongoDB database tools."
    exit 1
fi

echo "Step 1: Exporting products from local database..."
mongodump --uri="$LOCAL_URI" --collection=products --out=./migration-dump

if [ ! -f "./migration-dump/competitive-marketplace/products.bson" ]; then
    echo "❌ Failed to export products from local database"
    exit 1
fi

echo "✓ Products exported successfully"
echo ""

echo "Step 2: Creating archive..."
tar -czf products-backup.tar.gz migration-dump/
echo "✓ Archive created"
echo ""

echo "Step 3: Transferring to EC2..."
scp -i "C:\Users\user\Desktop\Bella\bellapro.pem" products-backup.tar.gz ubuntu@$EC2_HOST:~/products-backup.tar.gz
echo "✓ File transferred to EC2"
echo ""

echo "Step 4: Importing to EC2 database..."
ssh -i "C:\Users\user\Desktop\Bella\bellapro.pem" ubuntu@$EC2_HOST << 'ENDSSH'
cd ~
tar -xzf products-backup.tar.gz

# Check if mongorestore is available
if ! command -v mongorestore &> /dev/null; then
    echo "Installing MongoDB database tools..."
    sudo apt-get update
    sudo apt-get install -y mongodb-database-tools
fi

echo "Importing products..."
mongorestore --uri="mongodb://localhost:27017/marketplace" --collection=products --drop ./migration-dump/competitive-marketplace/products.bson

echo ""
echo "Verifying import..."
mongosh marketplace --eval "db.products.countDocuments()" --quiet

echo ""
echo "✓ Products imported successfully!"
rm -rf migration-dump products-backup.tar.gz
ENDSSH

echo ""
echo "Cleaning up local files..."
rm -rf migration-dump products-backup.tar.gz

echo ""
echo "=========================================="
echo "✅ Migration Complete!"
echo "=========================================="

