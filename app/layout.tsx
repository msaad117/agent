import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Voice Agent Platform',
  description: 'Create customizable voice agents powered by ElevenLabs and your own knowledge base.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
