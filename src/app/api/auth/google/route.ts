import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { getUserByEmail, createUser } from '@/lib/db';
import { createToken, hashPassword } from '@/lib/auth';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
    try {
        const { credential } = await request.json();

        if (!credential) {
            return NextResponse.json({ error: 'Google credential is required' }, { status: 400 });
        }

        // Verify the Google token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return NextResponse.json({ error: 'Invalid Google token payload' }, { status: 400 });
        }

        const { email, name, picture } = payload;

        // Check if user exists
        let user = await getUserByEmail(email);

        // If user doesn't exist, create a new one with a random secure password
        if (!user) {
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const hashedPassword = hashPassword(randomPassword);
            const userName = name || email.split('@')[0];

            user = await createUser(uuid(), userName, email, hashedPassword);
        }

        // Generate our standard app token
        const token = await createToken(user.id, user.email, user.name);

        const response = NextResponse.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role, picture },
            message: 'Google Login successful'
        });

        // Set the same cookie as normal login
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Google Auth error:', error);
        return NextResponse.json({ error: 'Google authentication failed' }, { status: 500 });
    }
}
