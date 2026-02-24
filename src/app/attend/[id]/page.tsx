'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface SessionInfo {
    id: string;
    title: string;
    description: string;
    status: string;
    expires_at: string | null;
}

export default function AttendPage() {
    const params = useParams();
    const sessionId = params.id as string;
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [studentName, setStudentName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/sessions/${sessionId}`);
                if (res.ok) {
                    const data = await res.json();
                    setSession(data.session);
                }
            } catch { } finally {
                setLoading(false);
            }
        })();
    }, [sessionId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const API_URL = process.env.NEXT_PUBLIC_SECURE_API_URL || 'http://localhost:5000';

            // Generate basic frontend fingerprint
            const rawFingerprint = navigator.userAgent + (window.screen ? window.screen.width : '');
            const deviceFingerprint = btoa(rawFingerprint);

            const res = await fetch(`${API_URL}/api/v1/attendance/mark`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentName,
                    studentId,
                    sessionId,
                    deviceFingerprint
                }),
            });

            // Parse response body safely whether success or error
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.message || data.error || 'Failed to mark attendance. Session may be invalid or you already scanned it.');
                return; // Stop execution, do NOT set success
            }

            setSuccess(true);
        } catch (err) {
            console.error(err);
            setError('Network error. Ensure you are connected and the session is active.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading session...</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="attend-page">
                <div className="attend-card text-center">
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>❌</div>
                    <h1>Session Not Found</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                        This attendance session does not exist or has been deleted.
                    </p>
                    <Link href="/" className="btn btn-primary mt-24" style={{ display: 'inline-flex' }}>
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="attend-page">
                <div className="attend-card text-center">
                    <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
                    <h1 style={{ color: 'var(--accent-success)' }}>Attendance Marked!</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '1.05rem' }}>
                        Your attendance for <strong>{session.title}</strong> has been recorded successfully.
                    </p>
                    <div style={{
                        marginTop: 24,
                        padding: 16,
                        background: 'var(--bg-glass)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                    }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <strong>{studentName}</strong> • ID: {studentId}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            {new Date().toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="attend-page">
            <div className="attend-card">
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Link href="/" className="navbar-brand" style={{ justifyContent: 'center', display: 'flex', marginBottom: 20 }}>
                        <span className="brand-icon">📋</span>
                        <span>AttendX</span>
                    </Link>
                    <h1>Mark Attendance</h1>
                    <p className="session-title">{session.title}</p>
                    {session.description && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{session.description}</p>
                    )}
                </div>

                {session.status !== 'active' && (
                    <div className="alert alert-error" style={{ textAlign: 'center' }}>
                        This session is no longer accepting attendance.
                    </div>
                )}

                {session.status === 'active' && (
                    <>
                        {error && <div className="alert alert-error">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label htmlFor="student-name">Your Name</label>
                                <input
                                    id="student-name"
                                    className="input"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="input-group" style={{ marginTop: 16 }}>
                                <label htmlFor="student-id">Student ID / Roll Number</label>
                                <input
                                    id="student-id"
                                    className="input"
                                    type="text"
                                    placeholder="Enter your student ID"
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary w-full"
                                style={{ marginTop: 24 }}
                                disabled={submitting}
                            >
                                {submitting ? 'Marking Attendance...' : '✅ Mark My Attendance'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
