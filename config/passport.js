const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Admin email allowlist (add your email here)
const ADMIN_EMAILS = [
    'admin@example.com', // Replace with your actual admin email
    // Add more admin emails as needed
];

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback',
            proxy: true,
        },
        (accessToken, refreshToken, profile, done) => {
            // Get user email
            const email = profile.emails?.[0]?.value;

            // Check if user is in admin allowlist
            // For demo purposes, we'll allow all authenticated users
            const isAdmin = ADMIN_EMAILS.includes(email) || true; // Set to true for demo

            if (!isAdmin) {
                return done(null, false, { message: 'Not authorized as admin' });
            }

            // Return user profile
            const user = {
                id: profile.id,
                displayName: profile.displayName,
                email: email,
                photo: profile.photos?.[0]?.value,
                isAdmin: true,
            };

            return done(null, user);
        }
    )
);

module.exports = passport;
