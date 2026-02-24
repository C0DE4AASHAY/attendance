import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // Note: The frontend page `attend/[id]/page.tsx` now calls the Express external API directly.
    // This route is kept only as a fallback proxy if needed, but we pass it strictly to the new Secure API.
    try {
        const { studentName, studentId, deviceFingerprint } = await request.json();
        const API_URL = process.env.NEXT_PUBLIC_SECURE_API_URL || 'http://localhost:5000';

        const forwardReq = await fetch(`${API_URL}/api/v1/attendance/mark`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentName,
                studentId,
                sessionId: params.id,
                deviceFingerprint: deviceFingerprint || 'Unknown'
            })
        });

        const data = await forwardReq.json();

        return NextResponse.json(data, { status: forwardReq.status });
    } catch (error) {
        console.error('Attend error proxy:', error);
        return NextResponse.json({ error: 'Failed to proxy attendance to secure backend' }, { status: 500 });
    }
}
