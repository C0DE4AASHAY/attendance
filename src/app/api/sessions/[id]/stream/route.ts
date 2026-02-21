import { NextRequest } from 'next/server';
import { getAttendeesBySession, getSessionById } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = getSessionById(params.id);
    if (!session) {
        return new Response('Session not found', { status: 404 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            // Send initial attendees
            const attendees = getAttendeesBySession(params.id);
            controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'init', attendees })}\n\n`)
            );

            // Poll for updates every 2 seconds
            const interval = setInterval(() => {
                try {
                    const currentAttendees = getAttendeesBySession(params.id);
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: 'update', attendees: currentAttendees })}\n\n`)
                    );
                } catch {
                    clearInterval(interval);
                    controller.close();
                }
            }, 2000);

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
        },
    });
}
