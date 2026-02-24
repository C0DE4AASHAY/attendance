const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { attendanceRateLimiter, validateAttendanceData } = require('../middleware/security');

// Core attendance route with Anti-API-Abuse Rate Limiter & Backend Input Validation
router.post('/mark',
    attendanceRateLimiter, // Add rate limit to prevent spam from the same IP (Postman Abuse)
    validateAttendanceData, // Validate input arrays server-side entirely (Never rely on frontend)
    attendanceController.markAttendance // Run all backend session / unique checks
);

module.exports = router;
