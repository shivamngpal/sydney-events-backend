const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
    {
        // Core event information
        title: {
            type: String,
            required: [true, 'Event title is required'],
            trim: true,
        },
        date: {
            type: String, // Scraped dates are strings, not Date objects
            default: 'Date TBA',
        },
        venue: {
            type: String,
            required: [true, 'Event venue is required'],
            trim: true,
        },
        city: {
            type: String,
            default: 'Sydney',
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },

        // Source tracking
        sourceUrl: {
            type: String,
            required: [true, 'Source URL is required'],
            unique: true,
        },
        sourceName: {
            type: String,
            default: 'Meetup',
        },

        // Change detection
        eventHash: {
            type: String,
        },

        // Status & Tracking
        status: {
            type: String,
            enum: ['new', 'updated', 'inactive', 'imported'],
            default: 'new',
        },
        isImported: {
            type: Boolean,
            default: false,
        },
        lastScrapedAt: {
            type: Date,
            default: Date.now,
        },
        importedAt: {
            type: Date,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Index for faster queries
eventSchema.index({ status: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ isImported: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
