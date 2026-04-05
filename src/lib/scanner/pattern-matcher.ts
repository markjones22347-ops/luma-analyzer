import { AnalysisContext, RiskFactor, Detection, ExtractedUrl, SuspiciousString } from '@/types';

export class PatternMatcher {
  private static readonly NETWORK_PATTERNS = {
    request: /\b(request|http_request|syn\.request|http\.request)\s*\(/gi,
    httpGet: /\b(game\.HttpGet|HttpGet|http\.Get|syn\.http_get)\s*\(/gi,
    httpPost: /\b(HttpPost|http\.post|syn\.http_post)\s*\(/gi,
    socket: /\b(WebSocket|socket|connect)\s*\(/gi,
    webhook: /https?:\/\/discord\.com\/api\/webhooks\/[^\s\'"]+/gi,
  };

  private static readonly EXECUTION_PATTERNS = {
    loadstring: /\bloadstring\s*\(/gi,
    pcallLoadstring: /pcall\s*\(\s*loadstring/gi,
    compile: /\b(CompileString|load|loadfile)\s*\(/gi,
    dofile: /\bdofile\s*\(/gi,
    require: /\brequire\s*\(/gi,
  };

  private static readonly ENVIRONMENT_PATTERNS = {
    getgenv: /\bgetgenv\s*\(\s*\)/gi,
    setgenv: /\bsetgenv\s*\(/gi,
    getrawmetatable: /\bgetrawmetatable\s*\(/gi,
    setrawmetatable: /\bsetrawmetatable\s*\(/gi,
    hookfunction: /\bhookfunction\s*\(/gi,
    hookmetamethod: /\bhookmetamethod\s*\(/gi,
    debug: /\b(debug\.getupvalue|debug\.setupvalue|debug\.getregistry)\s*\(/gi,
    getfenv: /\bgetfenv\s*\(/gi,
    setfenv: /\bsetfenv\s*\(/gi,
  };

  private static readonly ANTI_DEBUG_PATTERNS = {
    getconnections: /\bgetconnections\s*\(/gi,
    hooksignal: /\b(hooksignal|getsignal)\s*\(/gi,
    checkcaller: /\bcheckcaller\s*\(/gi,
    isstudio: /\b(isstudio|RunService\.IsStudio)\s*\(/gi,
    isexecutor: /\b(isexecutor|is_synapse|is_krnl|is_oxygen|is_fluxus)/gi,
    firesignal: /\bfiresignal\s*\(/gi,
  };

  private static readonly OBFUSCATION_PATTERNS = {
    ironbrew: /IronBrew|IB2|IronBrew2/gi,
    luraph: /Luraph|LPH_|luraph_/gi,
    moonsec: /MoonSec|Moon|Sec|msc/gi,
    psu: /PSU\s*obfuscator|ProtoSmasher/gi,
    xen: /Xen|Xeno/gi,
    aztupbrew: /AztupBrew/gi,
  };

  private static readonly SUSPICIOUS_STRINGS = {
    roblosecurity: /\.ROBLOSECURITY|roblosecurity/gi,
    token: /[a-f0-9]{64,}|[a-zA-Z0-9_-]{50,}/g,
    cookie: /cookie|_token|auth_token/gi,
    key: /\b(key|api[_-]?key|secret|password)\s*=\s*['"]/gi,
  };

  private static readonly URL_PATTERNS = {
    url: /https?:\/\/[^\s\'"<>]+/gi,
    ip: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?\b/g,
    grabify: /grabify\.(link|icu|xyz)|iplogger\.(org|com)|yip\.su|iplis\.ru/gi,
    shortener: /bit\.ly|tinyurl|t\.ly|is\.gd|short\.link|rebrand\.ly/gi,
  };

  static analyzeNetwork(code: string, lines: string[]): { detections: Detection[]; riskFactors: RiskFactor[]; hasActivity: boolean } {
    const detections: Detection[] = [];
    const riskFactors: RiskFactor[] = [];
    let hasActivity = false;

    // Check for request patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Direct request calls
      if (this.NETWORK_PATTERNS.request.test(line)) {
        hasActivity = true;
        detections.push({
          title: 'HTTP Request Detected',
          description: 'Script makes network requests that could exfiltrate data',
          line: i + 1,
          code: line.trim(),
          severity: 'medium',
        });
      }

      // HttpGet patterns (common in exploits)
      if (this.NETWORK_PATTERNS.httpGet.test(line)) {
        hasActivity = true;
        detections.push({
          title: 'HttpGet Usage',
          description: 'Roblox HttpGet can fetch remote content',
          line: i + 1,
          code: line.trim(),
          severity: 'medium',
        });
      }

      // Webhooks
      const webhookMatches = line.match(this.NETWORK_PATTERNS.webhook);
      if (webhookMatches) {
        hasActivity = true;
        detections.push({
          title: 'Discord Webhook Detected',
          description: `Found webhook URL that could be used for data exfiltration`,
          line: i + 1,
          code: line.trim(),
          severity: 'high',
        });
        riskFactors.push({
          type: 'webhook',
          weight: 25,
          evidence: webhookMatches,
        });
      }
    }

    return { detections, riskFactors, hasActivity };
  }

  static analyzeRemoteExecution(code: string, lines: string[]): { detections: Detection[]; riskFactors: RiskFactor[]; hasExecution: boolean } {
    const detections: Detection[] = [];
    const riskFactors: RiskFactor[] = [];
    let hasExecution = false;
    const loadstringLines: number[] = [];
    const httpLines: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (this.EXECUTION_PATTERNS.loadstring.test(line)) {
        loadstringLines.push(i + 1);
        hasExecution = true;
        detections.push({
          title: 'Dynamic Code Execution',
          description: 'loadstring() executes code from strings',
          line: i + 1,
          code: line.trim(),
          severity: 'high',
        });
      }

      if (this.NETWORK_PATTERNS.httpGet.test(line) || this.NETWORK_PATTERNS.request.test(line)) {
        httpLines.push(i + 1);
      }

      if (this.EXECUTION_PATTERNS.pcallLoadstring.test(line)) {
        detections.push({
          title: 'Protected Dynamic Execution',
          description: 'pcall(loadstring()) pattern - attempts to hide errors',
          line: i + 1,
          code: line.trim(),
          severity: 'high',
        });
      }
    }

    // Check for dangerous combinations
    if (loadstringLines.length > 0 && httpLines.length > 0) {
      const proximityThreshold = 10;
      for (const loadLine of loadstringLines) {
        for (const httpLine of httpLines) {
          if (Math.abs(loadLine - httpLine) <= proximityThreshold) {
            riskFactors.push({
              type: 'remote_execution_chain',
              weight: 40,
              evidence: [`loadstring at line ${loadLine}`, `HTTP request at line ${httpLine}`],
            });
            detections.push({
              title: 'CRITICAL: Remote Code Execution Chain',
              description: 'Script fetches remote code and executes it immediately - EXTREME RISK',
              line: Math.min(loadLine, httpLine),
              code: 'Combined HTTP + loadstring pattern',
              severity: 'critical',
            });
          }
        }
      }
    }

    return { detections, riskFactors, hasExecution };
  }

  static analyzeEnvironment(code: string, lines: string[]): { detections: Detection[]; riskFactors: RiskFactor[] } {
    const detections: Detection[] = [];
    const riskFactors: RiskFactor[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // getgenv analysis - contextual risk
      if (this.ENVIRONMENT_PATTERNS.getgenv.test(line)) {
        // Check if followed by request or sensitive operation
        const contextWindow = lines.slice(i, Math.min(i + 3, lines.length)).join(' ');
        const hasRequest = /request|http/i.test(contextWindow);
        const hasWebhook = /webhook|discord/i.test(contextWindow);
        
        if (hasRequest || hasWebhook) {
          riskFactors.push({
            type: 'getgenv_exfiltration',
            weight: 30,
            evidence: [line.trim()],
          });
          detections.push({
            title: 'Environment Access + Network Activity',
            description: 'getgenv() combined with network calls - likely data exfiltration',
            line: i + 1,
            code: line.trim(),
            severity: 'critical',
          });
        } else {
          detections.push({
            title: 'Global Environment Access',
            description: 'getgenv() accesses the global environment',
            line: i + 1,
            code: line.trim(),
            severity: 'low',
          });
        }
      }

      if (this.ENVIRONMENT_PATTERNS.hookfunction.test(line)) {
        detections.push({
          title: 'Function Hooking',
          description: 'Function hooks can intercept and modify behavior',
          line: i + 1,
          code: line.trim(),
          severity: 'high',
        });
      }

      if (this.ENVIRONMENT_PATTERNS.hookmetamethod.test(line)) {
        detections.push({
          title: 'Metamethod Hooking',
          description: 'Metamethod hooks intercept object operations',
          line: i + 1,
          code: line.trim(),
          severity: 'high',
        });
      }

      if (this.ENVIRONMENT_PATTERNS.getrawmetatable.test(line)) {
        detections.push({
          title: 'Raw Metatable Access',
          description: 'Access to raw metatables bypasses normal protections',
          line: i + 1,
          code: line.trim(),
          severity: 'medium',
        });
      }
    }

    return { detections, riskFactors };
  }

  static analyzeAntiDebug(code: string, lines: string[]): { detections: Detection[]; riskFactors: RiskFactor[] } {
    const detections: Detection[] = [];
    const riskFactors: RiskFactor[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (this.ANTI_DEBUG_PATTERNS.getconnections.test(line)) {
        detections.push({
          title: 'Signal Connection Inspection',
          description: 'getconnections() can disable or inspect event connections',
          line: i + 1,
          code: line.trim(),
          severity: 'medium',
        });
      }

      if (this.ANTI_DEBUG_PATTERNS.checkcaller.test(line)) {
        detections.push({
          title: 'Caller Verification',
          description: 'checkcaller() detects if code is running in user context',
          line: i + 1,
          code: line.trim(),
          severity: 'medium',
        });
      }

      if (this.ANTI_DEBUG_PATTERNS.isstudio.test(line)) {
        detections.push({
          title: 'Studio Detection',
          description: 'Script detects Roblox Studio environment',
          line: i + 1,
          code: line.trim(),
          severity: 'low',
        });
      }

      if (this.ANTI_DEBUG_PATTERNS.isexecutor.test(line)) {
        detections.push({
          title: 'Executor Detection',
          description: 'Script detects exploit executor presence',
          line: i + 1,
          code: line.trim(),
          severity: 'medium',
        });
      }
    }

    return { detections, riskFactors };
  }

  static analyzeObfuscation(code: string): { score: number; detections: Detection[]; riskFactors: RiskFactor[] } {
    const detections: Detection[] = [];
    const riskFactors: RiskFactor[] = [];
    let score = 0;

    // Check for known obfuscators
    for (const [name, pattern] of Object.entries(this.OBFUSCATION_PATTERNS)) {
      if (pattern.test(code)) {
        score += 30;
        detections.push({
          title: `Known Obfuscator: ${name}`,
          description: `Script appears to be obfuscated with ${name}`,
          severity: 'high',
        });
        riskFactors.push({
          type: `obfuscator_${name}`,
          weight: 25,
          evidence: [`Detected ${name} signature`],
        });
      }
    }

    // Entropy analysis
    const cleanedCode = code.replace(/\s/g, '');
    if (cleanedCode.length > 100) {
      const uniqueChars = new Set(cleanedCode).size;
      const entropy = uniqueChars / cleanedCode.length;
      
      if (entropy > 0.7) {
        score += 20;
        detections.push({
          title: 'High Entropy Code',
          description: 'Code shows high character randomness (possible obfuscation)',
          severity: 'medium',
        });
      }
    }

    // Byte array patterns
    const byteArrayPattern = /\{\s*(?:\d+\s*,\s*){10,}\d+\s*\}/g;
    const byteArrays = code.match(byteArrayPattern);
    if (byteArrays && byteArrays.length > 0) {
      score += 15;
      detections.push({
        title: 'Byte Array Obfuscation',
        description: `Found ${byteArrays.length} byte array(s) - common obfuscation technique`,
        severity: 'medium',
      });
    }

    // Base64 patterns
    const base64Pattern = /[A-Za-z0-9+/]{50,}={0,2}/g;
    const base64Matches = code.match(base64Pattern);
    if (base64Matches) {
      score += 10;
      detections.push({
        title: 'Base64 Encoded Content',
        description: `Found ${base64Matches.length} base64-like string(s)`,
        severity: 'low',
      });
    }

    // Random variable names (excessive)
    const varPattern = /\b(local\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
    const varNames: string[] = [];
    let match;
    while ((match = varPattern.exec(code)) !== null) {
      varNames.push(match[2]);
    }
    
    const shortRandomVars = varNames.filter(v => v.length <= 2 && /[a-z0-9]{1,2}/i.test(v));
    const ratio = varNames.length > 0 ? shortRandomVars.length / varNames.length : 0;
    
    if (ratio > 0.5 && varNames.length > 20) {
      score += 10;
      detections.push({
        title: 'Randomized Variable Names',
        description: 'High ratio of short/random variable names',
        severity: 'low',
      });
    }

    return { score: Math.min(score, 100), detections, riskFactors };
  }

  static extractUrls(code: string, lines: string[]): ExtractedUrl[] {
    const urls: ExtractedUrl[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // General URLs
      const urlMatches = line.match(this.URL_PATTERNS.url);
      if (urlMatches) {
        for (const url of urlMatches) {
          if (seen.has(url)) continue;
          seen.add(url);

          let type: ExtractedUrl['type'] = 'unknown';
          let risk: ExtractedUrl['risk'] = 'low';

          if (url.includes('discord.com/api/webhooks')) {
            type = 'webhook';
            risk = 'high';
          } else if (url.includes('github.com') || url.includes('raw.githubusercontent.com')) {
            type = 'github';
            risk = 'low';
          } else if (url.includes('pastebin.com')) {
            type = 'pastebin';
            risk = 'medium';
          } else if (url.includes('roblox.com') || /^(https?:\/\/)?(www\.)?roblox\.com/i.test(url)) {
            type = 'roblox';
            risk = 'low';
          } else if (url.includes('cloudflare.com') || url.includes('workers.dev') || /^(https?:\/\/)?.*\.cloudflare\.com/i.test(url) || /^(https?:\/\/)?.*\.workers\.dev/i.test(url)) {
            type = 'cloudflare';
            risk = 'medium';
          } else if (this.URL_PATTERNS.grabify.test(url)) {
            type = 'ipgrabber';
            risk = 'high';
          } else if (this.URL_PATTERNS.shortener.test(url)) {
            type = 'shortener';
            risk = 'medium';
          }

          urls.push({ url, type, line: i + 1, risk });
        }
      }

      // IP addresses
      const ipMatches = line.match(this.URL_PATTERNS.ip);
      if (ipMatches) {
        for (const ip of ipMatches) {
          if (seen.has(ip)) continue;
          seen.add(ip);
          urls.push({ url: ip, type: 'suspicious', line: i + 1, risk: 'medium' });
        }
      }
    }

    return urls;
  }

  static extractSuspiciousStrings(code: string, lines: string[]): SuspiciousString[] {
    const strings: SuspiciousString[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // ROBLOSECURITY
      if (this.SUSPICIOUS_STRINGS.roblosecurity.test(line)) {
        strings.push({
          value: '.ROBLOSECURITY',
          type: 'cookie',
          line: i + 1,
          risk: 'high',
        });
      }

      // Long tokens/keys
      const tokenMatches = line.match(/['"]([a-f0-9]{32,})['"]/gi);
      if (tokenMatches) {
        for (const token of tokenMatches) {
          const clean = token.replace(/['"]/g, '');
          if (seen.has(clean)) continue;
          seen.add(clean);
          strings.push({
            value: clean.substring(0, 20) + '...',
            type: 'token',
            line: i + 1,
            risk: 'high',
          });
        }
      }

      // API keys
      if (this.SUSPICIOUS_STRINGS.key.test(line)) {
        const keyMatch = line.match(/['"]([a-zA-Z0-9_-]{20,})['"]/);
        if (keyMatch) {
          strings.push({
            value: keyMatch[1].substring(0, 15) + '...',
            type: 'key',
            line: i + 1,
            risk: 'medium',
          });
        }
      }
    }

    return strings;
  }
}
