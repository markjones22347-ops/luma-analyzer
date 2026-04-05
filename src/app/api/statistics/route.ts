import { NextResponse } from 'next/server';
import { statisticsStore } from '@/lib/statistics';

export async function GET() {
  try {
    const stats = statisticsStore.getStatistics();
    const recentScans = statisticsStore.getRecentScans(20);

    return NextResponse.json({
      success: true,
      statistics: stats,
      recentScans,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
