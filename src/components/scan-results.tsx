'use client';

import { motion } from 'framer-motion';
import { ScanReport } from '@/types';
import { AlertTriangle, CheckCircle, XCircle, Shield, FileText, Code, Globe, Lock, Eye } from 'lucide-react';

interface ScanResultsProps {
  report: ScanReport;
  onDownload: () => void;
}

const severityIcons = {
  info: Eye,
  low: Eye,
  medium: AlertTriangle,
  high: AlertTriangle,
  critical: XCircle,
};

const severityColors = {
  info: 'text-luma-muted',
  low: 'text-luma-safe',
  medium: 'text-luma-caution',
  high: 'text-luma-danger',
  critical: 'text-luma-danger',
};

const severityBgColors = {
  info: 'bg-luma-muted/10 border-luma-muted/20',
  low: 'bg-luma-safe/10 border-luma-safe/20',
  medium: 'bg-luma-caution/10 border-luma-caution/20',
  high: 'bg-luma-danger/10 border-luma-danger/20',
  critical: 'bg-luma-danger/20 border-luma-danger/30',
};

export function ScanResults({ report, onDownload }: ScanResultsProps) {
  const getRatingIcon = () => {
    switch (report.rating) {
      case 'SAFE':
        return <CheckCircle className="w-8 h-8 text-luma-safe" />;
      case 'CAUTION':
        return <AlertTriangle className="w-8 h-8 text-luma-caution" />;
      case 'FLAGGED':
        return <XCircle className="w-8 h-8 text-luma-danger" />;
    }
  };

  const getRatingColor = () => {
    switch (report.rating) {
      case 'SAFE':
        return 'text-luma-safe';
      case 'CAUTION':
        return 'text-luma-caution';
      case 'FLAGGED':
        return 'text-luma-danger';
    }
  };

  const getRatingGlow = () => {
    switch (report.rating) {
      case 'SAFE':
        return 'glow-safe';
      case 'CAUTION':
        return 'glow-caution';
      case 'FLAGGED':
        return 'glow-danger';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto space-y-6"
    >
      {/* Header Card */}
      <div className={`glass rounded-3xl p-8 border border-luma-border ${getRatingGlow()}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Score Circle */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                fill="none"
                stroke="#1f1f2e"
                strokeWidth="8"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="58"
                fill="none"
                stroke={report.rating === 'SAFE' ? '#22c55e' : report.rating === 'CAUTION' ? '#f59e0b' : '#ef4444'}
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: report.riskScore / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${getRatingColor()}`}>
                {report.riskScore}
              </span>
              <span className="text-xs text-luma-muted">/ 100</span>
            </div>
          </div>

          {/* Rating Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {getRatingIcon()}
              <h2 className={`text-3xl font-bold ${getRatingColor()}`}>
                {report.rating}
              </h2>
            </div>
            <p className="text-luma-muted leading-relaxed max-w-2xl">
              {report.summary}
            </p>
          </div>

          {/* Download Button */}
          <button
            onClick={onDownload}
            className="px-6 py-3 rounded-2xl bg-luma-card border border-luma-border text-white font-medium hover:bg-luma-border transition-colors flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Download JSON
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5 border border-luma-border"
        >
          <div className="flex items-center gap-3 mb-2">
            <Code className="w-5 h-5 text-luma-primary" />
            <span className="text-luma-muted text-sm">Lines</span>
          </div>
          <span className="text-2xl font-bold text-white">{report.lineCount}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-5 border border-luma-border"
        >
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-5 h-5 text-luma-accent" />
            <span className="text-luma-muted text-sm">Obfuscation</span>
          </div>
          <span className={`text-2xl font-bold ${report.obfuscationScore > 50 ? 'text-luma-danger' : 'text-white'}`}>
            {report.obfuscationScore}%
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5 border border-luma-border"
        >
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-5 h-5 text-luma-caution" />
            <span className="text-luma-muted text-sm">URLs Found</span>
          </div>
          <span className="text-2xl font-bold text-white">{report.extractedUrls.length}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-2xl p-5 border border-luma-border"
        >
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-luma-safe" />
            <span className="text-luma-muted text-sm">Detections</span>
          </div>
          <span className="text-2xl font-bold text-white">
            {report.detections.reduce((acc, cat) => acc + cat.detections.length, 0)}
          </span>
        </motion.div>
      </div>

      {/* Detection Categories */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-luma-primary" />
          Detection Details
        </h3>

        {report.detections.map((category, catIndex) => (
          <motion.div
            key={category.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: catIndex * 0.1 }}
            className="glass rounded-2xl border border-luma-border overflow-hidden"
          >
            <div className={`px-6 py-4 border-b border-luma-border ${severityBgColors[category.severity]}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white">{category.name}</h4>
                <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${severityColors[category.severity]}`}>
                  {category.severity}
                </span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {category.detections.map((detection, detIndex) => {
                const Icon = severityIcons[detection.severity];
                return (
                  <motion.div
                    key={detIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: detIndex * 0.05 }}
                    className="flex gap-4"
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${severityBgColors[detection.severity]}`}>
                      <Icon className={`w-5 h-5 ${severityColors[detection.severity]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-white mb-1">{detection.title}</h5>
                      <p className="text-luma-muted text-sm">{detection.description}</p>
                      {detection.line && (
                        <span className="inline-block mt-2 text-xs text-luma-muted">
                          Line {detection.line}
                        </span>
                      )}
                      {detection.code && (
                        <code className="block mt-2 p-2 rounded-lg bg-luma-dark/50 text-xs text-luma-muted font-mono overflow-x-auto">
                          {detection.code}
                        </code>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* URLs Section */}
      {report.extractedUrls.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl border border-luma-border overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-luma-border">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-luma-primary" />
              Extracted URLs
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {report.extractedUrls.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-luma-dark/50"
                >
                  <div className="min-w-0 flex-1">
                    <code className="text-sm text-luma-muted font-mono truncate block">
                      {url.url}
                    </code>
                    <span className="text-xs text-luma-muted">Line {url.line}</span>
                  </div>
                  <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                    url.risk === 'high' ? 'bg-luma-danger/20 text-luma-danger' :
                    url.risk === 'medium' ? 'bg-luma-caution/20 text-luma-caution' :
                    'bg-luma-safe/20 text-luma-safe'
                  }`}>
                    {url.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Reasoning */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-2xl border border-luma-border overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-luma-border bg-gradient-to-r from-luma-primary/10 to-luma-accent/10">
          <h3 className="font-semibold text-white">Analysis Reasoning</h3>
        </div>
        <div className="p-6">
          <pre className="text-sm text-luma-muted whitespace-pre-wrap font-mono leading-relaxed">
            {report.aiReasoning}
          </pre>
        </div>
      </motion.div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-xs text-luma-muted">
        <span>Report ID: {report.id}</span>
        <span>Hash: {report.fileMetadata.hash}</span>
        <span>Size: {(report.fileMetadata.size / 1024).toFixed(1)} KB</span>
        <span>Generated: {new Date(report.timestamp).toLocaleString()}</span>
      </div>
    </motion.div>
  );
}
