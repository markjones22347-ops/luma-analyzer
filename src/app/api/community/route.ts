import { NextResponse } from 'next/server';
import { communitySubmissions } from '@/lib/community-submissions';
import { authStore } from '@/lib/auth-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'verified' | 'rejected' | undefined;
    
    const submissions = communitySubmissions.getSubmissions(status);
    const stats = communitySubmissions.getStats();

    return NextResponse.json({
      success: true,
      submissions,
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch community submissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scanId, submittedBy, userId, report, details, token } = body;

    if (!report) {
      return NextResponse.json(
        { error: 'Report data required' },
        { status: 400 }
      );
    }

    // Validate user if token provided
    let validatedUserId = userId;
    let validatedUsername = submittedBy || 'Anonymous';
    
    if (token) {
      const session = authStore.validateToken(token);
      if (session) {
        validatedUserId = session.userId;
        validatedUsername = session.username;
      }
    }

    const submission = communitySubmissions.submit(
      report, 
      validatedUsername,
      validatedUserId,
      details
    );

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error) {
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

    const result = communitySubmissions.delete(submissionId, adminToken);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 403 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    );
  }
}
