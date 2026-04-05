import { ScanReport } from '@/types';

export interface CommunitySubmission {
  id: string;
  scanId: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'verified' | 'rejected';
  report: ScanReport;
  votes: {
    upvotes: number;
    downvotes: number;
  };
  notes?: string;
}

/**
 * Community Submissions Store
 * Allows users to submit malicious scripts to the community database
 */
class CommunitySubmissionsStore {
  private submissions: CommunitySubmission[] = [];
  private maxSize = 1000;

  /**
   * Submit a scan report to the community database
   */
  submit(report: ScanReport, submittedBy: string = 'Anonymous'): CommunitySubmission {
    // Only allow submissions for medium+ risk scores
    if (report.riskScore < 41) {
      throw new Error('Only scripts with MODERATE risk or higher can be submitted');
    }

    const submission: CommunitySubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scanId: report.id,
      submittedBy,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      report,
      votes: {
        upvotes: 0,
        downvotes: 0,
      },
    };

    this.submissions.push(submission);
    
    if (this.submissions.length > this.maxSize) {
      this.submissions.shift();
    }

    return submission;
  }

  /**
   * Get all submissions (for admin/community view)
   */
  getSubmissions(status?: 'pending' | 'verified' | 'rejected'): CommunitySubmission[] {
    if (status) {
      return this.submissions.filter(s => s.status === status);
    }
    return [...this.submissions].reverse(); // Newest first
  }

  /**
   * Vote on a submission
   */
  vote(submissionId: string, vote: 'up' | 'down'): CommunitySubmission | null {
    const submission = this.submissions.find(s => s.id === submissionId);
    if (!submission) return null;

    if (vote === 'up') {
      submission.votes.upvotes++;
    } else {
      submission.votes.downvotes++;
    }

    // Auto-verify if enough upvotes
    if (submission.votes.upvotes >= 5 && submission.status === 'pending') {
      submission.status = 'verified';
    }

    return submission;
  }

  /**
   * Moderate a submission (admin only)
   */
  moderate(submissionId: string, status: 'verified' | 'rejected', notes?: string): CommunitySubmission | null {
    const submission = this.submissions.find(s => s.id === submissionId);
    if (!submission) return null;

    submission.status = status;
    if (notes) {
      submission.notes = notes;
    }

    return submission;
  }

  /**
   * Get verified malicious hashes from community
   */
  getVerifiedHashes(): string[] {
    return this.submissions
      .filter(s => s.status === 'verified')
      .map(s => s.report.fileMetadata.hash);
  }

  /**
   * Get statistics for display
   */
  getStats(): {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
    topContributors: Array<{ name: string; submissions: number }>;
  } {
    const total = this.submissions.length;
    const pending = this.submissions.filter(s => s.status === 'pending').length;
    const verified = this.submissions.filter(s => s.status === 'verified').length;
    const rejected = this.submissions.filter(s => s.status === 'rejected').length;

    // Count submissions by contributor
    const contributorCounts: Record<string, number> = {};
    this.submissions.forEach(s => {
      contributorCounts[s.submittedBy] = (contributorCounts[s.submittedBy] || 0) + 1;
    });

    const topContributors = Object.entries(contributorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, submissions]) => ({ name, submissions }));

    return {
      total,
      pending,
      verified,
      rejected,
      topContributors,
    };
  }

  clear() {
    this.submissions = [];
  }
}

export const communitySubmissions = new CommunitySubmissionsStore();
