const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Passport config
require('./config/passport');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Trust proxy - required for secure cookies behind Render's reverse proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS Configuration - Whitelist allowed origins
const allowedOrigins = [
  "http://localhost:5173",                              // Local Vite
  "http://localhost:3000",                              // Local Alternative
  "https://sydney-events-platform-ten.vercel.app"       // 🚀 Live Vercel URL
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'sydney-events-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production', // true in production (HTTPS)
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
      httpOnly: true,
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
const eventRoutes = require('./routes/events');
const leadRoutes = require('./routes/leads');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const otpRoutes = require('./routes/otp');

app.use('/api/events', eventRoutes);
app.use('/api/leads', leadRoutes);
app.use('/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/otp', otpRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('API is running');
});

// Define port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
