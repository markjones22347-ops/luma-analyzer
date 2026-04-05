'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Calendar, Shield, BarChart3, FileText, Upload, Award, Edit2, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { ScanReport } from '@/types';

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

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  isOwnProfile: boolean;
  onUpdateBio?: (bio: string) => void;
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
    maxWidth: '600px',
    maxHeight: '90vh',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    padding: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    border: '2px solid rgba(59, 130, 246, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    width: '32px',
    height: '32px',
    color: '#3b82f6',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  username: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#ffffff',
  },
  email: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  verifiedBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    color: '#22c55e',
    fontSize: '11px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
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
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  bioContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  bioText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  bioInput: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '14px',
    lineHeight: 1.6,
    minHeight: '80px',
    resize: 'vertical' as const,
  },
  editButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '12px',
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    color: '#22c55e',
    fontSize: '12px',
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    textAlign: 'center' as const,
  },
  statIcon: {
    width: '24px',
    height: '24px',
    color: 'rgba(255, 255, 255, 0.4)',
    margin: '0 auto 8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  joinedDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '10px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '13px',
  },
  emptyBio: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic' as const,
    fontSize: '14px',
  },
};

export function ProfileModal({ isOpen, onClose, user, isOwnProfile, onUpdateBio }: ProfileModalProps) {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user.bio || '');

  if (!isOpen) return null;

  const handleSaveBio = () => {
    onUpdateBio?.(bioText);
    setIsEditingBio(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const stats = user.stats || {
    scansPerformed: 0,
    scriptsSubmitted: 0,
    totalUpvotes: 0,
    joinedAt: user.createdAt || new Date().toISOString(),
  };

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
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.avatarSection}>
              <div style={styles.avatar}>
                <User style={styles.avatarIcon} />
              </div>
              <div style={styles.userInfo}>
                <h2 style={styles.username}>{user.username}</h2>
                <div style={styles.email}>
                  <Mail style={{ width: '14px', height: '14px' }} />
                  <span>{user.email}</span>
                  {user.emailVerified && (
                    <span style={styles.verifiedBadge}>
                      <Check style={{ width: '10px', height: '10px' }} />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={styles.closeButton}>
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {/* Content */}
          <div style={styles.content}>
            {/* Bio Section */}
            <div style={styles.section}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={styles.sectionTitle}>
                  <FileText style={{ width: '14px', height: '14px' }} />
                  Bio
                </div>
                {isOwnProfile && (
                  isEditingBio ? (
                    <button onClick={handleSaveBio} style={styles.saveButton}>
                      <Check style={{ width: '14px', height: '14px' }} />
                      Save
                    </button>
                  ) : (
                    <button onClick={() => setIsEditingBio(true)} style={styles.editButton}>
                      <Edit2 style={{ width: '14px', height: '14px' }} />
                      Edit
                    </button>
                  )
                )}
              </div>
              <div style={styles.bioContainer}>
                {isEditingBio ? (
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    placeholder="Write a short bio..."
                    style={styles.bioInput}
                    maxLength={200}
                  />
                ) : (
                  user.bio ? (
                    <p style={styles.bioText}>{user.bio}</p>
                  ) : (
                    <p style={styles.emptyBio}>
                      {isOwnProfile ? 'Add a bio to tell others about yourself' : 'No bio yet'}
                    </p>
                  )
                )}
              </div>
            </div>

            {/* Stats Section */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                <BarChart3 style={{ width: '14px', height: '14px' }} />
                Statistics
              </div>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <Shield style={styles.statIcon} />
                  <div style={styles.statValue}>{stats.scansPerformed}</div>
                  <div style={styles.statLabel}>Scans</div>
                </div>
                <div style={styles.statCard}>
                  <Upload style={styles.statIcon} />
                  <div style={styles.statValue}>{stats.scriptsSubmitted}</div>
                  <div style={styles.statLabel}>Submissions</div>
                </div>
                <div style={styles.statCard}>
                  <Award style={styles.statIcon} />
                  <div style={styles.statValue}>{stats.totalUpvotes}</div>
                  <div style={styles.statLabel}>Upvotes</div>
                </div>
              </div>
            </div>

            {/* Joined Date */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                <Calendar style={{ width: '14px', height: '14px' }} />
                Member Since
              </div>
              <div style={styles.joinedDate}>
                <Calendar style={{ width: '14px', height: '14px' }} />
                <span>{formatDate(stats.joinedAt)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
