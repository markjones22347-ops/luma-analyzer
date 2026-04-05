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
    
    // Determine rating
    const rating = riskScore >= 70 ? 'FLAGGED' : riskScore >= 40 ? 'CAUTION' : 'SAFE';

    // Generate summary
    const summary = this.generateSummary(rating, riskScore, detections, context, bytecodeCheck);

    // Generate AI reasoning
    const aiReasoning = this.generateAIReasoning(context, detections, riskScore, bytecodeCheck, webhookAnalysis);

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
      rating: 'FLAGGED',
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
      obfuscationLevel: string;
    }
  ): ScanReport {
    const obfuscationScore = bytecodeCheck.obfuscationLevel === 'critical' ? 100 :
      bytecodeCheck.obfuscationLevel === 'high' ? 90 :
      bytecodeCheck.obfuscationLevel === 'medium' ? 75 : 60;

    return {
      id,
      riskScore: 95,
      rating: 'FLAGGED',
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
    bytecodeCheck: { obfuscationLevel: string; bytecodeType?: string },
    webhookAnalysis: { obfuscatedWebhooks: Array<{ method: string }> }
  ): string {
    const lines: string[] = [];
    
    lines.push('## Risk Analysis Breakdown');
    lines.push('');
    
    // Security warning
    lines.push('### Security Analysis Methodology');
    lines.push('- Analysis Type: **PURELY STATIC** (no code execution)');
    lines.push('- Bytecode Detection: **ENABLED**');
    lines.push('- Known Threat Database: **CHECKED**');
    lines.push('- Obfuscated Webhook Detection: **ENABLED**');
    lines.push('');
    
    // Risk factors
    if (context.riskFactors.length > 0) {
      lines.push('### Key Risk Factors Identified:');
      for (const factor of context.riskFactors) {
        lines.push(`- **${factor.type}** (weight: ${factor.weight})`);
        if (factor.evidence.length > 0) {
          lines.push(`  - Evidence: ${factor.evidence.slice(0, 2).join(', ')}`);
        }
      }
      lines.push('');
    }

    // Obfuscated webhook analysis
    if (webhookAnalysis.obfuscatedWebhooks.length > 0) {
      lines.push('### Obfuscated Webhook Analysis:');
      const methods = webhookAnalysis.obfuscatedWebhooks.reduce((acc, w) => {
        acc[w.method] = (acc[w.method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      for (const [method, count] of Object.entries(methods)) {
        lines.push(`- **${method}**: ${count} instance(s)`);
      }
      lines.push('- All webhooks are hidden via encoding/fragmentation = HIGH RISK');
      lines.push('');
    }

    // Behavior analysis
    lines.push('### Behavioral Analysis:');
    
    if (context.hasRemoteExecution && context.hasNetworkActivity) {
      lines.push('- **CRITICAL**: Remote code execution chain detected. Script fetches external resources and immediately executes them.');
      lines.push('- This pattern is commonly used to deliver malware, steal data, or compromise accounts.');
    }
    
    if (context.hasObfuscation) {
      lines.push(`- **HIGH**: Code obfuscation level at ${context.obfuscationLevel}%. Obfuscation is typically used to evade detection.`);
    }

    if (!context.hasRemoteExecution && !context.hasNetworkActivity && !context.hasObfuscation) {
      lines.push('- No dangerous patterns detected in the analyzed code.');
    }
    
    lines.push('');
    
    // Category summary
    lines.push('### Detection Categories:');
    for (const cat of detections.slice(0, 5)) {
      const critical = cat.detections.filter(d => d.severity === 'critical').length;
      const high = cat.detections.filter(d => d.severity === 'high').length;
      lines.push(`- ${cat.name}: ${cat.detections.length} finding(s)` + 
        (critical > 0 ? ` (${critical} critical)` : high > 0 ? ` (${high} high)` : ''));
    }
    
    lines.push('');
    lines.push(`### Final Assessment: ${score >= 70 ? 'FLAGGED - Do not use this script' : score >= 40 ? 'CAUTION - Review carefully before use' : 'SAFE - No significant risks detected'}`);
    
    return lines.join('\n');
  }
}
