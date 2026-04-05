'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Lock, AlertTriangle, Shield } from 'lucide-react';

interface AdminDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  submissionName: string;
  onDelete: () => void;
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
    maxWidth: '450px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
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
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  closeButton: {
    padding: '8px',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.5)',
    cursor: 'pointer',
  },
  warningBox: {
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    marginBottom: '24px',
  },
  warningTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  warningText: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 1.5,
  },
  scriptName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#ffffff',
    marginTop: '8px',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
  },
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
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  input: {
    padding: '14px 16px',
    borderRadius: '6px',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'monospace',
    letterSpacing: '1px',
  },
  hint: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: '14px',
    borderRadius: '6px',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  error: {
    padding: '12px',
    borderRadius: '6px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    fontSize: '13px',
  },
};

export function AdminDeleteModal({ isOpen, onClose, submissionId, submissionName, onDelete }: AdminDeleteModalProps) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError('Admin token is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/community', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          adminToken: token.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        onDelete();
        onClose();
      } else {
        setError(data.error || 'Failed to delete submission');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
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
              <Shield style={{ width: '22px', height: '22px' }} />
              Admin Delete
            </h2>
            <button onClick={onClose} style={styles.closeButton}>
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          <div style={styles.warningBox}>
            <div style={styles.warningTitle}>
              <AlertTriangle style={{ width: '16px', height: '16px' }} />
              Warning: Permanent Deletion
            </div>
            <p style={styles.warningText}>
              You are about to permanently delete this submission from the community database. 
              This action cannot be undone.
            </p>
            <div style={styles.scriptName}>
              {submissionName}
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleDelete} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <Lock style={{ width: '14px', height: '14px' }} />
                Admin Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter admin token..."
                style={styles.input}
                required
              />
              <span style={styles.hint}>
                Required for verification. Contact site admin for the token.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.deleteButton,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <Trash2 style={{ width: '18px', height: '18px' }} />
              {loading ? 'Deleting...' : 'Permanently Delete'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
