import { NextResponse } from 'next/server';
import { communitySubmissions } from '@/lib/community-submissions';
import { authStore } from '@/lib/auth-store';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { vote } = body;
    const { id } = params;

    if (!vote || !['up', 'down'].includes(vote)) {
      return NextResponse.json(
        { error: 'Vote must be "up" or "down"' },
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

    const result = await communitySubmissions.vote(id, session.userId, vote);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to vote' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: result.submission,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to vote' },
      { status: 500 }
    );
  }
}
