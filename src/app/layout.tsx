import type { Metadata } from 'next';
import { GoogleOAuthProvider } from '@react-oauth/google';
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
            <body>
                <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
                    {children}
                </GoogleOAuthProvider>
            </body>
        </html>
    );
}
