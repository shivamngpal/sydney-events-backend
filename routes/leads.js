const express = require('express');
const router = express.Router();
const { createLead, getLeads } = require('../controllers/leadController');

// POST /api/leads - Create new lead
router.post('/', createLead);

// GET /api/leads - Get all leads (Admin only)
router.get('/', getLeads);

module.exports = router;
