import { SignJWT, jwtVerify } from 'jose';
import { hashSync, compareSync } from 'bcryptjs';
import { cookies } from 'next/headers';


// Lazy initialization — deferred to runtime so the build doesn't crash
// when JWT_SECRET is not yet set in the environment.
let _jwtSecret: Uint8Array | null = null;
function getJWTSecret(): Uint8Array {
    if (!_jwtSecret) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET environment variable is not set!");
        }
        _jwtSecret = new TextEncoder().encode(secret);
    }
    return _jwtSecret;
}



export async function createToken(userId: string, email: string, name: string): Promise<string> {
    return new SignJWT({ userId, email, name })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .setIssuedAt()
        .sign(getJWTSecret());
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string; name: string } | null> {
    try {
        const { payload } = await jwtVerify(token, getJWTSecret());
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
