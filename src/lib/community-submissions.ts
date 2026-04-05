import { sql } from '@vercel/postgres';
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
 * Community Submissions Store with Vercel Postgres
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

      const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await sql`
        INSERT INTO community_submissions (id, scan_id, submitted_by, user_id, status, report, upvotes, downvotes, details)
        VALUES (${submissionId}, ${report.id}, ${submittedBy}, ${userId || null}, 'pending', ${JSON.stringify(report)}, 0, 0, ${details ? JSON.stringify(details) : null})
      `;

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

      // Delete votes first (foreign key constraint)
      await sql`DELETE FROM user_votes WHERE submission_id = ${submissionId}`;
      
      // Delete submission
      const result = await sql`DELETE FROM community_submissions WHERE id = ${submissionId}`;
      
      if (result.rowCount === 0) {
        return { success: false, error: 'Submission not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('[CommunityStore] Delete error:', error);
      return { success: false, error: 'Delete failed' };
    }
  }

  async getSubmissions(status?: 'pending' | 'verified' | 'rejected'): Promise<CommunitySubmission[]> {
    try {
      let result;
      if (status) {
        result = await sql`
          SELECT * FROM community_submissions WHERE status = ${status} ORDER BY submitted_at DESC
        `;
      } else {
        result = await sql`
          SELECT * FROM community_submissions ORDER BY submitted_at DESC
        `;
      }

      const submissions: CommunitySubmission[] = [];
      
      for (const row of result.rows) {
        // Get user votes for this submission
        const votesResult = await sql`
          SELECT user_id, vote_type FROM user_votes WHERE submission_id = ${row.id}
        `;
        
        const userVotes: Record<string, 'up' | 'down'> = {};
        votesResult.rows.forEach((vote: { user_id: string; vote_type: 'up' | 'down' }) => {
          userVotes[vote.user_id] = vote.vote_type;
        });

        submissions.push({
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

      return submissions;
    } catch (error) {
      console.error('[CommunityStore] Get submissions error:', error);
      return [];
    }
  }

  async getSubmissionById(submissionId: string): Promise<CommunitySubmission | null> {
    try {
      const result = await sql`SELECT * FROM community_submissions WHERE id = ${submissionId}`;
      
      if (result.rowCount === 0) return null;

      const row = result.rows[0];
      
      // Get user votes for this submission
      const votesResult = await sql`
        SELECT user_id, vote_type FROM user_votes WHERE submission_id = ${row.id}
      `;
      
      const userVotes: Record<string, 'up' | 'down'> = {};
      votesResult.rows.forEach((vote: { user_id: string; vote_type: 'up' | 'down' }) => {
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
      const existingVote = await sql`
        SELECT vote_type FROM user_votes WHERE user_id = ${userId} AND submission_id = ${submissionId}
      `;

      const previousVote = existingVote.rowCount > 0 ? existingVote.rows[0].vote_type : null;

      if (previousVote === vote) {
        // User is toggling off their vote - remove it
        await sql`DELETE FROM user_votes WHERE user_id = ${userId} AND submission_id = ${submissionId}`;
        
        // Decrement vote count
        if (vote === 'up') {
          await sql`UPDATE community_submissions SET upvotes = upvotes - 1 WHERE id = ${submissionId}`;
        } else {
          await sql`UPDATE community_submissions SET downvotes = downvotes - 1 WHERE id = ${submissionId}`;
        }
      } else {
        // Remove previous vote if exists
        if (previousVote) {
          await sql`DELETE FROM user_votes WHERE user_id = ${userId} AND submission_id = ${submissionId}`;
          if (previousVote === 'up') {
            await sql`UPDATE community_submissions SET upvotes = upvotes - 1 WHERE id = ${submissionId}`;
          } else {
            await sql`UPDATE community_submissions SET downvotes = downvotes - 1 WHERE id = ${submissionId}`;
          }
        }

        // Add new vote
        await sql`
          INSERT INTO user_votes (user_id, submission_id, vote_type)
          VALUES (${userId}, ${submissionId}, ${vote})
        `;

        // Increment vote count
        if (vote === 'up') {
          await sql`UPDATE community_submissions SET upvotes = upvotes + 1 WHERE id = ${submissionId}`;
        } else {
          await sql`UPDATE community_submissions SET downvotes = downvotes + 1 WHERE id = ${submissionId}`;
        }
      }

      // Check if should auto-verify
      const submission = await this.getSubmissionById(submissionId);
      if (submission && submission.votes.upvotes >= 5 && submission.status === 'pending') {
        await sql`UPDATE community_submissions SET status = 'verified' WHERE id = ${submissionId}`;
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
      const result = await sql`
        SELECT vote_type FROM user_votes WHERE user_id = ${userId} AND submission_id = ${submissionId}
      `;
      
      if (result.rowCount === 0) return null;
      return result.rows[0].vote_type;
    } catch (error) {
      return null;
    }
  }

  async moderate(submissionId: string, status: 'verified' | 'rejected', adminToken: string, notes?: string): Promise<{ success: boolean; submission?: CommunitySubmission; error?: string }> {
    try {
      if (adminToken !== ADMIN_TOKEN) {
        return { success: false, error: 'Invalid admin token' };
      }

      const result = await sql`
        UPDATE community_submissions SET status = ${status} WHERE id = ${submissionId} RETURNING *
      `;
      
      if (result.rowCount === 0) {
        return { success: false, error: 'Submission not found' };
      }

      const submission = await this.getSubmissionById(submissionId);
      return { success: true, submission };
    } catch (error) {
      console.error('[CommunityStore] Moderate error:', error);
      return { success: false, error: 'Moderation failed' };
    }
  }

  async getVerifiedHashes(): Promise<string[]> {
    try {
      const result = await sql`
        SELECT report->>'hash' as hash FROM community_submissions WHERE status = 'verified'
      `;
      return result.rows.map((row: { hash: string }) => row.hash);
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
      const totalResult = await sql`SELECT COUNT(*) as count FROM community_submissions`;
      const pendingResult = await sql`SELECT COUNT(*) as count FROM community_submissions WHERE status = 'pending'`;
      const verifiedResult = await sql`SELECT COUNT(*) as count FROM community_submissions WHERE status = 'verified'`;
      const rejectedResult = await sql`SELECT COUNT(*) as count FROM community_submissions WHERE status = 'rejected'`;

      // Get top contributors
      const contributorsResult = await sql`
        SELECT submitted_by, user_id, COUNT(*) as count 
        FROM community_submissions 
        GROUP BY submitted_by, user_id 
        ORDER BY count DESC 
        LIMIT 10
      `;

      const topContributors = contributorsResult.rows.map((row: { submitted_by: string; user_id: string; count: string }) => ({
        name: row.submitted_by,
        userId: row.user_id,
        submissions: parseInt(row.count),
      }));

      return {
        total: parseInt(totalResult.rows[0].count),
        pending: parseInt(pendingResult.rows[0].count),
        verified: parseInt(verifiedResult.rows[0].count),
        rejected: parseInt(rejectedResult.rows[0].count),
        topContributors,
      };
    } catch (error) {
      console.error('[CommunityStore] Get stats error:', error);
      return { total: 0, pending: 0, verified: 0, rejected: 0, topContributors: [] };
    }
  }
}

export const communitySubmissions = new CommunitySubmissionsStore();
