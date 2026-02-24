const Attendance = require('../models/Attendance');
const Session = require('../models/Session');

// Mark attendance
exports.markAttendance = async (req, res) => {
    try {
        const { studentId, studentName, sessionId, deviceFingerprint } = req.body;

        // Retrieve IP Address from Express req (Works securely behind proxies using trust proxy)
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'Unknown User-Agent';

        console.log(`[ATTENDANCE ATTEMPT] IP: ${ipAddress} | Student: ${studentId} | Session: ${sessionId}`);

        // 3️⃣ QR Code Session Security (Backend Validation)
        const activeSession = await Session.findOne({ sessionId: sessionId });

        // Check if session exists
        if (!activeSession) {
            return res.status(404).json({
                status: 'error',
                message: 'Invalid Session ID. This session does not exist.'
            });
        }

        // Check if QR code / session is expired (5-10 minutes constraint)
        if (new Date() > new Date(activeSession.expiresAt)) {
            return res.status(403).json({
                status: 'error',
                message: 'QR code expired. Please scan a new code.'
            });
        }

        // 2️⃣ Duplicate Student ID Protection
        const existingStudent = await Attendance.findOne({ studentId, sessionId });
        if (existingStudent) {
            return res.status(409).json({
                status: 'error',
                message: 'Attendance already marked for this Student ID.'
            });
        }

        // 1️⃣ IP-Based Restriction (One IP per session = One vote per session)
        const existingIP = await Attendance.findOne({ ipAddress: ipAddress, sessionId: sessionId });
        if (existingIP) {
            return res.status(429).json({
                status: 'error',
                message: 'You have already marked your attendance.' // Protect against proxy IP cheating
            });
        }

        // 5️⃣ Store Data in MongoDB
        const attendanceRecord = new Attendance({
            studentId,
            studentName,
            sessionId,
            ipAddress,
            userAgent,
            deviceFingerprint // Optional layer for fingerprint tracking
        });

        await attendanceRecord.save();

        return res.status(201).json({
            status: 'success',
            message: 'Attendance securely logged!',
            data: {
                studentId: attendanceRecord.studentId,
                sessionId: attendanceRecord.sessionId,
            }
        });

    } catch (error) {
        console.error(`[ATTENDANCE ERROR] ${error.message}`);
        // If we're relying entirely on DB indices (MongoDB enforcing unique IP & student ID constraints natively)
        if (error.code === 11000) {
            if (error.message.includes('studentId_1_sessionId_1')) {
                return res.status(409).json({ status: 'error', message: 'Attendance already marked for this Student ID.' });
            } else if (error.message.includes('ipAddress_1_sessionId_1')) {
                return res.status(429).json({ status: 'error', message: 'You have already marked your attendance.' });
            }
        }

        return res.status(500).json({ status: 'error', message: 'Server error while processing attendance.' });
    }
};
