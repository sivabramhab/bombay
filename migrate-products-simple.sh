#!/bin/bash
# Simple script to export and import products

LOCAL_URI="mongodb://localhost:27017/competitive-marketplace"
EC2_HOST="ec2-54-236-21-8.compute-1.amazonaws.com"
EC2_USER="ubuntu"
EC2_URI="mongodb://localhost:27017/marketplace"
PEM_FILE="C:\\Users\\user\\Desktop\\Bella\\bellapro.pem"

echo "Exporting products from local database..."
mongoexport --uri="$LOCAL_URI" --collection=products --out=products.json --jsonArray

if [ ! -f "products.json" ]; then
    echo "Error: Failed to export products"
    exit 1
fi

echo "Transferring to EC2..."
scp -i "$PEM_FILE" products.json ${EC2_USER}@${EC2_HOST}:~/products.json

echo "Importing to EC2 database..."
ssh -i "$PEM_FILE" ${EC2_USER}@${EC2_HOST} << 'ENDSSH'
mongoimport --uri="mongodb://localhost:27017/marketplace" --collection=products --file=~/products.json --jsonArray --drop
mongosh marketplace --eval "db.products.countDocuments()" --quiet
rm ~/products.json
echo "Import complete!"
ENDSSH

rm products.json
echo "Migration complete!"

