import { NextResponse } from 'next/server';
import { authStore } from '@/lib/auth-store';

const COOKIE_NAME = 'luma_session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days
  path: '/',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, username, email, password, code } = body;

    // Get existing session from cookie
    const cookieHeader = request.headers.get('cookie');
    const existingToken = cookieHeader?.match(/luma_session=([^;]+)/)?.[1];

    if (action === 'register') {
      const result = authStore.register(username, email, password);
      if (result.success) {
        // Return verification code for demo (in production, send email)
        return NextResponse.json({
          success: true,
          user: { id: result.user!.id, username: result.user!.username, email: result.user!.email },
          verificationCode: result.user!.verificationCode, // Remove in production - send actual email
          message: 'Registration successful. Please verify your email.',
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
    } else if (action === 'verify-email') {
      const result = authStore.verifyEmail(username, code);
      if (result.success) {
        // Auto-login after verification
        const user = authStore.getUserByUsername(username);
        if (user) {
          const loginResult = authStore.login(username, user.passwordHash);
          if (loginResult.success) {
            const response = NextResponse.json({
              success: true,
              user: { id: loginResult.session!.userId, username: loginResult.session!.username, email: loginResult.session!.email, emailVerified: true },
              message: 'Email verified successfully.',
            });
            response.cookies.set(COOKIE_NAME, loginResult.session!.token, COOKIE_OPTIONS);
            return response;
          }
        }
      }
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    } else if (action === 'resend-verification') {
      const result = authStore.resendVerification(username);
      if (result.success) {
        return NextResponse.json({
          success: true,
          verificationCode: result.code, // Remove in production - send actual email
          message: 'Verification code resent.',
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
        // Check if email is verified
        const user = authStore.getUserByUsername(username);
        if (user && !user.emailVerified) {
          return NextResponse.json({
            success: false,
            error: 'Please verify your email before logging in',
            needsVerification: true,
            username: user.username,
          }, { status: 403 });
        }

        const response = NextResponse.json({
          success: true,
          user: { id: result.session!.userId, username: result.session!.username, email: result.session!.email, emailVerified: true },
        });
        response.cookies.set(COOKIE_NAME, result.session!.token, COOKIE_OPTIONS);
        return response;
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 401 }
        );
      }
    } else if (action === 'logout') {
      if (existingToken) {
        authStore.logout(existingToken);
      }
      const response = NextResponse.json({ success: true });
      response.cookies.delete(COOKIE_NAME);
      return response;
    } else if (action === 'verify') {
      if (existingToken) {
        const session = authStore.validateToken(existingToken);
        if (session) {
          return NextResponse.json({
            success: true,
            user: { id: session.userId, username: session.username, email: session.email, emailVerified: session.emailVerified },
          });
        }
      }
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    } else if (action === 'check-session') {
      if (existingToken) {
        const session = authStore.validateToken(existingToken);
        if (session) {
          return NextResponse.json({
            success: true,
            user: { id: session.userId, username: session.username, email: session.email, emailVerified: session.emailVerified },
          });
        }
      }
      return NextResponse.json({ success: false });
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
