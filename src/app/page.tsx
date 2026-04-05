'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from '@/components/file-upload';
import { ScanResults } from '@/components/scan-results';
import { StatisticsDashboard } from '@/components/statistics-dashboard';
import { CommunitySubmissions } from '@/components/community-submissions';
import { AuthModal } from '@/components/auth-modal';
import { SubmissionModal } from '@/components/submission-modal';
import { ScanningAnimation } from '@/components/scanning-animation';
import { ScanReport } from '@/types';
import { Shield, Github, BarChart3, Users, User, LogOut } from 'lucide-react';

type ViewMode = 'scan' | 'stats' | 'community';

interface User {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
}

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
    maxWidth: '1200px',
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
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navButton: (isActive: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '4px',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    border: 'none',
    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  authButton: (isLoggedIn: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '4px',
    backgroundColor: isLoggedIn ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
    border: `1px solid ${isLoggedIn ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
    color: isLoggedIn ? '#ef4444' : '#3b82f6',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  }),
  userDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  githubLink: {
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
  },
  hero: {
    maxWidth: '800px',
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
    maxWidth: '800px',
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
  bulkResults: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  bulkItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  bulkHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  bulkFileName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
  },
  bulkScore: (score: number) => ({
    fontSize: '16px',
    fontWeight: 700,
    color: score <= 20 ? '#22c55e' : 
           score <= 40 ? '#f59e0b' : 
           score <= 60 ? '#f97316' : 
           score <= 80 ? '#ef4444' : '#dc2626',
  }),
  footer: {
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '24px',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.3)',
  },
  loginPrompt: {
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    color: '#3b82f6',
    fontSize: '14px',
    textAlign: 'center' as const,
    marginTop: '16px',
  },
  loginPromptButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: '#3b82f6',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '12px',
  },
};

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [bulkReports, setBulkReports] = useState<ScanReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Submission modal state
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [submissionReport, setSubmissionReport] = useState<ScanReport | null>(null);

  // Check for existing session on load (server-side cookies)
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-session' }),
      });
      
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }
  };

  const handleAuth = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    setUser(null);
  };

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

  const handleBulkUpload = useCallback(async (files: File[]) => {
    setIsScanning(true);
    setError(null);
    setBulkReports([]);
    setReport(null);

    const reports: ScanReport[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          reports.push(data.report);
        }
      }

      setBulkReports(reports);
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
    setBulkReports([]);
    setError(null);
  }, []);

  const openSubmissionModal = (reportToSubmit: ScanReport) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setSubmissionReport(reportToSubmit);
    setSubmissionModalOpen(true);
  };

  return (
    <main style={styles.main}>
      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuth={handleAuth}
      />

      {/* Submission Modal */}
      {submissionReport && (
        <SubmissionModal
          isOpen={submissionModalOpen}
          onClose={() => setSubmissionModalOpen(false)}
          report={submissionReport}
          user={user}
          onSubmit={() => {
            alert('Submitted to community successfully!');
          }}
        />
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <Shield style={{ width: '18px', height: '18px', color: '#ffffff' }} />
            </div>
            <span style={styles.logoText}>Luma</span>
          </div>

          <nav style={styles.nav}>
            <button
              onClick={() => { setViewMode('scan'); resetScan(); }}
              style={styles.navButton(viewMode === 'scan')}
            >
              <Shield style={{ width: '14px', height: '14px' }} />
              <span>Scan</span>
            </button>
            <button
              onClick={() => setViewMode('stats')}
              style={styles.navButton(viewMode === 'stats')}
            >
              <BarChart3 style={{ width: '14px', height: '14px' }} />
              <span>Statistics</span>
            </button>
            <button
              onClick={() => setViewMode('community')}
              style={styles.navButton(viewMode === 'community')}
            >
              <Users style={{ width: '14px', height: '14px' }} />
              <span>Community</span>
            </button>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <>
                <div style={styles.userDisplay}>
                  <User style={{ width: '14px', height: '14px' }} />
                  <span>{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  style={styles.authButton(true)}
                >
                  <LogOut style={{ width: '14px', height: '14px' }} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                style={styles.authButton(false)}
              >
                <User style={{ width: '14px', height: '14px' }} />
                <span>Sign In</span>
              </button>
            )}

            <a
              href="https://github.com/markjones22347-ops/luma-analyzer"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.githubLink}
            >
              <Github style={{ width: '14px', height: '14px' }} />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {viewMode === 'scan' && (
        <>
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

          {/* Scan Area */}
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
                    <ScanResults 
                      report={report} 
                      onDownload={handleDownloadReport}
                      onSubmitToCommunity={openSubmissionModal}
                    />
                    
                    {/* Show login prompt if not logged in and score is high enough */}
                    {!user && report.riskScore >= 41 && (
                      <div style={styles.loginPrompt}>
                        <p>Sign in to submit this script to the community database</p>
                        <button 
                          onClick={() => setAuthModalOpen(true)}
                          style={styles.loginPromptButton}
                        >
                          Sign In to Submit
                        </button>
                      </div>
                    )}
                    
                    <button onClick={resetScan} style={styles.backButton}>
                      Analyze Another Script
                    </button>
                  </motion.div>
                ) : bulkReports.length > 0 ? (
                  <motion.div
                    key="bulk-results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', marginBottom: '16px' }}>
                      Bulk Analysis Results ({bulkReports.length} files)
                    </h3>
                    <div style={styles.bulkResults}>
                      {bulkReports.map((r, i) => (
                        <div key={r.id} style={styles.bulkItem}>
                          <div style={styles.bulkHeader}>
                            <span style={styles.bulkFileName}>
                              {i + 1}. {r.fileMetadata.filename || 'Pasted Code'}
                            </span>
                            <span style={styles.bulkScore(r.riskScore)}>
                              {r.riskScore}/100 - {r.rating}
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                            {r.summary.substring(0, 100)}...
                          </p>
                          {r.riskScore >= 41 && (
                            <button
                              onClick={() => openSubmissionModal(r)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '4px',
                                backgroundColor: user ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${user ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
                                color: user ? '#3b82f6' : 'rgba(255, 255, 255, 0.5)',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              {user ? 'Submit to Community' : 'Sign in to Submit'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button onClick={resetScan} style={styles.backButton}>
                      Analyze More Files
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
                          onBulkUpload={handleBulkUpload}
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
        </>
      )}

      {viewMode === 'stats' && (
        <div style={styles.mainArea}>
          <div style={styles.card}>
            <StatisticsDashboard />
          </div>
        </div>
      )}

      {viewMode === 'community' && (
        <div style={styles.mainArea}>
          <div style={styles.card}>
            <CommunitySubmissions />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Static analysis only. No code execution. Community-powered security.
        </p>
      </footer>
    </main>
  );
}
