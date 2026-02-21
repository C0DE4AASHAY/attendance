'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement
);

interface AnalyticsData {
    overview: {
        totalSessions: number;
        totalAttendees: number;
        activeSessions: number;
        avgAttendance: number;
    };
    sessions: {
        id: string;
        title: string;
        attendeeCount: number;
        status: string;
        createdAt: string;
    }[];
    dailyTrend: { date: string; count: number }[];
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/analytics');
                if (!res.ok) { router.push('/login'); return; }
                const analytics = await res.json();
                setData(analytics);
            } catch {
                router.push('/login');
            } finally {
                setLoading(false);
            }
        })();
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (!data) return null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#a0a0b8', font: { family: 'Inter' } },
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#a0a0b8', font: { family: 'Inter' } },
                beginAtZero: true,
            },
        },
    };

    const lineData = {
        labels: data.dailyTrend.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
            label: 'Check-ins',
            data: data.dailyTrend.map(d => d.count),
            borderColor: '#6c63ff',
            backgroundColor: 'rgba(108, 99, 255, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#6c63ff',
        }],
    };

    const barData = {
        labels: data.sessions.slice(0, 10).map(s => s.title.length > 20 ? s.title.slice(0, 20) + '...' : s.title),
        datasets: [{
            label: 'Attendees',
            data: data.sessions.slice(0, 10).map(s => s.attendeeCount),
            backgroundColor: data.sessions.slice(0, 10).map((_, i) =>
                `hsla(${240 + i * 15}, 70%, 65%, 0.7)`
            ),
            borderRadius: 8,
        }],
    };

    const activeCount = data.sessions.filter(s => s.status === 'active').length;
    const closedCount = data.sessions.filter(s => s.status === 'closed').length;
    const doughnutData = {
        labels: ['Active', 'Closed'],
        datasets: [{
            data: [activeCount, closedCount],
            backgroundColor: ['rgba(0, 212, 170, 0.8)', 'rgba(255, 107, 107, 0.8)'],
            borderWidth: 0,
        }],
    };

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
                        <Link href="/dashboard/analytics" className="active">Analytics</Link>
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            </nav>

            <div className="page-container">
                <div className="container">
                    <div className="dashboard-header">
                        <div>
                            <h1>📊 Analytics</h1>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Track attendance trends and insights</p>
                        </div>
                    </div>

                    {/* Overview stats */}
                    <div className="grid-4 mb-32">
                        <div className="stats-card">
                            <div className="stats-value">{data.overview.totalSessions}</div>
                            <div className="stats-label">Total Sessions</div>
                        </div>
                        <div className="stats-card">
                            <div className="stats-value">{data.overview.totalAttendees}</div>
                            <div className="stats-label">Total Check-ins</div>
                        </div>
                        <div className="stats-card">
                            <div className="stats-value">{data.overview.activeSessions}</div>
                            <div className="stats-label">Active Sessions</div>
                        </div>
                        <div className="stats-card">
                            <div className="stats-value">{data.overview.avgAttendance}</div>
                            <div className="stats-label">Avg Attendance</div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid-2 mb-32">
                        <div className="chart-container">
                            <h3>📈 Daily Attendance Trend</h3>
                            <div style={{ height: 300 }}>
                                {data.dailyTrend.length > 0 ? (
                                    <Line data={lineData} options={chartOptions} />
                                ) : (
                                    <div className="empty-state" style={{ padding: 32 }}>
                                        <p>No attendance data yet. Create sessions and start tracking!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="chart-container">
                            <h3>📊 Session Status</h3>
                            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {data.sessions.length > 0 ? (
                                    <Doughnut
                                        data={doughnutData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                    labels: { color: '#a0a0b8', font: { family: 'Inter' }, padding: 20 },
                                                },
                                            },
                                        }}
                                    />
                                ) : (
                                    <div className="empty-state" style={{ padding: 32 }}>
                                        <p>No sessions created yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="chart-container mb-32">
                        <h3>👥 Attendees per Session</h3>
                        <div style={{ height: 350 }}>
                            {data.sessions.length > 0 ? (
                                <Bar data={barData} options={chartOptions} />
                            ) : (
                                <div className="empty-state" style={{ padding: 32 }}>
                                    <p>No session data available yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
