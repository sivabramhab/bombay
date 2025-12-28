# 🔐 Google OAuth Setup Instructions

## Error: "OAuth client was not found" - Solution

This error occurs because Google OAuth credentials are not configured. Follow these steps:

## ⚡ Quick Setup (5-10 minutes)

### Step 1: Go to Google Cloud Console
1. Visit: **https://console.cloud.google.com/**
2. Sign in with: **sivabrahma7689@gmail.com** (or your Google account)

### Step 2: Create a Project
1. Click the **project dropdown** at the top
2. Click **"New Project"**
3. Name it: `marketplace-oauth` (or any name)
4. Click **"Create"**
5. Wait for creation and **select the project**

### Step 3: Configure OAuth Consent Screen
1. Go to: **APIs & Services** → **OAuth consent screen**
2. Select **"External"** → Click **"Create"**
3. Fill in:
   - **App name**: `Competitive Marketplace`
   - **User support email**: `sivabrahma7689@gmail.com`
   - **App logo**: (optional)
   - **Application home page**: `http://localhost:3000`
   - **Authorized domains**: (leave empty for localhost)
   - **Developer contact**: `sivabrahma7689@gmail.com`
4. Click **"Save and Continue"**
5. On **Scopes** page: Click **"Save and Continue"** (default scopes are fine)
6. On **Test users** page: Click **"Save and Continue"**
7. Review and **"Back to Dashboard"**

### Step 4: Create OAuth 2.0 Client ID
1. Go to: **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"**
3. Select **"OAuth client ID"**
4. Choose **Application type**: **Web application**
5. Name: `Marketplace Web Client`

6. **Authorized JavaScript origins** - Add these:
   ```
   http://localhost:5000
   http://localhost:3000
   ```

7. **Authorized redirect URIs** - Add this EXACTLY:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
   ⚠️ **Important**: No trailing slash, exact match required

8. Click **"CREATE"**

9. **📋 COPY THESE VALUES** (you'll see a popup):
   - **Client ID**: `123456789-abc.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-abc123xyz...`
   
   ⚠️ **Save these immediately** - you can't see the secret again!

### Step 5: Update .env File

Create or edit `.env` file in the **root directory** of your project:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/competitive-marketplace

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Google OAuth - ADD YOUR CREDENTIALS HERE
GOOGLE_CLIENT_ID=paste-your-client-id-here
GOOGLE_CLIENT_SECRET=paste-your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Client URL
CLIENT_URL=http://localhost:3000
```

**Replace:**
- `paste-your-client-id-here` → Your actual Client ID from Step 4
- `paste-your-client-secret-here` → Your actual Client Secret from Step 4

### Step 6: Restart Application

```bash
# Stop current servers (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### Step 7: Test

1. Go to: **http://localhost:3000/login**
2. Click: **"Sign in with Google"**
3. Should redirect to Google login page
4. After login, should redirect back to your app

## ✅ Verification Checklist

- [ ] OAuth consent screen configured
- [ ] OAuth Client ID created
- [ ] Redirect URI added: `http://localhost:5000/api/auth/google/callback`
- [ ] JavaScript origins added: `http://localhost:5000` and `http://localhost:3000`
- [ ] Client ID and Secret copied to `.env` file
- [ ] `.env` file in root directory (same level as `package.json`)
- [ ] Server restarted after updating `.env`

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
**Solution:**
- Check redirect URI in Google Console matches exactly
- Should be: `http://localhost:5000/api/auth/google/callback`
- No trailing slash, no spaces
- Make sure you're using `http://` not `https://`

### Error: "invalid_client" (Error 401)
**Solution:**
- Verify Client ID and Secret in `.env` are correct
- No spaces around `=` sign: `GOOGLE_CLIENT_ID=value` (not `GOOGLE_CLIENT_ID = value`)
- Restart server after changing `.env`
- Check for typos in credentials

### Error: "Access Blocked"
**Solution:**
- Wait 5-10 minutes after creating credentials
- Verify OAuth consent screen is published (or add test user)
- Check that you're signed in with correct Google account

### Still Not Working?
1. Double-check all URIs match exactly
2. Clear browser cache and cookies
3. Try incognito/private browsing mode
4. Verify `.env` file is in root directory
5. Check server console for error messages

## 📝 Important Notes

- **Never commit `.env` file to Git** - it contains secrets
- **Client Secret** can only be viewed once - save it securely
- For production, you'll need to update redirect URIs to your domain
- Localhost URLs only work for local development

