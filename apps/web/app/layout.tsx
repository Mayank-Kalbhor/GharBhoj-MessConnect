import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

let DevAuthSwitcher: React.ComponentType | null = null;
if (
  process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === 'true'
) {
  DevAuthSwitcher = require('@/components/shared/DevAuthSwitcher').DevAuthSwitcher;
}

export const metadata: Metadata = {
  title: 'GharBhoj (MessConnect) — Home-Cooked Daily Mess Platform',
  description: 'Connect with hygienic, authentic daily messes in Indore. Flexible subscriptions, daily menu cutoffs, and transparent kitchen capacities.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg-screen text-text-primary antialiased">
        <AuthProvider>
          {children}
          {DevAuthSwitcher && <DevAuthSwitcher />}
        </AuthProvider>
      </body>
    </html>
  );
}
