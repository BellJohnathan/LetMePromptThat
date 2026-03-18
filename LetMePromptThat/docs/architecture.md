# LetMePromptThat — Architecture

## Executive Summary

LetMePromptThat is a zero-dependency, no-build-step web application split across two static sites that communicate via URL-encoded data. The architecture prioritizes simplicity: vanilla JavaScript, no framework, no backend, no database.

## System Architecture

```
┌─────────────────────────────┐     URL with encoded query     ┌─────────────────────────────┐
│   Creator Site              │ ──────────────────────────────► │   Share Site                │
│   letmeprompthat.com        │                                 │   lmpt.io                   │
│                             │                                 │                             │
│   LetMePromptThat/          │                                 │   share/                    │
│   ├── index.html            │                                 │   ├── index.html            │
│   ├── app.js                │                                 │   ├── animation.js           │
│   ├── styles.css            │                                 │   ├── styles.css            │
│   └── shared/cipher.js ─────┼─── same code ──────────────────┼── shared/cipher.js          │
│                             │                                 │   └── _worker.js            │
└─────────────────────────────┘                                 └──────────┬──────────────────┘
                                                                           │
                                                                    Auto-redirect
                                                                           │
                                                                           ▼
                                                                ┌──────────────────────┐
                                                                │  AI Service          │
                                                                │  (Perplexity /       │
                                                                │   ChatGPT / Claude)  │
                                                                └──────────────────────┘
```

## Part: Creator Site (`LetMePromptThat/`)

**Purpose**: User-facing form where the link creator types a question and selects an AI target.

**Entry point**: `index.html` → loads `shared/cipher.js` then `app.js`

**Key files**:
- `index.html` — Single-page form with textarea, radio buttons for AI selection, generate button, and result display
- `app.js` — IIFE module handling form interaction: link generation via `buildShareURL()`, clipboard copy, auto-regeneration on input/radio change (300ms debounce)
- `styles.css` — Dark theme with warm editorial aesthetic, CSS custom properties, entrance animations, responsive grid
- `shared/cipher.js` — Copy of the canonical cipher module

**Data flow**: User input → `buildShareURL(query, aiCode)` → display URL + auto-copy to clipboard

## Part: Share Site (`share/`)

**Purpose**: Receives share links, plays a typewriter animation, then redirects to the chosen AI.

**Entry point**: `index.html` → loads `shared/cipher.js` then `animation.js`

**Key files**:
- `index.html` — Fake chat UI with typewriter area, thinking dots, snarky message, redirect notice, and fallback AI buttons
- `animation.js` — IIFE module: parses URL via `parseShareURL()`, runs typewriter animation (55ms/char + word-boundary pauses), shows "thinking" dots, reveals snarky message, then triggers redirect
- `styles.css` — Same design system as creator site, plus chat window chrome (macOS-style dots), typewriter cursor, thinking dots animation
- `_worker.js` — Cloudflare Worker that intercepts non-asset requests, injects OG meta tags for social previews, and serves `index.html` for all slug paths (SPA routing)
- `serve.json` — Local dev SPA routing config (`** → /index.html`)

**Animation sequence**: 1.2s delay → typewriter (55ms/char) → 800ms pause → send button activates → 800ms → thinking dots (1.6s) → fade out → snarky message → 3s → redirect action

**Redirect behavior by aiCode**:
- `p` (Perplexity): Auto-redirect to `perplexity.ai/search/?q=...` with 2s cancel window
- `g` (ChatGPT): Auto-redirect to `chatgpt.com/?q=...` with 2s cancel window
- `c` (Claude): Copy question to clipboard + open `claude.ai/new` in new tab
- `x` (None): Copy question to clipboard only, show all AI buttons

## Part: Shared Cipher Module (`shared/cipher.js`)

**Purpose**: Canonical encoding/decoding logic shared by both sites.

**Public API** (5 functions exported to both `module.exports` and `window`):
- `encodeQuery(query)` → encoded string (adaptive: ROT13/ROT5 or base64)
- `decodeQuery(encoded)` → original query string
- `slugHash(query)` → 4-char base-36 hash
- `buildShareURL(query, aiCode)` → full `lmpt.io/...` URL string
- `parseShareURL(pathname, hash)` → `{ query, aiCode }`

**Encoding strategy**: Tries ROT13/ROT5 substitution first (prefix `~`), falls back to URL-safe base64 if the substitution result is longer. This keeps URLs short for ASCII text.

## Design Decisions

1. **No framework**: The app is simple enough that vanilla JS keeps bundle size zero and eliminates build complexity
2. **No build step**: HTML/CSS/JS served as-is — no transpilation, bundling, or minification
3. **File copies over symlinks**: Cloudflare Pages doesn't follow symlinks, so `cipher.js` is physically copied to each site directory
4. **Adaptive encoding**: ROT13/ROT5 for ASCII (no URL expansion), base64 for Unicode (shorter than percent-encoding)
5. **Cosmetic slugs**: The 4-char slug makes URLs look cleaner but is ignored during decoding — all data lives in the hash fragment
6. **Hash fragment for data**: Using `#` means the encoded query never hits the server, preserving privacy
7. **Cloudflare Worker for OG tags**: Social previews show a generic "Shared with you" message to not spoil the joke
8. **Dual export pattern**: `cipher.js` exports via both `module.exports` (Node.js tests) and `window` (browser)
