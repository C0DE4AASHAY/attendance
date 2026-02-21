import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getSessionById, getAttendeesBySession, updateSessionStatus, deleteSession } from '@/lib/db';

export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = getSessionById(params.id);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const attendees = getAttendeesBySession(params.id);
    return NextResponse.json({ session, attendees });
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = getSessionById(params.id);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.creator_id !== user.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { status } = await request.json();
    if (status) {
        updateSessionStatus(params.id, status);
    }

    const updated = getSessionById(params.id);
    return NextResponse.json({ session: updated });
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = getSessionById(params.id);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.creator_id !== user.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    deleteSession(params.id);
    return NextResponse.json({ message: 'Session deleted' });
}
