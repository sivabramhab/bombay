# 🚀 Step-by-Step Google OAuth Setup (WITH SCREENSHOTS GUIDE)

## ⚠️ Error: "OAuth client was not found" / "invalid_client"

This error means **Google OAuth credentials are missing or incorrect**.

## 📋 Complete Setup Process

### Step 1: Open Google Cloud Console

1. **Open your browser**
2. **Go to**: https://console.cloud.google.com/
3. **Sign in** with: **sivabrahma7689@gmail.com**
4. **Enter password**: (your Google account password)

---

### Step 2: Create a New Project

1. Click the **project dropdown** at the top (shows current project name)
2. Click **"New Project"** button
3. Enter **Project name**: `marketplace-oauth`
4. Click **"Create"**
5. Wait for project creation (may take 10-30 seconds)
6. **Select the new project** from dropdown

---

### Step 3: Configure OAuth Consent Screen (REQUIRED FIRST!)

1. In left menu, go to: **APIs & Services** → **OAuth consent screen**
2. Select **"External"** (unless you have Google Workspace)
3. Click **"Create"**
4. Fill in the form:
   - **App name**: `Competitive Marketplace`
   - **User support email**: Select `sivabrahma7689@gmail.com` from dropdown
   - **Application home page**: `http://localhost:3000`
   - **Developer contact information**: `sivabrahma7689@gmail.com`
5. Click **"Save and Continue"**
6. On **Scopes** page: Click **"Save and Continue"** (default scopes are fine)
7. On **Test users** page: Click **"Save and Continue"**
8. On **Summary** page: Click **"Back to Dashboard"**

---

### Step 4: Create OAuth 2.0 Client ID

1. Go to: **APIs & Services** → **Credentials**
2. Click the **"+ CREATE CREDENTIALS"** button at the top
3. Select **"OAuth client ID"** from dropdown

4. If you see "Configure consent screen" warning:
   - Click it and complete Step 3 above
   - Then come back to this step

5. In the **Create OAuth client ID** form:
   - **Application type**: Select **"Web application"**
   - **Name**: `Marketplace Web Client` (or any name)

6. **Authorized JavaScript origins** - Click **"+ ADD URI"** and add:
   ```
   http://localhost:5000
   ```
   Then click **"+ ADD URI"** again and add:
   ```
   http://localhost:3000
   ```

7. **Authorized redirect URIs** - Click **"+ ADD URI"** and add:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
   ⚠️ **CRITICAL**: Must be EXACTLY this (no trailing slash, no spaces)

8. Click **"CREATE"** button

9. **POPUP APPEARS** - This is IMPORTANT!
   - You'll see **Client ID** (looks like: `123456789-abcxyz.apps.googleusercontent.com`)
   - You'll see **Client Secret** (looks like: `GOCSPX-abc123xyz...`)
   - **COPY BOTH VALUES** immediately
   - ⚠️ **Note**: Client Secret can only be viewed once!
   - Click **"OK"** after copying

---

### Step 5: Add Credentials to .env File

1. **Open** your project folder in a text editor
2. **Create or open** `.env` file in the **root directory** (same folder as `package.json`)
3. **Add or update** these lines:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/competitive-marketplace
JWT_SECRET=your-secret-key-here-change-this

# Google OAuth - PASTE YOUR CREDENTIALS HERE
GOOGLE_CLIENT_ID=paste-your-client-id-from-step-4
GOOGLE_CLIENT_SECRET=paste-your-client-secret-from-step-4
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

CLIENT_URL=http://localhost:3000
```

**Example** (with actual values):
```env
GOOGLE_CLIENT_ID=123456789-abcxyz123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz456
```

**⚠️ IMPORTANT:**
- No spaces around `=` sign
- No quotes around values
- One value per line
- Save the file

---

### Step 6: Restart Your Application

1. **Stop** your current servers:
   - Press `Ctrl+C` in the terminal where server is running

2. **Restart**:
   ```bash
   npm run dev
   ```

3. **Verify** credentials loaded:
   - Look at terminal output
   - Should NOT see "WARNING: GOOGLE_CLIENT_ID not configured"
   - If you see warnings, check `.env` file again

---

### Step 7: Test Google OAuth

1. **Open browser**: http://localhost:3000/login
2. **Click**: "Sign in with Google" button
3. **Should redirect** to Google login page
4. **Sign in** with your Google account
5. **Should redirect** back to your app

---

## ✅ Verification Checklist

Before testing, verify:

- [ ] Created Google Cloud Project
- [ ] Configured OAuth consent screen
- [ ] Created OAuth 2.0 Client ID
- [ ] Added JavaScript origins: `http://localhost:5000` and `http://localhost:3000`
- [ ] Added redirect URI: `http://localhost:5000/api/auth/google/callback`
- [ ] Copied Client ID and Secret
- [ ] Added credentials to `.env` file (in root directory)
- [ ] No spaces in `.env` file around `=`
- [ ] Restarted server after updating `.env`

---

## 🐛 Troubleshooting

### Still getting "invalid_client" error?

1. **Run the check script**:
   ```bash
   node CHECK_OAUTH_CONFIG.js
   ```
   This will show if credentials are loaded

2. **Verify .env file location**:
   - Should be in **root directory** (same level as `package.json`)
   - NOT in `server/` folder
   - NOT in `client/` folder

3. **Check for typos**:
   - Client ID should end with `.apps.googleusercontent.com`
   - Client Secret should start with `GOCSPX-`
   - No extra spaces or quotes

4. **Verify redirect URI**:
   - In Google Console, check it matches EXACTLY
   - Should be: `http://localhost:5000/api/auth/google/callback`
   - No trailing slash

5. **Wait a few minutes**:
   - Google sometimes needs 2-5 minutes to propagate new credentials

---

## 📞 Still Need Help?

If you've completed all steps and still get errors:

1. **Check server console** for error messages
2. **Run**: `node CHECK_OAUTH_CONFIG.js` to verify config
3. **Double-check** all URIs match exactly
4. **Try incognito/private browsing** mode
5. **Clear browser cache** and cookies

---

## 📝 Quick Reference

**Redirect URI** (must match exactly):
```
http://localhost:5000/api/auth/google/callback
```

**JavaScript Origins**:
```
http://localhost:5000
http://localhost:3000
```

**Where to get credentials**:
https://console.cloud.google.com/ → APIs & Services → Credentials

