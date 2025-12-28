const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Validate OAuth configuration
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientID || clientID === 'your-google-client-id' || clientID.trim() === '') {
  console.warn('⚠️  WARNING: GOOGLE_CLIENT_ID not configured in .env file');
  console.warn('   Google OAuth will not work until credentials are added.');
  console.warn('   See SETUP_GOOGLE_OAUTH.md for instructions.');
}

if (!clientSecret || clientSecret === 'your-google-client-secret' || clientSecret.trim() === '') {
  console.warn('⚠️  WARNING: GOOGLE_CLIENT_SECRET not configured in .env file');
  console.warn('   Google OAuth will not work until credentials are added.');
  console.warn('   See SETUP_GOOGLE_OAUTH.md for instructions.');
}

passport.use(
  new GoogleStrategy(
    {
      clientID: clientID || 'your-google-client-id',
      clientSecret: clientSecret || 'your-google-client-secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account
          user.googleId = profile.id;
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          mobile: '', // Will need to be added later
          mobileVerified: false,
        });

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

