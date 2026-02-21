import { SignJWT, jwtVerify } from 'jose';
import { hashSync, compareSync } from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'attendance-tracker-super-secret-key-2024'
);

export async function createToken(userId: string, email: string, name: string): Promise<string> {
    return new SignJWT({ userId, email, name })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .setIssuedAt()
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string; name: string } | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as { userId: string; email: string; name: string };
    } catch {
        return null;
    }
}

export function hashPassword(password: string): string {
    return hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
    return compareSync(password, hash);
}

export async function getAuthUser(): Promise<{ userId: string; email: string; name: string } | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return null;
    return verifyToken(token);
}
