import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getTotalSessions, getTotalAttendees, getSessionsWithCounts, getDailyAttendanceTrend } from '@/lib/db';

export async function GET() {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [totalSessions, totalAttendees, sessions, dailyTrend] = await Promise.all([
        getTotalSessions(user.userId),
        getTotalAttendees(user.userId),
        getSessionsWithCounts(user.userId),
        getDailyAttendanceTrend(user.userId)
    ]);

    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const avgAttendance = totalSessions > 0 ? Math.round(totalAttendees / totalSessions) : 0;

    return NextResponse.json({
        overview: {
            totalSessions,
            totalAttendees,
            activeSessions,
            avgAttendance,
        },
        sessions: sessions.map(s => ({
            id: s.id,
            title: s.title,
            attendeeCount: s.attendee_count,
            status: s.status,
            createdAt: s.created_at,
        })),
        dailyTrend: dailyTrend.reverse(),
    });
}
