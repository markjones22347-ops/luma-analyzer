'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Activity, Shield, AlertTriangle, FileCheck } from 'lucide-react';

interface StatisticsData {
  totalScans: number;
  safeScans: number;
  lowRiskScans: number;
  moderateRiskScans: number;
  highRiskScans: number;
  criticalScans: number;
  totalDetections: number;
  averageScore: number;
  topThreats: Array<{ name: string; count: number }>;
  scansByDay: Array<{ date: string; count: number }>;
}

const styles = {
  container: {
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#ffffff',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  statLabel: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#ffffff',
  },
  statIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '16px',
  },
  threatItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  threatName: {
    fontSize: '14px',
    color: '#ffffff',
  },
  threatCount: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  riskDistribution: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  riskBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  riskLabel: {
    width: '100px',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  progressBg: {
    flex: 1,
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: (color: string, percent: number) => ({
    height: '100%',
    width: `${percent}%`,
    backgroundColor: color,
    borderRadius: '4px',
  }),
  riskValue: {
    width: '40px',
    fontSize: '13px',
    color: '#ffffff',
    textAlign: 'right' as const,
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
};

const riskColors: Record<string, string> = {
  safe: '#22c55e',
  low: '#f59e0b',
  moderate: '#f97316',
  high: '#ef4444',
  critical: '#dc2626',
};

export function StatisticsDashboard() {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/statistics');
      if (response.ok) {
        const data = await response.json();
        setStats(data.statistics);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>Loading statistics...</div>
      </div>
    );
  }

  if (!stats || stats.totalScans === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <BarChart3 style={{ width: '24px', height: '24px', color: '#ffffff' }} />
          <h2 style={styles.title}>Statistics Dashboard</h2>
        </div>
        <div style={styles.emptyState}>
          <Activity style={{ width: '48px', height: '48px', marginBottom: '16px', opacity: 0.3 }} />
          <p>No scan data available yet.</p>
          <p style={{ fontSize: '13px', marginTop: '8px' }}>Analyze some scripts to see statistics.</p>
        </div>
      </div>
    );
  }

  const totalRiskScans = stats.safeScans + stats.lowRiskScans + stats.moderateRiskScans + stats.highRiskScans + stats.criticalScans;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <BarChart3 style={{ width: '24px', height: '24px', color: '#ffffff' }} />
        <h2 style={styles.title}>Statistics Dashboard</h2>
      </div>

      {/* Stats Grid */}
      <div style={styles.grid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <Activity style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
          </div>
          <div style={styles.statLabel}>Total Scans</div>
          <div style={styles.statValue}>{stats.totalScans.toLocaleString()}</div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
            <Shield style={{ width: '20px', height: '20px', color: '#22c55e' }} />
          </div>
          <div style={styles.statLabel}>Safe</div>
          <div style={styles.statValue}>{stats.safeScans.toLocaleString()}</div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <AlertTriangle style={{ width: '20px', height: '20px', color: '#ef4444' }} />
          </div>
          <div style={styles.statLabel}>Threats Found</div>
          <div style={styles.statValue}>{stats.totalDetections.toLocaleString()}</div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
            <FileCheck style={{ width: '20px', height: '20px', color: '#8b5cf6' }} />
          </div>
          <div style={styles.statLabel}>Avg Score</div>
          <div style={styles.statValue}>{stats.averageScore}/100</div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Risk Distribution</h3>
        <div style={styles.riskDistribution}>
          {[
            { label: 'Safe', count: stats.safeScans, color: riskColors.safe },
            { label: 'Low Risk', count: stats.lowRiskScans, color: riskColors.low },
            { label: 'Moderate', count: stats.moderateRiskScans, color: riskColors.moderate },
            { label: 'High Risk', count: stats.highRiskScans, color: riskColors.high },
            { label: 'Critical', count: stats.criticalScans, color: riskColors.critical },
          ].map((item) => {
            const percent = totalRiskScans > 0 ? (item.count / totalRiskScans) * 100 : 0;
            return (
              <div key={item.label} style={styles.riskBar}>
                <span style={styles.riskLabel}>{item.label}</span>
                <div style={styles.progressBg}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.5 }}
                    style={styles.progressFill(item.color, percent)}
                  />
                </div>
                <span style={styles.riskValue}>{item.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Threats */}
      {stats.topThreats.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Top Threats</h3>
          {stats.topThreats.slice(0, 5).map((threat, index) => (
            <div key={index} style={styles.threatItem}>
              <span style={styles.threatName}>{threat.name}</span>
              <span style={styles.threatCount}>{threat.count} detections</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
