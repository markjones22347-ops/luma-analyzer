import { Detection, RiskFactor } from '@/types';

/**
 * Webhook Deobfuscation Detector
 * Detects webhooks hidden via base64, hex, or string concatenation
 */
export class WebhookDetector {
  private static readonly DISCORD_WEBHOOK_PATTERN = /discord\.com\/api\/webhooks\/(\d+)\/([\w-]+)/i;
  
  // Meaningful patterns that indicate decoded content is worth analyzing
  private static readonly MEANINGFUL_PATTERNS = [
    /discord/i,
    /webhook/i,
    /http/i,
    /https/i,
    /api/i,
    /pastebin/i,
    /github/i,
    /raw\.githubusercontent/i,
  ];

  // Patterns for string reconstruction
  private static readonly RECONSTRUCTION_PATTERNS = {
    // String concatenation: "htt" .. "ps://" .. "discord"
    concatenation: /['"]([^'"]+)['"]\s*\.\.\s*['"]([^'"]+)['"]/g,
    // String concatenation with +
    plusConcat: /['"]([^'"]+)['"]\s*\+\s*['"]([^'"]+)['"]/g,
    // table.concat
    tableConcat: /table\.concat\s*\(\s*\{[^}]+\}\s*\)/g,
    // string.format
    stringFormat: /string\.format\s*\(['"][^'"]+['"]\s*,/g,
    // string.char
    stringChar: /string\.char\s*\([^)]+\)/g,
  };

  /**
   * Advanced webhook detection with deobfuscation
   */
  static detect(code: string, lines: string[]): {
    detections: Detection[];
    riskFactors: RiskFactor[];
    obfuscatedWebhooks: Array<{
      line: number;
      original?: string;
      deobfuscated?: string;
      method: 'base64' | 'hex' | 'fragmented' | 'char_code' | 'unknown';
    }>;
  } {
    const detections: Detection[] = [];
    const riskFactors: RiskFactor[] = [];
    const obfuscatedWebhooks: Array<{
      line: number;
      original?: string;
      deobfuscated?: string;
      method: 'base64' | 'hex' | 'fragmented' | 'char_code' | 'unknown';
    }> = [];

    // 1. Check for plain webhooks
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const plainMatch = line.match(this.DISCORD_WEBHOOK_PATTERN);
      
      if (plainMatch) {
        detections.push({
          title: 'Discord Webhook Detected',
          description: `Plain webhook URL at line ${i + 1}`,
          line: i + 1,
          code: this.maskWebhook(plainMatch[0]),
          severity: 'high',
        });

        riskFactors.push({
          type: 'webhook_plain',
          weight: 25,
          evidence: [this.maskWebhook(plainMatch[0])],
        });
      }
    }

    // 2. Check for base64 encoded webhooks
    const base64Webhooks = this.detectBase64Webhooks(code, lines);
    for (const webhook of base64Webhooks) {
      obfuscatedWebhooks.push(webhook);
      
      detections.push({
        title: 'OBFUSCATED WEBHOOK: Base64 Encoded',
        description: `Base64-encoded webhook detected at line ${webhook.line}. The author is actively hiding the webhook URL.`,
        line: webhook.line,
        severity: 'critical',
      });

      riskFactors.push({
        type: 'webhook_base64_obfuscated',
        weight: 35,
        evidence: [webhook.deobfuscated ? this.maskWebhook(webhook.deobfuscated) : 'base64 content'],
      });
    }

    // 3. Check for hex encoded webhooks
    const hexWebhooks = this.detectHexWebhooks(code, lines);
    for (const webhook of hexWebhooks) {
      obfuscatedWebhooks.push(webhook);
      
      detections.push({
        title: 'OBFUSCATED WEBHOOK: Hex Encoded',
        description: `Hex-encoded webhook detected at line ${webhook.line}. The author is actively hiding the webhook URL.`,
        line: webhook.line,
        severity: 'critical',
      });

      riskFactors.push({
        type: 'webhook_hex_obfuscated',
        weight: 35,
        evidence: [webhook.deobfuscated ? this.maskWebhook(webhook.deobfuscated) : 'hex content'],
      });
    }

    // 4. Check for character code construction
    const charCodeWebhooks = this.detectCharCodeWebhooks(code, lines);
    for (const webhook of charCodeWebhooks) {
      obfuscatedWebhooks.push(webhook);
      
      detections.push({
        title: 'OBFUSCATED WEBHOOK: Character Code Construction',
        description: `Webhook constructed from character codes at line ${webhook.line}. Evasion technique detected.`,
        line: webhook.line,
        severity: 'critical',
      });

      riskFactors.push({
        type: 'webhook_charcode_obfuscated',
        weight: 35,
        evidence: ['char code construction'],
      });
    }

    // 5. Check for string fragmentation/reconstruction
    const fragmentedWebhooks = this.detectFragmentedWebhooks(code, lines);
    for (const webhook of fragmentedWebhooks) {
      obfuscatedWebhooks.push(webhook);
      
      detections.push({
        title: 'OBFUSCATED WEBHOOK: String Fragmentation',
        description: `Fragmented webhook reconstruction detected at line ${webhook.line}. Multiple string pieces reassembled at runtime.`,
        line: webhook.line,
        severity: 'critical',
      });

      riskFactors.push({
        type: 'webhook_fragmented',
        weight: 30,
        evidence: ['string fragmentation'],
      });
    }

    // 6. Check for runtime deobfuscation patterns
    const runtimeDeobf = this.detectRuntimeDeobfuscation(code, lines);
    if (runtimeDeobf.length > 0) {
      detections.push({
        title: 'Runtime Deobfuscation Detected',
        description: `${runtimeDeobf.length} location(s) where strings are decoded at runtime. Strong indicator of malicious intent.`,
        severity: 'high',
      });

      riskFactors.push({
        type: 'runtime_deobfuscation',
        weight: 25,
        evidence: runtimeDeobf.map(r => `Line ${r.line}`),
      });
    }

    return { detections, riskFactors, obfuscatedWebhooks };
  }

  /**
   * Detect base64-encoded webhooks
   */
  private static detectBase64Webhooks(
    code: string,
    lines: string[]
  ): Array<{ line: number; deobfuscated?: string; method: 'base64' }> {
    const results: Array<{ line: number; deobfuscated?: string; method: 'base64' }> = [];

    // Pattern: base64 followed by decode
    const base64DecodePattern = /([A-Za-z0-9+/]{40,}={0,2})/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      while ((match = base64DecodePattern.exec(line)) !== null) {
        const potentialBase64 = match[1];
        
        // Check if this line or nearby lines have decode functions
        const contextWindow = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ');
        const hasDecode = /(decode|from|atob|base64|crypt)/i.test(contextWindow);

        if (hasDecode) {
          try {
            const decoded = this.safeBase64Decode(potentialBase64);
            if (decoded && this.DISCORD_WEBHOOK_PATTERN.test(decoded)) {
              results.push({
                line: i + 1,
                deobfuscated: decoded,
                method: 'base64',
              });
            }
          } catch {
            // Not valid base64 or not a webhook
          }
        }
      }
    }

    return results;
  }

  /**
   * Detect hex-encoded webhooks
   */
  private static detectHexWebhooks(
    code: string,
    lines: string[]
  ): Array<{ line: number; deobfuscated?: string; method: 'hex' }> {
    const results: Array<{ line: number; deobfuscated?: string; method: 'hex' }> = [];

    // Pattern: hex string that decodes to webhook
    const hexPattern = /['"]([a-f0-9\s]{60,})['"]/gi;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      while ((match = hexPattern.exec(line)) !== null) {
        const hexStr = match[1].replace(/\s/g, '');
        
        // Check for decode context
        const contextWindow = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ');
        const hasHexDecode = /(hex|decode|tonumber|parse|pack)/i.test(contextWindow);

        if (hasHexDecode && hexStr.length % 2 === 0) {
          try {
            const decoded = this.hexDecode(hexStr);
            // Only report if decoded content is meaningful
            if (this.isMeaningful(decoded) && this.DISCORD_WEBHOOK_PATTERN.test(decoded)) {
              results.push({
                line: i + 1,
                deobfuscated: decoded,
                method: 'hex',
              });
            }
          } catch {
            // Not valid hex - ignore
          }
        }
      }
    }

    return results;
  }

  /**
   * Detect character code construction
   */
  private static detectCharCodeWebhooks(
    code: string,
    lines: string[]
  ): Array<{ line: number; method: 'char_code' }> {
    const results: Array<{ line: number; method: 'char_code' }> = [];

    // Pattern: string.char(100, 105, 115, 99, ...) -> "disc"
    const charCodePattern = /string\.char\s*\(\s*(\d+\s*,\s*){5,}\d+\s*\)/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (charCodePattern.test(line)) {
        // Extract and decode the character codes
        const codesMatch = line.match(/\((\d+\s*,\s*)+\d+\)/);
        if (codesMatch) {
          const codes = codesMatch[0]
            .slice(1, -1)
            .split(',')
            .map(n => parseInt(n.trim()));
          
          const decoded = String.fromCharCode(...codes);
          
          // Check if it contains webhook indicators
          if (decoded.includes('discord') || decoded.includes('webhook')) {
            results.push({
              line: i + 1,
              method: 'char_code',
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Detect fragmented string reconstruction
   */
  private static detectFragmentedWebhooks(
    code: string,
    lines: string[]
  ): Array<{ line: number; method: 'fragmented' }> {
    const results: Array<{ line: number; method: 'fragmented' }> = [];

    // Look for multiple string fragments that could form a webhook
    const fragmentPattern = /['"]([\w]{2,5})['"]/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const fragments: string[] = [];
      let match;

      while ((match = fragmentPattern.exec(line)) !== null) {
        fragments.push(match[1]);
      }

      // Check if fragments combined form webhook indicators
      if (fragments.length >= 3) {
        const combined = fragments.join('').toLowerCase();
        const hasWebhookParts = 
          (combined.includes('disc') && combined.includes('hook')) ||
          (combined.includes('web') && combined.includes('hook')) ||
          (combined.includes('https') && combined.includes('discord'));

        if (hasWebhookParts) {
          // Check for concatenation operators
          const hasConcat = /\.\.|\+/.test(line);
          if (hasConcat) {
            results.push({
              line: i + 1,
              method: 'fragmented',
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Detect runtime deobfuscation patterns
   */
  private static detectRuntimeDeobfuscation(
    code: string,
    lines: string[]
  ): Array<{ line: number; method: string }> {
    const results: Array<{ line: number; method: string }> = [];
    const patterns = [
      { pattern: /loadstring\s*\(\s*\w+\s*\)\s*\(/, method: 'loadstring_decode' },
      { pattern: /pcall\s*\(\s*loadstring/, method: 'pcall_loadstring' },
      { pattern: /\w+\s*=\s*\w+\s*\(?\w+\)?/, method: 'variable_decode' },
    ];

    for (let i = 0; i < lines.length; i++) {
      for (const { pattern, method } of patterns) {
        if (pattern.test(lines[i])) {
          results.push({ line: i + 1, method });
        }
      }
    }

    return results;
  }

  /**
   * Safely decode base64
   */
  private static safeBase64Decode(str: string): string | null {
    try {
      // Validate base64 characters
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(str)) {
        return null;
      }
      
      // Use built-in atob for browser environment
      if (typeof atob !== 'undefined') {
        return atob(str);
      }
      
      // Node.js fallback
      return Buffer.from(str, 'base64').toString('utf-8');
    } catch {
      return null;
    }
  }

  /**
   * Decode hex string
   */
  private static hexDecode(hex: string): string {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  }

  /**
   * Mask webhook URL for safe display
   */
  private static maskWebhook(url: string): string {
    return url.replace(/\/([\w-]{60,})$/, '/[REDACTED]');
  }

  /**
   * Check if decoded string contains meaningful patterns
   * Prevents false positives from random data
   */
  private static isMeaningful(str: string): boolean {
    return this.MEANINGFUL_PATTERNS.some(pattern => pattern.test(str));
  }
}
