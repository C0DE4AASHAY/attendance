import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'attendance.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        initTables(db);
    }
    return db;
}

function initTables(db: Database.Database) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'teacher',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      creator_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendees (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      student_id TEXT NOT NULL,
      marked_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      UNIQUE(session_id, student_id)
    );
  `);
}

// --- User helpers ---
export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    created_at: string;
}

export function createUser(id: string, name: string, email: string, hashedPassword: string): User {
    const db = getDb();
    db.prepare(
        'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)'
    ).run(id, name, email, hashedPassword);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User;
}

export function getUserByEmail(email: string): User | undefined {
    return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
}

export function getUserById(id: string): User | undefined {
    return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
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

export function createSession(id: string, title: string, description: string, creatorId: string, expiresAt: string | null): Session {
    const db = getDb();
    db.prepare(
        'INSERT INTO sessions (id, title, description, creator_id, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, title, description, creatorId, expiresAt);
    return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session;
}

export function getSessionsByCreator(creatorId: string): Session[] {
    return getDb().prepare('SELECT * FROM sessions WHERE creator_id = ? ORDER BY created_at DESC').all(creatorId) as Session[];
}

export function getSessionById(id: string): Session | undefined {
    return getDb().prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session | undefined;
}

export function updateSessionStatus(id: string, status: string) {
    getDb().prepare('UPDATE sessions SET status = ? WHERE id = ?').run(status, id);
}

export function deleteSession(id: string) {
    getDb().prepare('DELETE FROM sessions WHERE id = ?').run(id);
}

// --- Attendee helpers ---
export interface Attendee {
    id: string;
    session_id: string;
    student_name: string;
    student_id: string;
    marked_at: string;
}

export function markAttendance(id: string, sessionId: string, studentName: string, studentId: string): Attendee {
    const db = getDb();
    db.prepare(
        'INSERT INTO attendees (id, session_id, student_name, student_id) VALUES (?, ?, ?, ?)'
    ).run(id, sessionId, studentName, studentId);
    return db.prepare('SELECT * FROM attendees WHERE id = ?').get(id) as Attendee;
}

export function getAttendeesBySession(sessionId: string): Attendee[] {
    return getDb().prepare('SELECT * FROM attendees WHERE session_id = ? ORDER BY marked_at DESC').all(sessionId) as Attendee[];
}

export function getAttendeeCount(sessionId: string): number {
    const row = getDb().prepare('SELECT COUNT(*) as count FROM attendees WHERE session_id = ?').get(sessionId) as { count: number };
    return row.count;
}

export function isAlreadyMarked(sessionId: string, studentId: string): boolean {
    const row = getDb().prepare('SELECT id FROM attendees WHERE session_id = ? AND student_id = ?').get(sessionId, studentId);
    return !!row;
}

// --- Analytics helpers ---
export function getTotalSessions(creatorId: string): number {
    const row = getDb().prepare('SELECT COUNT(*) as count FROM sessions WHERE creator_id = ?').get(creatorId) as { count: number };
    return row.count;
}

export function getTotalAttendees(creatorId: string): number {
    const row = getDb().prepare(`
    SELECT COUNT(*) as count FROM attendees a 
    JOIN sessions s ON a.session_id = s.id 
    WHERE s.creator_id = ?
  `).get(creatorId) as { count: number };
    return row.count;
}

export function getSessionsWithCounts(creatorId: string): (Session & { attendee_count: number })[] {
    return getDb().prepare(`
    SELECT s.*, COUNT(a.id) as attendee_count 
    FROM sessions s 
    LEFT JOIN attendees a ON s.id = a.session_id 
    WHERE s.creator_id = ? 
    GROUP BY s.id 
    ORDER BY s.created_at DESC
  `).all(creatorId) as (Session & { attendee_count: number })[];
}

export function getDailyAttendanceTrend(creatorId: string): { date: string; count: number }[] {
    return getDb().prepare(`
    SELECT DATE(a.marked_at) as date, COUNT(*) as count 
    FROM attendees a 
    JOIN sessions s ON a.session_id = s.id 
    WHERE s.creator_id = ? 
    GROUP BY DATE(a.marked_at) 
    ORDER BY date DESC 
    LIMIT 14
  `).all(creatorId) as { date: string; count: number }[];
}
