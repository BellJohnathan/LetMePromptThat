# LetMePromptThat

A tongue-in-cheek tool for the AI age — when someone asks you a question they could've just asked AI, send them a LetMePromptThat link. Inspired by LMGTFY.

## Architecture

Two static sites + shared encoding logic:

- **`LetMePromptThat/`** — Creator site (letmeprompthat.com). User types a question, picks an AI target, gets a share link.
- **`share/`** — Share/redirect site (lmpt.io). Decodes the URL, plays a typewriter animation, then redirects to the chosen AI.
- **`shared/cipher.js`** — Canonical encoding/decoding module (ROT13/ROT5 + base64). Copied into `share/shared/` and `LetMePromptThat/shared/` for deployment (Cloudflare Pages doesn't follow symlinks).

## Directory Structure

```
├── CLAUDE.md                 # This file
├── package.json              # Test scripts and dev dependencies
├── playwright.config.js      # E2E test configuration
├── .github/workflows/test.yml # CI: unit + e2e + post-deploy smoke tests
├── shared/
│   └── cipher.js             # Canonical cipher module (source of truth)
├── LetMePromptThat/          # Creator site
│   ├── index.html
│   ├── app.js                # Link generation + rotating placeholder animation
│   ├── styles.css
│   ├── _headers              # Cloudflare Pages cache headers (no-cache for JS/CSS)
│   ├── sitemap.xml           # Single-page sitemap for SEO
│   ├── robots.txt            # Crawl directives
│   └── shared/cipher.js      # Copy of shared/cipher.js
├── share/                    # Share/redirect site
│   ├── index.html
│   ├── animation.js          # Chat bubble animation + punchline system
│   ├── styles.css
│   ├── _worker.js            # Cloudflare Worker (OG tags + cache headers + routing)
│   ├── robots.txt            # Disallows crawling share links
│   ├── serve.json            # Local dev SPA routing config
│   └── shared/cipher.js      # Copy of shared/cipher.js
└── tests/
    ├── cipher.test.js        # Unit tests (Node.js built-in test runner)
    ├── sync-check.js         # Verifies all cipher.js copies match
    ├── smoke.js              # Production smoke tests (HTTP-only, no browser)
    └── e2e/
        ├── share-page.spec.js    # Playwright tests for share site
        └── creator-page.spec.js  # Playwright tests for creator site
```

## URL Format

Share links: `lmpt.io/{slug}#{aiCode}{encoded}`

- **slug**: 4-char base-36 hash of the query (cosmetic, ignored on decode)
- **aiCode**: `p` (Perplexity), `g` (ChatGPT), `c` (Claude), `m` (Gemini), `k` (Grok), `l` (Le Chat), `x` (copy only)
- **encoded**: `~` prefix = ROT13/ROT5 substitution; no prefix = base64

## Deployment

Both sites deploy to Cloudflare Pages. The share site uses `_worker.js` to inject OG meta tags and route all paths to `index.html`.

**Cache headers**: Both zones (lmpt.io, letmeprompthat.com) have Cloudflare Cache Rules configured in the dashboard to set Browser TTL to "Respect origin" for `.js` and `.css` files. Without this, the zone-level Browser Cache TTL (4h) overrides origin `Cache-Control` headers. The creator site sets cache headers via `_headers`; the share site sets them in `_worker.js` (note: `_headers` has no effect when a Worker handles the request).

**Critical**: Cloudflare Pages does not follow symlinks. The `shared/` directories in each site must contain real copies of `cipher.js`, not symlinks.

## Development Rules

- All changes must include/update tests — unit tests for logic, e2e for user-facing behavior.
- `npm test` and `npx playwright test` must pass before any commit to `main`.
- When modifying `shared/cipher.js`, copy to both `share/shared/` and `LetMePromptThat/shared/` — the sync-check test (`npm run test:sync`) enforces this.
- When adding/moving/renaming files, update this file's directory structure section.
- When making changes that alter file structure, add new features, or change architecture, update this file as part of the same commit.

## Testing Commands

```sh
npm test          # Unit tests (cipher roundtrips, slugHash, buildShareURL, parseShareURL)
npm run test:sync # Verify all cipher.js copies are identical
npm run test:e2e  # Playwright e2e tests (share page + creator page)
npm run test:smoke # Production smoke tests (hits live lmpt.io + letmeprompthat.com)
npm run test:all  # Run all local tests
```
