// Quick script to check OAuth configuration
require('dotenv').config();

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  🔍 GOOGLE OAUTH CONFIGURATION CHECK');
console.log('═══════════════════════════════════════════════════════════\n');

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

console.log('📋 Configuration Status:\n');

// Check Client ID
if (!clientID || clientID === 'your-google-client-id' || clientID.trim() === '') {
  console.log('❌ GOOGLE_CLIENT_ID: NOT SET');
  console.log('   Expected format: 123456789-abc.apps.googleusercontent.com\n');
} else {
  console.log('✅ GOOGLE_CLIENT_ID: SET');
  console.log(`   Value: ${clientID.substring(0, 30)}...\n`);
}

// Check Client Secret
if (!clientSecret || clientSecret === 'your-google-client-secret' || clientSecret.trim() === '') {
  console.log('❌ GOOGLE_CLIENT_SECRET: NOT SET');
  console.log('   Expected format: GOCSPX-abc123xyz...\n');
} else {
  console.log('✅ GOOGLE_CLIENT_SECRET: SET');
  console.log(`   Value: ${clientSecret.substring(0, 15)}...\n`);
}

// Check Callback URL
console.log('✅ GOOGLE_CALLBACK_URL:');
console.log(`   ${callbackURL}\n`);

// Summary
if ((!clientID || clientID === 'your-google-client-id') || 
    (!clientSecret || clientSecret === 'your-google-client-secret')) {
  console.log('⚠️  ISSUE DETECTED: OAuth credentials are not configured!\n');
  console.log('📖 To fix this:');
  console.log('   1. Open: https://console.cloud.google.com/');
  console.log('   2. Sign in with your Google account');
  console.log('   3. Create OAuth 2.0 Client ID');
  console.log('   4. Add credentials to .env file');
  console.log('   5. See SETUP_GOOGLE_OAUTH.md for detailed instructions\n');
  console.log('🔗 Quick setup guide: SETUP_GOOGLE_OAUTH.md\n');
} else {
  console.log('✅ All OAuth configuration looks good!');
  console.log('   If you still get errors, check:');
  console.log('   - Redirect URI matches in Google Console');
  console.log('   - Client ID/Secret are correct');
  console.log('   - Server has been restarted\n');
}

console.log('═══════════════════════════════════════════════════════════\n');

