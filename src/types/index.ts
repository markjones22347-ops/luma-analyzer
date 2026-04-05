export interface ScanReport {
  id: string;
  riskScore: number;
  rating: 'SAFE' | 'LOW RISK' | 'MODERATE RISK' | 'HIGH RISK' | 'CRITICAL';
  summary: string;
  detections: DetectionCategory[];
  extractedUrls: ExtractedUrl[];
  suspiciousStrings: SuspiciousString[];
  obfuscationScore: number;
  lineCount: number;
  fileMetadata: FileMetadata;
  aiReasoning: string;
  timestamp: string;
}

export interface DetectionCategory {
  name: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  detections: Detection[];
}

export interface Detection {
  title: string;
  description: string;
  line?: number;
  code?: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
}

export interface ExtractedUrl {
  url: string;
  type: 'webhook' | 'github' | 'pastebin' | 'ipgrabber' | 'shortener' | 'suspicious' | 'unknown';
  line: number;
  risk: 'low' | 'medium' | 'high';
}

export interface SuspiciousString {
  value: string;
  type: 'token' | 'cookie' | 'key' | 'encoded' | 'suspicious';
  line: number;
  risk: 'low' | 'medium' | 'high';
}

export interface FileMetadata {
  filename?: string;
  size: number;
  hash: string;
}

export interface AnalysisContext {
  code: string;
  lines: string[];
  hasNetworkActivity: boolean;
  hasRemoteExecution: boolean;
  hasObfuscation: boolean;
  obfuscationLevel: number;
  riskFactors: RiskFactor[];
  bytecodeDetected?: boolean;
  bytecodeType?: string;
}

export interface RiskFactor {
  type: string;
  weight: number;
  evidence: string[];
}
