import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'TalentPulse',
    template: '%s | TalentPulse',
  },
  description: 'Performance management that runs on data, not gut feel.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://talentpulse.vercel.app'),
  openGraph: {
    title: 'TalentPulse',
    description: 'AI-powered employee performance analytics for modern HR teams.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}