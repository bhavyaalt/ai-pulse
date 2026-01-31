import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Pulse | Daily AI News',
  description: 'Curated AI news, summarized by AI. Stay updated on what\'s happening in the AI world.',
  openGraph: {
    title: 'AI Pulse',
    description: 'Daily AI news, curated and summarized',
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
