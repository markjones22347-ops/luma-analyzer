import { LuaAnalyzer } from '@/lib/scanner/lua-analyzer';
import { reportStore } from '@/lib/store';
import { rateLimiter } from '@/lib/rate-limiter';
import { statisticsStore } from '@/lib/statistics';
import { WebhookNotifier } from '@/lib/webhook-notifier';

export async function POST(request: Request) {
  try {
    // Rate limiting check
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateCheck = rateLimiter.isAllowed(ip);
    
    if (!rateCheck.allowed) {
      return Response.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateCheck.blockTime || 60000) / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateCheck.blockTime || 60000) / 1000)),
          },
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const code = formData.get('code') as string | null;
    const webhookUrl = formData.get('webhookUrl') as string | null;

    let scriptContent: string;
    let filename: string | undefined;

    if (file) {
      // Handle file upload
      if (!file.name.endsWith('.lua') && !file.name.endsWith('.txt')) {
        return Response.json(
          { error: 'Invalid file type. Please upload a .lua or .txt file.' },
          { status: 400 }
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        return Response.json(
          { error: 'File too large. Maximum size is 5MB.' },
          { status: 400 }
        );
      }

      scriptContent = await file.text();
      filename = file.name;
    } else if (code) {
      // Handle direct code paste
      if (code.length > 5 * 1024 * 1024) {
        return Response.json(
          { error: 'Code too long. Maximum length is 5MB.' },
          { status: 400 }
        );
      }
      scriptContent = code;
    } else {
      return Response.json(
        { error: 'No file or code provided.' },
        { status: 400 }
      );
    }

    // Run analysis
    const analyzer = new LuaAnalyzer();
    const report = await analyzer.analyze(scriptContent, filename);

    // Store report
    reportStore.set(report.id, report);

    // Track statistics
    statisticsStore.addScan(report);

    // Send webhook notification if requested
    if (webhookUrl) {
      try {
        // Fire and forget - don't block response
        WebhookNotifier.sendToDiscord(webhookUrl, {
          id: report.id,
          riskScore: report.riskScore,
          rating: report.rating,
          summary: report.summary,
          detections: report.detections,
          fileMetadata: report.fileMetadata,
        }).catch(console.error);
      } catch (e) {
        console.error('Webhook notification error:', e);
      }
    }

    return Response.json({ 
      success: true, 
      reportId: report.id,
      report: report,
      rateLimit: {
        remaining: rateCheck.remaining,
        resetTime: rateCheck.resetTime,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return Response.json(
      { error: 'Failed to analyze script. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get('id');

  if (!reportId) {
    return Response.json(
      { error: 'Report ID required' },
      { status: 400 }
    );
  }

  const report = reportStore.get(reportId);

  if (!report) {
    return Response.json(
      { error: 'Report not found' },
      { status: 404 }
    );
  }

  return Response.json({ report });
}
