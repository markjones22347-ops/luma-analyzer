'use client';

import { motion } from 'framer-motion';
import { ScanReport } from '@/types';
import { AlertTriangle, CheckCircle, XCircle, FileText, Globe, Lock, Download, Shield, Code } from 'lucide-react';

interface ScanResultsProps {
  report: ScanReport;
  onDownload: () => void;
}

const severityColors: Record<string, { text: string; bg: string; border: string }> = {
  info: { text: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
  low: { text: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.15)' },
  medium: { text: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.15)' },
  high: { text: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.15)' },
  critical: { text: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  headerCard: (glowColor: string) => ({
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    padding: '32px',
    border: '1px solid rgba(255,255,255,0.06)',
  }),
  headerContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '20px',
  },
  scoreCircle: {
    position: 'relative' as const,
    width: '120px',
    height: '120px',
    flexShrink: 0,
  },
  scoreText: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 700,
    color: '#ffffff',
  },
  ratingBadge: (color: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: `1px solid ${color}`,
    color: color,
    fontWeight: 600,
    fontSize: '16px',
  }),
  summary: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    textAlign: 'center' as const,
    maxWidth: '500px',
    lineHeight: 1.5,
  },
  downloadButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.8)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  detectionItem: (severity: string) => ({
    padding: '14px',
    borderRadius: '8px',
    backgroundColor: severityColors[severity]?.bg || severityColors.info.bg,
    border: `1px solid ${severityColors[severity]?.border || severityColors.info.border}`,
    marginBottom: '8px',
  }),
  detectionTitle: (severity: string) => ({
    fontSize: '14px',
    fontWeight: 600,
    color: severityColors[severity]?.text || severityColors.info.text,
    marginBottom: '4px',
  }),
  detectionDesc: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.4,
  },
  urlItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '6px',
  },
  urlText: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'monospace',
    maxWidth: '70%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  riskBadge: (risk: string) => {
    const colors: Record<string, string> = {
      low: '#4ade80',
      medium: '#fbbf24',
      high: '#f87171',
    };
    return {
      padding: '4px 10px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      backgroundColor: risk === 'high' ? 'rgba(248,113,113,0.15)' : risk === 'medium' ? 'rgba(251,191,36,0.15)' : 'rgba(74,222,128,0.15)',
      color: colors[risk] || '#4ade80',
    };
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '12px',
  },
  metadataItem: {
    padding: '12px 14px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  metadataLabel: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  metadataValue: {
    fontSize: '14px',
    color: '#ffffff',
    fontWeight: 500,
  },
  aiReasoningBox: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: 'rgba(255,255,255,0.7)',
  },
};

export function ScanResults({ report, onDownload }: ScanResultsProps) {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'SAFE': return '#4ade80';
      case 'CAUTION': return '#fbbf24';
      case 'FLAGGED': return '#ef4444';
      default: return '#ffffff';
    }
  };

  const getRatingIcon = (rating: string) => {
    const color = getRatingColor(rating);
    const size = 20;
    switch (rating) {
      case 'SAFE':
        return <CheckCircle style={{ width: size, height: size, color }} />;
      case 'CAUTION':
        return <AlertTriangle style={{ width: size, height: size, color }} />;
      case 'FLAGGED':
        return <XCircle style={{ width: size, height: size, color }} />;
    }
  };

  const ratingColor = getRatingColor(report.rating);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={styles.container}
    >
      {/* Header Card */}
      <div style={styles.headerCard(ratingColor)}>
        <div style={styles.headerContent}>
          {/* Score Circle */}
          <div style={styles.scoreCircle}>
            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="6"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={ratingColor}
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: report.riskScore / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
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
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            <Download style={{ width: '16px', height: '16px' }} />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* AI Analysis - Rendered HTML */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <Code style={{ width: '18px', height: '18px', color: 'rgba(255,255,255,0.5)' }} />
          Analysis Details
        </h3>
        <div 
          style={styles.aiReasoningBox}
          dangerouslySetInnerHTML={{ __html: report.aiReasoning }}
        />
      </div>

      {/* Detections */}
      {report.detections.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <Shield style={{ width: '18px', height: '18px', color: 'rgba(255,255,255,0.5)' }} />
            Security Findings
          </h3>
          {report.detections.map((category, catIdx) => (
            <div key={catIdx} style={{ marginBottom: catIdx < report.detections.length - 1 ? '20px' : 0 }}>
              <h4 style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', fontWeight: 500 }}>
                {category.name}
              </h4>
              {category.detections.map((detection, detIdx) => (
                <div key={detIdx} style={styles.detectionItem(detection.severity)}>
                  <div style={styles.detectionTitle(detection.severity)}>
                    {detection.title}
                  </div>
                  <p style={styles.detectionDesc}>{detection.description}</p>
                  {detection.line && (
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
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
            <Globe style={{ width: '18px', height: '18px', color: 'rgba(255,255,255,0.5)' }} />
            URLs Found
          </h3>
          {report.extractedUrls.map((url, idx) => (
            <div key={idx} style={styles.urlItem}>
              <span style={styles.urlText}>{url.url}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
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
          <FileText style={{ width: '18px', height: '18px', color: 'rgba(255,255,255,0.5)' }} />
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
            <p style={styles.metadataValue}>{report.fileMetadata.hash.substring(0, 10)}...</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
