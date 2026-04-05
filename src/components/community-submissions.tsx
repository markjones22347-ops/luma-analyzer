'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ThumbsUp, ThumbsDown, Shield, AlertTriangle, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { AdminDeleteModal } from './admin-delete-modal';

interface Submission {
  id: string;
  scanId: string;
  submittedBy: string;
  userId?: string;
  submittedAt: string;
  status: 'pending' | 'verified' | 'rejected';
  report: {
    riskScore: number;
    rating: string;
    summary: string;
    fileMetadata: {
      filename?: string;
      hash: string;
    };
  };
  votes: {
    upvotes: number;
    downvotes: number;
  };
  details?: {
    scriptName: string;
    description: string;
    source?: string;
    tags?: string[];
  };
}

interface CommunityStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  topContributors: Array<{ name: string; submissions: number }>;
}

const styles = {
  container: {
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#ffffff',
  },
  statsBar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
  },
  statBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    paddingBottom: '12px',
  },
  tab: (isActive: boolean) => ({
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
  }),
  submissionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    marginBottom: '12px',
  },
  submissionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  submissionTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#ffffff',
  },
  submissionMeta: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: '4px',
  },
  statusBadge: (status: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    backgroundColor: status === 'verified' ? 'rgba(34, 197, 94, 0.15)' : 
                      status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 
                      'rgba(245, 158, 11, 0.15)',
    color: status === 'verified' ? '#22c55e' : 
           status === 'rejected' ? '#ef4444' : 
           '#f59e0b',
  }),
  riskScore: (score: number) => ({
    fontSize: '18px',
    fontWeight: 700,
    color: score <= 20 ? '#22c55e' : 
           score <= 40 ? '#f59e0b' : 
           score <= 60 ? '#f97316' : 
           score <= 80 ? '#ef4444' : '#dc2626',
  }),
  description: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 1.5,
    marginBottom: '12px',
  },
  summary: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 1.4,
    marginBottom: '12px',
  },
  tags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
    marginBottom: '12px',
  },
  tag: {
    padding: '4px 10px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteButtons: {
    display: 'flex',
    gap: '8px',
  },
  voteButton: (type: 'up' | 'down') => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '13px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: type === 'up' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
    color: type === 'up' ? '#22c55e' : '#ef4444',
  }),
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '4px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    fontSize: '12px',
    cursor: 'pointer',
  },
  hash: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.3)',
    fontFamily: 'monospace',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  contributors: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    marginTop: '20px',
  },
  contributorItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
};

export function CommunitySubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);
  
  // Admin delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [activeTab]);

  const fetchSubmissions = async () => {
    try {
      const url = activeTab === 'all' ? '/api/community' : `/api/community?status=${activeTab}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const vote = async (id: string, type: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/community/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: type }),
      });
      if (response.ok) {
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const openDeleteModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setDeleteModalOpen(true);
  };

  const handleDelete = () => {
    fetchSubmissions();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle style={{ width: '14px', height: '14px' }} />;
      case 'rejected': return <XCircle style={{ width: '14px', height: '14px' }} />;
      default: return <Clock style={{ width: '14px', height: '14px' }} />;
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>Loading community submissions...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Admin Delete Modal */}
      {selectedSubmission && (
        <AdminDeleteModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          submissionId={selectedSubmission.id}
          submissionName={selectedSubmission.details?.scriptName || selectedSubmission.report.fileMetadata.filename || 'Unknown'}
          onDelete={handleDelete}
        />
      )}

      <div style={styles.header}>
        <Users style={{ width: '24px', height: '24px', color: '#ffffff' }} />
        <h2 style={styles.title}>Community Submissions</h2>
      </div>

      {stats && (
        <div style={styles.statsBar}>
          <div style={styles.statBadge}>
            <Shield style={{ width: '16px', height: '16px', color: '#22c55e' }} />
            <span>{stats.verified} Verified</span>
          </div>
          <div style={styles.statBadge}>
            <Clock style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
            <span>{stats.pending} Pending</span>
          </div>
          <div style={styles.statBadge}>
            <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
            <span>{stats.total} Total</span>
          </div>
        </div>
      )}

      <div style={styles.tabs}>
        {(['all', 'pending', 'verified', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={styles.tab(activeTab === tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {submissions.length === 0 ? (
        <div style={styles.emptyState}>
          <Users style={{ width: '48px', height: '48px', marginBottom: '16px', opacity: 0.3 }} />
          <p>No submissions found.</p>
        </div>
      ) : (
        submissions.map((sub) => (
          <motion.div
            key={sub.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.submissionCard}
          >
            <div style={styles.submissionHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={styles.submissionTitle}>
                    {sub.details?.scriptName || sub.report.fileMetadata.filename || 'Unknown Script'}
                  </span>
                  <span style={styles.riskScore(sub.report.riskScore)}>
                    {sub.report.riskScore}/100
                  </span>
                </div>
                <div style={styles.submissionMeta}>
                  Submitted by {sub.submittedBy} • {new Date(sub.submittedAt).toLocaleDateString()}
                </div>
              </div>
              <span style={styles.statusBadge(sub.status)}>
                {getStatusIcon(sub.status)}
                {sub.status}
              </span>
            </div>

            {sub.details?.description && (
              <p style={styles.description}>{sub.details.description}</p>
            )}

            <p style={styles.summary}>{sub.report.summary}</p>

            {sub.details?.tags && sub.details.tags.length > 0 && (
              <div style={styles.tags}>
                {sub.details.tags.map((tag, i) => (
                  <span key={i} style={styles.tag}>{tag}</span>
                ))}
              </div>
            )}

            <div style={styles.hash}>Hash: {sub.report.fileMetadata.hash.substring(0, 16)}...</div>

            <div style={styles.actions}>
              <div style={styles.voteButtons}>
                <button
                  onClick={() => vote(sub.id, 'up')}
                  style={styles.voteButton('up')}
                >
                  <ThumbsUp style={{ width: '14px', height: '14px' }} />
                  {sub.votes.upvotes}
                </button>
                <button
                  onClick={() => vote(sub.id, 'down')}
                  style={styles.voteButton('down')}
                >
                  <ThumbsDown style={{ width: '14px', height: '14px' }} />
                  {sub.votes.downvotes}
                </button>
              </div>

              <button
                onClick={() => openDeleteModal(sub)}
                style={styles.deleteButton}
              >
                <Trash2 style={{ width: '14px', height: '14px' }} />
                Delete
              </button>
            </div>
          </motion.div>
        ))
      )}

      {stats && stats.topContributors.length > 0 && (
        <div style={styles.contributors}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '12px' }}>
            Top Contributors
          </h3>
          {stats.topContributors.map((contributor, index) => (
            <div key={index} style={styles.contributorItem}>
              <span style={{ fontSize: '13px', color: '#ffffff' }}>{contributor.name}</span>
              <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                {contributor.submissions} submissions
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
