# Quick Google OAuth Setup (5 Minutes)

## What You Need
- Google Account: sivabrahma7689@gmail.com
- Access to Google Cloud Console

## Steps

1. **Go to Google Cloud Console**: https://console.cloud.google.com/

2. **Create New Project** (or use existing)
   - Click project dropdown → New Project
   - Name: `marketplace-oauth`
   - Create

3. **Create OAuth Credentials**
   - Go to: APIs & Services → Credentials
   - Click: + CREATE CREDENTIALS → OAuth client ID
   
   - **If prompted for Consent Screen:**
     - App name: `Marketplace`
     - Support email: `sivabrahma7689@gmail.com`
     - Developer email: `sivabrahma7689@gmail.com`
     - Save and Continue (skip scopes and test users)

   - **Create OAuth Client:**
     - Application type: **Web application**
     - Name: `Marketplace Web Client`
     
     - **Authorized JavaScript origins:**
       ```
       http://localhost:5000
       http://localhost:3000
       ```
     
     - **Authorized redirect URIs:**
       ```
       http://localhost:5000/api/auth/google/callback
       ```
     
     - Click **Create**

4. **Copy Credentials**
   - Copy the **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
   - Copy the **Client Secret** (looks like: `GOCSPX-abc123xyz`)

5. **Update .env File**
   Create or update `.env` in root directory:
   ```env
   GOOGLE_CLIENT_ID=paste-client-id-here
   GOOGLE_CLIENT_SECRET=paste-client-secret-here
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   CLIENT_URL=http://localhost:3000
   ```

6. **Restart Server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

## Verify Setup

After restart, test the login:
- Go to: http://localhost:3000/login
- Click: "Sign in with Google"
- Should redirect to Google login page

## Common Issues

**Error: redirect_uri_mismatch**
- Check redirect URI matches exactly (no trailing slash)
- Should be: `http://localhost:5000/api/auth/google/callback`

**Error: invalid_client**
- Verify credentials in .env file
- No spaces around = sign
- Restart server after changing .env

**403 Error: Access Blocked**
- Wait 5-10 minutes after creating credentials
- Verify OAuth consent screen is configured

