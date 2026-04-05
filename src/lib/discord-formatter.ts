import { ScanReport, Detection } from '@/types';

/**
 * Discord Report Formatter
 * Creates color-coded embeds with clear recommendations for Discord bot
 */
export class DiscordReportFormatter {
  /**
   * Formats a scan report for Discord embed
   */
  static format(report: ScanReport): {
    title: string;
    description: string;
    color: number;
    fields: Array<{ name: string; value: string; inline?: boolean }>;
    footer: { text: string };
    recommendation: string;
  } {
    // Determine color based on risk score
    const color = this.getColorForScore(report.riskScore);
    
    // Get clear recommendation
    const recommendation = this.getRecommendation(report.riskScore, report.rating);
    
    // Get dangerous functions list
    const dangerousFunctions = this.extractDangerousFunctions(report.detections);
    
    // Build fields
    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      {
        name: '📊 Risk Score',
        value: `${report.riskScore}/100 (${report.rating})`,
        inline: true,
      },
      {
        name: '🛡️ Obfuscation',
        value: `${report.obfuscationScore}%`,
        inline: true,
      },
      {
        name: '📄 Lines',
        value: `${report.lineCount}`,
        inline: true,
      },
      {
        name: '⚠️ Dangerous Functions',
        value: dangerousFunctions.length > 0 
          ? dangerousFunctions.slice(0, 10).join('\n') + (dangerousFunctions.length > 10 ? '\n...' : '')
          : 'None detected',
        inline: false,
      },
    ];

    // Add URLs field if found
    if (report.extractedUrls.length > 0) {
      const webhookUrls = report.extractedUrls.filter(u => u.type === 'webhook');
      const otherUrls = report.extractedUrls.filter(u => u.type !== 'webhook');
      
      if (webhookUrls.length > 0) {
        fields.push({
          name: '🔗 Webhooks Found',
          value: webhookUrls.map(u => `Line ${u.line}: ${this.maskUrl(u.url)}`).join('\n'),
          inline: false,
        });
      }
      
      if (otherUrls.length > 0) {
        fields.push({
          name: '🌐 URLs Found',
          value: otherUrls.slice(0, 5).map(u => `Line ${u.line}: ${u.type}`).join('\n') + 
                 (otherUrls.length > 5 ? `\n... and ${otherUrls.length - 5} more` : ''),
          inline: false,
        });
      }
    }

    // Add critical detections if any
    const criticalCount = report.detections.reduce(
      (acc, cat) => acc + cat.detections.filter(d => d.severity === 'critical').length, 
      0
    );
    
    if (criticalCount > 0) {
      fields.push({
        name: '🚨 Critical Issues',
        value: `${criticalCount} critical security issue(s) detected`,
        inline: false,
      });
    }

    // Add recommendation field
    fields.push({
      name: '✅ Recommendation',
      value: recommendation,
      inline: false,
    });

    return {
      title: `Luma Security Analysis: ${report.rating}`,
      description: report.summary.substring(0, 2048), // Discord limit
      color,
      fields,
      footer: {
        text: `ID: ${report.id} | Hash: ${report.fileMetadata.hash.substring(0, 8)}`,
      },
      recommendation,
    };
  }

  /**
   * Gets Discord color code based on risk score
   */
  private static getColorForScore(score: number): number {
    if (score >= 70) return 0xef4444; // Red for FLAGGED
    if (score >= 40) return 0xf59e0b; // Yellow for CAUTION
    return 0x22c55e; // Green for SAFE
  }

  /**
   * Gets clear recommendation based on risk
   */
  private static getRecommendation(score: number, rating: string): string {
    if (score >= 70 || rating === 'FLAGGED') {
      return '**🚫 DO NOT EXECUTE**\nThis script has been flagged as malicious. Delete immediately and do not run under any circumstances.';
    }
    
    if (score >= 40 || rating === 'CAUTION') {
      return '**⚠️ REVIEW MANUALLY**\nSuspicious patterns detected. Have an experienced developer review the code before executing.';
    }
    
    return '**✅ LIKELY SAFE**\nNo significant threats detected. Standard precautions still apply.';
  }

  /**
   * Extracts dangerous function names from detections
   */
  private static extractDangerousFunctions(detections: Array<{ detections: Detection[] }>): string[] {
    const dangerousPatterns = [
      'loadstring',
      'getgenv',
      'hookfunction',
      'hookmetamethod',
      'request',
      'HttpGet',
      'webhook',
      'ROBLOSECURITY',
      'compile',
      'decompile',
    ];

    const found = new Set<string>();
    
    for (const category of detections) {
      for (const detection of category.detections) {
        const code = detection.code || '';
        const title = detection.title || '';
        
        for (const pattern of dangerousPatterns) {
          if (code.toLowerCase().includes(pattern.toLowerCase()) ||
              title.toLowerCase().includes(pattern.toLowerCase())) {
            found.add(pattern);
          }
        }
      }
    }

    return Array.from(found).sort();
  }

  /**
   * Masks URL for safe display
   */
  private static maskUrl(url: string): string {
    if (url.includes('webhook')) {
      return url.replace(/\/([\w-]{50,})$/, '/[REDACTED]');
    }
    return url.length > 50 ? url.substring(0, 50) + '...' : url;
  }

  /**
   * Creates a compact summary for Discord (for forum posts)
   */
  static createForumSummary(report: ScanReport): string {
    const lines = [
      `## Luma Analysis Result: ${report.rating}`,
      '',
      `**Risk Score:** ${report.riskScore}/100`,
      `**Obfuscation:** ${report.obfuscationScore}%`,
      `**Lines:** ${report.lineCount}`,
      '',
      '**Summary:**',
      report.summary,
      '',
      '**Recommendation:**',
      this.getRecommendation(report.riskScore, report.rating),
    ];

    return lines.join('\n');
  }
}
