'use client';

import Link from 'next/link';

export default function HomePage() {
    return (
        <main>
            {/* Navbar */}
            <nav className="navbar">
                <div className="container">
                    <Link href="/" className="navbar-brand">
                        <span className="brand-icon">📋</span>
                        <span>AttendX</span>
                    </Link>
                    <div className="navbar-links">
                        <Link href="/login">Login</Link>
                        <Link href="/login" className="btn btn-primary btn-sm">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-badge">
                        ⚡ Real-time Cloud Attendance
                    </div>
                    <h1>
                        Track Attendance<br />
                        <span className="gradient-text">Effortlessly</span>
                    </h1>
                    <p>
                        Generate QR codes, let students check in from their phones, and watch attendance appear in real-time. Powerful analytics at your fingertips.
                    </p>
                    <div className="hero-actions">
                        <Link href="/login" className="btn btn-primary btn-lg">
                            🚀 Start Tracking
                        </Link>
                        <a href="#features" className="btn btn-secondary btn-lg">
                            Learn More →
                        </a>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="features-section">
                <div className="container">
                    <h2>Why <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #6c63ff 0%, #00d4aa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AttendX</span>?</h2>
                    <p className="section-subtitle">
                        Everything you need to modernize attendance tracking in one beautiful platform.
                    </p>
                    <div className="grid-3">
                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: 'rgba(108, 99, 255, 0.15)' }}>
                                📱
                            </div>
                            <h3>QR Code Check-in</h3>
                            <p>Generate unique QR codes for each session. Students scan with their phone camera — no app needed.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: 'rgba(0, 212, 170, 0.15)' }}>
                                ⚡
                            </div>
                            <h3>Real-time Updates</h3>
                            <p>Watch attendance appear instantly as students check in. Live feed powered by server-sent events.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: 'rgba(255, 159, 67, 0.15)' }}>
                                📊
                            </div>
                            <h3>Analytics Dashboard</h3>
                            <p>Track trends, view attendance rates, and export data. Beautiful charts for data-driven insights.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: 'rgba(255, 107, 107, 0.15)' }}>
                                🔒
                            </div>
                            <h3>Secure & Private</h3>
                            <p>JWT authentication, session expiry controls, and duplicate prevention keep your data safe.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: 'rgba(108, 99, 255, 0.15)' }}>
                                📲
                            </div>
                            <h3>Mobile Optimized</h3>
                            <p>Beautiful on every screen. Students can check in from any device — phones, tablets, or desktops.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: 'rgba(0, 212, 170, 0.15)' }}>
                                ⏱️
                            </div>
                            <h3>Session Controls</h3>
                            <p>Set expiry times, close sessions, and manage who can check in. Full control at your fingertips.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '40px 0',
                textAlign: 'center',
                borderTop: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
            }}>
                <div className="container">
                    <p>AttendX — Smart Attendance Tracking System</p>
                </div>
            </footer>
        </main>
    );
}
