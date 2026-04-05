import type { Metadata } from 'next';
import './globals.css';

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
      <body style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
