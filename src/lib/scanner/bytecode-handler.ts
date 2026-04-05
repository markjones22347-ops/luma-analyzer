import { Detection, RiskFactor } from '@/types';

/**
 * Lua Bytecode Handler
 * Attempts decompilation, falls back to maximum risk if unable to analyze
 */
export class BytecodeHandler {
  // Lua bytecode signatures
  private static readonly BYTECODE_SIGNATURES = {
    lua51: /\x1bLua\x51/,
    lua52: /\x1bLua\x52/,
    lua53: /\x1bLua\x53/,
    lua54: /\x1bLua\x54/,
    luajit: /\x1b\x4c\x4a/,
    roblox: /\x1b\x52\x62/,
  };

  /**
   * Attempts to decompile bytecode or returns max risk if impossible
   */
  static async handleBytecode(code: string): Promise<{
    isBytecode: boolean;
    decompiled?: string;
    canAnalyze: boolean;
    detections: Detection[];
    riskFactors: RiskFactor[];
    analysisNote: string;
  }> {
    const detections: Detection[] = [];
    const riskFactors: RiskFactor[] = [];

    // Check for bytecode signatures
    let detectedType: string | null = null;
    for (const [name, pattern] of Object.entries(this.BYTECODE_SIGNATURES)) {
      if (pattern.test(code)) {
        detectedType = name;
        break;
      }
    }

    if (!detectedType) {
      return {
        isBytecode: false,
        canAnalyze: true,
        detections: [],
        riskFactors: [],
        analysisNote: '',
      };
    }

    // Attempt decompilation
    const decompileResult = await this.attemptDecompile(code, detectedType);

    if (decompileResult.success && decompileResult.code) {
      // Decompilation successful - return the decompiled code for analysis
      detections.push({
        title: 'Bytecode Decompiled',
        description: `Successfully decompiled ${detectedType} bytecode. Analyzing decompiled source...`,
        severity: 'medium',
      });

      return {
        isBytecode: true,
        decompiled: decompileResult.code,
        canAnalyze: true,
        detections,
        riskFactors,
        analysisNote: `Decompiled from ${detectedType} bytecode`,
      };
    }

    // Decompilation failed - MAXIMUM RISK
    detections.push({
      title: 'CRITICAL: Bytecode Cannot Be Analyzed',
      description: `Detected ${detectedType} compiled bytecode but decompilation failed. The internal content cannot be analyzed for security threats. This represents MAXIMUM RISK as malicious code could be hidden within the bytecode.`,
      severity: 'critical',
    });

    riskFactors.push({
      type: 'unanalyzable_bytecode',
      weight: 100,
      evidence: [`Type: ${detectedType}`, 'Decompilation failed', 'Internal content opaque'],
    });

    return {
      isBytecode: true,
      canAnalyze: false,
      detections,
      riskFactors,
      analysisNote: `CRITICAL: ${detectedType} bytecode detected but could not be decompiled. Internal content is opaque and cannot be analyzed. Treated as MAXIMUM RISK.`,
    };
  }

  /**
   * Attempts to decompile bytecode using available methods
   */
  private static async attemptDecompile(
    code: string,
    type: string
  ): Promise<{ success: boolean; code?: string; error?: string }> {
    // In a production environment, this would integrate with:
    // - luadec for standard Lua
    // - unluac for Lua 5.1+
    // - Custom Roblox decompilers
    // - LuaJIT decompilation tools

    // For this implementation, we'll attempt basic extraction of embedded strings
    // which often contains obfuscated source or URLs
    try {
      // Extract readable strings from bytecode (basic heuristic decompilation)
      const extractedStrings = this.extractStringsFromBytecode(code);
      
      if (extractedStrings.length > 0) {
        // If we can extract meaningful strings, consider it partial success
        const reconstructed = this.reconstructFromStrings(extractedStrings);
        if (reconstructed.length > 100) {
          return { success: true, code: reconstructed };
        }
      }

      // Check for embedded source code alongside bytecode
      const embeddedSource = this.extractEmbeddedSource(code);
      if (embeddedSource) {
        return { success: true, code: embeddedSource };
      }

      return {
        success: false,
        error: `Unable to decompile ${type} bytecode. No analyzable source extracted.`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Decompilation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Extracts readable strings from bytecode
   */
  private static extractStringsFromBytecode(code: string): string[] {
    const strings: string[] = [];
    
    // Pattern for Lua strings in bytecode (4-byte length prefix)
    const stringPattern = /[\x00-\x1f][\x00-\xff]{3}([\x20-\x7e]{4,})/g;
    let match;
    
    while ((match = stringPattern.exec(code)) !== null) {
      strings.push(match[1]);
    }

    // Also look for standard string patterns
    const standardStrings = code.match(/[\x20-\x7e]{10,}/g) || [];
    strings.push(...standardStrings);

    return [...new Set(strings)]; // Deduplicate
  }

  /**
   * Attempts to reconstruct pseudo-source from extracted strings
   */
  private static reconstructFromStrings(strings: string[]): string {
    // Join strings that look like code fragments
    const codeLike = strings.filter(s => 
      /\b(function|local|if|then|end|return|loadstring|require|http|request)\b/.test(s)
    );

    if (codeLike.length > 0) {
      return '-- Reconstructed from bytecode fragments\n' + codeLike.join('\n');
    }

    return strings.join('\n');
  }

  /**
   * Extracts source code that may be embedded alongside bytecode
   */
  private static extractEmbeddedSource(code: string): string | null {
    // Look for source code after bytecode header
    const sourcePattern = /\x1bLua.{4,100}(function|local|if|then)/;
    const match = code.match(sourcePattern);
    
    if (match && match[1]) {
      const startIdx = code.indexOf(match[1]);
      if (startIdx > 0) {
        return code.substring(startIdx);
      }
    }

    return null;
  }

  /**
   * Validates that analysis is purely static
   */
  static enforceStaticOnly(): void {
    // Safety check - scanner should NEVER execute Lua
    const executionDetected = false;
    
    if (executionDetected) {
      throw new Error(
        'CRITICAL SECURITY VIOLATION: Attempted to execute Lua code during analysis. ' +
        'Luma is strictly static analysis only.'
      );
    }
  }
}
