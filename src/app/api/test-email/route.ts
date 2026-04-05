import { NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/email';

export async function GET() {
  const testEmail = process.env.GMAIL_USER || 'not-configured';
  
  const result = await sendVerificationEmail(testEmail, 'TestUser', '123456');
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    gmailConfigured: !!process.env.GMAIL_USER,
    passwordConfigured: !!process.env.GMAIL_APP_PASSWORD,
    testResult: result,
  });
}
