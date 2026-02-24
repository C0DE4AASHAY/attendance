import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getSessionById, getAttendeeCount, updateSessionStatus, deleteSession } from '@/lib/db';

export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getSessionById(params.id);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // The dashboard frontend relies on an array of attendees to map over. 
    // We must return the actual rows, not just a count object.
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    const { data: attendeesList } = await supabase
        .from('attendees')
        .select('*')
        .eq('session_id', params.id)
        .order('marked_at', { ascending: false });

    return NextResponse.json({ session, attendees: attendeesList || [] });
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await getSessionById(params.id);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.creator_id !== user.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { status } = await request.json();
    if (status) {
        await updateSessionStatus(params.id, status);
    }

    const updated = await getSessionById(params.id);
    return NextResponse.json({ session: updated });
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await getSessionById(params.id);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.creator_id !== user.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await deleteSession(params.id);
    return NextResponse.json({ message: 'Session deleted' });
}
