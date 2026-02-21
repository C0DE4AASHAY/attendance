'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Session {
    id: string;
    title: string;
    description: string;
    status: string;
    attendee_count: number;
    created_at: string;
    expires_at: string | null;
}

interface UserInfo {
    userId: string;
    email: string;
    name: string;
}

export default function DashboardPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newExpiry, setNewExpiry] = useState('60');
    const [creating, setCreating] = useState(false);
    const router = useRouter();

    const fetchData = useCallback(async () => {
        try {
            const [userRes, sessionsRes] = await Promise.all([
                fetch('/api/auth/me'),
                fetch('/api/sessions'),
            ]);

            if (!userRes.ok) {
                router.push('/login');
                return;
            }

            const userData = await userRes.json();
            const sessionsData = await sessionsRes.json();
            setUser(userData.user);
            setSessions(sessionsData.sessions || []);
        } catch {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    description: newDesc,
                    expiresInMinutes: parseInt(newExpiry) || null,
                }),
            });
            if (res.ok) {
                setShowModal(false);
                setNewTitle('');
                setNewDesc('');
                setNewExpiry('60');
                fetchData();
            }
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    const activeSessions = sessions.filter(s => s.status === 'active');
    const totalAttendees = sessions.reduce((sum, s) => sum + s.attendee_count, 0);

    return (
        <>
            <nav className="navbar">
                <div className="container">
                    <Link href="/dashboard" className="navbar-brand">
                        <span className="brand-icon">📋</span>
                        <span>AttendX</span>
                    </Link>
                    <div className="navbar-links">
                        <Link href="/dashboard" className="active">Dashboard</Link>
                        <Link href="/dashboard/analytics">Analytics</Link>
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            </nav>

            <div className="page-container">
                <div className="container">
                    <div className="dashboard-header">
                        <div>
                            <h1>Welcome, {user?.name} 👋</h1>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Manage your attendance sessions</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            ➕ New Session
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid-4 mb-32">
                        <div className="stats-card">
                            <div className="stats-value">{sessions.length}</div>
                            <div className="stats-label">Total Sessions</div>
                        </div>
                        <div className="stats-card">
                            <div className="stats-value">{activeSessions.length}</div>
                            <div className="stats-label">Active Sessions</div>
                        </div>
                        <div className="stats-card">
                            <div className="stats-value">{totalAttendees}</div>
                            <div className="stats-label">Total Check-ins</div>
                        </div>
                        <div className="stats-card">
                            <div className="stats-value">{sessions.length > 0 ? Math.round(totalAttendees / sessions.length) : 0}</div>
                            <div className="stats-label">Avg per Session</div>
                        </div>
                    </div>

                    {/* Sessions list */}
                    <h2 className="section-title">Your Sessions</h2>
                    {sessions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <h3>No sessions yet</h3>
                            <p>Create your first attendance session to get started.</p>
                            <button className="btn btn-primary mt-16" onClick={() => setShowModal(true)}>
                                ➕ Create Session
                            </button>
                        </div>
                    ) : (
                        <div className="grid-2">
                            {sessions.map((session) => (
                                <Link href={`/dashboard/sessions/${session.id}`} key={session.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="session-card">
                                        <div className="session-header">
                                            <h3>{session.title}</h3>
                                            <span className={`session-status ${session.status}`}>
                                                {session.status}
                                            </span>
                                        </div>
                                        {session.description && (
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 12 }}>
                                                {session.description}
                                            </p>
                                        )}
                                        <div className="session-meta">
                                            <span>👥 {session.attendee_count} attendees</span>
                                            <span>📅 {new Date(session.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Session Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className="modal">
                        <h2>Create New Session</h2>
                        <form onSubmit={handleCreateSession}>
                            <div className="input-group">
                                <label htmlFor="session-title">Session Title</label>
                                <input
                                    id="session-title"
                                    className="input"
                                    type="text"
                                    placeholder="e.g., CS101 — Lecture 5"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="session-desc">Description (optional)</label>
                                <input
                                    id="session-desc"
                                    className="input"
                                    type="text"
                                    placeholder="Brief description..."
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="session-expiry">Auto-expire after (minutes)</label>
                                <input
                                    id="session-expiry"
                                    className="input"
                                    type="number"
                                    placeholder="60"
                                    value={newExpiry}
                                    onChange={(e) => setNewExpiry(e.target.value)}
                                    min="1"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? 'Creating...' : 'Create Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
