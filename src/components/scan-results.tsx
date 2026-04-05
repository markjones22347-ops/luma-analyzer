'use client';

import { motion } from 'framer-motion';
import { ScanReport } from '@/types';
import { AlertTriangle, CheckCircle, XCircle, FileText, Globe, Lock, Download, Shield } from 'lucide-react';

interface ScanResultsProps {
  report: ScanReport;
  onDownload: () => void;
}

const severityColors: Record<string, { text: string; bg: string; border: string }> = {
  info: { text: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
  low: { text: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
  medium: { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  high: { text: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
  critical: { text: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  headerCard: (glowColor: string) => ({
    backgroundColor: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(20px)',
    borderRadius: '28px',
    padding: '40px',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: `0 0 60px ${glowColor}`,
  }),
  headerContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '28px',
  },
  scoreCircle: {
    position: 'relative' as const,
    width: '140px',
    height: '140px',
    flexShrink: 0,
  },
  scoreText: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    fontWeight: 800,
    color: '#ffffff',
  },
  ratingBadge: (color: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 28px',
    borderRadius: '16px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: `2px solid ${color}`,
    color: color,
    fontWeight: 700,
    fontSize: '18px',
  }),
  summary: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '15px',
    textAlign: 'center' as const,
    maxWidth: '600px',
    lineHeight: 1.6,
  },
  downloadButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 28px',
    borderRadius: '14px',
    backgroundColor: 'rgba(59,130,246,0.15)',
    border: '1px solid rgba(59,130,246,0.3)',
    color: '#3b82f6',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '28px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  detectionItem: (severity: string) => ({
    padding: '18px',
    borderRadius: '16px',
    backgroundColor: severityColors[severity]?.bg || severityColors.info.bg,
    border: `1px solid ${severityColors[severity]?.border || severityColors.info.border}`,
    marginBottom: '12px',
  }),
  detectionTitle: (severity: string) => ({
    fontSize: '15px',
    fontWeight: 700,
    color: severityColors[severity]?.text || severityColors.info.text,
    marginBottom: '6px',
  }),
  detectionDesc: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.5,
  },
  urlItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '8px',
  },
  urlText: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'monospace',
    maxWidth: '70%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  riskBadge: (risk: string) => {
    const colors: Record<string, string> = {
      low: '#22c55e',
      medium: '#f59e0b',
      high: '#ef4444',
    };
    return {
      padding: '6px 14px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 700,
      backgroundColor: risk === 'high' ? 'rgba(239,68,68,0.2)' : risk === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)',
      color: colors[risk] || '#22c55e',
    };
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  metadataItem: {
    padding: '16px 20px',
    borderRadius: '14px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  metadataLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  metadataValue: {
    fontSize: '16px',
    color: '#ffffff',
    fontWeight: 600,
  },
  aiReasoning: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap' as const,
  },
};

export function ScanResults({ report, onDownload }: ScanResultsProps) {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'SAFE': return '#22c55e';
      case 'CAUTION': return '#f59e0b';
      case 'FLAGGED': return '#ef4444';
      default: return '#ffffff';
    }
  };

  const getRatingIcon = (rating: string) => {
    const color = getRatingColor(rating);
    const size = 28;
    switch (rating) {
      case 'SAFE':
        return <CheckCircle style={{ width: size, height: size, color }} />;
      case 'CAUTION':
        return <AlertTriangle style={{ width: size, height: size, color }} />;
      case 'FLAGGED':
        return <XCircle style={{ width: size, height: size, color }} />;
    }
  };

  const glowColor = report.rating === 'SAFE' ? 'rgba(34,197,94,0.15)' : 
                    report.rating === 'CAUTION' ? 'rgba(245,158,11,0.15)' : 
                    'rgba(239,68,68,0.15)';

  const ratingColor = getRatingColor(report.rating);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={styles.container}
    >
      {/* Header Card */}
      <div style={styles.headerCard(glowColor)}>
        <div style={styles.headerContent}>
          {/* Score Circle */}
          <div style={styles.scoreCircle}>
            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle
                cx="70"
                cy="70"
                r="64"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              <motion.circle
                cx="70"
                cy="70"
                r="64"
                fill="none"
                stroke={ratingColor}
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: report.riskScore / 100 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <div style={styles.scoreText}>{report.riskScore}</div>
          </div>

          {/* Rating Badge */}
          <div style={styles.ratingBadge(ratingColor)}>
            {getRatingIcon(report.rating)}
            <span>{report.rating}</span>
          </div>

          {/* Summary */}
          <p style={styles.summary}>{report.summary}</p>

          {/* Download Button */}
          <button
            onClick={onDownload}
            style={styles.downloadButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Download style={{ width: '18px', height: '18px' }} />
            <span>Download JSON Report</span>
          </button>
        </div>
      </div>

      {/* Detections */}
      {report.detections.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <Shield style={{ width: '22px', height: '22px', color: '#f59e0b' }} />
            Security Findings ({report.detections.reduce((acc, cat) => acc + cat.detections.length, 0)})
          </h3>
          {report.detections.map((category, catIdx) => (
            <div key={catIdx}>
              <h4 style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '14px', fontWeight: 600 }}>
                {category.name}
              </h4>
              {category.detections.map((detection, detIdx) => (
                <div key={detIdx} style={styles.detectionItem(detection.severity)}>
                  <div style={styles.detectionTitle(detection.severity)}>
                    {detection.title}
                  </div>
                  <p style={styles.detectionDesc}>{detection.description}</p>
                  {detection.line && (
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                      Line {detection.line}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* URLs Found */}
      {report.extractedUrls.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <Globe style={{ width: '22px', height: '22px', color: '#3b82f6' }} />
            URLs Found ({report.extractedUrls.length})
          </h3>
          {report.extractedUrls.map((url, idx) => (
            <div key={idx} style={styles.urlItem}>
              <span style={styles.urlText}>{url.url}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
                  {url.type}
                </span>
                <span style={styles.riskBadge(url.risk)}>{url.risk}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Info */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <FileText style={{ width: '22px', height: '22px', color: '#8b5cf6' }} />
          File Information
        </h3>
        <div style={styles.metadataGrid}>
          <div style={styles.metadataItem}>
            <p style={styles.metadataLabel}>Size</p>
            <p style={styles.metadataValue}>{(report.fileMetadata.size / 1024).toFixed(2)} KB</p>
          </div>
          <div style={styles.metadataItem}>
            <p style={styles.metadataLabel}>Lines</p>
            <p style={styles.metadataValue}>{report.lineCount.toLocaleString()}</p>
          </div>
          <div style={styles.metadataItem}>
            <p style={styles.metadataLabel}>Obfuscation</p>
            <p style={styles.metadataValue}>{report.obfuscationScore}%</p>
          </div>
          <div style={styles.metadataItem}>
            <p style={styles.metadataLabel}>Hash</p>
            <p style={styles.metadataValue}>{report.fileMetadata.hash.substring(0, 12)}...</p>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <Lock style={{ width: '22px', height: '22px', color: '#22c55e' }} />
          Analysis Details
        </h3>
        <div style={styles.aiReasoning}>{report.aiReasoning}</div>
      </div>
    </motion.div>
  );
}
