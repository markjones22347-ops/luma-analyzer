'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, FileText, Tag, Globe, Send } from 'lucide-react';
import { ScanReport } from '@/types';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ScanReport;
  user: { id: string; username: string } | null;
  token: string | null;
  onSubmit: (details: { scriptName: string; description: string; source?: string; tags: string[] }) => void;
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
    maxWidth: '500px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    maxHeight: '90vh',
    overflow: 'auto' as const,
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
  infoBox: {
    padding: '12px 16px',
    borderRadius: '6px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '13px',
    marginBottom: '20px',
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
    padding: '12px 16px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  },
  textarea: {
    padding: '12px 16px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical' as const,
    minHeight: '100px',
    fontFamily: 'inherit',
  },
  submitButton: {
    padding: '14px',
    borderRadius: '6px',
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
  },
  error: {
    padding: '12px',
    borderRadius: '6px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    fontSize: '13px',
  },
  required: {
    color: '#ef4444',
  },
};

export function SubmissionModal({ isOpen, onClose, report, user, token, onSubmit }: SubmissionModalProps) {
  const [scriptName, setScriptName] = useState(report.fileMetadata.filename || '');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scriptName.trim() || !description.trim()) {
      setError('Script name and description are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
      
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: report.id,
          submittedBy: user?.username || 'Anonymous',
          userId: user?.id,
          report: report,
          details: {
            scriptName: scriptName.trim(),
            description: description.trim(),
            source: source.trim() || undefined,
            tags: tagArray,
          },
          token: token,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSubmit({
          scriptName: scriptName.trim(),
          description: description.trim(),
          source: source.trim() || undefined,
          tags: tagArray,
        });
        onClose();
      } else {
        setError(data.error || 'Failed to submit');
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
              <Users style={{ width: '22px', height: '22px', color: '#3b82f6' }} />
              Submit to Community
            </h2>
            <button onClick={onClose} style={styles.closeButton}>
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          <div style={styles.infoBox}>
            <strong>Risk Score: {report.riskScore}/100 - {report.rating}</strong>
            <br />
            Submissions help protect others by warning about potentially malicious scripts.
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <FileText style={{ width: '14px', height: '14px' }} />
                Script Name <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={scriptName}
                onChange={(e) => setScriptName(e.target.value)}
                placeholder="e.g., Malicious Stealer Script"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <FileText style={{ width: '14px', height: '14px' }} />
                Description <span style={styles.required}>*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this script does, what malicious behaviors were detected, etc."
                style={styles.textarea}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <Globe style={{ width: '14px', height: '14px' }} />
                Source (Optional)
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Where did you find this script? (Discord server, website, etc.)"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <Tag style={{ width: '14px', height: '14px' }} />
                Tags (Optional, comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., stealer, obfuscated, webhook, roblox"
                style={styles.input}
              />
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
              <Send style={{ width: '18px', height: '18px' }} />
              {loading ? 'Submitting...' : 'Submit to Community'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
