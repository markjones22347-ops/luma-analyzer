import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Luma - Lua Script Analyzer',
  description: 'AI-powered Lua script security analysis. Detect malicious patterns, obfuscation, and security risks.',
  keywords: ['lua', 'security', 'malware', 'script analysis', 'roblox', 'code scanner'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
