const Event = require('../models/Event');

/**
 * @desc    Get all events with pagination, filtering, and sorting
 * @route   GET /api/events
 * @access  Public
 */
const getEvents = async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};

        // City filter (case insensitive)
        if (req.query.city) {
            filter.city = { $regex: new RegExp(`^${req.query.city}$`, 'i') };
        }

        // Search filter (regex on title, description, or venue)
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filter.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { venue: searchRegex },
            ];
        }

        // Status filter
        if (req.query.status) {
            filter.status = req.query.status;
        }

        // isImported filter
        if (req.query.isImported !== undefined) {
            filter.isImported = req.query.isImported === 'true';
        }

        // Date range filter (for string dates, we do string comparison)
        // Note: Since dates are stored as strings, this is a basic filter
        if (req.query.startDate || req.query.endDate) {
            // For now, we'll skip date filtering since dates are strings
            // In production, you'd parse and compare properly
        }

        // Sorting (default: by createdAt descending for newest first)
        const sortField = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.order === 'asc' ? 1 : -1;
        const sort = { [sortField]: sortOrder };

        // Execute query
        const events = await Event.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
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
        console.error('Error fetching events:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching events',
            error: error.message,
        });
    }
};

/**
 * @desc    Get single event by ID
 * @route   GET /api/events/:id
 * @access  Public
 */
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        res.json({
            success: true,
            data: event,
        });
    } catch (error) {
        // Handle invalid ObjectId
        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Event not found (invalid ID)',
            });
        }

        console.error('Error fetching event:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching event',
            error: error.message,
        });
    }
};

/**
 * @desc    Trigger manual scrape
 * @route   POST /api/events/scrape
 * @access  Admin (TODO: Add auth middleware)
 */
const triggerScrape = async (req, res) => {
    try {
        const { saveEventsToDB } = require('../services/scraper');

        res.json({
            success: true,
            message: 'Scraping started. Check server logs for progress.',
        });

        // Run scraper in background
        saveEventsToDB()
            .then(result => console.log('Scrape completed:', result))
            .catch(err => console.error('Scrape failed:', err));

    } catch (error) {
        console.error('Error triggering scrape:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start scraper',
            error: error.message,
        });
    }
};

module.exports = {
    getEvents,
    getEventById,
    triggerScrape,
};
