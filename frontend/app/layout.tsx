import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ReachInbox — Email Job Scheduler',
  description:
    'Production-grade email scheduling platform powered by BullMQ, Redis, and Ethereal SMTP. Schedule, track, and manage email campaigns at scale.',
  keywords: ['email scheduler', 'bulk email', 'BullMQ', 'cold email', 'ReachInbox'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-inter antialiased">{children}</body>
    </html>
  );
}
