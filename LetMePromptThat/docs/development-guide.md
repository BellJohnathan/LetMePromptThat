# LetMePromptThat — Development Guide

## Prerequisites

- **Node.js** 20+ (used for testing; no build step)
- **npm** (comes with Node.js)
- **Git**

## Setup

```bash
cd /path/to/claude  # project root (not LetMePromptThat/ subdirectory)
npm ci              # install devDependencies (playwright, serve)
```

For E2E tests, also install Playwright browsers:

```bash
npx playwright install --with-deps chromium
```

## Local Development

There is no build step. Both sites are static HTML/CSS/JS served as-is.

### Creator site (letmeprompthat.com)

```bash
npx serve LetMePromptThat -l 4174 --no-clipboard
# Open http://localhost:4174
```

### Share site (lmpt.io)

```bash
npx serve share -l 4173 --no-clipboard --single
# Open http://localhost:4173
```

The `--single` flag enables SPA routing (all paths serve `index.html`), matching the Cloudflare Worker behavior in production.

### Both sites simultaneously

The Playwright config starts both servers automatically during E2E tests, but for manual development you can run them in separate terminals.

## Testing

All test commands are run from the project root (`/path/to/claude`):

| Command | What It Does | Duration |
|---------|-------------|----------|
| `npm test` | Unit tests: cipher roundtrips, slugHash, buildShareURL, parseShareURL | ~1s |
| `npm run test:sync` | Verifies all 3 copies of cipher.js are byte-identical | ~0.1s |
| `npm run test:e2e` | Playwright E2E: creator page form behavior + share page animation | ~30s |
| `npm run test:smoke` | HTTP smoke tests against live production URLs | ~5s |
| `npm run test:all` | Runs unit + sync + e2e (all local tests) | ~35s |

### Test details

**Unit tests** (`tests/cipher.test.js`): Uses Node.js built-in test runner (`node --test`). Tests encoding/decoding roundtrips for ASCII, digits, Unicode, special characters, and emoji. Also tests slugHash determinism and URL building/parsing.

**Sync check** (`tests/sync-check.js`): Reads the canonical `shared/cipher.js` and compares byte-for-byte against the copies in `LetMePromptThat/shared/` and `share/shared/`. Fails if any copy is missing or differs.

**E2E tests** (`tests/e2e/`): Playwright tests that spin up both local servers. Share page tests verify typewriter animation, redirect behavior, empty hash fallback. Creator page tests verify form generation, AI radio switching, auto-regeneration on input change, and empty input handling.

**Smoke tests** (`tests/smoke.js`): Hit production URLs (`lmpt.io`, `letmeprompthat.com`) with HTTP requests. Verify 200 responses, correct HTML structure, accessible static assets, OG meta tags. Run in CI only after deployment to main.

## Development Rules

1. **All changes must include/update tests** — unit tests for logic, E2E for user-facing behavior
2. **`npm test` and `npx playwright test` must pass before any commit to `main`**
3. **When modifying `shared/cipher.js`**: copy to both `share/shared/` and `LetMePromptThat/shared/` — the sync-check enforces this
4. **When adding/moving/renaming files**: update the directory structure section in `CLAUDE.md`
5. **When changing architecture or adding features**: update `CLAUDE.md` as part of the same commit

## Common Tasks

### Add a new AI target

1. Add a new radio option in `LetMePromptThat/index.html` with appropriate `value` attribute
2. Add the redirect URL in `share/animation.js` in the `urls` and `aiNames` objects
3. If the aiCode is a new single character, update `parseShareURL` in `shared/cipher.js` to recognize it
4. Copy updated `cipher.js` to both site directories
5. Add E2E test coverage for the new target
6. Update `CLAUDE.md` URL format section

### Modify the encoding scheme

1. Edit `shared/cipher.js` (the canonical copy)
2. Copy to `LetMePromptThat/shared/cipher.js` and `share/shared/cipher.js`
3. Run `npm run test:sync` to verify copies match
4. Run `npm test` to verify roundtrips still pass
5. Run `npm run test:e2e` to verify end-to-end behavior

### Change the share animation

Edit `share/animation.js`. Key timing constants:
- Initial delay: 1200ms
- Typing speed: 55ms per character
- Word boundary extra delay: 80-120ms
- Post-typing pause: 800ms
- Thinking dots duration: 1600ms
- Snarky message display: 3000ms before redirect
- Redirect countdown: 2000ms (with cancel button)
