/**
 * Middleware to require user login
 * Returns 401 if user is not authenticated
 */
const requireLogin = (req, res, next) => {
    if (req.user) {
        return next();
    }

    return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please log in.',
    });
};

module.exports = requireLogin;
