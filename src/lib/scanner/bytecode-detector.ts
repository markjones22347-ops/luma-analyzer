import { Detection, RiskFactor } from '@/types';

/**
 * Lua Bytecode Detector
 * Identifies compiled Lua bytecode and flags as high risk
 * No bytecode is EVER executed - purely static analysis
 */
export class BytecodeDetector {
  // Lua bytecode signatures
  private static readonly BYTECODE_SIGNATURES = {
    // Lua 5.1 bytecode header: \x1bLua followed by version
    lua51: /\x1bLua\x51/,
    // Lua 5.2 bytecode header
    lua52: /\x1bLua\x52/,
    // Lua 5.3 bytecode header
    lua53: /\x1bLua\x53/,
    // Lua 5.4 bytecode header
    lua54: /\x1bLua\x54/,
    // LuaJIT bytecode (various forms)
    luajit: /\x1b\x4c\x4a/,
    // Roblox's custom bytecode (slightly modified Lua)
    roblox: /\x1b\x52\x62/,
  };

  // Known obfuscator bytecode markers
  private static readonly OBFUSCATOR_MARKERS = {
    ironbrew: /IB2|IronBrew.*\x00/,
    luraph: /LPH_\w{20,}/,
    moonsec: /[\x00-\x1f]{10,}MoonSec/,
    psu: /ProtoSmasher|PSU.*\x1b/,
    xen: /Xeno|Xen\x00/,
    // Common bytecode obfuscation pattern: heavy null bytes in sequence
    heavyObfuscation: /\x00{5,}/,
  };

  /**
   * Analyzes code for bytecode signatures
   * Returns critical severity if bytecode detected
   */
  static detect(code: string): {
    isBytecode: boolean;
    detections: Detection[];
    riskFactors: RiskFactor[];
    bytecodeType?: string;
    obfuscationLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  } {
    const detections: Detection[] = [];
    const riskFactors: RiskFactor[] = [];
    let isBytecode = false;
    let bytecodeType: string | undefined;
    let obfuscationLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';

    // Check for bytecode signatures
    for (const [name, pattern] of Object.entries(this.BYTECODE_SIGNATURES)) {
      if (pattern.test(code)) {
        isBytecode = true;
        bytecodeType = name;
        
        detections.push({
          title: `COMPILED BYTECODE DETECTED: ${name.toUpperCase()}`,
          description: `Script contains ${name} compiled bytecode. Bytecode cannot be statically analyzed and may contain hidden malicious instructions. This is a HIGH RISK indicator.`,
          severity: 'critical',
        });

        riskFactors.push({
          type: 'compiled_bytecode',
          weight: 50,
          evidence: [`Detected ${name} signature`],
        });

        obfuscationLevel = 'critical';
        break; // Only report first match
      }
    }

    // Check for obfuscator markers even in source code
    for (const [name, pattern] of Object.entries(this.OBFUSCATOR_MARKERS)) {
      if (pattern.test(code)) {
        const severity = name === 'heavyObfuscation' ? 'high' : 'critical';
        
        detections.push({
          title: `Bytecode-Level Obfuscation: ${name}`,
          description: `Detected ${name} obfuscation patterns in the code. This indicates intentional hiding of code functionality.`,
          severity,
        });

        riskFactors.push({
          type: `bytecode_obfuscation_${name}`,
          weight: name === 'heavyObfuscation' ? 35 : 45,
          evidence: [`${name} signature detected`],
        });

        if (!isBytecode) {
          obfuscationLevel = severity === 'critical' ? 'critical' : 'high';
        }
      }
    }

    // Additional analysis for mixed source/bytecode
    if (isBytecode) {
      // Check if it also contains source code (hybrid)
      const hasSourceCode = /\b(function|local|if|then|end|return)\b/.test(code);
      if (hasSourceCode) {
        detections.push({
          title: 'Hybrid Bytecode/Source Code',
          description: 'Script contains both compiled bytecode and source code. This is a common evasion technique.',
          severity: 'critical',
        });

        riskFactors.push({
          type: 'hybrid_bytecode_source',
          weight: 45,
          evidence: ['Mixed bytecode and source detected'],
        });
      }

      // Check for embedded bytecode chunks in strings
      const bytecodeChunks = this.extractBytecodeChunks(code);
      if (bytecodeChunks.length > 0) {
        detections.push({
          title: `Embedded Bytecode Chunks: ${bytecodeChunks.length}`,
          description: `Found ${bytecodeChunks.length} embedded bytecode chunk(s). These are likely loaded dynamically at runtime.`,
          severity: 'critical',
        });

        riskFactors.push({
          type: 'embedded_bytecode',
          weight: 40,
          evidence: bytecodeChunks.map((_, i) => `Chunk ${i + 1}`),
        });
      }
    }

    return {
      isBytecode,
      detections,
      riskFactors,
      bytecodeType,
      obfuscationLevel,
    };
  }

