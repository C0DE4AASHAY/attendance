import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getSessionById, getAttendeesBySession, updateSessionStatus, deleteSession } from '@/lib/db';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getSessionById(id);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const attendeesList = await getAttendeesBySession(id);

    return NextResponse.json({ session, attendees: attendeesList });
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await getSessionById(id);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.creator_id !== user.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { status } = await request.json();
    if (status) {
        await updateSessionStatus(id, status);
    }

    const updated = await getSessionById(id);
    return NextResponse.json({ session: updated });
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await getSessionById(id);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.creator_id !== user.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await deleteSession(id);
    return NextResponse.json({ message: 'Session deleted' });
}
