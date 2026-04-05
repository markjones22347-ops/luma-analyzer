import { NextResponse } from 'next/server';
import { authStore } from '@/lib/auth-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, username, password } = body;

    if (action === 'register') {
      const result = authStore.register(username, password);
      if (result.success) {
        // Auto-login after register
        const loginResult = authStore.login(username, password);
        return NextResponse.json({
          success: true,
          user: { id: result.user!.id, username: result.user!.username },
          token: loginResult.session!.token,
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
    } else if (action === 'login') {
      const result = authStore.login(username, password);
      if (result.success) {
        return NextResponse.json({
          success: true,
          user: { id: result.session!.userId, username: result.session!.username },
          token: result.session!.token,
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 401 }
        );
      }
    } else if (action === 'logout') {
      const { token } = body;
      authStore.logout(token);
      return NextResponse.json({ success: true });
    } else if (action === 'verify') {
      const { token } = body;
      const session = authStore.validateToken(token);
      if (session) {
        return NextResponse.json({
          success: true,
          user: { id: session.userId, username: session.username },
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid token' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
