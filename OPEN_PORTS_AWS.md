# 🔓 Open Ports 80 and 443 in AWS Security Group

## Problem
Server is configured correctly, but you cannot access it because AWS Security Group blocks external traffic on ports 80 and 443.

## ✅ Server Status (Verified)
- ✅ Nginx running on ports 80 & 443
- ✅ HTTPS working locally
- ✅ SSL configured
- ❌ Security Group blocking external access

## Solution: Open Ports in AWS Console

### Step 1: Login to AWS
1. Go to: **https://console.aws.amazon.com/**
2. Click "Sign in to the console"
3. Login with:
   - **Account ID or alias:** (leave blank or use root account)
   - **IAM user name:** `team@svgnai.com`
   - **Password:** `Theteamofbella@123`

### Step 2: Navigate to EC2
1. In the search bar at the top, type: `EC2`
2. Click on **EC2** service

### Step 3: Find Your Instance
1. In the left sidebar, click **Instances**
2. In the search box at the top right, type: `i-0f75a79829213e975`
3. Click on the instance row to select it

### Step 4: Open Security Group
1. Look at the bottom panel - click the **Security** tab
2. You'll see "Security groups" section
3. Click on the Security Group name (it's a clickable link, e.g., `sg-0123456789abcdef0`)

### Step 5: Edit Inbound Rules
1. In the Security Group details page, click **Edit inbound rules** button
2. Click **Add rule** button (top right)

### Step 6: Add HTTP Rule (Port 80)
Fill in:
- **Type:** Select `HTTP` from dropdown (or `Custom TCP`)
- **Protocol:** TCP (auto-filled if HTTP selected)
- **Port range:** `80`
- **Source:** 
  - Click the dropdown
  - Select `Anywhere-IPv4` (or type `0.0.0.0/0`)
- **Description:** `Allow HTTP access` (optional)

### Step 7: Add HTTPS Rule (Port 443)
Click **Add rule** again and fill in:
- **Type:** Select `HTTPS` from dropdown (or `Custom TCP`)
- **Protocol:** TCP (auto-filled if HTTPS selected)
- **Port range:** `443`
- **Source:**
  - Click the dropdown
  - Select `Anywhere-IPv4` (or type `0.0.0.0/0`)
- **Description:** `Allow HTTPS access` (optional)

### Step 8: Save
1. Scroll down and click **Save rules** button
2. Wait 10-20 seconds for changes to take effect

### Step 9: Test
Open your browser and try:
- `https://ec2-54-236-21-8.compute-1.amazonaws.com`
- `http://ec2-54-236-21-8.compute-1.amazonaws.com` (should redirect to HTTPS)

## Visual Checklist

Your Security Group should have these inbound rules after configuration:

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | Your IP | (already exists) |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 | (already exists) |
| Custom TCP | TCP | 5000 | 0.0.0.0/0 | (already exists) |
| **HTTP** | TCP | **80** | **0.0.0.0/0** | **NEW - Add this** |
| **HTTPS** | TCP | **443** | **0.0.0.0/0** | **NEW - Add this** |

## Troubleshooting

### Still can't access after 30 seconds?
1. **Double-check the rules:**
   - Go back to Security Group → Inbound rules
   - Verify both HTTP (80) and HTTPS (443) are listed
   - Source should be `0.0.0.0/0` or `::/0`

2. **Try different browser:**
   - Clear cache
   - Try incognito/private mode

3. **Verify server is responding:**
   - The server is confirmed working (tested locally)
   - Nginx is running
   - Ports 80 & 443 are listening

4. **Check if firewall is blocking:**
   - Server firewall is configured correctly
   - Issue is definitely the Security Group

## Quick Reference

**Instance ID:** `i-0f75a79829213e975`  
**Instance URL:** `ec2-54-236-21-8.compute-1.amazonaws.com`  
**Ports to open:** 80 (HTTP), 443 (HTTPS)  
**Source:** 0.0.0.0/0 (Anywhere-IPv4)

---

**After opening ports, your site will be fully accessible via HTTPS!** 🎉

