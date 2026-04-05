import { AnalysisContext, DetectionCategory } from '@/types';

export class ScoringEngine {
  private static readonly BASE_WEIGHTS = {
    remote_execution: 40,
    webhook: 25,
    getgenv_exfiltration: 30,
    obfuscator_known: 25,
    obfuscator_suspected: 15,
    network_request: 10,
    environment_manipulation: 15,
    anti_debug: 10,
    high_entropy: 15,
    suspicious_strings: 20,
    ip_grabber: 35,
  };

  calculateScore(context: AnalysisContext, detections: DetectionCategory[]): number {
    let score = 0;
    const appliedFactors = new Set<string>();

    // Apply risk factor weights
    for (const factor of context.riskFactors) {
      if (!appliedFactors.has(factor.type)) {
        const weight = this.getWeightForFactor(factor.type);
        score += weight * (1 + (factor.evidence.length - 1) * 0.2);
        appliedFactors.add(factor.type);
      }
    }

    // Obfuscation penalty (capped)
    if (context.obfuscationLevel > 90) {
      score += 30;
    } else if (context.obfuscationLevel > 70) {
      score += 20;
    } else if (context.obfuscationLevel > 50) {
      score += 10;
    }

    // Count critical and high severity detections
    let criticalCount = 0;
    let highCount = 0;
    for (const cat of detections) {
      for (const det of cat.detections) {
        if (det.severity === 'critical') criticalCount++;
        if (det.severity === 'high') highCount++;
      }
    }

    // Additional penalties for multiple serious issues
    score += criticalCount * 15;
    score += Math.max(0, (highCount - 1)) * 5;

    // Cap the score
    score = Math.min(score, 100);

    // Ensure minimum score if any serious issues exist
    if (criticalCount > 0 && score < 70) {
      score = 70;
    }

    // Boost score to at least 30 if obfuscation is high
    if (context.obfuscationLevel > 85 && score < 30) {
      score = 30;
    }

    return Math.round(score);
  }

  private getWeightForFactor(type: string): number {
    // Check for exact match
    if (type in ScoringEngine.BASE_WEIGHTS) {
      return ScoringEngine.BASE_WEIGHTS[type as keyof typeof ScoringEngine.BASE_WEIGHTS];
    }

    // Check for partial matches
    if (type.includes('remote_execution')) return ScoringEngine.BASE_WEIGHTS.remote_execution;
    if (type.includes('webhook')) return ScoringEngine.BASE_WEIGHTS.webhook;
    if (type.includes('getgenv')) return ScoringEngine.BASE_WEIGHTS.getgenv_exfiltration;
    if (type.includes('obfuscator')) return ScoringEngine.BASE_WEIGHTS.obfuscator_known;
    if (type.includes('ip_grabber')) return ScoringEngine.BASE_WEIGHTS.ip_grabber;
    if (type.includes('network')) return ScoringEngine.BASE_WEIGHTS.network_request;
    if (type.includes('environment')) return ScoringEngine.BASE_WEIGHTS.environment_manipulation;
    if (type.includes('anti')) return ScoringEngine.BASE_WEIGHTS.anti_debug;

    return 5; // Default weight
  }
}
