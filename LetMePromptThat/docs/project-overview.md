# LetMePromptThat — Project Overview

## Purpose

A tongue-in-cheek tool for the AI age — when someone asks you a question they could've just asked AI, send them a LetMePromptThat link. Inspired by [LMGTFY](https://lmgtfy.app), but for AI assistants.

## How It Works

1. **Creator** visits [letmeprompthat.com](https://letmeprompthat.com), types the question, picks an AI target (Perplexity, ChatGPT, Claude, or copy-only)
2. **Creator** gets a short share link (e.g., `lmpt.io/ab12#p~uryyb`)
3. **Recipient** opens the link, sees a typewriter animation of "their" question being typed into a fake AI chat
4. After the animation, a snarky "Was that so hard?" message appears
5. The recipient is auto-redirected to the selected AI with the question pre-filled

## Tech Stack Summary

| Category | Technology | Notes |
|----------|-----------|-------|
| Language | JavaScript (ES2020+) | Vanilla, zero frameworks |
| Markup | HTML5 | Semantic, accessible |
| Styling | CSS3 | Custom properties, animations, responsive |
| Fonts | Google Fonts | DM Serif Display, Inter, JetBrains Mono |
| Hosting | Cloudflare Pages | Two separate sites |
| Edge Logic | Cloudflare Workers | OG tag injection on share site |
| Testing | Playwright + Node.js test runner | E2E, unit, sync, smoke |
| CI/CD | GitHub Actions | 3-job pipeline |
| Dev Server | `serve` (npm) | For local development and E2E tests |

## Architecture Type

**Multi-part static web application** — two independent static sites that share a common encoding/decoding module (`cipher.js`). No backend, no database, no build step. Files are served as-is from Cloudflare Pages.

## Repository Structure

- **Multi-part**: 2 deployable sites + 1 shared library + 1 test suite
- **No build step**: Raw HTML/CSS/JS served directly
- **Shared code**: `cipher.js` is copied (not symlinked) to each site due to Cloudflare Pages limitations

## Key URLs

| Site | Domain | Source Directory |
|------|--------|-----------------|
| Creator | letmeprompthat.com | `LetMePromptThat/` |
| Share/Redirect | lmpt.io | `share/` |

## URL Encoding Format

Share links follow the pattern: `lmpt.io/{slug}#{aiCode}{encoded}`

- **slug**: 4-character base-36 hash of the query (cosmetic only, ignored on decode)
- **aiCode**: `p` (Perplexity), `g` (ChatGPT), `c` (Claude), `x` (copy only)
- **encoded**: `~` prefix = ROT13/ROT5 substitution cipher; no prefix = base64 (for non-ASCII)

The encoding strategy is adaptive: ROT13/ROT5 is used for ASCII text (zero overhead), base64 for non-ASCII when percent-encoding would be too long.
