#!/bin/bash
# Setup MongoDB for remote access (use with caution)

echo "⚠️  WARNING: This script will configure MongoDB to accept remote connections"
echo "This should only be used for development/testing purposes"
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

# Backup original config
echo "Backing up MongoDB configuration..."
sudo cp /etc/mongod.conf /etc/mongod.conf.backup.$(date +%Y%m%d_%H%M%S)

# Update MongoDB config to bind to all interfaces
echo "Updating MongoDB configuration..."
sudo sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/g' /etc/mongod.conf

# Restart MongoDB
echo "Restarting MongoDB..."
sudo systemctl restart mongod

# Wait a moment for MongoDB to start
sleep 3

# Check status
if sudo systemctl is-active --quiet mongod; then
    echo "✅ MongoDB is running and configured for remote access"
    echo ""
    echo "⚠️  IMPORTANT: Make sure to:"
    echo "1. Configure AWS Security Group to allow port 27017"
    echo "2. Restrict access to specific IPs only (not 0.0.0.0/0)"
    echo "3. Consider using SSH tunnel instead for better security"
    echo ""
    echo "Connection string for MongoDB Compass:"
    echo "mongodb://ec2-54-236-21-8.compute-1.amazonaws.com:27017/marketplace"
else
    echo "❌ Error: MongoDB failed to start"
    echo "Restoring backup configuration..."
    sudo cp /etc/mongod.conf.backup.* /etc/mongod.conf
    sudo systemctl restart mongod
    exit 1
fi

