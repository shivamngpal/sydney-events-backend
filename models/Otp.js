const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300, // Auto-delete after 5 minutes
    },
});

// Ensure one OTP per email (upsert-friendly)
otpSchema.index({ email: 1 });

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;
