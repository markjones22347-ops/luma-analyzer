import { ScanReport } from '@/types';

interface Statistics {
  totalScans: number;
  safeScans: number;
  lowRiskScans: number;
  moderateRiskScans: number;
  highRiskScans: number;
  criticalScans: number;
  totalDetections: number;
  topThreats: Array<{ name: string; count: number }>;
  scansByDay: Array<{ date: string; count: number }>;
  averageScore: number;
  topMaliciousPatterns: Array<{ pattern: string; count: number }>;
}

/**
 * Statistics Store
 * In-memory storage for scan statistics
 */
class StatisticsStore {
  private scans: ScanReport[] = [];
  private maxSize = 10000;

  addScan(report: ScanReport) {
    this.scans.push(report);
    if (this.scans.length > this.maxSize) {
      this.scans.shift();
    }
  }

  getStatistics(): Statistics {
    const totalScans = this.scans.length;
    
    // Count by risk level
    const safeScans = this.scans.filter(s => s.riskScore <= 20).length;
    const lowRiskScans = this.scans.filter(s => s.riskScore > 20 && s.riskScore <= 40).length;
    const moderateRiskScans = this.scans.filter(s => s.riskScore > 40 && s.riskScore <= 60).length;
    const highRiskScans = this.scans.filter(s => s.riskScore > 60 && s.riskScore <= 80).length;
    const criticalScans = this.scans.filter(s => s.riskScore > 80).length;

    // Total detections
    const totalDetections = this.scans.reduce((acc, scan) => 
      acc + scan.detections.reduce((d, cat) => d + cat.detections.length, 0), 0
    );

    // Average score
    const averageScore = totalScans > 0 
      ? Math.round(this.scans.reduce((acc, s) => acc + s.riskScore, 0) / totalScans)
      : 0;

    // Top threats
    const threatCounts: Record<string, number> = {};
    this.scans.forEach(scan => {
      scan.detections.forEach(cat => {
        cat.detections.forEach(det => {
          threatCounts[det.title] = (threatCounts[det.title] || 0) + 1;
        });
      });
    });
    const topThreats = Object.entries(threatCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Scans by day (last 30 days)
    const scansByDay: Record<string, number> = {};
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      scansByDay[date.toISOString().split('T')[0]] = 0;
    }
    
    this.scans.forEach(scan => {
      const date = scan.timestamp.split('T')[0];
      if (scansByDay[date] !== undefined) {
        scansByDay[date]++;
      }
    });

    const scansByDayArray = Object.entries(scansByDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    // Top malicious patterns
    const patternCounts: Record<string, number> = {};
    this.scans.forEach(scan => {
      scan.detections.forEach(cat => {
        if (cat.name.includes('Malicious') || cat.name.includes('Threat')) {
          patternCounts[cat.name] = (patternCounts[cat.name] || 0) + 1;
        }
      });
    });
    
    const topMaliciousPatterns = Object.entries(patternCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }));

    return {
      totalScans,
      safeScans,
      lowRiskScans,
      moderateRiskScans,
      highRiskScans,
      criticalScans,
      totalDetections,
      topThreats,
      scansByDay: scansByDayArray,
      averageScore,
      topMaliciousPatterns,
    };
  }

  getRecentScans(limit: number = 50): ScanReport[] {
    return this.scans.slice(-limit).reverse();
  }

  clear() {
    this.scans = [];
  }
}

export const statisticsStore = new StatisticsStore();
