import { Detection, RiskFactor } from '@/types';

/**
 * Discord Webhook Verifier
 * Safely probes webhooks to gather info without alerting attackers
 */
export class WebhookVerifier {
  /**
   * Safely verify a webhook without sending messages
   * Only performs HEAD request to check if webhook exists
   */
  static async verifyWebhook(url: string): Promise<{
    exists: boolean;
    valid: boolean;
    channelName?: string;
    guildName?: string;
    type: 'webhook' | 'invalid' | 'error';
    error?: string;
  }> {
    try {
      // Only check webhook info endpoint - never POST messages
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.status === 200) {
        const data = await response.json();
        return {
          exists: true,
          valid: true,
          channelName: data.name || 'Unknown',
          guildName: data.guild?.name || 'Unknown Server',
          type: 'webhook',
        };
      } else if (response.status === 404) {
        return {
          exists: false,
          valid: false,
          type: 'invalid',
          error: 'Webhook not found (404)',
        };
      } else if (response.status === 401) {
        return {
          exists: true,
          valid: false,
          type: 'invalid',
          error: 'Webhook unauthorized (401)',
        };
      } else {
        return {
          exists: false,
          valid: false,
          type: 'error',
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return {
        exists: false,
        valid: false,
        type: 'error',
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Analyze webhook URL for risk indicators
   */
  static analyzeWebhookUrl(url: string): {
    detections: Detection[];
    riskFactors: RiskFactor[];
    riskScore: number;
  } {
    const detections: Detection[] = [];
    const riskFactors: RiskFactor[] = [];
    let riskScore = 0;

    // Check for suspicious patterns in webhook URL
    const suspiciousPatterns = [
      { pattern: /hook[s]?[-_]?log/i, name: 'Suspicious webhook name', weight: 30 },
      { pattern: /steal[-_]?log/i, name: 'Data theft indicator', weight: 45 },
      { pattern: /cookie[-_]?log/i, name: 'Cookie theft indicator', weight: 50 },
      { pattern: /grab[-_]?log/i, name: 'Data grabber indicator', weight: 40 },
      { pattern: /exfil/i, name: 'Exfiltration indicator', weight: 45 },
    ];

    for (const { pattern, name, weight } of suspiciousPatterns) {
      if (pattern.test(url.toLowerCase())) {
        detections.push({
          title: `Suspicious Webhook: ${name}`,
          description: `Webhook URL contains pattern suggesting malicious purpose: ${name}`,
          severity: weight > 40 ? 'high' : 'medium',
        });
        riskFactors.push({
          type: 'suspicious_webhook_name',
          weight,
          evidence: [url],
        });
        riskScore += weight;
      }
    }

    // Check if webhook uses HTTP instead of HTTPS
    if (url.startsWith('http://')) {
      detections.push({
        title: 'Insecure Webhook Protocol',
        description: 'Webhook uses HTTP instead of HTTPS - data transmission is not encrypted',
        severity: 'medium',
      });
      riskFactors.push({
        type: 'insecure_webhook_protocol',
        weight: 20,
        evidence: ['HTTP protocol detected'],
      });
      riskScore += 20;
    }

    return { detections, riskFactors, riskScore };
  }

  /**
   * Verify multiple webhooks and aggregate results
   */
  static async verifyMultiple(urls: string[]): Promise<{
    verified: Array<{
      url: string;
      exists: boolean;
      valid: boolean;
      channelName?: string;
      guildName?: string;
    }>;
    totalFound: number;
    totalValid: number;
    riskDetections: Detection[];
    riskFactors: RiskFactor[];
  }> {
    const verified = [];
    const allDetections: Detection[] = [];
    const allRiskFactors: RiskFactor[] = [];
    let totalValid = 0;

    for (const url of urls) {
      // Analyze URL patterns
      const urlAnalysis = this.analyzeWebhookUrl(url);
      allDetections.push(...urlAnalysis.detections);
      allRiskFactors.push(...urlAnalysis.riskFactors);

      // Verify webhook existence
      const result = await this.verifyWebhook(url);
      verified.push({
        url,
        exists: result.exists,
        valid: result.valid,
        channelName: result.channelName,
        guildName: result.guildName,
      });

      if (result.valid) {
        totalValid++;
      }
    }

    return {
      verified,
      totalFound: verified.length,
      totalValid,
      riskDetections: allDetections,
      riskFactors: allRiskFactors,
    };
  }
}
