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
            .from('sessions_dashboard')
            .select('*')
            .eq('id', sessionId)
            .single();

        // Check if session exists
        if (sessionError || !activeSession) {
            return res.status(404).json({
                status: 'error',
                message: 'Invalid Session ID. This session does not exist.'
            });
        }

        // Check if QR code / session is expired (5-10 minutes constraint)
        if (activeSession.expires_at && new Date() > new Date(activeSession.expires_at)) {
            return res.status(403).json({
                status: 'error',
                message: 'QR code expired. Please scan a new code.'
            });
        }

        // Next.js frontend table now expects `session_id` instead of `sessionId`
        // 2️⃣ Duplicate Student ID Protection & 1️⃣ IP-Based Restriction
        // Note: For full IP limits, we would need to add an IP address column to the attendees table, but for now we enforce student_id uniqueness

        const { data: existingStudent, error: studentError } = await supabase
            .from('attendees')
            .select('id')
            .eq('student_id', studentId)
            .eq('session_id', sessionId)
            .maybeSingle();

        if (existingStudent) {
            return res.status(409).json({
                status: 'error',
                message: 'Attendance already marked for this Student ID.'
            });
        }

        // 5️⃣ Store Data in Supabase
        const { data: attendanceRecord, error: insertError } = await supabase
            .from('attendees')
            .insert([
                {
                    student_id: studentId,
                    student_name: studentName,
                    session_id: sessionId,
                    // Note: If you want strict IP limitation you'd need to add `ipAddress` to the attendees schema.
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
