import { AnalysisContext, DetectionCategory } from '@/types';

/**
 * Risk Score Calculation (1-100 Scale)
 * 
 * 1-20   = SAFE (Green)
 * 21-40  = LOW RISK (Yellow)
 * 41-60  = MODERATE RISK (Orange)
 * 61-80  = HIGH RISK (Red)
 * 81-100 = CRITICAL (Dark Red)
 */
export class ScoringEngine {
  // Risk weights based on severity levels
  private static readonly WEIGHTS = {
    // Minor patterns (+5 to +20)
    weird_naming: 5,
    harmless_encoding: 8,
    getfenv_usage: 12,
    
    // Medium patterns (+20 to +40)
    string_reconstruction: 25,
    fake_network_behavior: 28,
    light_obfuscation: 22,
    base64_strings: 20,
    
    // High-risk patterns (+40 to +70)
    loadstring: 55,
    httpget: 50,
    encoded_url: 45,
    webhook_fragment: 60,
    require_dynamic: 48,
    
    // Critical patterns (+70 to +100)
    remote_execution_chain: 85,
    bytecode_detected: 100,
    bytecode_decompile_failed: 100,
    data_exfiltration: 90,
    cookie_stealer: 95,
    
    // Legacy weights for compatibility
    remote_execution: 55,
    webhook: 60,
    getgenv_exfiltration: 50,
    obfuscator_known: 40,
    obfuscator_suspected: 25,
    network_request: 20,
    environment_manipulation: 25,
    anti_debug: 20,
    high_entropy: 22,
    suspicious_strings: 25,
    ip_grabber: 50,
  };

  calculateScore(context: AnalysisContext, detections: DetectionCategory[]): number {
    let score = 0;
    const appliedFactors = new Set<string>();

    // Apply risk factor weights
    for (const factor of context.riskFactors) {
      if (!appliedFactors.has(factor.type)) {
        const weight = this.getWeightForFactor(factor.type);
        score += weight * (1 + (factor.evidence.length - 1) * 0.15);
        appliedFactors.add(factor.type);
      }
    }

    // Obfuscation scoring
    if (context.obfuscationLevel > 90) {
      score += 35;
    } else if (context.obfuscationLevel > 70) {
      score += 28;
    } else if (context.obfuscationLevel > 50) {
      score += 18;
    } else if (context.obfuscationLevel > 30) {
      score += 10;
    }

    // Count critical and high severity detections
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    for (const cat of detections) {
      for (const det of cat.detections) {
        if (det.severity === 'critical') criticalCount++;
        if (det.severity === 'high') highCount++;
        if (det.severity === 'medium') mediumCount++;
      }
    }

    // Additional penalties for multiple serious issues
    score += criticalCount * 20;
    score += highCount * 12;
    score += Math.max(0, (mediumCount - 2)) * 5;

    // Cap the score at 100
    score = Math.min(score, 100);

    // Ensure minimum score reflects severity
    if (criticalCount > 0 && score < 61) {
      score = 61; // At least HIGH RISK if critical issues exist
    }
    if (highCount >= 3 && score < 41) {
      score = 41; // At least MODERATE if multiple high issues
    }

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
        recommendation: 'Safe' 
      };
    } else if (score <= 40) {
      return { 
        level: 'LOW RISK', 
        color: '#f59e0b', 
        recommendation: 'Use caution' 
      };
    } else if (score <= 60) {
      return { 
        level: 'MODERATE RISK', 
        color: '#f97316', 
        recommendation: 'Review manually' 
      };
    } else if (score <= 80) {
      return { 
        level: 'HIGH RISK', 
        color: '#ef4444', 
        recommendation: 'Do not execute' 
      };
    } else {
      return { 
        level: 'CRITICAL', 
        color: '#dc2626', 
        recommendation: 'Do not execute' 
      };
    }
  }

  private getWeightForFactor(type: string): number {
    // Check for exact match
    if (type in ScoringEngine.WEIGHTS) {
      return ScoringEngine.WEIGHTS[type as keyof typeof ScoringEngine.WEIGHTS];
    }

    // Check for partial matches
    if (type.includes('remote_execution') || type.includes('loadstring')) return ScoringEngine.WEIGHTS.remote_execution;
    if (type.includes('webhook')) return ScoringEngine.WEIGHTS.webhook;
    if (type.includes('getgenv')) return ScoringEngine.WEIGHTS.getgenv_exfiltration;
    if (type.includes('obfuscator')) return ScoringEngine.WEIGHTS.obfuscator_known;
    if (type.includes('ip_grabber')) return ScoringEngine.WEIGHTS.ip_grabber;
    if (type.includes('network') || type.includes('http')) return ScoringEngine.WEIGHTS.network_request;
    if (type.includes('environment')) return ScoringEngine.WEIGHTS.environment_manipulation;
    if (type.includes('anti')) return ScoringEngine.WEIGHTS.anti_debug;
    if (type.includes('bytecode')) return ScoringEngine.WEIGHTS.bytecode_detected;
    if (type.includes('cookie') || type.includes('stealer')) return ScoringEngine.WEIGHTS.cookie_stealer;

    return 8; // Default weight for unknown factors
  }
}
