const express = require('express');
const router = express.Router();
const Otp = require('../models/Otp');
const { sendOTP } = require('../services/emailService');

/**
 * @desc    Send OTP to user's email
 * @route   POST /api/otp/send
 * @access  Public
 */
router.post('/send', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Upsert: one active OTP per email at a time
        await Otp.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            { otp, createdAt: Date.now() },
            { upsert: true, new: true }
        );

        // Send email
        await sendOTP(email, otp);

        res.json({ success: true, message: 'Verification code sent' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, message: 'Failed to send verification code' });
    }
});

/**
 * @desc    Verify OTP
 * @route   POST /api/otp/verify
 * @access  Public
 */
router.post('/verify', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and code are required' });
        }

        // Find matching OTP
        const record = await Otp.findOne({
            email: email.toLowerCase().trim(),
            otp,
        });

        if (!record) {
            return res.status(400).json({ success: false, message: 'Invalid or expired code' });
        }

        // Delete after successful verification (one-time use)
        await Otp.deleteOne({ _id: record._id });

        console.log(`✅ OTP verified for ${email}`);
        res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
});

module.exports = router;
