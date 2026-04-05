'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from '@/components/file-upload';
import { ScanResults } from '@/components/scan-results';
import { ScanningAnimation } from '@/components/scanning-animation';
import { ScanReport } from '@/types';
import { Shield, Github, ExternalLink, Sparkles } from 'lucide-react';

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsScanning(true);
    setError(null);
    setReport(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to analyze script');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleCodePaste = useCallback(async (code: string) => {
    setIsScanning(true);
    setError(null);
    setReport(null);

    try {
      const formData = new FormData();
      formData.append('code', code);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to analyze script');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleDownloadReport = useCallback(() => {
    if (!report) return;

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luma-report-${report.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [report]);

  const resetScan = useCallback(() => {
    setReport(null);
    setError(null);
  }, []);

  return (
    <main className="min-h-screen bg-luma-dark">
      {/* Background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-luma-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-luma-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-luma-border/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-luma-primary to-luma-accent flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Luma</h1>
                <p className="text-xs text-luma-muted">Lua Script Analyzer</p>
              </div>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-luma-card border border-luma-border text-luma-muted hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">GitHub</span>
            </a>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-luma-card border border-luma-border mb-6">
              <Sparkles className="w-4 h-4 text-luma-primary" />
              <span className="text-sm text-luma-muted">AI-Powered Security Analysis</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Analyze Lua Scripts with{' '}
              <span className="bg-gradient-to-r from-luma-primary to-luma-accent bg-clip-text text-transparent">
                Confidence
              </span>
            </h2>
            <p className="text-lg text-luma-muted max-w-2xl mx-auto">
              Advanced behavioral analysis to detect malicious patterns, obfuscation, 
              and security risks in Lua scripts before they harm your system.
            </p>
          </motion.div>

          {/* Main content area */}
          <AnimatePresence mode="wait">
            {report ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex justify-center mb-8">
                  <button
                    onClick={resetScan}
                    className="px-6 py-3 rounded-2xl bg-luma-card border border-luma-border text-white font-medium hover:bg-luma-border transition-colors"
                  >
                    Analyze Another Script
                  </button>
                </div>
                <ScanResults report={report} onDownload={handleDownloadReport} />
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {isScanning ? (
                  <ScanningAnimation />
                ) : (
                  <>
                    <FileUpload 
                      onFileSelect={handleFileSelect} 
                      onCodePaste={handleCodePaste} 
                    />
                    
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto mt-6 p-4 rounded-2xl bg-luma-danger/10 border border-luma-danger/20 text-luma-danger text-center"
                      >
                        {error}
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Features */}
        {!report && !isScanning && (
          <section className="max-w-6xl mx-auto px-6 pb-24">
            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                title="Behavioral Analysis"
                description="Detects dangerous patterns like remote code execution, not just keywords"
                icon="🔍"
                delay={0.1}
              />
              <FeatureCard
                title="Obfuscation Detection"
                description="Identifies known obfuscators and high-entropy code blocks"
                icon="🛡️"
                delay={0.2}
              />
              <FeatureCard
                title="Risk Scoring"
                description="Weighted scoring system from 0-100 with detailed reasoning"
                icon="📊"
                delay={0.3}
              />
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-luma-border/50">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-luma-muted">
                Luma - Lua Script Security Analyzer
              </p>
              <div className="flex items-center gap-6 text-sm text-luma-muted">
                <span>Static Analysis Only</span>
                <span>•</span>
                <span>No Code Execution</span>
                <span>•</span>
                <span>Private & Secure</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({ title, description, icon, delay }: { title: string; description: string; icon: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="glass rounded-3xl p-6 border border-luma-border hover:border-luma-primary/50 transition-colors"
    >
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-luma-muted">{description}</p>
    </motion.div>
  );
}
