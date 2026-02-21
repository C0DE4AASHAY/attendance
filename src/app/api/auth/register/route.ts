import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { createUser, getUserByEmail } from '@/lib/db';
import { hashPassword, createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
        }

        const existing = getUserByEmail(email);
        if (existing) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }

        const hashed = hashPassword(password);
        const user = createUser(uuid(), name, email, hashed);
        const token = await createToken(user.id, user.email, user.name);

        const response = NextResponse.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            message: 'Registration successful'
        });

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}
