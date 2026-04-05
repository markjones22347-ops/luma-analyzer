import { ScanReport, DetectionCategory, AnalysisContext, RiskFactor, Detection } from '@/types';
import { PatternMatcher } from './pattern-matcher';
import { ScoringEngine } from './scoring-engine';
import { BytecodeDetector } from './bytecode-detector';
import { ThreatDatabase } from './threat-database';
import { WebhookDetector } from './webhook-detector';

/**
 * Luma Lua Analyzer - Security-First Static Analysis
 * 
 * SECURITY GUARANTEES:
 * - NO Lua code execution under any circumstances
 * - NO bytecode interpretation
 * - NO sandboxed execution
 * - Purely static pattern matching and analysis
 * - Depth-limited URL fetching (if enabled)
 * - Known-bad hash checking
 * - Bytecode detection and flagging
 */
export class LuaAnalyzer {
  private scoringEngine: ScoringEngine;

  constructor() {
    this.scoringEngine = new ScoringEngine();
    // Security check: Ensure we're not in an environment that might execute code
    BytecodeDetector.enforceStaticOnly();
  }

  async analyze(code: string, filename?: string): Promise<ScanReport> {
    const lines = code.split('\n');
    const id = this.generateId();
    
    // Security: Compute hash for threat database lookup
    const contentHash = await ThreatDatabase.computeHash(code);

    // SECURITY CHECK 1: Check against known-bad hash database
    const threatCheck = ThreatDatabase.checkHash(contentHash);
    if (threatCheck.isKnownBad) {
      // Immediate critical flag if known malicious
      return this.createKnownBadReport(id, code, filename, contentHash, threatCheck);
    }

    // SECURITY CHECK 2: Detect compiled bytecode
    const bytecodeCheck = BytecodeDetector.detect(code);
    if (bytecodeCheck.isBytecode) {
      // Bytecode is auto-critical
      return this.createBytecodeReport(id, code, filename, contentHash, bytecodeCheck);
    }

    // SECURITY ASSERTION: Verify we're still in static-only mode
    BytecodeDetector.assertStaticAnalysis(code);

    // Create analysis context
    const context: AnalysisContext = {
      code,
      lines,
      hasNetworkActivity: false,
      hasRemoteExecution: false,
      hasObfuscation: false,
      obfuscationLevel: 0,
      riskFactors: [],
    };

    // Run all detection modules
    const networkAnalysis = PatternMatcher.analyzeNetwork(code, lines);
    const executionAnalysis = PatternMatcher.analyzeRemoteExecution(code, lines);
    const environmentAnalysis = PatternMatcher.analyzeEnvironment(code, lines);
    const antiDebugAnalysis = PatternMatcher.analyzeAntiDebug(code, lines);
    const obfuscationAnalysis = PatternMatcher.analyzeObfuscation(code);
    
    // NEW: Advanced webhook detection with deobfuscation
    const webhookAnalysis = WebhookDetector.detect(code, lines);
    
    // NEW: Check against known malicious patterns
    const patternCheck = ThreatDatabase.checkPatterns(code);
    
    // Update context
    context.hasNetworkActivity = networkAnalysis.hasActivity;
    context.hasRemoteExecution = executionAnalysis.hasExecution;
    context.hasObfuscation = obfuscationAnalysis.score > 50;
    context.obfuscationLevel = obfuscationAnalysis.score;
    context.riskFactors = [
      ...networkAnalysis.riskFactors,
      ...executionAnalysis.riskFactors,
      ...environmentAnalysis.riskFactors,
      ...antiDebugAnalysis.riskFactors,
      ...obfuscationAnalysis.riskFactors,
    ];

    // Build detection categories
    const detections: DetectionCategory[] = [];

    // Network Activity
    if (networkAnalysis.detections.length > 0 || webhookAnalysis.detections.length > 0) {
      const allDetections = [...networkAnalysis.detections, ...webhookAnalysis.detections];
      detections.push({
        name: 'Network Activity',
        severity: this.getHighestSeverity(allDetections),
        detections: allDetections,
      });
    }

    // Remote Code Execution
    if (executionAnalysis.detections.length > 0) {
      detections.push({
        name: 'Remote Code Execution',
        severity: this.getHighestSeverity(executionAnalysis.detections),
        detections: executionAnalysis.detections,
      });
    }

    // Environment Manipulation
    if (environmentAnalysis.detections.length > 0) {
      detections.push({
        name: 'Environment Manipulation',
        severity: this.getHighestSeverity(environmentAnalysis.detections),
        detections: environmentAnalysis.detections,
      });
    }

    // Anti-Debug / Anti-Analysis
    if (antiDebugAnalysis.detections.length > 0) {
      detections.push({
        name: 'Anti-Debug / Anti-Analysis',
        severity: this.getHighestSeverity(antiDebugAnalysis.detections),
        detections: antiDebugAnalysis.detections,
      });
    }

    // Obfuscation
    if (obfuscationAnalysis.detections.length > 0 || bytecodeCheck.detections.length > 0) {
      const allObfDetections = [...obfuscationAnalysis.detections, ...bytecodeCheck.detections];
      detections.push({
        name: 'Obfuscation',
        severity: context.obfuscationLevel > 70 ? 'high' : 'medium',
        detections: allObfDetections,
      });
    }

    // Known Malicious Patterns
    if (patternCheck.detections.length > 0) {
      detections.push({
        name: 'Known Malicious Signatures',
        severity: this.getHighestSeverity(patternCheck.detections),
        detections: patternCheck.detections,
      });
    }

    // Extract additional data
    const extractedUrls = PatternMatcher.extractUrls(code, lines);
    const suspiciousStrings = PatternMatcher.extractSuspiciousStrings(code, lines);

    // NEW: Check URLs against threat database
    const urlThreatCheck = ThreatDatabase.checkUrls(extractedUrls.map(u => u.url));
    if (urlThreatCheck.detections.length > 0) {
      detections.push({
        name: 'Malicious URLs',
        severity: this.getHighestSeverity(urlThreatCheck.detections),
        detections: urlThreatCheck.detections,
      });
      context.riskFactors.push(...urlThreatCheck.riskFactors);
    }

    // Add Suspicious Strings category if found
    if (suspiciousStrings.length > 0) {
      const stringDetections: Detection[] = suspiciousStrings.map(s => ({
        title: `Suspicious ${s.type}`,
        description: `Found potential ${s.type}: ${s.value}`,
        line: s.line,
        severity: s.risk === 'high' ? 'high' : 'medium',
      }));
      
      detections.push({
        name: 'Suspicious Strings',
        severity: suspiciousStrings.some(s => s.risk === 'high') ? 'high' : 'medium',
        detections: stringDetections,
      });
    }

    // Calculate risk score
    const riskScore = this.scoringEngine.calculateScore(context, detections);
    const riskLevel = this.scoringEngine.getRiskLevel(riskScore);
    
    // Determine rating based on score
    const rating = riskScore >= 81 ? 'CRITICAL' : 
                   riskScore >= 61 ? 'HIGH RISK' : 
                   riskScore >= 41 ? 'MODERATE RISK' : 
                   riskScore >= 21 ? 'LOW RISK' : 'SAFE';

    // Generate summary
    const summary = this.generateSummary(rating, riskScore, detections, context, bytecodeCheck);

    // Generate AI reasoning with new format
    const aiReasoning = this.generateAIReasoning(context, detections, riskScore, riskLevel, bytecodeCheck, webhookAnalysis);

    return {
      id,
      riskScore,
      rating,
      summary,
      detections,
      extractedUrls,
      suspiciousStrings,
      obfuscationScore: context.obfuscationLevel,
      lineCount: lines.length,
      fileMetadata: {
        filename,
        size: code.length,
        hash: contentHash,
      },
      aiReasoning,
      timestamp: new Date().toISOString(),
    };
  }

