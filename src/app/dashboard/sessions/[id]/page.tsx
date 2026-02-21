'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';

interface Session {
    id: string;
    title: string;
    description: string;
    status: string;
    expires_at: string | null;
    created_at: string;
}

interface Attendee {
    id: string;
    student_name: string;
    student_id: string;
    marked_at: string;
}

export default function SessionDetailPage() {
    const params = useParams();
    const sessionId = params.id as string;
    const [session, setSession] = useState<Session | null>(null);
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [loading, setLoading] = useState(true);
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);
    const router = useRouter();

    const attendLink = typeof window !== 'undefined'
        ? `${window.location.origin}/attend/${sessionId}`
        : '';

    const fetchSession = useCallback(async () => {
        try {
            const res = await fetch(`/api/sessions/${sessionId}`);
            if (!res.ok) { router.push('/dashboard'); return; }
            const data = await res.json();
            setSession(data.session);
            setAttendees(data.attendees);
        } catch {
            router.push('/dashboard');
        } finally {
            setLoading(false);
        }
    }, [sessionId, router]);

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    // Generate QR code
    useEffect(() => {
        if (attendLink) {
            QRCode.toDataURL(attendLink, {
                width: 280,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' },
            }).then(setQrDataUrl).catch(console.error);
        }
    }, [attendLink]);

    // SSE for real-time updates
    useEffect(() => {
        if (!sessionId) return;

        const es = new EventSource(`/api/sessions/${sessionId}/stream`);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.attendees) {
                    setAttendees(data.attendees);
                }
            } catch { }
        };

        return () => {
            es.close();
        };
    }, [sessionId]);

    const handleCloseSession = async () => {
        await fetch(`/api/sessions/${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'closed' }),
        });
        fetchSession();
    };

    const handleReopenSession = async () => {
        await fetch(`/api/sessions/${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'active' }),
        });
        fetchSession();
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this session?')) return;
        await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
        router.push('/dashboard');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(attendLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading session...</p>
            </div>
        );
    }

    if (!session) return null;

    return (
        <>
            <nav className="navbar">
                <div className="container">
                    <Link href="/dashboard" className="navbar-brand">
                        <span className="brand-icon">📋</span>
                        <span>AttendX</span>
                    </Link>
                    <div className="navbar-links">
                        <Link href="/dashboard">Dashboard</Link>
                        <Link href="/dashboard/analytics">Analytics</Link>
                    </div>
                </div>
            </nav>

            <div className="page-container">
                <div className="container">
                    {/* Header */}
                    <div className="detail-header">
                        <div>
                            <Link href="/dashboard" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 8, display: 'inline-block' }}>
                                ← Back to Dashboard
                            </Link>
                            <h1>{session.title}</h1>
                            {session.description && (
                                <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{session.description}</p>
                            )}
                            <div style={{ display: 'flex', gap: 16, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span className={`session-status ${session.status}`} style={{
                                    padding: '6px 14px',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    background: session.status === 'active' ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255, 107, 107, 0.15)',
                                    color: session.status === 'active' ? 'var(--accent-success)' : 'var(--accent-danger)',
                                }}>
                                    {session.status}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    Created {new Date(session.created_at).toLocaleString()}
                                </span>
                                {session.expires_at && (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        Expires {new Date(session.expires_at).toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="detail-actions">
                            {session.status === 'active' ? (
                                <button className="btn btn-secondary btn-sm" onClick={handleCloseSession}>
                                    🔒 Close Session
                                </button>
                            ) : (
                                <button className="btn btn-secondary btn-sm" onClick={handleReopenSession}>
                                    🔓 Reopen Session
                                </button>
                            )}
                            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                                🗑️ Delete
                            </button>
                        </div>
                    </div>

                    <div className="detail-grid">
                        {/* Left: QR Code & Share Link */}
                        <div>
                            <div className="card" style={{ textAlign: 'center' }}>
                                <h3 style={{ marginBottom: 20, fontWeight: 700 }}>📱 QR Code</h3>
                                {qrDataUrl && (
                                    <div className="qr-container" style={{ margin: '0 auto' }}>
                                        <img src={qrDataUrl} alt="QR Code" style={{ width: 280, height: 280 }} />
                                    </div>
                                )}
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 16 }}>
                                    Students scan this to mark attendance
                                </p>
                                <div className="share-link">
                                    <input type="text" readOnly value={attendLink} />
                                    <button className="btn btn-sm btn-secondary" onClick={handleCopy}>
                                        {copied ? '✅ Copied!' : '📋 Copy'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right: Live Attendees */}
                        <div>
                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <h3 style={{ fontWeight: 700 }}>👥 Attendees ({attendees.length})</h3>
                                    {session.status === 'active' && (
                                        <div className="live-indicator">
                                            <span className="live-dot"></span>
                                            Live
                                        </div>
                                    )}
                                </div>

                                {attendees.length === 0 ? (
                                    <div className="empty-state" style={{ padding: 32 }}>
                                        <div className="empty-icon">⏳</div>
                                        <h3>Waiting for check-ins</h3>
                                        <p>Share the QR code or link with students</p>
                                    </div>
                                ) : (
                                    <ul className="attendee-list">
                                        {attendees.map((a) => (
                                            <li key={a.id} className="attendee-item">
                                                <div className="attendee-info">
                                                    <span className="attendee-name">{a.student_name}</span>
                                                    <span className="attendee-id">ID: {a.student_id}</span>
                                                </div>
                                                <span className="attendee-time">
                                                    {new Date(a.marked_at).toLocaleTimeString()}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
