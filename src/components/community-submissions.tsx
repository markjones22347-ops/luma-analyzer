'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ThumbsUp, ThumbsDown, Shield, AlertTriangle, CheckCircle, XCircle, Clock, Trash2, Trophy, Medal, Award, Eye } from 'lucide-react';
import { AdminDeleteModal } from './admin-delete-modal';
import { PostDetailModal } from './post-detail-modal';
import { CommunitySubmission } from '@/lib/community-submissions';

interface User {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
}

interface CommunityStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  topContributors: Array<{ name: string; submissions: number; userId?: string }>;
}

interface CommunitySubmissionsProps {
  currentUser: User | null;
  onOpenProfile: (username?: string) => void;
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
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
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
    cursor: 'pointer',
  },
  submitterName: {
    color: '#3b82f6',
    cursor: 'pointer',
    ':hover': {
      textDecoration: 'underline',
    },
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
  voteButton: (isActive: boolean, type: 'up' | 'down') => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '13px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: isActive ? 
      (type === 'up' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)') :
      'rgba(255, 255, 255, 0.05)',
    color: isActive ? 
      (type === 'up' ? '#22c55e' : '#ef4444') :
      'rgba(255, 255, 255, 0.5)',
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
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '4px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    color: '#3b82f6',
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
  // Leaderboard styles
  leaderboard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    marginTop: '24px',
  },
  leaderboardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  leaderboardTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#ffffff',
  },
  leaderboardItem: (index: number) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px',
    borderRadius: '10px',
    backgroundColor: index < 3 ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
    border: index < 3 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
    marginBottom: '8px',
  }),
  rankBadge: (index: number) => ({
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '14px',
    backgroundColor: index === 0 ? 'rgba(251, 191, 36, 0.2)' : // Gold
                     index === 1 ? 'rgba(148, 163, 184, 0.2)' : // Silver
                     index === 2 ? 'rgba(251, 146, 60, 0.2)' : // Bronze
                     'rgba(255, 255, 255, 0.05)',
    color: index === 0 ? '#fbbf24' :
          index === 1 ? '#94a3b8' :
          index === 2 ? '#fb923c' :
          'rgba(255, 255, 255, 0.6)',
    border: `2px solid ${index === 0 ? 'rgba(251, 191, 36, 0.3)' :
                            index === 1 ? 'rgba(148, 163, 184, 0.3)' :
                            index === 2 ? 'rgba(251, 146, 60, 0.3)' :
                            'transparent'}`,
  }),
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    ':hover': {
      color: '#3b82f6',
    },
  },
  contributorScore: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  trophyIcon: {
    width: '24px',
    height: '24px',
    color: '#fbbf24',
  },
};

