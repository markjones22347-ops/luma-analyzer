import { reportStore } from '@/lib/store';

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
      { error: 'Report not found or expired' },
      { status: 404 }
    );
  }

  return Response.json({ report });
}
