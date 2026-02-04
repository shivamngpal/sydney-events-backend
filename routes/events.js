const express = require('express');
const router = express.Router();
const {
    getEvents,
    getEventById,
    triggerScrape,
} = require('../controllers/eventController');

// GET /api/events - Get all events (with pagination & filters)
router.get('/', getEvents);

// GET /api/events/:id - Get single event
router.get('/:id', getEventById);

// POST /api/events/scrape - Trigger manual scrape (Admin only)
router.post('/scrape', triggerScrape);

module.exports = router;
