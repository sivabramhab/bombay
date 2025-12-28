# How to Create .env File

## Quick Steps

1. **Create a new file** named `.env` in the **root directory** (same folder as `package.json`)

2. **Copy and paste** this template:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/competitive-marketplace

# JWT Secret (Change this to a random string)
JWT_SECRET=competitive-marketplace-secret-key-change-in-production

# Google OAuth Credentials
# GET THESE FROM: https://console.cloud.google.com/
# After creating OAuth Client ID, paste the values here:
GOOGLE_CLIENT_ID=paste-your-client-id-here
GOOGLE_CLIENT_SECRET=paste-your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Client URL
CLIENT_URL=http://localhost:3000
```

3. **Replace** `paste-your-client-id-here` and `paste-your-client-secret-here` with your actual Google OAuth credentials

4. **Save the file**

5. **Restart your server**: `npm run dev`

## Where to Get Google OAuth Credentials?

1. Go to: https://console.cloud.google.com/
2. Sign in with: sivabrahma7689@gmail.com
3. Create project → Create OAuth Client ID
4. See `STEP_BY_STEP_OAUTH.md` for complete instructions

## File Location

```
competitive-marketplace/
├── .env              ← CREATE THIS FILE HERE (root directory)
├── package.json
├── server/
└── client/
```

## Verify Configuration

After creating .env file, run:
```bash
node CHECK_OAUTH_CONFIG.js
```

This will show if credentials are loaded correctly.

