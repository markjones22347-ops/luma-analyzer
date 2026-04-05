import { Detection, RiskFactor } from '@/types';

/**
 * Known-Bad Hash Database
 * Community-reported malicious script hashes for instant flagging
 * SHA-256 hashes of confirmed malicious scripts
 */
export class ThreatDatabase {
  // Database of known malicious script hashes (SHA-256)
  // These are from community reports and security research
  private static readonly KNOWN_BAD_HASHES = new Set<string>([
    // Example format - these would be populated from actual reports
    // 'a1b2c3d4e5f6...', // Known stealer script
    // 'f6e5d4c3b2a1...', // Known backdoor
  ]);

  // Patterns for known malicious script families
  private static readonly KNOWN_MALICIOUS_PATTERNS = {
    // Known stealer scripts that target Roblox
    robloxStealer: [
      /\bsteal\s*\(\s*['"]\.ROBLOSECURITY['"]\s*\)/i,
      /getgenv\s*\(\s*\)\.\w+\s*=\s*.*webhook/i,
      /\bcookie\s*.*discord.*webhook/i,
    ],
    // Known backdoor patterns
    backdoor: [
      /\bloadstring\s*\(\s*['"]https?:\/\/[^'"]+['"]\s*\)\s*\(\s*\)\s*\(\s*\)/i,
      /\brequire\s*\(\s*\d+\s*\)\s*:\s*\w+\s*\(/i,
    ],
    // Known obfuscated malware dropper patterns
    dropper: [
      /while\s+true\s+do\s+loadstring/i,
      /spawn\s*\(\s*function\s*\(\s*\).*loadstring/i,
    ],
  };

  // Community-contributed IOCs (Indicators of Compromise)
  private static readonly MALICIOUS_IOCS = {
    // Known bad domains
    domains: new Set([
      'grabify.link',
      'grabify.icu',
      'grabify.xyz',
      'iplogger.org',
      'iplogger.com',
      'yip.su',
      'iplis.ru',
      'virusclean.xyz', // Known malware host
      'freerobux.scam',
    ]),
    // Known bad webhook patterns (partial IDs)
    webhooks: new Set([
      // Would contain known malicious webhook IDs
    ]),
  };

  /**
   * Check if hash is in known-bad database
   */
  static checkHash(hash: string): {
    isKnownBad: boolean;
    detection?: Detection;
    riskFactor?: RiskFactor;
  } {
    if (this.KNOWN_BAD_HASHES.has(hash.toLowerCase())) {
      return {
        isKnownBad: true,
        detection: {
          title: 'KNOWN MALICIOUS SCRIPT',
          description: 'This script matches a hash in the threat database of known malicious scripts reported by the community. It has been previously identified as malware.',
          severity: 'critical',
        },
        riskFactor: {
          type: 'known_malicious_hash',
          weight: 100,
          evidence: [`Hash: ${hash}`],
        },
      };
    }

    return { isKnownBad: false };
  }

  /**
   * Check code against known malicious patterns
   */
  static checkPatterns(code: string): {
    detections: Detection[];
    riskFactors: RiskFactor[];
  } {
    const detections: Detection[] = [];
    const riskFactors: RiskFactor[] = [];

    for (const [category, patterns] of Object.entries(this.KNOWN_MALICIOUS_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(code)) {
          const severity = category === 'robloxStealer' ? 'critical' : 'high';
          
          detections.push({
            title: `Known Malicious Pattern: ${category}`,
            description: `Detected signature of known ${category} malware family`,
            severity,
          });

          riskFactors.push({
            type: `known_malware_${category}`,
            weight: category === 'robloxStealer' ? 50 : 40,
            evidence: [pattern.toString()],
          });

          // Only report first match per category
          break;
        }
      }
    }

    return { detections, riskFactors };
  }

  /**
   * Check URLs against malicious IOCs
   */
  static checkUrls(urls: string[]): {
    detections: Detection[];
    riskFactors: RiskFactor[];
    flaggedUrls: string[];
  } {
    const detections: Detection[] = [];
    const riskFactors: RiskFactor[] = [];
    const flaggedUrls: string[] = [];

    for (const url of urls) {
      const lowerUrl = url.toLowerCase();

      // Check against known bad domains
      for (const domain of this.MALICIOUS_IOCS.domains) {
        if (lowerUrl.includes(domain)) {
          detections.push({
            title: 'Known Malicious Domain',
            description: `URL matches known malicious domain: ${domain}`,
            severity: 'critical',
          });

          riskFactors.push({
            type: 'known_bad_domain',
            weight: 45,
            evidence: [url],
          });

          flaggedUrls.push(url);
        }
      }

      // Check for suspicious URL patterns
      if (this.isSuspiciousUrlPattern(lowerUrl)) {
        detections.push({
          title: 'Suspicious URL Pattern',
          description: 'URL exhibits patterns commonly used by malware',
          severity: 'high',
        });

        riskFactors.push({
          type: 'suspicious_url_pattern',
          weight: 25,
          evidence: [url],
        });

        flaggedUrls.push(url);
      }
    }

    return { detections, riskFactors, flaggedUrls };
  }

  /**
   * Adds a new hash to the threat database
   * This would typically be done via an admin API
   */
  static addMaliciousHash(hash: string, metadata?: {
    category?: string;
    description?: string;
    reportedBy?: string;
  }): void {
    this.KNOWN_BAD_HASHES.add(hash.toLowerCase());
    
    // In a real implementation, this would persist to a database
    console.log(`[ThreatDB] Added malicious hash: ${hash}`, metadata);
  }

  /**
   * Get database statistics
   */
  static getStats(): {
    hashCount: number;
    domainCount: number;
    patternCount: number;
  } {
    let patternCount = 0;
    for (const patterns of Object.values(this.KNOWN_MALICIOUS_PATTERNS)) {
      patternCount += patterns.length;
    }

    return {
      hashCount: this.KNOWN_BAD_HASHES.size,
      domainCount: this.MALICIOUS_IOCS.domains.size,
      patternCount,
    };
  }

  /**
   * Checks for suspicious URL patterns
   */
  private static isSuspiciousUrlPattern(url: string): boolean {
    const suspiciousPatterns = [
      // High entropy paths (often obfuscated)
      /\/[a-zA-Z0-9]{30,}\//,
      // Excessive subdomains
      /https?:\/\/[^/]+\.[^/]+\.[^/]+\.[^/]+\.[^/]+\//,
      // Suspicious file extensions
      /\.(exe|dll|bin|dat)\?/i,
      // URL shortener chains
      /bit\.ly.*bit\.ly|tinyurl.*tinyurl/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Compute SHA-256 hash of content
   * Used for checking against threat database
   */
  static async computeHash(content: string): Promise<string> {
    // Use Web Crypto API for SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
