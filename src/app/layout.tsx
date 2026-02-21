import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'AttendX — Smart Attendance Tracking',
    description: 'Cloud-based real-time attendance tracking with QR codes, mobile check-in, and analytics dashboard.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
