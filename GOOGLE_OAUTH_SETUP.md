# Google OAuth Setup Guide

## Step-by-Step Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account: **sivabrahma7689@gmail.com**
3. Click on the project dropdown at the top
4. Click **"New Project"**
5. Enter project name: `competitive-marketplace` (or any name you prefer)
6. Click **"Create"**
7. Wait for the project to be created and select it

### Step 2: Enable Google+ API

1. In the Google Cloud Console, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google+ API"** (or "Google Identity")
3. Click on it and click **"Enable"**
4. Also enable **"Google OAuth2 API"** if available

### Step 3: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. If prompted, configure the OAuth consent screen first:
   - Choose **"External"** user type
   - Fill in the required fields:
     - **App name**: Competitive Marketplace
     - **User support email**: sivabrahma7689@gmail.com
     - **Developer contact information**: sivabrahma7689@gmail.com
   - Click **"Save and Continue"**
   - On Scopes page, click **"Save and Continue"**
   - On Test users (if shown), click **"Save and Continue"**
   - Review and click **"Back to Dashboard"**

5. Now create OAuth Client ID:
   - **Application type**: Select **"Web application"**
   - **Name**: Marketplace OAuth Client (or any name)
   
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5000
     http://localhost:3000
     ```
   
   - **Authorized redirect URIs**:
     ```
     http://localhost:5000/api/auth/google/callback
     ```

6. Click **"Create"**
7. **IMPORTANT**: Copy the **Client ID** and **Client Secret** that appear
   - You'll see a popup with these credentials
   - Save them securely - you'll need them next

### Step 4: Configure Application

1. Open or create `.env` file in the root directory of your project
2. Add the following lines:
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   CLIENT_URL=http://localhost:3000
   ```

3. Replace `your-client-id-here` and `your-client-secret-here` with the actual values from Step 3

### Step 5: Restart Application

After adding the credentials, restart your servers:
```bash
# Stop current servers (Ctrl+C)
# Then restart:
npm run dev
```

## Quick Reference

**Redirect URI to add in Google Console:**
```
http://localhost:5000/api/auth/google/callback
```

**JavaScript Origins to add:**
```
http://localhost:5000
http://localhost:3000
```

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in `.env` exactly matches what's in Google Console
- Check for trailing slashes (should be none)
- Verify you're using `http://` not `https://` for localhost

### Error: "invalid_client"
- Verify Client ID and Client Secret are correct
- Make sure there are no extra spaces in `.env` file
- Restart the server after changing `.env`

### Still having issues?
1. Double-check all URIs match exactly
2. Ensure Google+ API is enabled
3. Wait a few minutes after creating credentials (Google sometimes needs time to propagate)