  private generateId(): string {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Creates a report for known-bad hash matches
   */
  private createKnownBadReport(
    id: string,
    code: string,
    filename: string | undefined,
    hash: string,
    threatCheck: { detection?: Detection; riskFactor?: RiskFactor }
  ): ScanReport {
    const detection = threatCheck.detection!;
    const riskFactor = threatCheck.riskFactor!;

    return {
      id,
      riskScore: 100,
      rating: 'CRITICAL',
      summary: 'This script matches a known malicious hash in the threat database. It has been reported as malware by the community. DO NOT EXECUTE.',
      detections: [{
        name: 'Threat Database Match',
        severity: 'critical',
        detections: [detection],
      }],
      extractedUrls: [],
      suspiciousStrings: [],
      obfuscationScore: 100,
      lineCount: code.split('\n').length,
      fileMetadata: {
        filename,
        size: code.length,
        hash,
      },
      aiReasoning: `### CRITICAL THREAT DETECTED

This script (hash: ${hash}) matches an entry in the known-malicious hash database.

**Immediate Actions:**
- Do not execute this script under any circumstances
- Delete the file from your system
- If already executed, rotate any credentials that may have been exposed
- Report incident to security team

**Database Match:**
- Type: ${riskFactor.type}
- Weight: ${riskFactor.weight}/100

This is an automatic FLAGGED rating due to confirmed malicious status.`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Creates a report for bytecode detections
   */
  private createBytecodeReport(
    id: string,
    code: string,
    filename: string | undefined,
    hash: string,
    bytecodeCheck: {
      isBytecode: boolean;
      detections: Detection[];
      riskFactors: RiskFactor[];
      bytecodeType?: string;
      obfuscationLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
    }
  ): ScanReport {
    const obfuscationScore = bytecodeCheck.obfuscationLevel === 'critical' ? 100 :
      bytecodeCheck.obfuscationLevel === 'high' ? 90 :
      bytecodeCheck.obfuscationLevel === 'medium' ? 75 : 60;

    return {
      id,
      riskScore: 95,
      rating: 'CRITICAL',
      summary: `COMPILED BYTECODE DETECTED (${bytecodeCheck.bytecodeType}). Bytecode cannot be statically analyzed and may contain hidden malicious instructions. This is treated as CRITICAL RISK.`,
      detections: [{
        name: 'Compiled Bytecode',
        severity: 'critical',
        detections: bytecodeCheck.detections,
      }],
      extractedUrls: [],
      suspiciousStrings: [],
      obfuscationScore,
      lineCount: code.split('\n').length,
      fileMetadata: {
        filename,
        size: code.length,
        hash,
      },
      aiReasoning: `### COMPILED BYTECODE DETECTED

**Type:** ${bytecodeCheck.bytecodeType}
**Obfuscation Level:** ${bytecodeCheck.obfuscationLevel}

This script contains compiled Lua bytecode, which poses several security concerns:

1. **Non-analyzable**: Bytecode cannot be meaningfully inspected without decompilation
2. **Hidden behavior**: Actual instructions are masked in binary format
3. **Evasion technique**: Malware often uses bytecode to bypass detection

**Why this is FLAGGED:**
- Static analysis of bytecode is inherently limited
- Malicious payloads can be embedded in bytecode segments
- No legitimate reason to distribute compiled bytecode

**Security Policy:**
Luma automatically assigns CRITICAL severity to all bytecode-containing scripts as a safety measure.

${bytecodeCheck.riskFactors.map(rf => `- ${rf.type}: weight ${rf.weight}`).join('\n')}`,
      timestamp: new Date().toISOString(),
    };
  }

  private getHighestSeverity(detections: Detection[]): DetectionCategory['severity'] {
    const severityOrder = ['info', 'low', 'medium', 'high', 'critical'];
    let highest = 'info';
    for (const d of detections) {
      if (severityOrder.indexOf(d.severity) > severityOrder.indexOf(highest)) {
        highest = d.severity;
      }
    }
    return highest as DetectionCategory['severity'];
  }

  private generateSummary(
    rating: string,
    score: number,
    detections: DetectionCategory[],
    context: AnalysisContext,
    bytecodeCheck: { obfuscationLevel: string }
  ): string {
    const parts: string[] = [];
    
    parts.push(`This script has been rated ${rating} with a risk score of ${score}/100.`);
    
    if (context.hasRemoteExecution && context.hasNetworkActivity) {
      parts.push('The script exhibits dangerous behavior by fetching and executing remote code, which is a primary indicator of malicious intent.');
    } else if (context.hasRemoteExecution) {
      parts.push('The script uses dynamic code execution capabilities which could be exploited.');
    }

    if (context.hasObfuscation) {
      parts.push(`High obfuscation level detected (${context.obfuscationLevel}%) - the author is actively trying to hide what the code does.`);
    }

    // Check for obfuscated webhooks
    const obfWebhookCount = detections
      .flatMap(c => c.detections)
      .filter(d => d.title.includes('OBFUSCATED WEBHOOK')).length;
    
    if (obfWebhookCount > 0) {
      parts.push(`Detected ${obfWebhookCount} obfuscated webhook(s) - the author is actively hiding data exfiltration destinations.`);
    }

    const criticalCount = detections.reduce((acc, cat) => 
      acc + cat.detections.filter(d => d.severity === 'critical').length, 0);
    
    if (criticalCount > 0) {
      parts.push(`Found ${criticalCount} critical security issue(s) that require immediate attention.`);
    }

    const webhookCount = detections
      .flatMap(c => c.detections)
      .filter(d => d.title.includes('Webhook')).length;
    
    if (webhookCount > 0) {
      parts.push(`Detected ${webhookCount} Discord webhook(s) that could be used to exfiltrate data.`);
    }

    return parts.join(' ');
  }

  private generateAIReasoning(
    context: AnalysisContext,
    detections: DetectionCategory[],
    score: number,
    riskLevel: { level: string; color: string; recommendation: string },
    bytecodeCheck: { isBytecode: boolean; obfuscationLevel: string; bytecodeType?: string; canAnalyze?: boolean },
    webhookAnalysis: { obfuscatedWebhooks: Array<{ method: string; line?: number }> }
  ): string {
    const sections: string[] = [];
    
    // 1. Risk Score Header
    sections.push(`<div style="margin-bottom:24px;padding:20px;background-color:rgba(255,255,255,0.03);border-radius:8px;border-left:4px solid ${riskLevel.color};">`);
    sections.push(`<div style="font-size:28px;font-weight:700;color:${riskLevel.color};margin-bottom:8px;">${score}/100 — ${riskLevel.level}</div>`);
    sections.push(`<div style="font-size:14px;color:rgba(255,255,255,0.6);">Risk Level: ${riskLevel.level} (${riskLevel.color})</div>`);
    sections.push(`</div>`);
    
    // 2. Detected Behaviors
    const allDetections = detections.flatMap(cat => cat.detections);
    if (allDetections.length > 0) {
      sections.push(`<h3 style="font-size:16px;font-weight:600;color:#ffffff;margin:20px 0 12px 0;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:8px;">Detected Behaviors</h3>`);
      sections.push(`<ul style="margin:0 0 20px 0;padding-left:0;list-style:none;">`);
      
      // Group by severity
      const criticalDets = allDetections.filter(d => d.severity === 'critical');
      const highDets = allDetections.filter(d => d.severity === 'high');
      const mediumDets = allDetections.filter(d => d.severity === 'medium');
      const lowDets = allDetections.filter(d => d.severity === 'low' || d.severity === 'info');
      
      const severityColors: Record<string, string> = {
        critical: '#dc2626',
        high: '#ef4444',
        medium: '#f97316',
        low: '#f59e0b',
        info: '#22c55e'
      };
      
      [...criticalDets, ...highDets, ...mediumDets, ...lowDets].slice(0, 10).forEach(det => {
        const color = severityColors[det.severity] || '#ffffff';
        sections.push(`<li style="margin-bottom:10px;padding:12px;background-color:rgba(255,255,255,0.02);border-radius:6px;border-left:3px solid ${color};">`);
        sections.push(`<div style="font-weight:600;color:${color};font-size:14px;margin-bottom:4px;">${det.title}</div>`);
        sections.push(`<div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.4;">${det.description}</div>`);
        if (det.line) {
          sections.push(`<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;">Line ${det.line}</div>`);
        }
        sections.push(`</li>`);
      });
      
      sections.push(`</ul>`);
    }
    
    // 3. Evidence Summary
    const evidenceItems: string[] = [];
    if (context.hasRemoteExecution) evidenceItems.push('Remote code execution detected');
    if (context.hasNetworkActivity) evidenceItems.push('Network activity patterns found');
    if (context.hasObfuscation) evidenceItems.push(`Obfuscation level: ${context.obfuscationLevel}%`);
    if (webhookAnalysis.obfuscatedWebhooks.length > 0) evidenceItems.push(`${webhookAnalysis.obfuscatedWebhooks.length} obfuscated webhook(s)`);
    if (bytecodeCheck.isBytecode) evidenceItems.push(`Bytecode detected: ${bytecodeCheck.bytecodeType}`);
    
    if (evidenceItems.length > 0) {
      sections.push(`<h3 style="font-size:16px;font-weight:600;color:#ffffff;margin:20px 0 12px 0;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:8px;">Evidence</h3>`);
      sections.push(`<ul style="margin:0 0 20px 0;padding-left:20px;list-style-type:disc;color:rgba(255,255,255,0.7);line-height:1.8;">`);
      evidenceItems.forEach(item => {
        sections.push(`<li style="margin-bottom:6px;">${item}</li>`);
      });
      sections.push(`</ul>`);
    }
    
    // 4. Explanation
    sections.push(`<h3 style="font-size:16px;font-weight:600;color:#ffffff;margin:20px 0 12px 0;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:8px;">Explanation</h3>`);
    
    const explanationParts: string[] = [];
    if (score <= 20) {
      explanationParts.push('This script shows no signs of malicious behavior. No dangerous patterns were detected during static analysis.');
    } else if (score <= 40) {
      explanationParts.push('This script contains minor suspicious patterns that warrant caution. While not overtly malicious, some behaviors could be problematic depending on context.');
    } else if (score <= 60) {
      explanationParts.push('This script exhibits moderate risk indicators. Multiple suspicious patterns were detected that suggest the code may have hidden functionality or attempt to obscure its true purpose.');
    } else if (score <= 80) {
      explanationParts.push('This script contains high-risk patterns that strongly suggest malicious intent. Critical security issues were detected that could compromise system security or steal data.');
    } else {
      explanationParts.push('This script is CRITICAL and should be treated as malware. Severe security threats were detected including potential data exfiltration, remote code execution, or system compromise mechanisms.');
    }
    
    if (context.hasRemoteExecution && context.hasNetworkActivity) {
      explanationParts.push(' The script fetches and executes remote code—a primary indicator of malware distribution.');
    }
    if (context.hasObfuscation && context.obfuscationLevel > 70) {
      explanationParts.push(' Heavy obfuscation suggests deliberate attempts to hide malicious functionality.');
    }
    
    sections.push(`<p style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;margin-bottom:20px;">${explanationParts.join('')}</p>`);
    
    // 5. Final Recommendation
    sections.push(`<h3 style="font-size:16px;font-weight:600;color:#ffffff;margin:20px 0 12px 0;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:8px;">Final Recommendation</h3>`);
    sections.push(`<div style="padding:16px 20px;background-color:${score > 60 ? 'rgba(239,68,68,0.1)' : score > 40 ? 'rgba(249,115,22,0.1)' : score > 20 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)'};border-radius:8px;border:1px solid ${riskLevel.color};">`);
    sections.push(`<div style="font-size:18px;font-weight:700;color:${riskLevel.color};margin-bottom:8px;">${riskLevel.recommendation}</div>`);
    
    if (score > 80) {
      sections.push(`<div style="font-size:13px;color:rgba(255,255,255,0.6);">Do not execute this script under any circumstances. Delete immediately and scan your system.</div>`);
    } else if (score > 60) {
      sections.push(`<div style="font-size:13px;color:rgba(255,255,255,0.6);">This script poses significant security risks. Execution is strongly discouraged.</div>`);
    } else if (score > 40) {
      sections.push(`<div style="font-size:13px;color:rgba(255,255,255,0.6);">Review the detected patterns carefully before deciding to execute.</div>`);
    } else if (score > 20) {
      sections.push(`<div style="font-size:13px;color:rgba(255,255,255,0.6);">Exercise caution. Verify the source and intended purpose before execution.</div>`);
    } else {
      sections.push(`<div style="font-size:13px;color:rgba(255,255,255,0.6);">No significant risks detected. Safe to use.</div>`);
    }
    
    sections.push(`</div>`);
    
    return `<div style="font-size:14px;line-height:1.6;">${sections.join('')}</div>`;
  }
}
