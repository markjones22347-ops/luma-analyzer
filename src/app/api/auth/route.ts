import { NextResponse } from 'next/server';
import { authStore } from '@/lib/auth-store';
import { sendVerificationEmail } from '@/lib/email';

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
      const result = await authStore.register(username, email, password);
      if (result.success) {
        // Send actual verification email via Gmail
        const emailResult = await sendVerificationEmail(
          email,
          username,
          result.user!.verificationCode!
        );
        
        if (!emailResult.success) {
          return NextResponse.json(
            { success: false, error: 'Failed to send verification email. Please try again.' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          user: { id: result.user!.id, username: result.user!.username, email: result.user!.email },
          message: 'Registration successful. Please check your email for the verification code.',
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
    } else if (action === 'verify-email') {
      const result = await authStore.verifyEmail(username, code);
      if (result.success) {
        // Auto-login after verification
        const user = await authStore.getUserByUsername(username);
        if (user) {
          const loginResult = await authStore.login(username, user.passwordHash);
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
      const result = await authStore.resendVerification(username);
      if (result.success) {
        const user = await authStore.getUserByUsername(username);
        if (user) {
          // Send new verification email
          const emailResult = await sendVerificationEmail(
            user.email,
            username,
            result.code!
          );
          
          if (!emailResult.success) {
            return NextResponse.json(
              { success: false, error: 'Failed to send verification email.' },
              { status: 500 }
            );
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'New verification code sent to your email.',
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
    } else if (action === 'login') {
      const result = await authStore.login(username, password);
      if (result.success) {
        const response = NextResponse.json({
          success: true,
          user: { id: result.session!.userId, username: result.session!.username, email: result.session!.email, emailVerified: true },
        });
        response.cookies.set(COOKIE_NAME, result.session!.token, COOKIE_OPTIONS);
        return response;
      } else {
        // Check if needs verification
        if (result.needsVerification) {
          return NextResponse.json({
            success: false,
            error: result.error,
            needsVerification: true,
            username: username,
          }, { status: 403 });
        }
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 401 }
        );
      }
    } else if (action === 'logout') {
      if (existingToken) {
        await authStore.logout(existingToken);
      }
      const response = NextResponse.json({ success: true });
      response.cookies.delete(COOKIE_NAME);
      return response;
    } else if (action === 'verify') {
      if (existingToken) {
        const session = await authStore.validateToken(existingToken);
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
        const session = await authStore.validateToken(existingToken);
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
    console.error('[Auth API] Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
