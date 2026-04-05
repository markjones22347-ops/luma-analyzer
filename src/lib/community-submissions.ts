import { kv } from '@vercel/kv';
import { ScanReport } from '@/types';

export interface CommunitySubmission {
  id: string;
  scanId: string;
  submittedBy: string;
  userId?: string;
  submittedAt: string;
  status: 'pending' | 'verified' | 'rejected';
  report: ScanReport;
  votes: {
    upvotes: number;
    downvotes: number;
  };
  // Track who voted and what they voted
  userVotes: Record<string, 'up' | 'down'>;
  notes?: string;
  details?: {
    scriptName: string;
    description: string;
    source?: string;
    tags?: string[];
  };
}

const ADMIN_TOKEN = 'pvKcCHCd6Vf78E8XrbsUrovHvosf1RlX';
const SUBMISSIONS_KEY = 'community_submissions';
const MAX_SUBMISSIONS = 1000;

/**
 * Community Submissions Store with Vercel KV
 * Persistent across deployments with per-user voting
 */
class CommunitySubmissionsStore {
  async submit(
    report: ScanReport, 
    submittedBy: string = 'Anonymous',
    userId?: string,
    details?: { scriptName: string; description: string; source?: string; tags?: string[] }
  ): Promise<{ success: boolean; submission?: CommunitySubmission; error?: string }> {
    try {
      // Only allow submissions for medium+ risk scores
      if (report.riskScore < 41) {
        return { success: false, error: 'Only scripts with MODERATE risk or higher can be submitted' };
      }

      const submission: CommunitySubmission = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scanId: report.id,
        submittedBy,
        userId,
        submittedAt: new Date().toISOString(),
        status: 'pending',
        report,
        votes: {
          upvotes: 0,
          downvotes: 0,
        },
        userVotes: {},
        details,
      };

      // Get existing submissions
      const submissions = await kv.get<CommunitySubmission[]>(SUBMISSIONS_KEY) || [];
      
      // Add new submission
      submissions.push(submission);
      
      // Keep only last MAX_SUBMISSIONS
      if (submissions.length > MAX_SUBMISSIONS) {
        submissions.shift();
      }

      await kv.set(SUBMISSIONS_KEY, submissions);
      return { success: true, submission };
    } catch (error) {
      console.error('[CommunityStore] Submit error:', error);
      return { success: false, error: 'Failed to submit' };
    }
  }

  async delete(submissionId: string, adminToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (adminToken !== ADMIN_TOKEN) {
        return { success: false, error: 'Invalid admin token' };
      }

      const submissions = await kv.get<CommunitySubmission[]>(SUBMISSIONS_KEY) || [];
      const index = submissions.findIndex(s => s.id === submissionId);
      
      if (index === -1) {
        return { success: false, error: 'Submission not found' };
      }

      submissions.splice(index, 1);
      await kv.set(SUBMISSIONS_KEY, submissions);
      return { success: true };
    } catch (error) {
      console.error('[CommunityStore] Delete error:', error);
      return { success: false, error: 'Delete failed' };
    }
  }

  async getSubmissions(status?: 'pending' | 'verified' | 'rejected'): Promise<CommunitySubmission[]> {
    try {
      const submissions = await kv.get<CommunitySubmission[]>(SUBMISSIONS_KEY) || [];
      
      if (status) {
        return submissions.filter(s => s.status === status).reverse();
      }
      return [...submissions].reverse();
    } catch (error) {
      console.error('[CommunityStore] Get submissions error:', error);
      return [];
    }
  }

  async getSubmissionById(submissionId: string): Promise<CommunitySubmission | null> {
    try {
      const submissions = await kv.get<CommunitySubmission[]>(SUBMISSIONS_KEY) || [];
      return submissions.find(s => s.id === submissionId) || null;
    } catch (error) {
      console.error('[CommunityStore] Get submission error:', error);
      return null;
    }
  }

  async vote(submissionId: string, userId: string, vote: 'up' | 'down'): Promise<{ success: boolean; submission?: CommunitySubmission; error?: string }> {
    try {
      const submissions = await kv.get<CommunitySubmission[]>(SUBMISSIONS_KEY) || [];
      const submission = submissions.find(s => s.id === submissionId);
      
      if (!submission) {
        return { success: false, error: 'Submission not found' };
      }

      // Initialize userVotes if not exists
      if (!submission.userVotes) {
        submission.userVotes = {};
      }

      const previousVote = submission.userVotes[userId];

      if (previousVote === vote) {
        // User is toggling off their vote
        if (vote === 'up') {
          submission.votes.upvotes = Math.max(0, submission.votes.upvotes - 1);
        } else {
          submission.votes.downvotes = Math.max(0, submission.votes.downvotes - 1);
        }
        delete submission.userVotes[userId];
      } else {
        // User is changing vote or voting for first time
        if (previousVote === 'up') {
          submission.votes.upvotes = Math.max(0, submission.votes.upvotes - 1);
        } else if (previousVote === 'down') {
          submission.votes.downvotes = Math.max(0, submission.votes.downvotes - 1);
        }

        // Add new vote
        if (vote === 'up') {
          submission.votes.upvotes++;
        } else {
          submission.votes.downvotes++;
        }
        submission.userVotes[userId] = vote;
      }

      // Auto-verify if enough upvotes
      if (submission.votes.upvotes >= 5 && submission.status === 'pending') {
        submission.status = 'verified';
      }

      await kv.set(SUBMISSIONS_KEY, submissions);
      return { success: true, submission };
    } catch (error) {
      console.error('[CommunityStore] Vote error:', error);
      return { success: false, error: 'Vote failed' };
    }
  }

  async hasUserVoted(submissionId: string, userId: string): Promise<'up' | 'down' | null> {
    try {
      const submission = await this.getSubmissionById(submissionId);
      if (!submission || !submission.userVotes) return null;
      return submission.userVotes[userId] || null;
    } catch (error) {
      return null;
    }
  }

  async moderate(submissionId: string, status: 'verified' | 'rejected', adminToken: string, notes?: string): Promise<{ success: boolean; submission?: CommunitySubmission; error?: string }> {
    try {
      if (adminToken !== ADMIN_TOKEN) {
        return { success: false, error: 'Invalid admin token' };
      }

      const submissions = await kv.get<CommunitySubmission[]>(SUBMISSIONS_KEY) || [];
      const submission = submissions.find(s => s.id === submissionId);
      
      if (!submission) {
        return { success: false, error: 'Submission not found' };
      }

      submission.status = status;
      if (notes) {
        submission.notes = notes;
      }

      await kv.set(SUBMISSIONS_KEY, submissions);
      return { success: true, submission };
    } catch (error) {
      console.error('[CommunityStore] Moderate error:', error);
      return { success: false, error: 'Moderation failed' };
    }
  }

  async getVerifiedHashes(): Promise<string[]> {
    try {
      const submissions = await kv.get<CommunitySubmission[]>(SUBMISSIONS_KEY) || [];
      return submissions
        .filter(s => s.status === 'verified')
        .map(s => s.report.fileMetadata.hash);
    } catch (error) {
      return [];
    }
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    verified: number;
    rejected: number;
    topContributors: Array<{ name: string; submissions: number; userId?: string }>;
  }> {
    try {
      const submissions = await kv.get<CommunitySubmission[]>(SUBMISSIONS_KEY) || [];
      
      const total = submissions.length;
      const pending = submissions.filter(s => s.status === 'pending').length;
      const verified = submissions.filter(s => s.status === 'verified').length;
      const rejected = submissions.filter(s => s.status === 'rejected').length;

      // Count submissions by contributor with userId
      const contributorCounts: Record<string, { count: number; userId?: string }> = {};
      submissions.forEach(s => {
        const key = s.submittedBy;
        if (!contributorCounts[key]) {
          contributorCounts[key] = { count: 0, userId: s.userId };
        }
        contributorCounts[key].count++;
      });

      const topContributors = Object.entries(contributorCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([name, data]) => ({ name, submissions: data.count, userId: data.userId }));

      return {
        total,
        pending,
        verified,
        rejected,
        topContributors,
      };
    } catch (error) {
      console.error('[CommunityStore] Get stats error:', error);
      return { total: 0, pending: 0, verified: 0, rejected: 0, topContributors: [] };
    }
  }

  async clear(): Promise<void> {
    await kv.del(SUBMISSIONS_KEY);
  }
}

export const communitySubmissions = new CommunitySubmissionsStore();
