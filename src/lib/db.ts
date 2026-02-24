import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client for Frontend Next.js API
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- User helpers ---
export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    created_at: string;
}

export async function createUser(id: string, name: string, email: string, hashedPassword: string): Promise<User> {
    const { data, error } = await supabase
        .from('users')
        .insert([{ id, name, email, password: hashedPassword, role: 'teacher' }])
        .select()
        .single();

    if (error) throw error;
    return data as User;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (error) {
        console.error('Supabase getUserByEmail error:', error);
        return undefined;
    }
    return data || undefined;
}

export async function getUserById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        console.error('Supabase getUserById error:', error);
        return undefined;
    }
    return data || undefined;
}

// --- Session helpers ---
export interface Session {
    id: string;
    title: string;
    description: string;
    creator_id: string;
    status: string;
    expires_at: string | null;
    created_at: string;
}

export async function createSession(id: string, title: string, description: string, creatorId: string, expiresAt: string | null): Promise<Session> {
    const { data, error } = await supabase
        .from('sessions_dashboard') // Different from your backend table just for Next.js dashboards
        .insert([{
            id,
            title,
            description,
            creator_id: creatorId,
            expires_at: expiresAt,
            status: 'active'
        }])
        .select()
        .single();

    if (error) throw error;
    return data as Session;
}

export async function getSessionsByCreator(creatorId: string): Promise<Session[]> {
    const { data, error } = await supabase
        .from('sessions_dashboard')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase getSessionsByCreator error:', error);
        return [];
    }
    return data || [];
}

export async function getSessionById(id: string): Promise<Session | undefined> {
    const { data, error } = await supabase
        .from('sessions_dashboard')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        console.error('Supabase getSessionById error:', error);
        return undefined;
    }
    return data || undefined;
}

export async function updateSessionStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
        .from('sessions_dashboard')
        .update({ status })
        .eq('id', id);

    if (error) throw error;
}

export async function deleteSession(id: string): Promise<void> {
    const { error } = await supabase
        .from('sessions_dashboard')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// --- Attendee helpers ---
export interface Attendee {
    id: string;
    session_id: string;
    student_name: string;
    student_id: string;
    marked_at: string;
}

// The dashboard creates local attendees, but external security checks happen differently.
export async function getAttendeeCount(sessionId: string): Promise<number> {
    const { count, error } = await supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

    if (error) return 0;
    return count || 0;
}

// --- Analytics helpers ---
export async function getTotalSessions(creatorId: string): Promise<number> {
    const { count, error } = await supabase
        .from('sessions_dashboard')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId);

    if (error) return 0;
    return count || 0;
}

// Helper to manually aggregate relations in Supabase
export async function getTotalAttendees(creatorId: string): Promise<number> {
    // 1. Get all session IDs for this creator
    const sessions = await getSessionsByCreator(creatorId);
    if (!sessions.length) return 0;

    const sessionIds = sessions.map(s => s.id);

    // 2. Count attendees in those sessions
    const { count, error } = await supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true })
        .in('session_id', sessionIds);

    if (error) return 0;
    return count || 0;
}

export async function getSessionsWithCounts(creatorId: string): Promise<(Session & { attendee_count: number })[]> {
    const sessions = await getSessionsByCreator(creatorId);
    const sessionsWithCounts = [];

    // Map manually due to NoSQL-like behavior in basic API calls
    for (const session of sessions) {
        const count = await getAttendeeCount(session.id);
        sessionsWithCounts.push({ ...session, attendee_count: count });
    }

    return sessionsWithCounts;
}

export async function getDailyAttendanceTrend(creatorId: string): Promise<{ date: string; count: number }[]> {
    // Basic aggregation proxy since group by isn't easily exposed in JS client without RPC
    const sessions = await getSessionsByCreator(creatorId);
    if (!sessions.length) return [];
    const sessionIds = sessions.map(s => s.id);

    const { data: attendees, error } = await supabase
        .from('attendees')
        .select('marked_at')
        .in('session_id', sessionIds)
        .order('marked_at', { ascending: false });

    if (error || !attendees) return [];

    const trendMap: Record<string, number> = {};

    attendees.forEach(a => {
        const dateStr = new Date(a.marked_at).toISOString().split('T')[0];
        trendMap[dateStr] = (trendMap[dateStr] || 0) + 1;
    });

    const result = Object.entries(trendMap)
        .map(([date, count]) => ({ date, count }))
        .slice(0, 14);

    return result;
}
