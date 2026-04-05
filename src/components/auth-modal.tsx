'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, LogIn, UserPlus, Mail, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';

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
    padding: '20px',
  },
  modal: {
    backgroundColor: '#0a0a0a',
    borderRadius: '12px',
    padding: '32px',
    width: '100%',
    maxWidth: '420px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '22px',
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
    padding: '12px',
    borderRadius: '8px',
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
    transition: 'all 0.2s ease',
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
    marginLeft: '4px',
  },
  inputWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute' as const,
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '18px',
    height: '18px',
    color: 'rgba(255, 255, 255, 0.4)',
    pointerEvents: 'none' as const,
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: '#3b82f6',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  error: {
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    fontSize: '13px',
  },
  successBox: {
    textAlign: 'center' as const,
    padding: '32px 20px',
  },
  successIcon: {
    width: '64px',
    height: '64px',
    color: '#22c55e',
    marginBottom: '20px',
  },
  successTitle: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#22c55e',
    marginBottom: '12px',
  },
  successText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '15px',
    lineHeight: 1.6,
    marginBottom: '24px',
  },
  emailHighlight: {
    color: '#3b82f6',
    fontWeight: 600,
  },
  codeInput: {
    width: '100%',
    padding: '16px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: '#3b82f6',
    fontSize: '28px',
    fontWeight: 700,
    textAlign: 'center' as const,
    letterSpacing: '12px',
    outline: 'none',
    marginBottom: '16px',
    boxSizing: 'border-box' as const,
  },
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '12px',
    width: '100%',
  },
  signInPrompt: {
    textAlign: 'center' as const,
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  signInText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px',
  },
  signInLink: {
    color: '#3b82f6',
    cursor: 'pointer',
    fontWeight: 600,
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Flow states
  const [showVerification, setShowVerification] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [pendingUsername, setPendingUsername] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
          setShowVerification(true);
          setPendingUsername(data.user.username);
          setPendingEmail(data.user.email);
          setSuccessMessage(data.message);
        } else {
          // Login successful
          onAuth(data.user);
          onClose();
        }
      } else {
        if (data.needsVerification) {
          setShowVerification(true);
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
        // Show success then redirect to sign in
        setRegistrationComplete(true);
        setTimeout(() => {
          // Reset to sign in tab
          setActiveTab('login');
          setShowVerification(false);
          setRegistrationComplete(false);
          setUsername(pendingUsername);
          setEmail(pendingEmail);
          setVerificationCode('');
          setSuccessMessage(null);
        }, 2000);
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
        setSuccessMessage(data.message);
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchToSignIn = () => {
    setActiveTab('login');
    setShowVerification(false);
    setRegistrationComplete(false);
    setUsername(pendingUsername);
    setEmail('');
    setPassword('');
    setVerificationCode('');
    setSuccessMessage(null);
    setError(null);
  };

  const resetForm = () => {
    setShowVerification(false);
    setRegistrationComplete(false);
    setPendingUsername('');
    setPendingEmail('');
    setUsername('');
    setEmail('');
    setPassword('');
    setVerificationCode('');
    setError(null);
    setSuccessMessage(null);
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
              {showVerification ? 'Verify Email' : activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <button onClick={onClose} style={styles.closeButton}>
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {showVerification ? (
            registrationComplete ? (
              // Registration complete - show success before redirecting
              <div style={styles.successBox}>
                <CheckCircle style={styles.successIcon} />
                <h3 style={styles.successTitle}>Email Verified!</h3>
                <p style={styles.successText}>
                  Your account has been created successfully. Redirecting to sign in...
                </p>
              </div>
            ) : (
              // Verification form
              <>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <Mail style={{ width: '48px', height: '48px', color: '#3b82f6', marginBottom: '12px' }} />
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', lineHeight: 1.5 }}>
                    Enter the 6-digit code we sent to<br />
                    <span style={styles.emailHighlight}>{pendingEmail}</span>
                  </p>
                </div>

                {error && <div style={styles.error}>{error}</div>}
                {successMessage && (
                  <div style={{ ...styles.error, backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleVerify} style={styles.form}>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    style={styles.codeInput}
                    required
                    maxLength={6}
                    autoFocus
                  />

                  <button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    style={{
                      ...styles.submitButton,
                      opacity: loading || verificationCode.length !== 6 ? 0.6 : 1,
                      cursor: loading || verificationCode.length !== 6 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Verifying...' : (
                      <>
                        Verify Email
                        <ArrowRight style={{ width: '18px', height: '18px' }} />
                      </>
                    )}
                  </button>
                </form>

                <button onClick={handleResendCode} disabled={loading} style={styles.secondaryButton}>
                  <RefreshCw style={{ width: '14px', height: '14px' }} />
                  Resend Code
                </button>

                <button onClick={switchToSignIn} style={{ ...styles.secondaryButton, marginTop: '8px' }}>
                  Already verified? Sign In
                </button>
              </>
            )
          ) : (
            <>
              <div style={styles.tabs}>
                <button
                  onClick={() => { setActiveTab('login'); resetForm(); }}
                  style={styles.tab(activeTab === 'login')}
                >
                  <LogIn style={{ width: '16px', height: '16px' }} />
                  Sign In
                </button>
                <button
                  onClick={() => { setActiveTab('register'); resetForm(); }}
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
                    <div style={styles.inputWrapper}>
                      <Mail style={styles.inputIcon} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        style={styles.input}
                        required={activeTab === 'register'}
                      />
                    </div>
                  </div>
                )}

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Username</label>
                  <div style={styles.inputWrapper}>
                    <User style={styles.inputIcon} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      style={styles.input}
                      required
                      minLength={3}
                      maxLength={20}
                    />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Password</label>
                  <div style={styles.inputWrapper}>
                    <Lock style={styles.inputIcon} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      style={styles.input}
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
                  {loading ? 'Please wait...' : (
                    <>
                      {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                      <ArrowRight style={{ width: '18px', height: '18px' }} />
                    </>
                  )}
                </button>
              </form>

              {activeTab === 'login' ? (
                <div style={styles.signInPrompt}>
                  <span style={styles.signInText}>
                    Don't have an account?{' '}
                    <span onClick={() => { setActiveTab('register'); resetForm(); }} style={styles.signInLink}>
                      Sign up
                    </span>
                  </span>
                </div>
              ) : (
                <div style={styles.signInPrompt}>
                  <span style={styles.signInText}>
                    Already have an account?{' '}
                    <span onClick={() => { setActiveTab('login'); resetForm(); }} style={styles.signInLink}>
                      Sign in
                    </span>
                  </span>
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
