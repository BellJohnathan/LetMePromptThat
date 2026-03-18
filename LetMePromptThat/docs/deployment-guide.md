# LetMePromptThat — Deployment Guide

## Infrastructure

Both sites are deployed to **Cloudflare Pages** as static sites. There is no backend server, no database, and no build step.

| Site | Domain | Cloudflare Pages Project | Source Directory |
|------|--------|--------------------------|-----------------|
| Creator | letmeprompthat.com | (configured in Cloudflare) | `LetMePromptThat/` |
| Share | lmpt.io | (configured in Cloudflare) | `share/` |

## Deployment Process

Deployments are triggered automatically on push to `main` via Cloudflare Pages' GitHub integration. There is no manual deploy step.

### What happens on push to main

1. Cloudflare Pages detects the push and deploys both sites
2. GitHub Actions CI runs in parallel:
   - **unit-tests**: `npm test` + `npm run test:sync`
   - **e2e-tests**: Playwright tests with local servers
3. After both CI jobs pass and deployment is live (~2 min), **smoke-tests** run:
   - HTTP requests to `lmpt.io` and `letmeprompthat.com`
   - Verify 200 responses, HTML structure, static assets, OG tags

## CI/CD Pipeline

Defined in `.github/workflows/test.yml`:

```
push/PR to main
    ├── unit-tests (Node 20)
    │   ├── npm ci
    │   ├── npm test (cipher unit tests)
    │   └── npm run test:sync (cipher.js copy verification)
    │
    ├── e2e-tests (Node 20)
    │   ├── npm ci
    │   ├── npx playwright install --with-deps chromium
    │   └── npx playwright test
    │
    └── smoke-tests (Node 20) [main branch only, after unit+e2e pass]
        ├── sleep 120 (wait for Cloudflare Pages deploy)
        └── npm run test:smoke (HTTP tests against production)
```

## Cloudflare Worker

The share site (`lmpt.io`) uses a Cloudflare Worker (`share/_worker.js`) for two purposes:

1. **OG Meta Tag Injection**: For any slug path (e.g., `/ab12`), the worker intercepts the request, reads `index.html`, and injects/replaces Open Graph meta tags with generic "Shared with you" content. This ensures social preview cards don't reveal the question.

2. **SPA Routing**: All non-asset paths serve `index.html`, allowing the client-side JavaScript to read the URL hash and decode the question.

Static assets (`.css`, `.js`, `.png`, etc.) are served directly without worker intervention.

## Environment Configuration

There are no environment variables, secrets, or `.env` files. The application is entirely client-side with hardcoded AI redirect URLs:

- Perplexity: `https://www.perplexity.ai/search/?q=...`
- ChatGPT: `https://chatgpt.com/?q=...`
- Claude: `https://claude.ai/new`

## Critical Deployment Constraint

**Cloudflare Pages does not follow symlinks.** The `shared/` directories in each site (`LetMePromptThat/shared/cipher.js` and `share/shared/cipher.js`) must contain real file copies, not symlinks to `shared/cipher.js`. The `test:sync` CI job enforces this.
