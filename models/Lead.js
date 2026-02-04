const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
    },
    eventTitle: {
        type: String,
    },
    sourceUrl: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for faster queries
leadSchema.index({ email: 1 });
leadSchema.index({ eventId: 1 });

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
