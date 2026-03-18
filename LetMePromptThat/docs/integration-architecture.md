# LetMePromptThat — Integration Architecture

## Part Communication

The two sites (creator and share) do not communicate directly via APIs. Instead, they share data through **URL encoding** — the creator site produces a URL that the share site consumes.

```
Creator Site                    Share Site                      External AI
(letmeprompthat.com)            (lmpt.io)                       Services

 User types question            User opens share link
        │                              │
        ▼                              ▼
 buildShareURL(query, aiCode)   parseShareURL(pathname, hash)
        │                              │
        ▼                              ▼
 Returns: lmpt.io/{slug}        Extracts: { query, aiCode }
          #{aiCode}{encoded}           │
        │                              ▼
        ▼                       Typewriter animation
 URL copied to clipboard               │
 (user shares it)                      ▼
                                Redirect to AI service ────────► perplexity.ai
                                (or copy to clipboard)           chatgpt.com
                                                                 claude.ai
```

## Integration Point: Shared Cipher Module

The single integration point between the two sites is `shared/cipher.js`, which provides matching encode/decode functions.

| Function | Used By | Purpose |
|----------|---------|---------|
| `buildShareURL(query, aiCode)` | Creator site (`app.js`) | Encodes question into share URL |
| `parseShareURL(pathname, hash)` | Share site (`animation.js`) | Decodes question from share URL |
| `encodeQuery(query)` | Internal to `buildShareURL` | Adaptive ROT13/base64 encoding |
| `decodeQuery(encoded)` | Internal to `parseShareURL` | Matching decode |
| `slugHash(query)` | Internal to `buildShareURL` | Cosmetic 4-char slug generation |

### Sync Requirement

Both sites must use the **exact same version** of `cipher.js`. The canonical source is `shared/cipher.js` at the project root. It is copied to:
- `LetMePromptThat/shared/cipher.js`
- `share/shared/cipher.js`

The `tests/sync-check.js` script verifies byte-for-byte identity of all three copies.

## Data Flow: URL Format

```
lmpt.io/ab12#p~ubj+gb+pragre+n+qvi+va+PFF
        ^^^^  ^ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        slug  │ encoded query (ROT13/ROT5)
              │
              aiCode (p=Perplexity, g=ChatGPT, c=Claude, x=copy)
```

- The **slug** (`ab12`) is a cosmetic 4-char hash — it makes URLs look legitimate but is completely ignored during decoding
- The **hash fragment** (`#...`) contains all the data — this means the encoded query never leaves the browser (not sent to the server)
- The **aiCode** is a single character prefix that determines redirect behavior
- The **encoded query** uses `~` prefix for ROT13/ROT5 substitution, or raw base64 for non-ASCII text

## External Service Integration

The share site redirects to external AI services. No API keys or authentication are involved — it simply constructs URLs:

| AI Code | Service | URL Pattern | Behavior |
|---------|---------|-------------|----------|
| `p` | Perplexity | `perplexity.ai/search/?q={query}` | Auto-redirect (2s cancel window) |
| `g` | ChatGPT | `chatgpt.com/?q={query}` | Auto-redirect (2s cancel window) |
| `c` | Claude | `claude.ai/new` | Copy question to clipboard, open in new tab |
| `x` | None | N/A | Copy question to clipboard only |

Claude gets special treatment because it doesn't support URL-based query pre-fill — the question is copied to clipboard and the user pastes it manually.
