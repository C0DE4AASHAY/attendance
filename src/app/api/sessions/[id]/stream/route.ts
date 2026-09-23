import { NextRequest } from 'next/server';
import { getSessionById, getAttendeesBySession } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getSessionById(id);
    if (!session) {
        return new Response('Session not found', { status: 404 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {

            // Helper function to fetch latest attendees
            const fetchAttendees = async () => {
                return await getAttendeesBySession(id);
            };

            // Send initial attendees
            try {
                const attendees = await fetchAttendees();
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'init', attendees })}\n\n`)
                );
            } catch (err) {
                console.error("Stream init error", err);
            }

            // Poll for updates every 3 seconds (async safe for Supabase)
            const interval = setInterval(async () => {
                try {
                    const currentAttendees = await fetchAttendees();
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: 'update', attendees: currentAttendees })}\n\n`)
                    );
                } catch {
                    clearInterval(interval);
                    controller.close();
                }
            }, 3000);

            // Clean up on close
            _request.signal.addEventListener('abort', () => {
                clearInterval(interval);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        },
    });
}
