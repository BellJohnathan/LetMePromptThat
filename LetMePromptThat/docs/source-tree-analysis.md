# LetMePromptThat — Source Tree Analysis

```
project-root/                         # Git root: /Users/johnathanbell/Desktop/claude
├── CLAUDE.md                         # Project rules, architecture docs, dev commands
├── README.md                         # Public README
├── package.json                      # Test scripts, devDependencies (playwright, serve)
├── package-lock.json                 # Lockfile
├── playwright.config.js              # E2E config: 2 web servers on ports 4173/4174
├── .gitignore                        # Allowlist-style: only LMPT files tracked
│
├── shared/                           # ★ Canonical shared module (SOURCE OF TRUTH)
│   └── cipher.js                     # Encoding/decoding: ROT13/ROT5, base64, URL builder/parser
│
├── LetMePromptThat/                  # ★ Creator site → deployed to letmeprompthat.com
│   ├── index.html                    # Single-page form: textarea + AI radio buttons + generate
│   ├── app.js                        # Form logic: generateLink, clipboard, auto-regen
│   ├── styles.css                    # Dark editorial theme, CSS vars, responsive
│   ├── IDEAS.md                      # Brainstorm/feature ideas (not deployed)
│   └── shared/
│       └── cipher.js                 # ⚠ COPY of shared/cipher.js (must stay in sync)
│
├── share/                            # ★ Share/redirect site → deployed to lmpt.io
│   ├── index.html                    # Fake chat UI: typewriter, thinking dots, snarky msg
│   ├── animation.js                  # Typewriter animation, redirect logic
│   ├── styles.css                    # Chat window chrome, animations
│   ├── _worker.js                    # Cloudflare Worker: OG tag injection, SPA routing
│   ├── serve.json                    # Local dev SPA rewrite rules
│   └── shared/
│       └── cipher.js                 # ⚠ COPY of shared/cipher.js (must stay in sync)
│
├── tests/                            # ★ All test files
│   ├── cipher.test.js                # Unit tests: roundtrips, slugHash, buildShareURL, parseShareURL
│   ├── sync-check.js                 # Verifies all 3 cipher.js copies are byte-identical
│   ├── smoke.js                      # Production HTTP smoke tests (no browser)
│   └── e2e/
│       ├── share-page.spec.js        # Playwright: typewriter, redirect, copy, fallback
│       └── creator-page.spec.js      # Playwright: form, generate, auto-regen, AI selection
│
└── .github/
    └── workflows/
        └── test.yml                  # CI: unit → e2e → smoke (post-deploy on main only)
```

## Critical Directories

| Directory | Purpose | Deployment Target |
|-----------|---------|-------------------|
| `shared/` | Source of truth for cipher.js | Not deployed directly |
| `LetMePromptThat/` | Creator site files | Cloudflare Pages → letmeprompthat.com |
| `share/` | Share/redirect site files | Cloudflare Pages → lmpt.io |
| `tests/` | All test types | CI only |
| `.github/workflows/` | CI pipeline | GitHub Actions |

## Entry Points

| Context | Entry Point | What It Does |
|---------|-------------|-------------|
| Creator site (browser) | `LetMePromptThat/index.html` | Loads cipher.js + app.js |
| Share site (browser) | `share/index.html` | Loads cipher.js + animation.js |
| Share site (edge) | `share/_worker.js` | Cloudflare Worker: OG tags + routing |
| Unit tests | `tests/cipher.test.js` | Node.js test runner |
| E2E tests | `tests/e2e/*.spec.js` | Playwright with 2 local servers |
| Smoke tests | `tests/smoke.js` | HTTP requests to production URLs |
| Sync check | `tests/sync-check.js` | File content comparison |

## Key Constraint: cipher.js Sync

The file `shared/cipher.js` must be manually copied to both `LetMePromptThat/shared/cipher.js` and `share/shared/cipher.js` whenever it changes. The `tests/sync-check.js` script (run via `npm run test:sync`) enforces this. Cloudflare Pages does not support symlinks.
