import { NextResponse } from 'next/server';
import { communitySubmissions } from '@/lib/community-submissions';
import { authStore } from '@/lib/auth-store';

const COOKIE_NAME = 'luma_session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'verified' | 'rejected' | undefined;
    const submissionId = searchParams.get('id');
    
    // Get user from cookie for vote checking
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader?.match(/luma_session=([^;]+)/)?.[1];
    let userId: string | undefined;
    
    if (token) {
      const session = await authStore.validateToken(token);
      if (session) {
        userId = session.userId;
      }
    }
    
    // Get single submission
    if (submissionId) {
      const submission = await communitySubmissions.getSubmissionById(submissionId);
      if (!submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }
      
      // Check user's vote on this submission
      const userVote = userId ? await communitySubmissions.hasUserVoted(submissionId, userId) : null;
      
      return NextResponse.json({
        success: true,
        submission,
        userVote,
      });
    }
    
    // Get all submissions
    const submissions = await communitySubmissions.getSubmissions(status);
    const stats = await communitySubmissions.getStats();

    return NextResponse.json({
      success: true,
      submissions,
      stats,
    });
  } catch (error) {
    console.error('[Community API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community submissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scanId, report, details } = body;

    if (!report) {
      return NextResponse.json(
        { error: 'Report data required' },
        { status: 400 }
      );
    }

    // Get user from cookie
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader?.match(/luma_session=([^;]+)/)?.[1];
    let userId: string | undefined;
    let username = 'Anonymous';
    
    if (token) {
      const session = await authStore.validateToken(token);
      if (session) {
        userId = session.userId;
        username = session.username;
        
        // Increment user's submission stat
        await authStore.incrementUserStat(userId, 'scriptsSubmitted');
      }
    }

    const result = await communitySubmissions.submit(
      report, 
      username,
      userId,
      details
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        submission: result.submission,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Community API] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { submissionId, adminToken } = body;

    if (!submissionId || !adminToken) {
      return NextResponse.json(
        { error: 'Submission ID and admin token required' },
        { status: 400 }
      );
    }

    const result = await communitySubmissions.delete(submissionId, adminToken);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('[Community API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    );
  }
}

// PUT for voting
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { submissionId, vote } = body;

    if (!submissionId || !vote || !['up', 'down'].includes(vote)) {
      return NextResponse.json(
        { error: 'Submission ID and vote (up/down) required' },
        { status: 400 }
      );
    }

    // Get user from cookie
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader?.match(/luma_session=([^;]+)/)?.[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const session = await authStore.validateToken(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const result = await communitySubmissions.vote(submissionId, session.userId, vote);

    if (result.success) {
      return NextResponse.json({
        success: true,
        submission: result.submission,
        userVote: vote,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Community API] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to vote' },
      { status: 500 }
    );
  }
}
