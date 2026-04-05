import { AnalysisContext, DetectionCategory } from '@/types';

/**
 * Proportional Risk Score Calculation (1-100 Scale)
 * 
 * Scoring Guidelines:
 * - 1-20   = SAFE (Green) - Clean scripts, minimal concerns
 * - 21-40  = LOW RISK (Yellow) - Mild indicators present
 * - 41-60  = MODERATE RISK (Orange) - Multiple medium indicators
 * - 61-80  = HIGH RISK (Red) - High-risk patterns detected
 * - 81-100 = CRITICAL (Dark Red) - Confirmed critical malicious patterns
 * 
 * Critical patterns ONLY include:
 * - Webhook URLs (Discord, etc.)
 * - Encoded URLs or payloads (Base64, hex, etc.)
 * - loadstring + remote source execution
 * - HttpGet to unknown/suspicious endpoints
 * - Bytecode execution
 * - Data exfiltration to external servers
 */
export class ScoringEngine {
  // Point ranges for different indicator severities
  private static readonly POINTS = {
    // Mild indicators: 1-10 points
    mild: {
      base64_strings: 5,           // Base64 alone isn't malicious
      high_entropy: 4,               // High randomness, possible obfuscation
      weird_naming: 3,             // Unusual variable names
      string_concatenation: 2,     // String building (common pattern)
      getfenv_usage: 6,              // Environment access alone
      getgenv_usage: 6,              // Global environment access
      harmless_encoding: 5,          // URL encoding, etc.
      short_random_vars: 3,        // Randomized naming
      common_obfuscation: 4,         // Light obfuscation patterns
    },
    
    // Medium indicators: 10-20 points
    medium: {
      dynamic_require: 12,         // Dynamic module loading
      environment_manipulation: 14,  // Modifying _G or getfenv
      anti_debug_patterns: 15,     // Anti-analysis techniques
      string_reconstruction: 16,   // Building code from strings
      known_obfuscator: 18,        // Identified obfuscation tool
      suspicious_network_prep: 14, // Network setup without execution
      http_request_generic: 12,    // Generic HTTP requests (non-suspicious URLs)
    },
    
    // High-risk indicators: 20-40 points
    high: {
      loadstring_usage: 28,        // Code execution from strings
      httpget_unknown: 32,         // HTTP to unknown endpoints
      encoded_payload_detected: 30, // Encoded malicious content
      require_remote: 26,          // Requiring remote modules
      ip_grabber_detected: 35,     // IP collection patterns
      cookie_token_access: 25,     // Accessing sensitive data
      data_collection_setup: 22,   // Gathering system info
    },
    
    // Critical indicators: 40-60 points (only these can push score above 80)
    critical: {
      webhook_url: 50,             // Discord/webhook URLs
      encoded_webhook: 55,         // Obfuscated webhook
      remote_execution_chain: 52,  // loadstring + remote
      httpget_suspicious: 48,      // HTTP to known bad endpoints
      bytecode_execution: 60,      // Bytecode loading/execution
      data_exfiltration: 55,       // Sending data to external server
      cookie_stealer: 58,          // Specifically stealing cookies/tokens
      known_malicious_hash: 60,    // Matches threat database
    },
  };

