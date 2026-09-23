import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { getAuthUser } from '@/lib/auth';
import { createSession, getSessionsWithCounts, updateSessionStatus } from '@/lib/db';

export async function GET() {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionsWithCounts = await getSessionsWithCounts(user.userId);

    // Auto-expire any sessions that have passed their expiry time
    const now = new Date();
    for (const session of sessionsWithCounts) {
        if (session.status === 'active' && session.expires_at && now > new Date(session.expires_at)) {
            await updateSessionStatus(session.id, 'expired');
            session.status = 'expired';
        }
    }

    return NextResponse.json({ sessions: sessionsWithCounts });
}

export async function POST(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { title, description, expiresInMinutes } = await request.json();

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        let expiresAt: string | null = null;
        if (expiresInMinutes) {
            const expiry = new Date(Date.now() + expiresInMinutes * 60 * 1000);
            expiresAt = expiry.toISOString();
        }

        const session = await createSession(uuid(), title, description || '', user.userId, expiresAt);
        return NextResponse.json({ session }, { status: 201 });
    } catch (error) {
        console.error('Create session error:', error);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
}
