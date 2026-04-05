'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from '@/components/file-upload';
import { ScanResults } from '@/components/scan-results';
import { ScanningAnimation } from '@/components/scanning-animation';
import { ScanReport } from '@/types';
import { Shield, Github } from 'lucide-react';

const styles = {
  main: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
  },
  headerInner: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#ffffff',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'rgba(255, 255, 255, 0.6)',
    textDecoration: 'none',
    fontSize: '13px',
    cursor: 'pointer',
  },
  hero: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '48px 24px 32px',
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '32px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '12px',
  },
  subtitle: {
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 1.5,
  },
  mainArea: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '0 24px 48px',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  backButton: {
    display: 'block',
    width: '100%',
    padding: '12px',
    marginTop: '16px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    cursor: 'pointer',
  },
  errorBox: {
    marginTop: '16px',
    padding: '12px 16px',
    borderRadius: '6px',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    fontSize: '13px',
  },
  footer: {
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '24px',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.3)',
  },
};

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsScanning(true);
    setError(null);
    setReport(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to analyze script');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleCodePaste = useCallback(async (code: string) => {
    setIsScanning(true);
    setError(null);
    setReport(null);

    try {
      const formData = new FormData();
      formData.append('code', code);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to analyze script');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleDownloadReport = useCallback(() => {
    if (!report) return;

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luma-report-${report.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [report]);

  const resetScan = useCallback(() => {
    setReport(null);
    setError(null);
  }, []);

  return (
    <main style={styles.main}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <Shield style={{ width: '18px', height: '18px', color: '#ffffff' }} />
            </div>
            <span style={styles.logoText}>Luma</span>
          </div>
          <a
            href="https://github.com/markjones22347-ops/luma-analyzer"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.navButton}
          >
            <Github style={{ width: '14px', height: '14px' }} />
            <span>GitHub</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section style={styles.hero}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h1 style={styles.title}>Lua Script Analyzer</h1>
          <p style={styles.subtitle}>
            Static analysis for Lua scripts. Detect malicious patterns, obfuscation, 
            and security risks without executing code.
          </p>
        </motion.div>
      </section>

      {/* Main Content */}
      <div style={styles.mainArea}>
        <div style={styles.card}>
          <AnimatePresence mode="wait">
            {report ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ScanResults report={report} onDownload={handleDownloadReport} />
                <button onClick={resetScan} style={styles.backButton}>
                  Analyze Another Script
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {isScanning ? (
                  <ScanningAnimation />
                ) : (
                  <>
                    <FileUpload 
                      onFileSelect={handleFileSelect} 
                      onCodePaste={handleCodePaste} 
                    />
                    
                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={styles.errorBox}
                      >
                        {error}
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Static analysis only. No code execution.
        </p>
      </footer>
    </main>
  );
}