  calculateScore(context: AnalysisContext, detections: DetectionCategory[]): number {
    let score = 0;
    const appliedFactors = new Set<string>();
    
    // Track which severity levels are present
    let hasCritical = false;
    let hasHigh = false;
    let hasMedium = false;
    
    // Track applied critical patterns for max score enforcement
    const criticalPatterns: string[] = [];

    // Apply risk factor weights with proportional scoring
    for (const factor of context.riskFactors) {
      if (appliedFactors.has(factor.type)) continue;
      
      const points = this.getPointsForFactor(factor.type);
      const evidenceCount = factor.evidence?.length || 1;
      
      // Diminishing returns for multiple instances of same pattern
      const multiplier = evidenceCount > 1 ? (1 + (evidenceCount - 1) * 0.3) : 1;
      const addedPoints = points * multiplier;
      
      score += addedPoints;
      appliedFactors.add(factor.type);
      
      // Track severity presence
      if (this.isCriticalFactor(factor.type)) {
        hasCritical = true;
        criticalPatterns.push(factor.type);
      } else if (this.isHighFactor(factor.type)) {
        hasHigh = true;
      } else if (this.isMediumFactor(factor.type)) {
        hasMedium = true;
      }
    }

    // Obfuscation scoring - proportional, not binary
    if (context.obfuscationLevel > 0) {
      // Scale obfuscation contribution based on level
      let obfuscationPoints = 0;
      if (context.obfuscationLevel > 90) {
        obfuscationPoints = 25;  // Severe obfuscation
        hasHigh = true;
      } else if (context.obfuscationLevel > 70) {
        obfuscationPoints = 18;  // Heavy obfuscation
        hasMedium = true;
      } else if (context.obfuscationLevel > 50) {
        obfuscationPoints = 12;  // Moderate obfuscation
        hasMedium = true;
      } else if (context.obfuscationLevel > 30) {
        obfuscationPoints = 6;   // Light obfuscation
      } else {
        obfuscationPoints = 2;   // Minimal obfuscation
      }
      score += obfuscationPoints;
    }

    // Process detection categories for additional scoring
    for (const cat of detections) {
      for (const det of cat.detections) {
        const severity = det.severity;
        
        if (severity === 'critical') {
          hasCritical = true;
          // Add smaller increments for additional critical detections
          score += 8;
        } else if (severity === 'high') {
          hasHigh = true;
          score += 5;
        } else if (severity === 'medium') {
          hasMedium = true;
          score += 3;
        } else if (severity === 'low') {
          score += 1;
        }
      }
    }

    // Apply enforcement rules for maximum scores based on pattern presence
    // Rule: Only scripts with confirmed critical patterns can reach 80-100
    if (!hasCritical && score > 80) {
      score = 78; // Cap at 78 if no critical patterns
    }
    
    // Rule: Only scripts with high-risk patterns can reach 60-80
    if (!hasHigh && !hasCritical && score > 60) {
      score = 58; // Cap at 58 if no high-risk patterns
    }
    
    // Rule: Only scripts with medium+ patterns can reach 40-60
    if (!hasMedium && !hasHigh && !hasCritical && score > 40) {
      score = 38; // Cap at 38 if only mild patterns
    }

    // Ensure minimum score reflects some presence of issues
    // But keep it proportional - don't jump to 100
    if (score < 5 && (hasMedium || hasHigh || hasCritical)) {
      score = 5; // Minimum for any real detection
    }

    // Cap at 100
    score = Math.min(score, 100);
    
    // Ensure score is at least 1 for any analyzed script
    score = Math.max(score, 1);

    // Round to nearest integer
    return Math.round(score);
  }

  /**
   * Get risk level and color based on score
   */
  getRiskLevel(score: number): { level: string; color: string; recommendation: string } {
    if (score <= 20) {
      return { 
        level: 'SAFE', 
        color: '#22c55e', 
        recommendation: 'Script appears safe for use' 
      };
    } else if (score <= 40) {
      return { 
        level: 'LOW RISK', 
        color: '#f59e0b', 
        recommendation: 'Minor concerns detected - review if cautious' 
      };
    } else if (score <= 60) {
      return { 
        level: 'MODERATE RISK', 
        color: '#f97316', 
        recommendation: 'Suspicious patterns present - manual review recommended' 
      };
    } else if (score <= 80) {
      return { 
        level: 'HIGH RISK', 
        color: '#ef4444', 
        recommendation: 'Dangerous patterns detected - do not execute without verification' 
      };
    } else {
      return { 
        level: 'CRITICAL', 
        color: '#dc2626', 
        recommendation: 'Confirmed malicious patterns - DO NOT EXECUTE' 
      };
    }
  }

