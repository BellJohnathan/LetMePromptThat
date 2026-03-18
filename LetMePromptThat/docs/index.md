# LetMePromptThat — Documentation Index

> Generated: 2026-03-16 | Scan level: deep | Mode: initial_scan

## Project Overview

- **Type:** Multi-part static web application (2 sites + shared library)
- **Primary Language:** JavaScript (vanilla, zero frameworks)
- **Architecture:** Static sites with shared URL-encoding module, deployed to Cloudflare Pages
- **Domains:** letmeprompthat.com (creator), lmpt.io (share/redirect)

## Quick Reference

### Creator Site (`LetMePromptThat/`)
- **Type:** Static web page
- **Tech Stack:** HTML5, CSS3, Vanilla JS
- **Entry Point:** `index.html` → `shared/cipher.js` → `app.js`
- **Deploys to:** letmeprompthat.com

### Share Site (`share/`)
- **Type:** Static web page + Cloudflare Worker
- **Tech Stack:** HTML5, CSS3, Vanilla JS, Cloudflare Workers
- **Entry Point:** `index.html` → `shared/cipher.js` → `animation.js`
- **Deploys to:** lmpt.io

### Shared Module (`shared/`)
- **Type:** JavaScript library (dual-export: CommonJS + browser global)
- **Entry Point:** `cipher.js`
- **Exports:** `encodeQuery`, `decodeQuery`, `slugHash`, `buildShareURL`, `parseShareURL`

## Generated Documentation

- [Project Overview](./project-overview.md) — Purpose, tech stack, how it works
- [Architecture](./architecture.md) — System design, parts, design decisions
- [Source Tree Analysis](./source-tree-analysis.md) — Annotated directory structure, entry points
- [Development Guide](./development-guide.md) — Setup, testing, common tasks
- [Deployment Guide](./deployment-guide.md) — Cloudflare Pages, CI/CD pipeline
- [Integration Architecture](./integration-architecture.md) — How parts communicate via URL encoding

## Existing Documentation

- [CLAUDE.md](../CLAUDE.md) — Project rules, directory structure, development guidelines (at repo root: `../../CLAUDE.md`)
- [IDEAS.md](../IDEAS.md) — Feature brainstorm and ideas backlog

## Getting Started

```bash
# Clone and install
git clone <repo-url>
cd claude
npm ci

# Run creator site locally
npx serve LetMePromptThat -l 4174 --no-clipboard

# Run share site locally
npx serve share -l 4173 --no-clipboard --single

# Run all local tests
npm run test:all
```
