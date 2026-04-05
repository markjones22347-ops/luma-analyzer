'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, FileCode, Calendar, User, Shield, ThumbsUp, ThumbsDown, Hash, Tag, Link, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { CommunitySubmission } from '@/lib/community-submissions';

interface PostDetailModalProps {
  submission: CommunitySubmission | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  userVote: 'up' | 'down' | null | undefined;
  onVote: (submissionId: string, vote: 'up' | 'down') => void;
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1500,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#0a0a0a',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#ffffff',
  },
  closeButton: {
    padding: '8px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    cursor: 'pointer',
  },
  content: {
    padding: '24px',
    overflowY: 'auto' as const,
    flex: 1,
  },
  metaRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '13px',
  },
  statusBadge: (status: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: status === 'verified' ? 'rgba(34, 197, 94, 0.1)' : 
                     status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
    color: status === 'verified' ? '#22c55e' : 
           status === 'rejected' ? '#ef4444' : '#f59e0b',
  }),
  description: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: '16px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    marginBottom: '20px',
  },
  descriptionLabel: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  descriptionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  tagsContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    marginBottom: '20px',
  },
  tag: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '6px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#3b82f6',
    fontSize: '12px',
  },
  riskSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    marginBottom: '20px',
  },
  riskHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  riskBadge: (score: number) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 700,
    backgroundColor: score >= 75 ? 'rgba(220, 38, 38, 0.2)' : 
                    score >= 50 ? 'rgba(245, 158, 11, 0.2)' :
                    score >= 25 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(34, 197, 94, 0.2)',
    color: score >= 75 ? '#ef4444' : 
           score >= 50 ? '#f59e0b' :
           score >= 25 ? '#3b82f6' : '#22c55e',
  }),
  riskLabel: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  detectionList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  detectionItem: (severity: string) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderLeft: `3px solid ${
      severity === 'critical' ? '#ef4444' :
      severity === 'high' ? '#f59e0b' :
      severity === 'medium' ? '#3b82f6' : '#22c55e'
    }`,
  }),
  detectionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    flex: 1,
  },
  detectionSeverity: (severity: string) => ({
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: severity === 'critical' ? '#ef4444' :
          severity === 'high' ? '#f59e0b' :
          severity === 'medium' ? '#3b82f6' : '#22c55e',
  }),
  voteSection: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  voteButton: (isActive: boolean, type: 'up' | 'down') => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: isActive ? 
      (type === 'up' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)') :
      'rgba(255, 255, 255, 0.05)',
    color: isActive ? 
      (type === 'up' ? '#22c55e' : '#ef4444') :
      'rgba(255, 255, 255, 0.6)',
  }),
  voteCount: {
    fontWeight: 700,
  },
};

export function PostDetailModal({ submission, isOpen, onClose, currentUserId, userVote, onVote }: PostDetailModalProps) {
  if (!submission || !isOpen) return null;

  const handleVote = (vote: 'up' | 'down') => {
    if (currentUserId) {
      onVote(submission.id, vote);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle style={{ width: '14px', height: '14px' }} />;
      case 'rejected': return <XCircle style={{ width: '14px', height: '14px' }} />;
      default: return <HelpCircle style={{ width: '14px', height: '14px' }} />;
    }
  };

  const report = submission.report;

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
            <div style={styles.headerTitle}>
              <FileCode style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
              <h2 style={styles.title}>
                {submission.details?.scriptName || report.fileMetadata.fileName || 'Untitled Script'}
              </h2>
            </div>
            <button onClick={onClose} style={styles.closeButton}>
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          <div style={styles.content}>
            {/* Meta info */}
            <div style={styles.metaRow}>
              <div style={styles.metaItem}>
                <User style={{ width: '14px', height: '14px' }} />
                <span>By {submission.submittedBy}</span>
              </div>
              <div style={styles.metaItem}>
                <Calendar style={{ width: '14px', height: '14px' }} />
                <span>{formatDate(submission.submittedAt)}</span>
              </div>
              <div style={styles.metaItem}>
                <Hash style={{ width: '14px', height: '14px' }} />
                <span>{report.fileMetadata.hash.slice(0, 16)}...</span>
              </div>
              <div style={styles.statusBadge(submission.status)}>
                {getStatusIcon(submission.status)}
                <span>{submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}</span>
              </div>
            </div>

            {/* Description */}
            {submission.details?.description && (
              <div style={styles.description}>
                <div style={styles.descriptionLabel}>Description</div>
                <p style={styles.descriptionText}>{submission.details.description}</p>
              </div>
            )}

            {/* Tags */}
            {submission.details?.tags && submission.details.tags.length > 0 && (
              <div style={styles.tagsContainer}>
                {submission.details.tags.map((tag, i) => (
                  <span key={i} style={styles.tag}>
                    <Tag style={{ width: '12px', height: '12px' }} />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Source */}
            {submission.details?.source && (
              <div style={{ ...styles.metaItem, marginBottom: '20px' }}>
                <Link style={{ width: '14px', height: '14px' }} />
                <span>Source: {submission.details.source}</span>
              </div>
            )}

            {/* Risk Score Section */}
            <div style={styles.riskSection}>
              <div style={styles.riskHeader}>
                <Shield style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                <span style={styles.riskLabel}>Risk Analysis</span>
                <span style={styles.riskBadge(report.riskScore)}>
                  {report.riskScore}/100
                </span>
              </div>

              {/* AI Reasoning */}
              {report.aiReasoning && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={styles.descriptionLabel}>AI Analysis</div>
                  <p style={styles.descriptionText}>{report.aiReasoning}</p>
                </div>
              )}

              {/* Detections */}
              {report.detections.length > 0 && (
                <div>
                  <div style={styles.descriptionLabel}>Detections ({report.detections.length})</div>
                  <div style={styles.detectionList}>
                    {report.detections.slice(0, 5).map((detection, i) => (
                      <div key={i} style={styles.detectionItem(detection.severity)}>
                        <span style={styles.detectionText}>{detection.description}</span>
                        <span style={styles.detectionSeverity(detection.severity)}>
                          {detection.severity}
                        </span>
                      </div>
                    ))}
                    {report.detections.length > 5 && (
                      <p style={{ ...styles.descriptionText, textAlign: 'center', padding: '8px' }}>
                        +{report.detections.length - 5} more detections
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Voting */}
            <div style={styles.voteSection}>
              <button
                onClick={() => handleVote('up')}
                style={styles.voteButton(userVote === 'up', 'up')}
                disabled={!currentUserId}
              >
                <ThumbsUp style={{ width: '18px', height: '18px' }} />
                <span>Helpful</span>
                <span style={styles.voteCount}>{submission.votes.upvotes}</span>
              </button>
              <button
                onClick={() => handleVote('down')}
                style={styles.voteButton(userVote === 'down', 'down')}
                disabled={!currentUserId}
              >
                <ThumbsDown style={{ width: '18px', height: '18px' }} />
                <span>Not Helpful</span>
                <span style={styles.voteCount}>{submission.votes.downvotes}</span>
              </button>
              {!currentUserId && (
                <span style={{ ...styles.descriptionText, fontSize: '12px', marginLeft: 'auto' }}>
                  Sign in to vote
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
