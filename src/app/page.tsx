'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from '@/components/file-upload';
import { ScanResults } from '@/components/scan-results';
import { ScanningAnimation } from '@/components/scanning-animation';
import { ScanReport } from '@/types';
import { Shield, Github, Sparkles, Upload, FileText, ShieldCheck } from 'lucide-react';

// Pure inline styles - no Tailwind
const styles = {
  main: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  background: {
    position: 'fixed' as const,
    inset: 0,
    overflow: 'hidden' as const,
    pointerEvents: 'none' as const,
    zIndex: 0,
  },
  orb1: {
    position: 'absolute' as const,
    top: '10%',
    left: '10%',
    width: '300px',
    height: '300px',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: '50%',
    filter: 'blur(80px)',
  },
  orb2: {
    position: 'absolute' as const,
    bottom: '20%',
    right: '10%',
    width: '400px',
    height: '400px',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: '50%',
    filter: 'blur(100px)',
  },
  content: {
    position: 'relative' as const,
    zIndex: 10,
  },
  header: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
    backdropFilter: 'blur(10px)',
  },
  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#ffffff',
  },
  logoTagline: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.7)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  hero: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '80px 24px 40px',
    textAlign: 'center' as const,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    marginBottom: '24px',
  },
  badgeText: {
    fontSize: '13px',
    color: '#3b82f6',
    fontWeight: 500,
  },
  title: {
    fontSize: '56px',
    fontWeight: 800,
    color: '#ffffff',
    marginBottom: '16px',
    lineHeight: 1.1,
  },
  titleGradient: {
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.5)',
    maxWidth: '600px',
    margin: '0 auto 48px',
    lineHeight: 1.6,
  },
  mainArea: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '0 24px 80px',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(20px)',
    borderRadius: '32px',
    padding: '40px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  features: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '60px 24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  featureCard: {
    padding: '32px',
    borderRadius: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    transition: 'all 0.3s ease',
  },
  featureIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  featureTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '8px',
  },
  featureDesc: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 1.5,
  },
  footer: {
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '40px 24px',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  backButton: {
    display: 'block',
    width: '100%',
    padding: '16px 24px',
    marginTop: '24px',
    borderRadius: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  errorBox: {
    marginTop: '24px',
    padding: '16px 20px',
    borderRadius: '16px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    fontSize: '14px',
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
      {/* Animated background */}
      <div style={styles.background}>
        <div style={styles.orb1} />
        <div style={styles.orb2} />
      </div>

      <div style={styles.content}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerInner}>
            <div style={styles.logo}>
              <div style={styles.logoIcon}>
                <Shield style={{ width: '24px', height: '24px', color: '#ffffff' }} />
              </div>
              <div>
                <div style={styles.logoText}>Luma</div>
                <div style={styles.logoTagline}>Security Analyzer</div>
              </div>
            </div>
            <a
              href="https://github.com/markjones22347-ops/luma-analyzer"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.navButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              }}
            >
              <Github style={{ width: '18px', height: '18px' }} />
              <span>GitHub</span>
            </a>
          </div>
        </header>

        {/* Hero Section */}
        <section style={styles.hero}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div style={styles.badge}>
              <Sparkles style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
              <span style={styles.badgeText}>AI-Powered Analysis</span>
            </div>
            <h1 style={styles.title}>
              Analyze Lua Scripts{' '}
              <span style={styles.titleGradient}>Safely</span>
            </h1>
            <p style={styles.subtitle}>
              Detect malicious patterns, obfuscation, and security risks before executing. 
              Pure static analysis - no code execution.
            </p>
          </motion.div>
        </section>

        {/* Main Content Area */}
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
                  <button
                    onClick={resetScan}
                    style={styles.backButton}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                  >
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
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
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

        {/* Features Section */}
        {!report && !isScanning && (
          <div style={styles.features}>
            <FeatureCard
              icon={<Upload style={{ width: '24px', height: '24px', color: '#3b82f6' }} />}
              title="Easy Upload"
              description="Drag and drop your .lua files or paste code directly. Supports files up to 5MB."
              delay={0.1}
            />
            <FeatureCard
              icon={<ShieldCheck style={{ width: '24px', height: '24px', color: '#22c55e' }} />}
              title="Static Analysis"
              description="No code execution. We only analyze text patterns and behavioral signatures."
              delay={0.2}
            />
            <FeatureCard
              icon={<FileText style={{ width: '24px', height: '24px', color: '#8b5cf6' }} />}
              title="Detailed Reports"
              description="Get comprehensive risk scores, detected patterns, and downloadable JSON reports."
              delay={0.3}
            />
          </div>
        )}

        {/* Footer */}
        <footer style={styles.footer}>
          <p style={styles.footerText}>
            Luma Lua Analyzer • Static Analysis Only • No Code Execution
          </p>
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description, delay }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      style={styles.featureCard}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={styles.featureIcon}>{icon}</div>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDesc}>{description}</p>
    </motion.div>
  );
}
