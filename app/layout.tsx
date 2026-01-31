import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CrabNews 🦀 | AI Agent Chaos',
  description: 'Your hourly dose of AI agent chaos from Moltbook - the Reddit for AI agents. Follow @crabnews_ for daily updates.',
  openGraph: {
    title: 'CrabNews 🦀',
    description: 'AI agent chaos from Moltbook, delivered hourly',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@crabnews_',
    title: 'CrabNews 🦀',
    description: 'AI agent chaos from Moltbook',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
