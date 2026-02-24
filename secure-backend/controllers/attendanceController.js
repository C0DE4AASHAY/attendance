const supabase = require('../config/supabaseClient');

// Mark attendance
exports.markAttendance = async (req, res) => {
    try {
        const { studentId, studentName, sessionId, deviceFingerprint } = req.body;

        // Retrieve IP Address from Express req (Works securely behind proxies using trust proxy)
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'Unknown User-Agent';

        console.log(`[ATTENDANCE ATTEMPT] IP: ${ipAddress} | Student: ${studentId} | Session: ${sessionId}`);

        // 3️⃣ QR Code Session Security (Backend Validation)
        const { data: activeSession, error: sessionError } = await supabase
            .from('sessions')
            .select('*')
            .eq('sessionId', sessionId)
            .single();

        // Check if session exists
        if (sessionError || !activeSession) {
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
        const { data: existingStudent, error: studentError } = await supabase
            .from('attendance')
            .select('id')
            .eq('studentId', studentId)
            .eq('sessionId', sessionId)
            .maybeSingle();

        if (existingStudent) {
            return res.status(409).json({
                status: 'error',
                message: 'Attendance already marked for this Student ID.'
            });
        }

        // 1️⃣ IP-Based Restriction (One IP per session = One vote per session)
        const { data: existingIP, error: ipError } = await supabase
            .from('attendance')
            .select('id')
            .eq('ipAddress', ipAddress)
            .eq('sessionId', sessionId)
            .maybeSingle();

        if (existingIP) {
            return res.status(429).json({
                status: 'error',
                message: 'You have already marked your attendance.' // Protect against proxy IP cheating
            });
        }

        // 5️⃣ Store Data in Supabase
        const { data: attendanceRecord, error: insertError } = await supabase
            .from('attendance')
            .insert([
                {
                    studentId,
                    studentName,
                    sessionId,
                    ipAddress,
                    userAgent,
                    deviceFingerprint // Optional layer for fingerprint tracking
                }
            ])
            .select();

        if (insertError) {
            throw insertError;
        }

        return res.status(201).json({
            status: 'success',
            message: 'Attendance securely logged!',
            data: {
                studentId: attendanceRecord[0].studentId,
                sessionId: attendanceRecord[0].sessionId,
            }
        });

    } catch (error) {
        console.error(`[ATTENDANCE ERROR] ${error.message}`);
        // Handle specific Supabase unique constraint errors (e.g. 23505) if db triggers first
        if (error.code === '23505') {
            // Note: To map specific constraints perfectly, we usually rely on the explicit selects above, 
            // but as a fallback, we catch the unique violation.
            return res.status(409).json({ status: 'error', message: 'Attendance already marked (Database unique constraint).' });
        }

        return res.status(500).json({ status: 'error', message: 'Server error while processing attendance.' });
    }
};
