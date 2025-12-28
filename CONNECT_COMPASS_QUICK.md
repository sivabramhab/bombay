# Quick Guide: Connect to EC2 MongoDB with Compass

## Current Status
MongoDB is currently configured to accept connections only from localhost (127.0.0.1).

## ✅ Recommended Method: SSH Tunnel (Secure)

### Step 1: Create SSH Tunnel
Open PowerShell and run:
```powershell
ssh -i "C:\Users\user\Desktop\Bella\bellapro.pem" -L 27017:localhost:27017 ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com -N
```
**Keep this PowerShell window open** while using MongoDB Compass.

### Step 2: Open MongoDB Compass
1. Open MongoDB Compass
2. In the connection string field, enter:
   ```
   mongodb://localhost:27017/marketplace
   ```
3. Click **Connect**

### Step 3: Explore Database
Once connected, you'll see:
- **Database:** `marketplace`
- **Collections:**
  - `users` (2 documents)
  - `sellers` (1 document)
  - `products` (29 documents)
  - `orders`
  - `challenges`
  - `bargains`

---

## 🔧 Alternative: Direct Connection (Requires Configuration)

If you want to connect directly without SSH tunnel:

### Step 1: Enable Remote Access on EC2
SSH into EC2 and run:
```bash
sudo sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/g' /etc/mongod.conf
sudo systemctl restart mongod
```

### Step 2: Configure AWS Security Group
1. Go to AWS EC2 Console → Your Instance → Security Group
2. Edit Inbound Rules
3. Add rule:
   - Type: Custom TCP
   - Port: 27017
   - Source: Your IP address (find it at https://whatismyipaddress.com/)

### Step 3: Connect in Compass
```
mongodb://ec2-54-236-21-8.compute-1.amazonaws.com:27017/marketplace
```

⚠️ **Warning:** Direct connection is less secure. Use SSH tunnel for better security.

---

## 📝 Connection String Format

### Without Authentication (Current Setup)
```
mongodb://HOST:PORT/DATABASE
```

### With Authentication (If Enabled)
```
mongodb://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

---

## 🐛 Troubleshooting

**Can't connect?**
1. Make sure SSH tunnel is running (for SSH method)
2. Check MongoDB is running: `sudo systemctl status mongod`
3. Verify port 27017 is open in Security Group
4. Check if MongoDB is bound to correct IP

**Connection timeout?**
- Verify Security Group allows your IP
- Check if MongoDB is bound to 0.0.0.0 (not just 127.0.0.1)

