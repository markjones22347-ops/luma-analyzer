import { NextResponse } from 'next/server';
import { WebhookVerifier } from '@/lib/webhook-verifier';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'Webhook URLs array required' },
        { status: 400 }
      );
    }

    // Verify multiple webhooks
    const results = await WebhookVerifier.verifyMultiple(urls);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify webhooks' },
      { status: 500 }
    );
  }
}
