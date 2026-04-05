import { NextResponse } from 'next/server';
import { communitySubmissions } from '@/lib/community-submissions';

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
    const { scanId, submittedBy, report } = body;

    if (!report) {
      return NextResponse.json(
        { error: 'Report data required' },
        { status: 400 }
      );
    }

    const submission = communitySubmissions.submit(report, submittedBy || 'Anonymous');

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
