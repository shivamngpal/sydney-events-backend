const express = require('express');
const passport = require('passport');
const router = express.Router();

// @route   GET /auth/google
// @desc    Authenticate with Google
// @access  Public
router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
    })
);

// @route   GET /auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/auth/failure',
    }),
    (req, res) => {
        // Successful authentication, redirect to admin dashboard
        res.redirect('http://localhost:3000/admin');
    }
);

// @route   GET /auth/failure
// @desc    Auth failure page
// @access  Public
router.get('/failure', (req, res) => {
    res.status(401).json({
        success: false,
        message: 'Authentication failed. You are not authorized.',
    });
});

// @route   GET /api/current_user
// @desc    Get current logged in user
// @access  Public
router.get('/current_user', (req, res) => {
    if (req.user) {
        res.json({
            success: true,
            user: req.user,
        });
    } else {
        res.json({
            success: false,
            user: null,
        });
    }
});

// @route   GET /api/logout
// @desc    Logout user
// @access  Public
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error logging out',
            });
        }
        res.redirect('http://localhost:3000');
    });
});

module.exports = router;
