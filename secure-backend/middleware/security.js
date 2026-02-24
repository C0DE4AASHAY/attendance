const rateLimit = require('express-rate-limit');
const { validationResult, body } = require('express-validator');

// 4️⃣ Rate limiting to prevent API abuse (Brute-force / Postman spam)
const attendanceRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes (Match typical session duration)
    max: 5, // Limit each IP to 5 attendance attempts per windowMs
    message: {
        status: 'error',
        message: 'Too many attendance requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// General API rate limiter for the entire app (optional backend security layer)
const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        status: 'error',
        message: 'Too many requests overall, please slow down.'
    }
});

// Middleware to properly validate request body attributes entirely server-side
const validateAttendanceData = [
    body('studentId').isString().trim().notEmpty().withMessage('Valid Student ID is required').escape(),
    body('studentName').isString().trim().notEmpty().withMessage('Valid Student Name is required').escape(),
    body('sessionId').isString().trim().notEmpty().withMessage('Valid Session ID is required').escape(),

    // Custom middleware to throw validation errors immediately if they exist
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid input data. Backend validation failed.',
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = {
    attendanceRateLimiter,
    apiRateLimiter,
    validateAttendanceData
};
