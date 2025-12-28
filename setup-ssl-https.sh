#!/bin/bash
# Setup SSL/HTTPS for EC2 instance using Let's Encrypt and Nginx

set -e

DOMAIN="ec2-54-236-21-8.compute-1.amazonaws.com"
# Replace with your actual domain if you have one, e.g., "yourdomain.com"

echo "=========================================="
echo "Setting up SSL/HTTPS for EC2 Instance"
echo "=========================================="
echo ""

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx

# Install Certbot for Let's Encrypt
echo "📦 Installing Certbot..."
sudo apt-get install -y certbot python3-certbot-nginx

# Check if we have a custom domain or using EC2 hostname
read -p "Do you have a custom domain name? (y/n): " has_domain
if [ "$has_domain" = "y" ]; then
    read -p "Enter your domain name: " DOMAIN
fi

echo ""
echo "⚠️  IMPORTANT: For Let's Encrypt to work, you need:"
echo "1. A domain name pointing to this EC2 instance's IP"
echo "2. Security Group must allow port 80 and 443"
echo "3. If using EC2 hostname only, you may need to use self-signed certificate"
echo ""
read -p "Continue with setup? (y/n): " continue_setup

if [ "$continue_setup" != "y" ]; then
    echo "Setup cancelled."
    exit 0
fi

# Configure Nginx
echo "🔧 Configuring Nginx..."

sudo tee /etc/nginx/sites-available/marketplace > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # For Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # API Backend (Express)
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/marketplace /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Start Nginx
echo "🚀 Starting Nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx

# Try to get Let's Encrypt certificate
echo "🔐 Attempting to get SSL certificate from Let's Encrypt..."
if certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect 2>/dev/null; then
    echo "✅ SSL certificate obtained successfully!"
    echo "✅ HTTPS is now enabled!"
    echo ""
    echo "Your site is available at:"
    echo "  https://$DOMAIN"
else
    echo "⚠️  Could not obtain Let's Encrypt certificate."
    echo "This might be because:"
    echo "  1. Domain doesn't point to this server"
    echo "  2. Port 80 is not accessible"
    echo ""
    echo "Setting up self-signed certificate as fallback..."
    
    # Create self-signed certificate
    sudo mkdir -p /etc/nginx/ssl
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/marketplace.key \
        -out /etc/nginx/ssl/marketplace.crt \
        -subj "/C=IN/ST=State/L=City/O=Marketplace/CN=$DOMAIN"
    
    # Update Nginx config for self-signed cert
    sudo sed -i "s|ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;|ssl_certificate /etc/nginx/ssl/marketplace.crt;|g" /etc/nginx/sites-available/marketplace
    sudo sed -i "s|ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;|ssl_certificate_key /etc/nginx/ssl/marketplace.key;|g" /etc/nginx/sites-available/marketplace
    
    sudo systemctl restart nginx
    
    echo "⚠️  Self-signed certificate installed."
    echo "⚠️  Browsers will show a security warning (this is normal for self-signed certs)."
    echo "⚠️  For production, use a proper domain with Let's Encrypt."
fi

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

echo ""
echo "=========================================="
echo "✅ SSL/HTTPS Setup Complete!"
echo "=========================================="
echo ""
echo "Your application is now accessible via:"
echo "  HTTP:  http://$DOMAIN (redirects to HTTPS)"
echo "  HTTPS: https://$DOMAIN"
echo ""
echo "Note: If using self-signed certificate, you'll need to"
echo "accept the security warning in your browser."
echo ""