export function CommunitySubmissions({ currentUser, onOpenProfile }: CommunitySubmissionsProps) {
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down'>>({});
  
  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<CommunitySubmission | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [activeTab]);

  const fetchSubmissions = async () => {
    try {
      const url = activeTab === 'all' ? '/api/community' : `/api/community?status=${activeTab}`;
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
        setStats(data.stats);
        
        // Track user's votes
        const votes: Record<string, 'up' | 'down'> = {};
        data.submissions.forEach((sub: CommunitySubmission) => {
          if (currentUser && sub.userVotes && sub.userVotes[currentUser.id]) {
            votes[sub.id] = sub.userVotes[currentUser.id];
          }
        });
        setUserVotes(votes);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const vote = async (id: string, type: 'up' | 'down') => {
    if (!currentUser) return;
    
    try {
      const response = await fetch('/api/community', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ submissionId: id, vote: type }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update local state with new vote
        setUserVotes(prev => ({
          ...prev,
          [id]: prev[id] === type ? undefined : type
        }));
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const openDetailModal = (submission: CommunitySubmission) => {
    setSelectedSubmission(submission);
    setDetailModalOpen(true);
  };

  const openDeleteModal = (submission: CommunitySubmission, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSubmission(submission);
    setDeleteModalOpen(true);
  };

  const handleDelete = () => {
    fetchSubmissions();
    setDeleteModalOpen(false);
  };

  const handleProfileClick = (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    onOpenProfile(username);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle style={{ width: '14px', height: '14px' }} />;
      case 'rejected': return <XCircle style={{ width: '14px', height: '14px' }} />;
      default: return <Clock style={{ width: '14px', height: '14px' }} />;
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy style={styles.trophyIcon} />;
    if (index === 1) return <Medal style={{ ...styles.trophyIcon, color: '#94a3b8' }} />;
    if (index === 2) return <Award style={{ ...styles.trophyIcon, color: '#fb923c' }} />;
    return null;
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
      {/* Modals */}
      {selectedSubmission && (
        <>
          <AdminDeleteModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            submissionId={selectedSubmission.id}
            submissionName={selectedSubmission.details?.scriptName || 'Unknown'}
            onDelete={handleDelete}
          />
          <PostDetailModal
            submission={selectedSubmission}
            isOpen={detailModalOpen}
            onClose={() => setDetailModalOpen(false)}
            currentUserId={currentUser?.id}
            userVote={selectedSubmission.id ? userVotes[selectedSubmission.id] : null}
            onVote={vote}
          />
        </>
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
            onClick={() => openDetailModal(sub)}
          >
            <div style={styles.submissionHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={styles.submissionTitle}>
                    {sub.details?.scriptName || 'Untitled Script'}
                  </span>
                  <span style={styles.riskScore(sub.report.riskScore)}>
                    {sub.report.riskScore}/100
                  </span>
                </div>
                <div style={styles.submissionMeta}>
                  Submitted by{' '}
                  <span 
                    style={styles.submitterName}
                    onClick={(e) => handleProfileClick(e, sub.submittedBy)}
                  >
                    {sub.submittedBy}
                  </span>
                  {' • '}
                  {new Date(sub.submittedAt).toLocaleDateString()}
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
                  onClick={(e) => { e.stopPropagation(); vote(sub.id, 'up'); }}
                  style={styles.voteButton(userVotes[sub.id] === 'up', 'up')}
                  disabled={!currentUser}
                >
                  <ThumbsUp style={{ width: '14px', height: '14px' }} />
                  {sub.votes.upvotes}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); vote(sub.id, 'down'); }}
                  style={styles.voteButton(userVotes[sub.id] === 'down', 'down')}
                  disabled={!currentUser}
                >
                  <ThumbsDown style={{ width: '14px', height: '14px' }} />
                  {sub.votes.downvotes}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); openDetailModal(sub); }}
                  style={styles.viewButton}
                >
                  <Eye style={{ width: '14px', height: '14px' }} />
                  View
                </button>
                <button
                  onClick={(e) => openDeleteModal(sub, e)}
                  style={styles.deleteButton}
                >
                  <Trash2 style={{ width: '14px', height: '14px' }} />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))
      )}

      {/* Leaderboard */}
      {stats && stats.topContributors.length > 0 && (
        <div style={styles.leaderboard}>
          <div style={styles.leaderboardHeader}>
            <Trophy style={{ width: '24px', height: '24px', color: '#fbbf24' }} />
            <h3 style={styles.leaderboardTitle}>Top Contributors</h3>
          </div>
          {stats.topContributors.map((contributor, index) => (
            <div 
              key={index} 
              style={styles.leaderboardItem(index)}
              onClick={() => onOpenProfile(contributor.name)}
            >
              <div style={styles.rankBadge(index)}>
                {index < 3 ? getRankIcon(index) : index + 1}
              </div>
              <div style={styles.contributorInfo}>
                <div style={styles.contributorName}>{contributor.name}</div>
                <div style={styles.contributorScore}>
                  {contributor.submissions} submission{contributor.submissions !== 1 ? 's' : ''}
                </div>
              </div>
              {index < 3 && (
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
                  #{index + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
