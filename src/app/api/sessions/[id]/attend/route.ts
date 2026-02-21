import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { getSessionById, markAttendance, isAlreadyMarked } from '@/lib/db';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = getSessionById(params.id);
        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        if (session.status !== 'active') {
            return NextResponse.json({ error: 'This session is no longer accepting attendance' }, { status: 400 });
        }

        if (session.expires_at && new Date(session.expires_at) < new Date()) {
            return NextResponse.json({ error: 'This session has expired' }, { status: 400 });
        }

        const { studentName, studentId } = await request.json();

        if (!studentName || !studentId) {
            return NextResponse.json({ error: 'Student name and ID are required' }, { status: 400 });
        }

        if (isAlreadyMarked(params.id, studentId)) {
            return NextResponse.json({ error: 'Attendance already marked for this student ID' }, { status: 409 });
        }

        const attendee = markAttendance(uuid(), params.id, studentName, studentId);
        return NextResponse.json({ attendee, message: 'Attendance marked successfully' }, { status: 201 });
    } catch (error) {
        console.error('Attend error:', error);
        return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
    }
}
