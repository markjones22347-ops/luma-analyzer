import { Detection, RiskFactor, ExtractedUrl } from '@/types';

/**
 * Safe URL Fetcher with strict depth limits and DoS protection
 * - Max depth: 2 levels (prevent infinite nesting)
 * - Max file size: 500KB per URL (prevent heavy file DoS)
 * - Max URLs per scan: 10 (prevent enumeration attacks)
 * - Timeout: 10 seconds per request
 * - Only fetches text content, NEVER executes anything
 */
export class SafeUrlFetcher {
  private static readonly MAX_DEPTH = 2;
  private static readonly MAX_FILE_SIZE = 500 * 1024; // 500KB
  private static readonly MAX_URLS_PER_SCAN = 10;
  private static readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private static readonly ALLOWED_CONTENT_TYPES = [
    'text/plain',
    'text/html',
    'application/octet-stream',
    'application/json',
  ];

  private fetchedUrls: Set<string> = new Set();
  private currentDepth: number = 0;
  private urlCount: number = 0;

  /**
   * Analyzes URLs found in code and optionally fetches them if safe
   * Does NOT follow URLs automatically - only analyzes references
   */
  async analyzeUrls(
    urls: ExtractedUrl[],
    options: { fetchContent?: boolean } = {}
  ): Promise<{
    detections: Detection[];
    riskFactors: RiskFactor[];
    fetchedContent: Map<string, string>;
    blockedUrls: string[];
  }> {
    const detections: Detection[] = [];
    const riskFactors: RiskFactor[] = [];
    const fetchedContent = new Map<string, string>();
    const blockedUrls: string[] = [];

    for (const urlInfo of urls) {
      // Check URL limit
      if (this.urlCount >= SafeUrlFetcher.MAX_URLS_PER_SCAN) {
        blockedUrls.push(urlInfo.url);
        detections.push({
          title: 'URL Analysis Limit Reached',
          description: `Skipped ${urls.length - this.urlCount} URLs to prevent DoS attacks`,
          severity: 'medium',
        });
        break;
      }

      this.urlCount++;

      // Check for suspicious URL patterns even without fetching
      const urlRisk = this.analyzeUrlStructure(urlInfo.url);
      if (urlRisk.isSuspicious) {
        detections.push({
          title: 'Suspicious URL Structure',
          description: urlRisk.reason || 'Suspicious URL pattern detected',
          line: urlInfo.line,
          severity: 'high',
        });
        riskFactors.push({
          type: 'suspicious_url_structure',
          weight: 20,
          evidence: [urlInfo.url],
        });
      }

      // Optionally fetch content if enabled and safe
      if (options.fetchContent && this.shouldFetchUrl(urlInfo)) {
        try {
          const content = await this.fetchUrlSafely(urlInfo.url);
          if (content) {
            fetchedContent.set(urlInfo.url, content);

            // Analyze fetched content for nested threats
            const nestedThreats = this.analyzeFetchedContent(content, urlInfo.url);
            detections.push(...nestedThreats.detections);
            riskFactors.push(...nestedThreats.riskFactors);
          }
        } catch (error) {
          detections.push({
            title: 'URL Fetch Failed',
            description: `Could not fetch ${urlInfo.url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            line: urlInfo.line,
            severity: 'low',
          });
        }
      }
    }

    return { detections, riskFactors, fetchedContent, blockedUrls };
  }

  /**
   * Fetches URL content with strict safety limits
   */
  private async fetchUrlSafely(url: string): Promise<string | null> {
    // Prevent duplicate fetches
    if (this.fetchedUrls.has(url)) {
      return null;
    }

    // Check depth limit
    if (this.currentDepth >= SafeUrlFetcher.MAX_DEPTH) {
      throw new Error('Maximum URL depth exceeded');
    }

    // Validate URL
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }

    // Check for private/internal IPs
    if (this.isPrivateIp(parsedUrl.hostname)) {
      throw new Error('Private IP addresses not allowed');
    }

    this.fetchedUrls.add(url);
    this.currentDepth++;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SafeUrlFetcher.REQUEST_TIMEOUT);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Luma-Security-Scanner/1.0 (Static Analysis Only)',
          'Accept': 'text/plain,text/html,application/octet-stream',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type') || '';
      if (!this.isAllowedContentType(contentType)) {
        throw new Error(`Content type not allowed: ${contentType}`);
      }

      // Check content length
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > SafeUrlFetcher.MAX_FILE_SIZE) {
        throw new Error('File too large');
      }

      // Read with size limit
      const blob = await response.blob();
      if (blob.size > SafeUrlFetcher.MAX_FILE_SIZE) {
        throw new Error('File exceeds size limit');
      }

      // Only read as text, never execute
      const text = await blob.text();
      
      // Additional safety: truncate if somehow still too large
      if (text.length > SafeUrlFetcher.MAX_FILE_SIZE) {
        return text.substring(0, SafeUrlFetcher.MAX_FILE_SIZE);
      }

      return text;
    } finally {
      this.currentDepth--;
    }
  }

  /**
   * Analyzes URL structure for suspicious patterns
   */
  private analyzeUrlStructure(url: string): { isSuspicious: boolean; reason?: string } {
    const suspiciousPatterns = [
      { pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, reason: 'Direct IP address usage' },
      { pattern: /:(4444|5555|6666|7777|8888|9999|10000|1337)\//, reason: 'Suspicious port number' },
      { pattern: /\/exec\?|\/run\?|\/eval\?|\/cmd\?/i, reason: 'Potential command execution endpoint' },
      { pattern: /base64|hex|decode|decrypt/i, reason: 'Obfuscation-related path' },
      { pattern: /\?.*[a-zA-Z0-9]{100,}/, reason: 'Excessive query parameters (possible payload)' },
    ];

    for (const { pattern, reason } of suspiciousPatterns) {
      if (pattern.test(url)) {
        return { isSuspicious: true, reason };
      }
    }

    return { isSuspicious: false };
  }

  /**
   * Analyzes fetched content for nested threats
   */
  private analyzeFetchedContent(
    content: string,
    sourceUrl: string
  ): { detections: Detection[]; riskFactors: RiskFactor[] } {
    const detections: Detection[] = [];
    const riskFactors: RiskFactor[] = [];

    // Check for nested URLs (potential chain attack)
    const nestedUrls = this.extractUrls(content);
    if (nestedUrls.length > 5) {
      detections.push({
        title: 'Nested URL Chain Detected',
        description: `Fetched content from ${sourceUrl} contains ${nestedUrls.length} additional URLs - possible redirection chain`,
        severity: 'high',
      });
      riskFactors.push({
        type: 'url_chain',
        weight: 25,
        evidence: nestedUrls.slice(0, 3),
      });
    }

    // Check for executable markers in content
    if (this.containsExecutableMarkers(content)) {
      detections.push({
        title: 'Executable Content Detected',
        description: 'Fetched content contains executable markers - possible malware delivery',
        severity: 'critical',
      });
      riskFactors.push({
        type: 'executable_content',
        weight: 40,
        evidence: [sourceUrl],
      });
    }

    // Check for obfuscated content
    if (this.isHeavilyObfuscated(content)) {
      detections.push({
        title: 'Obfuscated Remote Content',
        description: 'Fetched content appears heavily obfuscated',
        severity: 'high',
      });
      riskFactors.push({
        type: 'obfuscated_remote',
        weight: 30,
        evidence: [sourceUrl],
      });
    }

    return { detections, riskFactors };
  }

  /**
   * Determines if a URL should be fetched
   */
  private shouldFetchUrl(urlInfo: ExtractedUrl): boolean {
    // Only fetch certain types
    const fetchableTypes: ExtractedUrl['type'][] = ['pastebin', 'github', 'unknown'];
    return fetchableTypes.includes(urlInfo.type);
  }

  /**
   * Checks if IP is private/internal
   */
  private isPrivateIp(hostname: string): boolean {
    const privateRanges = [
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^0\./,
      /^::1$/,
      /^fc00:/i,
      /^fe80:/i,
    ];

    return privateRanges.some(pattern => pattern.test(hostname));
  }

  /**
   * Validates content type is allowed
   */
  private isAllowedContentType(contentType: string): boolean {
    return SafeUrlFetcher.ALLOWED_CONTENT_TYPES.some(
      allowed => contentType.toLowerCase().includes(allowed)
    );
  }

  /**
   * Extracts URLs from content
   */
  private extractUrls(content: string): string[] {
    const urlPattern = /https?:\/\/[^\s\'"<>]+/gi;
    return content.match(urlPattern) || [];
  }

  /**
   * Checks for executable markers
   */
  private containsExecutableMarkers(content: string): boolean {
    const markers = [
      'MZ', // Windows executable
      '\x7fELF', // Linux executable
      '\x89PNG', // Could be disguised
      'PK\x03\x04', // ZIP (could contain malware)
    ];
    return markers.some(marker => content.includes(marker));
  }

  /**
   * Checks if content is heavily obfuscated
   */
  private isHeavilyObfuscated(content: string): boolean {
    const cleaned = content.replace(/\s/g, '');
    if (cleaned.length < 100) return false;

    const uniqueChars = new Set(cleaned).size;
    const entropy = uniqueChars / cleaned.length;

    // High entropy indicates obfuscation
    return entropy > 0.75 || /[A-Za-z0-9+/]{100,}={0,2}/.test(content);
  }
}
