# Fix Access Issues - Security Group & API Configuration

## Problems Identified

1. **Security Group**: Ports 80 and 443 are NOT open (blocking HTTPS access)
2. **API Configuration**: Fixed API URL to always use HTTPS when on EC2 domain

## ✅ Fixed

- Updated `client/lib/api.ts` to always use HTTPS when accessing via EC2 domain
- Application rebuilt and restarted on EC2

## ⚠️ ACTION REQUIRED: Open Security Group Ports

You **MUST** configure the AWS Security Group to allow traffic on ports 80 and 443.

### Quick Steps:

1. **AWS Console**: https://console.aws.amazon.com/ec2/
2. **Login**: `team@svgnai.com` / `Theteamofbella@123`
3. **Navigate**: EC2 → Instances → `i-0f75a79829213e975`
4. **Security Tab** → Click Security Group name
5. **Edit Inbound Rules** → Add:
   - **HTTP** (Port 80) from `0.0.0.0/0`
   - **HTTPS** (Port 443) from `0.0.0.0/0`
6. **Save rules**

### After Opening Ports

Access your site via:
- ✅ `https://ec2-54-236-21-8.compute-1.amazonaws.com` (HTTPS - recommended)
- ✅ `http://ec2-54-236-21-8.compute-1.amazonaws.com` (HTTP - redirects to HTTPS)

### Why Port 3000 Shows "Loading Products"?

When accessing via `http://ec2-54-236-21-8.compute-1.amazonaws.com:3000`:
- The page loads (port 3000 is open)
- But API calls may fail because:
  - Security Group blocks port 5000 from external access (API server)
  - OR the frontend is trying to use HTTP instead of HTTPS for API calls

### Solution

**Use HTTPS (ports 80/443) through Nginx:**
- Nginx proxies both frontend (port 3000) and API (port 5000)
- All traffic goes through HTTPS (port 443)
- Security Group only needs ports 80 & 443 open

## Current Server Status

✅ Nginx running on ports 80 & 443  
✅ Server running on port 5000  
✅ Client running on port 3000  
✅ SSL configured  
✅ API URL fixed to use HTTPS  
❌ **Security Group blocking external access on ports 80/443**

## Next Steps

1. **Open Security Group ports** (as described above)
2. **Wait 10-20 seconds** after saving
3. **Test access**: `https://ec2-54-236-21-8.compute-1.amazonaws.com`
4. Products should load correctly via HTTPS

## Troubleshooting

If products still don't load after opening ports:

1. **Check browser console** (F12) for API errors
2. **Verify API URL**: Should be `https://ec2-54-236-21-8.compute-1.amazonaws.com/api`
3. **Check Nginx logs**: `sudo tail -f /var/log/nginx/error.log`
4. **Verify services**: `pm2 list` should show both services online

