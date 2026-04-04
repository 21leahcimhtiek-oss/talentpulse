import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'TalentPulse', template: '%s | TalentPulse' },
  description: 'Performance management that runs on data, not gut feel. AI-driven OKR tracking, bias detection, and coaching suggestions.',
  keywords: ['performance management', 'OKR tracking', 'HR analytics', 'AI coaching', '360 feedback'],
  openGraph: {
    title: 'TalentPulse',
    description: 'AI-driven employee performance analytics and OKR tracking.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}