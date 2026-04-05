import { createServerClient } from './supabase-client';
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

/**
 * Community Submissions Store with Supabase
 * Persistent across deployments with per-user voting
 */
class CommunitySubmissionsStore {
  private supabase = createServerClient();

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

      const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { error } = await this.supabase
        .from('community_submissions')
        .insert({
          id: submissionId,
          scan_id: report.id,
          submitted_by: submittedBy,
          user_id: userId || null,
          status: 'pending',
          report: report,
          upvotes: 0,
          downvotes: 0,
          details: details || null,
        });

      if (error) throw error;

      const submission: CommunitySubmission = {
        id: submissionId,
        scanId: report.id,
        submittedBy,
        userId,
        submittedAt: new Date().toISOString(),
        status: 'pending',
        report,
        votes: { upvotes: 0, downvotes: 0 },
        userVotes: {},
        details,
      };

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

      // Delete votes first
      await this.supabase
        .from('user_votes')
        .delete()
        .eq('submission_id', submissionId);

      // Delete submission
      const { error } = await this.supabase
        .from('community_submissions')
        .delete()
        .eq('id', submissionId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('[CommunityStore] Delete error:', error);
      return { success: false, error: 'Delete failed' };
    }
  }

  async getSubmissions(status?: 'pending' | 'verified' | 'rejected'): Promise<CommunitySubmission[]> {
    try {
      let query = this.supabase
        .from('community_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: submissions, error } = await query;

      if (error || !submissions) return [];

      const result: CommunitySubmission[] = [];

      for (const row of submissions) {
        // Get user votes for this submission
        const { data: votes } = await this.supabase
          .from('user_votes')
          .select('user_id, vote_type')
          .eq('submission_id', row.id);

        const userVotes: Record<string, 'up' | 'down'> = {};
        votes?.forEach((vote: any) => {
          userVotes[vote.user_id] = vote.vote_type;
        });

        result.push({
          id: row.id,
          scanId: row.scan_id,
          submittedBy: row.submitted_by,
          userId: row.user_id,
          submittedAt: row.submitted_at,
          status: row.status,
          report: row.report,
          votes: { upvotes: row.upvotes, downvotes: row.downvotes },
          userVotes,
          details: row.details,
        });
      }

      return result;
    } catch (error) {
      console.error('[CommunityStore] Get submissions error:', error);
      return [];
    }
  }

  async getSubmissionById(submissionId: string): Promise<CommunitySubmission | null> {
    try {
      const { data: row, error } = await this.supabase
        .from('community_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error || !row) return null;

      // Get user votes for this submission
      const { data: votes } = await this.supabase
        .from('user_votes')
        .select('user_id, vote_type')
        .eq('submission_id', row.id);

      const userVotes: Record<string, 'up' | 'down'> = {};
      votes?.forEach((vote: any) => {
        userVotes[vote.user_id] = vote.vote_type;
      });

      return {
        id: row.id,
        scanId: row.scan_id,
        submittedBy: row.submitted_by,
        userId: row.user_id,
        submittedAt: row.submitted_at,
        status: row.status,
        report: row.report,
        votes: { upvotes: row.upvotes, downvotes: row.downvotes },
        userVotes,
        details: row.details,
      };
    } catch (error) {
      console.error('[CommunityStore] Get submission error:', error);
      return null;
    }
  }

  async vote(submissionId: string, userId: string, vote: 'up' | 'down'): Promise<{ success: boolean; submission?: CommunitySubmission; error?: string }> {
    try {
      // Check if user already voted
      const { data: existingVote } = await this.supabase
        .from('user_votes')
        .select('vote_type')
        .eq('user_id', userId)
        .eq('submission_id', submissionId)
        .single();

      const previousVote = existingVote?.vote_type;

      if (previousVote === vote) {
        // User is toggling off their vote - remove it
        await this.supabase
          .from('user_votes')
          .delete()
          .eq('user_id', userId)
          .eq('submission_id', submissionId);

        // Decrement vote count
        if (vote === 'up') {
          await this.supabase.rpc('decrement_upvotes', { submission_id: submissionId });
        } else {
          await this.supabase.rpc('decrement_downvotes', { submission_id: submissionId });
        }
      } else {
        // Remove previous vote if exists
        if (previousVote) {
          await this.supabase
            .from('user_votes')
            .delete()
            .eq('user_id', userId)
            .eq('submission_id', submissionId);

          if (previousVote === 'up') {
            await this.supabase.rpc('decrement_upvotes', { submission_id: submissionId });
          } else {
            await this.supabase.rpc('decrement_downvotes', { submission_id: submissionId });
          }
        }

        // Add new vote
        await this.supabase
          .from('user_votes')
          .insert({
            user_id: userId,
            submission_id: submissionId,
            vote_type: vote,
          });

        // Increment vote count
        if (vote === 'up') {
          await this.supabase.rpc('increment_upvotes', { submission_id: submissionId });
        } else {
          await this.supabase.rpc('decrement_downvotes', { submission_id: submissionId });
        }
      }

      // Check if should auto-verify
      const submission = await this.getSubmissionById(submissionId);
      if (submission && submission.votes.upvotes >= 5 && submission.status === 'pending') {
        await this.supabase
          .from('community_submissions')
          .update({ status: 'verified' })
          .eq('id', submissionId);
        submission.status = 'verified';
      }

      return { success: true, submission };
    } catch (error) {
      console.error('[CommunityStore] Vote error:', error);
      return { success: false, error: 'Vote failed' };
    }
  }

  async hasUserVoted(submissionId: string, userId: string): Promise<'up' | 'down' | null> {
    try {
      const { data: vote, error } = await this.supabase
        .from('user_votes')
        .select('vote_type')
        .eq('user_id', userId)
        .eq('submission_id', submissionId)
        .single();

      if (error || !vote) return null;
      return vote.vote_type;
    } catch (error) {
      return null;
    }
  }

  async moderate(submissionId: string, status: 'verified' | 'rejected', adminToken: string, notes?: string): Promise<{ success: boolean; submission?: CommunitySubmission; error?: string }> {
    try {
      if (adminToken !== ADMIN_TOKEN) {
        return { success: false, error: 'Invalid admin token' };
      }

      const { error } = await this.supabase
        .from('community_submissions')
        .update({ status })
        .eq('id', submissionId);

      if (error) throw error;

      const submission = await this.getSubmissionById(submissionId);
      return { success: true, submission };
    } catch (error) {
      console.error('[CommunityStore] Moderate error:', error);
      return { success: false, error: 'Moderation failed' };
    }
  }

  async getVerifiedHashes(): Promise<string[]> {
    try {
      const { data: submissions, error } = await this.supabase
        .from('community_submissions')
        .select('report->hash')
        .eq('status', 'verified');

      if (error || !submissions) return [];
      return submissions.map((row: any) => row.report.hash);
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
      const { count: total } = await this.supabase
        .from('community_submissions')
        .select('*', { count: 'exact', head: true });

      const { count: pending } = await this.supabase
        .from('community_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: verified } = await this.supabase
        .from('community_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'verified');

      const { count: rejected } = await this.supabase
        .from('community_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');

      // Get top contributors
      const { data: contributors } = await this.supabase
        .from('community_submissions')
        .select('submitted_by, user_id');

      const contributorCounts: Record<string, { count: number; userId?: string }> = {};
      contributors?.forEach((row: any) => {
        const key = row.submitted_by;
        if (!contributorCounts[key]) {
          contributorCounts[key] = { count: 0, userId: row.user_id };
        }
        contributorCounts[key].count++;
      });

      const topContributors = Object.entries(contributorCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([name, data]) => ({ name, submissions: data.count, userId: data.userId }));

      return {
        total: total || 0,
        pending: pending || 0,
        verified: verified || 0,
        rejected: rejected || 0,
        topContributors,
      };
    } catch (error) {
      console.error('[CommunityStore] Get stats error:', error);
      return { total: 0, pending: 0, verified: 0, rejected: 0, topContributors: [] };
    }
  }
}

export const communitySubmissions = new CommunitySubmissionsStore();
