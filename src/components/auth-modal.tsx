'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, LogIn, UserPlus, Mail, CheckCircle, RefreshCw } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (user: { id: string; username: string; email: string; emailVerified: boolean }) => void;
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#0a0a0a',
    borderRadius: '12px',
    padding: '32px',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#ffffff',
  },
  closeButton: {
    padding: '8px',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.5)',
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  tab: (isActive: boolean) => ({
    flex: 1,
    padding: '10px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  }),
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  },
  submitButton: {
    padding: '12px',
    borderRadius: '6px',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: '#3b82f6',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    padding: '12px',
    borderRadius: '6px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    fontSize: '13px',
  },
  success: {
    padding: '12px',
    borderRadius: '6px',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
    fontSize: '13px',
  },
  verificationBox: {
    textAlign: 'center' as const,
    padding: '20px',
  },
  verificationTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#22c55e',
    marginBottom: '12px',
  },
  verificationText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    lineHeight: 1.5,
    marginBottom: '20px',
  },
  emailHighlight: {
    color: '#3b82f6',
    fontWeight: 600,
  },
  resendButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '12px',
  },
};

export function AuthModal({ isOpen, onClose, onAuth }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Verification flow state
  const [needsVerification, setNeedsVerification] = useState(false);
  const [pendingUsername, setPendingUsername] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: activeTab,
          username,
          email: activeTab === 'register' ? email : undefined,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (activeTab === 'register') {
          // Show verification step
          setNeedsVerification(true);
          setPendingUsername(data.user.username);
          setPendingEmail(data.user.email);
          setSuccess(data.message);
        } else {
          // Login successful
          onAuth(data.user);
          onClose();
        }
      } else {
        if (data.needsVerification) {
          setNeedsVerification(true);
          setPendingUsername(data.username);
          setError('Please verify your email before logging in.');
        } else {
          setError(data.error || 'Authentication failed');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-email',
          username: pendingUsername,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onAuth(data.user);
        onClose();
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend-verification',
          username: pendingUsername,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNeedsVerification(false);
    setPendingUsername('');
    setPendingEmail('');
    setVerificationCode('');
    setError(null);
    setSuccess(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={styles.overlay}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          style={styles.modal}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.header}>
            <h2 style={styles.title}>
              {needsVerification ? 'Verify Email' : activeTab === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
            <button onClick={onClose} style={styles.closeButton}>
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {needsVerification ? (
            <div style={styles.verificationBox}>
              <CheckCircle style={{ width: '48px', height: '48px', color: '#22c55e', marginBottom: '16px' }} />
              <p style={styles.verificationTitle}>Check your email</p>
              <p style={styles.verificationText}>
                We've sent a 6-digit verification code to<br />
                <span style={styles.emailHighlight}>{pendingEmail}</span>
              </p>
              
              {error && <div style={styles.error}>{error}</div>}
              {success && <div style={styles.success}>{success}</div>}

              <form onSubmit={handleVerify} style={styles.form}>
                <div style={styles.inputGroup}>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    style={{ ...styles.input, textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                    required
                    maxLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  style={{
                    ...styles.submitButton,
                    opacity: loading || verificationCode.length !== 6 ? 0.6 : 1,
                    cursor: loading || verificationCode.length !== 6 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
              </form>

              <button onClick={handleResendCode} disabled={loading} style={styles.resendButton}>
                <RefreshCw style={{ width: '14px', height: '14px' }} />
                Resend Code
              </button>

              <button onClick={resetForm} style={{ ...styles.resendButton, marginTop: '8px' }}>
                Back to {activeTab === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          ) : (
            <>
              <div style={styles.tabs}>
                <button
                  onClick={() => setActiveTab('login')}
                  style={styles.tab(activeTab === 'login')}
                >
                  <LogIn style={{ width: '16px', height: '16px' }} />
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  style={styles.tab(activeTab === 'register')}
                >
                  <UserPlus style={{ width: '16px', height: '16px' }} />
                  Sign Up
                </button>
              </div>

              {error && <div style={styles.error}>{error}</div>}

              <form onSubmit={handleSubmit} style={styles.form}>
                {activeTab === 'register' && (
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Email</label>
                    <div style={{ position: 'relative' }}>
                      <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        style={{ ...styles.input, paddingLeft: '40px' }}
                        required={activeTab === 'register'}
                      />
                    </div>
                  </div>
                )}

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Username</label>
                  <div style={{ position: 'relative' }}>
                    <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      style={{ ...styles.input, paddingLeft: '40px' }}
                      required
                      minLength={3}
                      maxLength={20}
                    />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      style={{ ...styles.input, paddingLeft: '40px' }}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.submitButton,
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Please wait...' : activeTab === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