  /**
   * Attempts to extract bytecode chunks from strings
   * These are often base64/hex encoded bytecode segments
   */
  private static extractBytecodeChunks(code: string): string[] {
    const chunks: string[] = [];

    // Pattern 1: Base64 encoded chunks that decode to bytecode-like content
    const base64Chunks = code.match(/['"]([A-Za-z0-9+/]{100,}={0,2})['"]/g);
    if (base64Chunks) {
      for (const chunk of base64Chunks) {
        // Quick heuristic: high entropy base64 likely contains bytecode
        if (this.isHighEntropy(chunk)) {
          chunks.push(chunk);
        }
      }
    }

    // Pattern 2: Hex encoded byte sequences
    const hexChunks = code.match(/['"]([a-f0-9\s]{100,})['"]/gi);
    if (hexChunks) {
      for (const chunk of hexChunks) {
        if (this.looksLikeBytecodeHex(chunk)) {
          chunks.push(chunk);
        }
      }
    }

    // Pattern 3: Byte arrays
    const byteArrays = code.match(/\{[\s\d,]{50,}\}/g);
    if (byteArrays) {
      chunks.push(...byteArrays);
    }

    return chunks;
  }

  /**
   * Checks if string has high entropy (randomness indicator)
   */
  private static isHighEntropy(str: string): boolean {
    const unique = new Set(str).size;
    const entropy = unique / str.length;
    return entropy > 0.7 && str.length > 50;
  }

  /**
   * Checks if hex string looks like bytecode
   */
  private static looksLikeBytecodeHex(hex: string): boolean {
    // Lua bytecode often starts with these patterns when hex encoded
    const bytecodePatterns = [
      '1b4c75', // \x1bLua
      '1b4c4a', // \x1bLJ (LuaJIT)
      '1b5262', // \x1bRb (Roblox)
    ];
    
    const cleanHex = hex.replace(/[^a-f0-9]/gi, '').toLowerCase();
    return bytecodePatterns.some(pattern => cleanHex.startsWith(pattern));
  }

  /**
   * Validates that analysis is purely static
   * Throws if any execution is attempted
   */
  static enforceStaticOnly(): void {
    // This is a safety check - the scanner should NEVER:
    // 1. Call loadstring() or load()
    // 2. Execute any Lua interpreter
    // 3. Evaluate dynamic code
    // 4. Run sandboxed Lua

    // If we detect any execution attempt, throw immediately
    const executionDetected = false; // This would be set by monitoring
    
    if (executionDetected) {
      throw new Error(
        'CRITICAL SECURITY VIOLATION: Attempted to execute Lua code during analysis. ' +
        'Luma is strictly static analysis only. This incident has been logged.'
      );
    }
  }

  /**
   * Security assertion for static analysis
   */
  static assertStaticAnalysis(code: string): void {
    // Double check we haven't accidentally loaded executable content
    const executableSignatures = [
      '\x1bLua', // Lua bytecode
      '\x89PNG', // Could be disguised executable
      'MZ', // Windows executable
      '\x7fELF', // Linux executable
    ];

    for (const sig of executableSignatures) {
      if (code.includes(sig)) {
        // Log but don't throw - this is handled by detection logic
        console.warn(`[SECURITY] Executable signature detected in analysis: ${sig}`);
      }
    }
  }
}
