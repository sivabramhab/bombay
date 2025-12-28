# 🔴 URGENT: Fix OAuth Error Right Now

## Current Error
```
"OAuth client was not found" / "invalid_client"
```

## Root Cause
**The .env file is missing or doesn't have Google OAuth credentials.**

## ✅ Quick Fix (5 Minutes)

### Step 1: Create .env File

**In the root directory** (same folder as `package.json`), create a file named `.env`

**Content to paste:**

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/competitive-marketplace
JWT_SECRET=competitive-marketplace-secret-key

GOOGLE_CLIENT_ID=YOU-NEED-TO-GET-THIS-FROM-GOOGLE-CONSOLE
GOOGLE_CLIENT_SECRET=YOU-NEED-TO-GET-THIS-FROM-GOOGLE-CONSOLE
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CLIENT_URL=http://localhost:3000
```

### Step 2: Get Google OAuth Credentials

**You MUST do this yourself** - I cannot do it for you:

1. **Open**: https://console.cloud.google.com/
2. **Sign in**: sivabrahma7689@gmail.com (with your password: SIVA1#siva)
3. **Create Project** (if needed):
   - Click project dropdown → New Project
   - Name: `marketplace-oauth`
   - Create
4. **Create OAuth Client**:
   - Go to: **APIs & Services** → **Credentials**
   - Click: **+ CREATE CREDENTIALS** → **OAuth client ID**
   - **If asked for consent screen**: Configure it first (see Step 3 below)
   - **Application type**: Web application
   - **Name**: `Marketplace Client`
   - **Redirect URI**: `http://localhost:5000/api/auth/google/callback`
   - **JavaScript origins**: `http://localhost:5000` and `http://localhost:3000`
   - Click **CREATE**
   - **COPY** the Client ID and Client Secret from the popup

### Step 3: Configure OAuth Consent Screen (If Required)

If Google asks you to configure consent screen:

1. **OAuth consent screen** page:
   - **User Type**: External
   - **App name**: `Competitive Marketplace`
   - **Support email**: sivabrahma7689@gmail.com
   - **Developer email**: sivabrahma7689@gmail.com
   - Click **Save and Continue**
   - On Scopes: Click **Save and Continue**
   - On Test users: Click **Save and Continue**
   - Click **Back to Dashboard**

### Step 4: Update .env File

Replace these lines in your `.env` file:

```env
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz...
```

**Replace with your actual values from Step 2**

### Step 5: Verify and Restart

```bash
# Check if credentials are loaded:
node CHECK_OAUTH_CONFIG.js

# Restart server:
npm run dev
```

## ⚠️ Important Notes

1. **You must create OAuth credentials yourself** in Google Cloud Console
2. **I cannot create them for you** - it requires your Google account
3. **Client Secret is shown only once** - copy it immediately
4. **Restart server** after updating .env file

## 📋 Checklist

- [ ] Created .env file in root directory
- [ ] Opened Google Cloud Console
- [ ] Created OAuth 2.0 Client ID
- [ ] Copied Client ID and Secret
- [ ] Updated .env file with credentials
- [ ] Verified with: `node CHECK_OAUTH_CONFIG.js`
- [ ] Restarted server: `npm run dev`

## 🆘 Still Having Issues?

1. **Check .env file location**: Must be in root (same as package.json)
2. **Verify no spaces**: `GOOGLE_CLIENT_ID=value` (not `GOOGLE_CLIENT_ID = value`)
3. **Check credentials format**: 
   - Client ID ends with `.apps.googleusercontent.com`
   - Client Secret starts with `GOCSPX-`
4. **Wait 2-5 minutes** after creating credentials (Google propagation)

