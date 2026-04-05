# Luma - Lua Script Analyzer

A modern, AI-powered web-based Lua script analysis system that detects malicious patterns, obfuscation, and security risks through behavioral analysis.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan)

## Features

- **Behavioral Analysis** - Detects dangerous patterns like remote code execution, not just keywords
- **Obfuscation Detection** - Identifies known obfuscators (IronBrew, Luraph, MoonSec, etc.) and high-entropy code
- **Risk Scoring** - Weighted 0-100 scoring system with detailed reasoning
- **Domain Analysis** - Whitelist/flag system for URLs, webhooks, and IP grabbers
- **Modern UI** - Rounded, animated, minimalistic design with smooth transitions
- **Server-Side Analysis** - All scanning logic remains hidden from clients
- **JSON Reports** - Downloadable analysis reports for further review

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Deploy with zero configuration

```bash
# Using GitHub CLI
github.bat
```

## API Endpoints

- `POST /api/analyze` - Upload file or paste code for analysis
- `GET /api/report?id=<reportId>` - Retrieve analysis report

## Risk Categories

- **Network Activity** - HTTP requests, webhooks, data exfiltration
- **Remote Code Execution** - loadstring + HTTP combinations
- **Environment Manipulation** - getgenv, hookfunction, metatable manipulation
- **Anti-Debug / Anti-Analysis** - debugger detection, executor checks
- **Obfuscation** - Known obfuscators, high entropy, encoded blobs
- **Suspicious Strings** - Tokens, cookies, API keys

## Architecture

```
src/
├── app/              # Next.js app router
│   ├── api/          # API routes
│   └── page.tsx      # Main UI
├── components/       # React components
├── lib/
│   └── scanner/      # Analysis engine
│       ├── lua-analyzer.ts
│       ├── pattern-matcher.ts
│       └── scoring-engine.ts
└── types/            # TypeScript definitions
```

## Phase 2: Discord Bot (Coming Soon)

The modular architecture is designed to easily integrate a Discord bot that will:
- Post colored embeds (green/yellow/red)
- Create forum posts
- Upload scanned files
- Display analysis reports

## License

MIT License - See LICENSE file for details

## Security Note

Luma performs static analysis only. No Lua code is executed during scanning.
