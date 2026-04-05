import { NextResponse } from 'next/server';
import { authStore } from '@/lib/auth-store';

const COOKIE_NAME = 'luma_session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    // Get user from cookie (for viewing own profile)
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader?.match(/luma_session=([^;]+)/)?.[1];
    let currentUserId: string | undefined;
    
    if (token) {
      const session = await authStore.validateToken(token);
      if (session) {
        currentUserId = session.userId;
      }
    }
    
    let user;
    if (username) {
      user = await authStore.getUserByUsername(username);
    } else if (currentUserId) {
      user = await authStore.getUserById(currentUserId);
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Remove sensitive info
    const { passwordHash, verificationCode, verificationExpiry, ...publicUser } = user;
    
    return NextResponse.json({
      success: true,
      user: publicUser,
      isOwnProfile: user.id === currentUserId,
    });
  } catch (error) {
    console.error('[Profile API] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bio } = body;
    
    // Get user from cookie
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader?.match(/luma_session=([^;]+)/)?.[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const session = await authStore.validateToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const result = await authStore.updateUser(session.userId, { bio });
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error('[Profile API] POST error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
