const express = require('express');
const router = express.Router();
const requireLogin = require('../middleware/requireLogin');
const Event = require('../models/Event');
const Lead = require('../models/Lead');

// Apply requireLogin middleware to all routes
router.use(requireLogin);

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Admin
 */
router.get('/stats', async (req, res) => {
    try {
        const totalEvents = await Event.countDocuments();
        const newEvents = await Event.countDocuments({ status: 'new' });
        const updatedEvents = await Event.countDocuments({ status: 'updated' });
        const importedEvents = await Event.countDocuments({ status: 'imported' });
        const inactiveEvents = await Event.countDocuments({ status: 'inactive' });
        const totalLeads = await Lead.countDocuments();

        res.json({
            success: true,
            data: {
                events: {
                    total: totalEvents,
                    new: newEvents,
                    updated: updatedEvents,
                    imported: importedEvents,
                    inactive: inactiveEvents,
                },
                leads: {
                    total: totalLeads,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message,
        });
    }
});

/**
 * @route   GET /api/admin/events
 * @desc    Get all events for admin management
 * @access  Admin
 */
router.get('/events', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Filter by status if provided
        const filter = {};
        if (req.query.status) {
            filter.status = req.query.status;
        }

        const events = await Event.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Event.countDocuments(filter);

        res.json({
            success: true,
            count: events.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: events,
        });
    } catch (error) {
        console.error('Error fetching admin events:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching events',
            error: error.message,
        });
    }
});

/**
 * @route   POST /api/admin/events/:id/import
 * @desc    Mark an event as imported
 * @access  Admin
 */
router.post('/events/:id/import', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        event.status = 'imported';
        event.isImported = true;
        event.importedAt = new Date();
        await event.save();

        res.json({
            success: true,
            message: 'Event imported successfully',
            data: event,
        });
    } catch (error) {
        console.error('Error importing event:', error);
        res.status(500).json({
            success: false,
            message: 'Error importing event',
            error: error.message,
        });
    }
});

/**
 * @route   POST /api/admin/events/:id/status
 * @desc    Update event status
 * @access  Admin
 */
router.post('/events/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['new', 'updated', 'inactive', 'imported'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
            });
        }

        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        res.json({
            success: true,
            message: 'Status updated successfully',
            data: event,
        });
    } catch (error) {
        console.error('Error updating event status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating status',
            error: error.message,
        });
    }
});

/**
 * @route   GET /api/admin/leads
 * @desc    Get all captured leads
 * @access  Admin
 */
router.get('/leads', async (req, res) => {
    try {
        const leads = await Lead.find()
            .sort({ createdAt: -1 })
            .populate('eventId', 'title');

        res.json({
            success: true,
            count: leads.length,
            data: leads,
        });
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leads',
            error: error.message,
        });
    }
});

/**
 * @route   POST /api/admin/scrape
 * @desc    Trigger manual scrape
 * @access  Admin
 */
router.post('/scrape', async (req, res) => {
    try {
        const { saveEventsToDB } = require('../services/scraper');

        res.json({
            success: true,
            message: 'Scraping started. Check server logs for progress.',
        });

        // Run scraper in background
        saveEventsToDB()
            .then((result) => console.log('Scrape completed:', result))
            .catch((err) => console.error('Scrape failed:', err));
    } catch (error) {
        console.error('Error triggering scrape:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start scraper',
            error: error.message,
        });
    }
});

module.exports = router;