  /**
   * Get points for a risk factor based on its severity classification
   */
  private getPointsForFactor(type: string): number {
    // Check critical patterns first
    const criticalPattern = this.findPatternInCategory(type, ScoringEngine.POINTS.critical);
    if (criticalPattern !== null) return criticalPattern;
    
    // Check high patterns
    const highPattern = this.findPatternInCategory(type, ScoringEngine.POINTS.high);
    if (highPattern !== null) return highPattern;
    
    // Check medium patterns
    const mediumPattern = this.findPatternInCategory(type, ScoringEngine.POINTS.medium);
    if (mediumPattern !== null) return mediumPattern;
    
    // Check mild patterns
    const mildPattern = this.findPatternInCategory(type, ScoringEngine.POINTS.mild);
    if (mildPattern !== null) return mildPattern;
    
    // Check for partial matches
    if (type.includes('bytecode')) return ScoringEngine.POINTS.critical.bytecode_execution;
    if (type.includes('webhook')) return ScoringEngine.POINTS.critical.webhook_url;
    if (type.includes('exfiltration')) return ScoringEngine.POINTS.critical.data_exfiltration;
    if (type.includes('cookie') || type.includes('stealer')) return ScoringEngine.POINTS.critical.cookie_stealer;
    if (type.includes('remote_execution_chain') || (type.includes('loadstring') && type.includes('remote'))) {
      return ScoringEngine.POINTS.critical.remote_execution_chain;
    }
    if (type.includes('loadstring')) return ScoringEngine.POINTS.high.loadstring_usage;
    if (type.includes('httpget') || type.includes('http_get')) {
      return type.includes('suspicious') || type.includes('unknown') 
        ? ScoringEngine.POINTS.critical.httpget_suspicious 
        : ScoringEngine.POINTS.high.httpget_unknown;
    }
    if (type.includes('encoded') || type.includes('payload')) return ScoringEngine.POINTS.high.encoded_payload_detected;
    if (type.includes('ip_grabber')) return ScoringEngine.POINTS.high.ip_grabber_detected;
    if (type.includes('obfuscator')) return ScoringEngine.POINTS.medium.known_obfuscator;
    if (type.includes('network')) return ScoringEngine.POINTS.medium.suspicious_network_prep;
    if (type.includes('anti')) return ScoringEngine.POINTS.medium.anti_debug_patterns;
    if (type.includes('environment')) return ScoringEngine.POINTS.medium.environment_manipulation;
    if (type.includes('getfenv')) return ScoringEngine.POINTS.mild.getfenv_usage;
    if (type.includes('getgenv')) return ScoringEngine.POINTS.mild.getgenv_usage;
    if (type.includes('base64')) return ScoringEngine.POINTS.mild.base64_strings;
    if (type.includes('entropy')) return ScoringEngine.POINTS.mild.high_entropy;
    if (type.includes('require')) return ScoringEngine.POINTS.medium.dynamic_require;

    return 3; // Default minimal weight for unknown factors
  }

  /**
   * Find a pattern match in a category
   */
  private findPatternInCategory(type: string, category: Record<string, number>): number | null {
    if (type in category) {
      return category[type as keyof typeof category];
    }
    return null;
  }

  /**
   * Check if a factor is classified as critical
   */
  private isCriticalFactor(type: string): boolean {
    const criticalPatterns = Object.keys(ScoringEngine.POINTS.critical);
    return criticalPatterns.some(pattern => type.includes(pattern)) ||
           type.includes('bytecode') ||
           type.includes('webhook') ||
           type.includes('exfiltration') ||
           (type.includes('remote_execution_chain')) ||
           (type.includes('loadstring') && type.includes('remote')) ||
           (type.includes('httpget') && (type.includes('suspicious') || type.includes('unknown'))) ||
           type.includes('cookie_stealer') ||
           type.includes('known_malicious');
  }

  /**
   * Check if a factor is classified as high-risk
   */
  private isHighFactor(type: string): boolean {
    const highPatterns = Object.keys(ScoringEngine.POINTS.high);
    return highPatterns.some(pattern => type.includes(pattern)) ||
           type.includes('loadstring') ||
           type.includes('ip_grabber') ||
           type.includes('httpget') ||
           type.includes('encoded_payload') ||
           type.includes('require_remote');
  }

  /**
   * Check if a factor is classified as medium-risk
   */
  private isMediumFactor(type: string): boolean {
    const mediumPatterns = Object.keys(ScoringEngine.POINTS.medium);
    return mediumPatterns.some(pattern => type.includes(pattern)) ||
           type.includes('obfuscator') ||
           type.includes('anti_debug') ||
           type.includes('environment_manipulation') ||
           type.includes('dynamic_require') ||
           type.includes('string_reconstruction');
  }
}
