# Setup SSL/HTTPS for EC2 Application

## Problem
Mobile browsers are trying to access the site via HTTPS (SSL), but the server is only serving HTTP, causing `ERR_SSL_PROTOCOL_ERROR`.

## Solution: Setup Nginx Reverse Proxy with SSL

### Option 1: Automatic Setup (Recommended)

1. **SSH into your EC2 instance:**
```bash
ssh -i "C:\Users\user\Desktop\Bella\bellapro.pem" ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com
```

2. **Run the setup script:**
```bash
cd ~/bombay-marketplace
chmod +x setup-ssl-https.sh
./setup-ssl-https.sh
```

3. **Follow the prompts** - The script will:
   - Install Nginx
   - Install Certbot (for Let's Encrypt SSL certificates)
   - Configure SSL/HTTPS
   - Set up reverse proxy for both frontend (port 3000) and backend (port 5000)

### Option 2: Manual Setup

#### Step 1: Install Nginx and Certbot

```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

#### Step 2: Configure AWS Security Group

1. Go to AWS EC2 Console
2. Select your instance → Security Group
3. Edit Inbound Rules and add:
   - **Type:** HTTP, Port: 80, Source: 0.0.0.0/0
   - **Type:** HTTPS, Port: 443, Source: 0.0.0.0/0

#### Step 3: Configure Nginx

Create Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/marketplace
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name ec2-54-236-21-8.compute-1.amazonaws.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ec2-54-236-21-8.compute-1.amazonaws.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ec2-54-236-21-8.compute-1.amazonaws.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec2-54-236-21-8.compute-1.amazonaws.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Frontend (Next.js - Port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Backend (Express - Port 5000)
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Step 4: Enable Site and Get SSL Certificate

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/marketplace /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d ec2-54-236-21-8.compute-1.amazonaws.com --non-interactive --agree-tos --email your-email@example.com --redirect

# Restart Nginx
sudo systemctl restart nginx
```

### Option 3: Self-Signed Certificate (For Testing)

If you don't have a domain or Let's Encrypt doesn't work:

```bash
# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/marketplace.key \
    -out /etc/nginx/ssl/marketplace.crt \
    -subj "/C=IN/ST=State/L=City/O=Marketplace/CN=ec2-54-236-21-8.compute-1.amazonaws.com"

# Update Nginx config to use self-signed cert
sudo nano /etc/nginx/sites-available/marketplace
```

Then use these SSL paths:
```nginx
ssl_certificate /etc/nginx/ssl/marketplace.crt;
ssl_certificate_key /etc/nginx/ssl/marketplace.key;
```

⚠️ **Note:** Self-signed certificates will show a security warning in browsers. Users need to click "Advanced" → "Proceed anyway" to access the site.

## After Setup

### Access URLs:
- **HTTP:** `http://ec2-54-236-21-8.compute-1.amazonaws.com` (auto-redirects to HTTPS)
- **HTTPS:** `https://ec2-54-236-21-8.compute-1.amazonaws.com`

### Update Application URLs

Update the `CLIENT_URL` in your `.env` file on EC2:

```bash
cd ~/bombay-marketplace
nano .env
```

Change:
```
CLIENT_URL=https://ec2-54-236-21-8.compute-1.amazonaws.com
```

Then restart the application:
```bash
pm2 restart all
```

## Troubleshooting

### Certificate won't issue from Let's Encrypt
- Ensure domain/hostname points to your server IP
- Check Security Group allows ports 80 and 443
- Verify DNS propagation

### Nginx won't start
```bash
sudo nginx -t  # Check configuration syntax
sudo systemctl status nginx  # Check status
sudo tail -f /var/log/nginx/error.log  # View errors
```

### SSL errors persist
- Clear browser cache
- Try incognito/private mode
- Check certificate validity: `sudo certbot certificates`

## Benefits of This Setup

✅ **Secure HTTPS connection**  
✅ **Works on mobile browsers** (no SSL protocol errors)  
✅ **Automatic HTTP to HTTPS redirect**  
✅ **Reverse proxy** - Nginx handles SSL, Node.js handles application  
✅ **Better performance** - Nginx is optimized for serving static content  

## Next Steps

1. **For Production:** Get a custom domain and use Let's Encrypt
2. **Monitor:** Set up certificate auto-renewal: `sudo certbot renew --dry-run`
3. **Security:** Consider adding rate limiting and DDoS protection

