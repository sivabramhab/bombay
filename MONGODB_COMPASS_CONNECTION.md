# Connect to EC2 MongoDB with MongoDB Compass

## Connection Details

**EC2 Instance:** `ec2-54-236-21-8.compute-1.amazonaws.com`  
**Database Name:** `marketplace`  
**MongoDB Port:** `27017` (default)

## Option 1: SSH Tunnel (Recommended - Secure)

This is the most secure method as it doesn't expose MongoDB directly to the internet.

### Step 1: Create SSH Tunnel

On Windows (PowerShell), run:

```powershell
ssh -i "C:\Users\user\Desktop\Bella\bellapro.pem" -L 27017:localhost:27017 ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com -N
```

**Explanation:**
- `-L 27017:localhost:27017` - Creates a local port forward
- `-N` - Don't execute any remote commands (just forward ports)
- Keep this terminal window open while using Compass

### Step 2: Connect in MongoDB Compass

1. Open MongoDB Compass
2. Use this connection string:
   ```
   mongodb://localhost:27017/marketplace
   ```
3. Click **Connect**

## Option 2: Direct Connection (Less Secure)

⚠️ **Warning:** This exposes MongoDB to the internet. Only use for development/testing.

### Step 1: Configure MongoDB to Allow Remote Connections

SSH into your EC2 instance and update MongoDB configuration:

```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf
```

Change the `bindIp` from `127.0.0.1` to `0.0.0.0`:
```yaml
net:
  port: 27017
  bindIp: 0.0.0.0  # Changed from 127.0.0.1
```

Restart MongoDB:
```bash
sudo systemctl restart mongod
```

### Step 2: Configure AWS Security Group

1. Go to AWS EC2 Console
2. Select your instance
3. Click on Security Group
4. Click **Edit inbound rules**
5. Add a new rule:
   - **Type:** Custom TCP
   - **Port:** 27017
   - **Source:** Your IP address (or 0.0.0.0/0 for any IP - NOT recommended)
   - **Description:** MongoDB Compass

### Step 3: Connect in MongoDB Compass

1. Open MongoDB Compass
2. Use this connection string:
   ```
   mongodb://ec2-54-236-21-8.compute-1.amazonaws.com:27017/marketplace
   ```
3. Click **Connect**

## Option 3: MongoDB Atlas / Cloud Connection (Most Secure)

For production, consider migrating to MongoDB Atlas which provides:
- Built-in security
- Connection string with authentication
- IP whitelist management
- Automatic backups

## Troubleshooting

### Connection Refused

1. Check if MongoDB is running:
   ```bash
   sudo systemctl status mongod
   ```

2. Check if port 27017 is listening:
   ```bash
   sudo netstat -tlnp | grep 27017
   ```

3. Check firewall:
   ```bash
   sudo ufw status
   ```

### Authentication Required

If MongoDB has authentication enabled, use:
```
mongodb://username:password@host:port/database
```

### Connection Timeout

1. Verify Security Group allows your IP
2. Check if MongoDB is bound to 0.0.0.0 (not just localhost)
3. Verify the SSH tunnel is active (for Option 1)

## Available Databases and Collections

Once connected, you should see:

- **marketplace** database with:
  - `users` collection
  - `sellers` collection
  - `products` collection (29 products)
  - `orders` collection
  - `challenges` collection
  - `bargains` collection

## Quick Commands

### View all databases
```javascript
show dbs
```

### Switch to marketplace database
```javascript
use marketplace
```

### View collections
```javascript
show collections
```

### Count documents
```javascript
db.products.countDocuments()
db.users.countDocuments()
db.sellers.countDocuments()
```

