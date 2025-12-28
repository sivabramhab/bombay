# ⚠️ URGENT: Configure AWS Security Group

## Current Issue
Unable to access `https://ec2-54-236-21-8.compute-1.amazonaws.com` because ports 80 (HTTP) and 443 (HTTPS) are not open in the AWS Security Group.

## Quick Fix Instructions

### Option 1: AWS Console (Easiest)

1. **Go to AWS Console:**
   ```
   https://console.aws.amazon.com/ec2/
   ```

2. **Login:**
   - Username: `team@svgnai.com`
   - Password: `Theteamofbella@123`

3. **Find Instance:**
   - Click "Instances" in left menu
   - Search for: `i-0f75a79829213e975`
   - Click on the instance

4. **Open Security Group:**
   - Click "Security" tab (bottom of page)
   - Click on the Security Group name (blue link)

5. **Edit Inbound Rules:**
   - Click "Edit inbound rules"
   - Click "Add rule"
   - Add these TWO rules:

   **Rule 1 - HTTP:**
   - Type: `HTTP`
   - Port: `80`
   - Source: `0.0.0.0/0` (or select "Anywhere-IPv4")

   **Rule 2 - HTTPS:**
   - Type: `HTTPS`
   - Port: `443`
   - Source: `0.0.0.0/0` (or select "Anywhere-IPv4")

6. **Save:**
   - Click "Save rules"
   - Wait 10-20 seconds

7. **Test:**
   - Try: `https://ec2-54-236-21-8.compute-1.amazonaws.com`

## Visual Guide

```
AWS Console → EC2 → Instances → i-0f75a79829213e975
  ↓
Security Tab
  ↓
Security Group (click name)
  ↓
Edit Inbound Rules
  ↓
Add Rule (x2)
  ↓
Save Rules
```

## Current Status

✅ Nginx running and configured  
✅ SSL certificate created  
✅ Ports 80 & 443 listening on server  
❌ Security Group not allowing external access (needs configuration)

## After Configuration

Your site will be accessible at:
- **HTTPS:** `https://ec2-54-236-21-8.compute-1.amazonaws.com`
- **HTTP:** `http://ec2-54-236-21-8.compute-1.amazonaws.com` (auto-redirects to HTTPS)

Both mobile and desktop browsers will work!

