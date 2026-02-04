const Lead = require('../models/Lead');

/**
 * @desc    Create a new lead (capture email)
 * @route   POST /api/leads
 * @access  Public
 */
const createLead = async (req, res) => {
    try {
        const { email, eventId, eventTitle, sourceUrl } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address',
            });
        }

        // Create new lead
        const lead = await Lead.create({
            email,
            eventId,
            eventTitle,
            sourceUrl,
        });

        console.log(`📧 New lead captured: ${email} for "${eventTitle}"`);

        res.status(201).json({
            success: true,
            message: 'Lead saved',
            data: lead,
        });
    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while saving lead',
            error: error.message,
        });
    }
};

/**
 * @desc    Get all leads (Admin only)
 * @route   GET /api/leads
 * @access  Admin
 */
const getLeads = async (req, res) => {
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
            message: 'Server error while fetching leads',
            error: error.message,
        });
    }
};

module.exports = {
    createLead,
    getLeads,
};
