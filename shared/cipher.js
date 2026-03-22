/**
 * URL encoding for share links — adaptive substitution cipher + base64.
 *
 * Substitution (ROT13/ROT5) has zero overhead for ASCII text.
 * Base64 is used when non-ASCII makes percent-encoding too long.
 * Prefix '~' marks substitution; no prefix means base64 (backward-compatible).
 *
 * URL format: lmpt.io/{4-char-hash}#{aiCode}{imageCode}{encoded-query}
 */

// --- Substitution helpers (ROT13 letters, ROT5 digits) ---

function rot13rot5(str) {
  return str.split('').map(ch => {
    const c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) return String.fromCharCode(((c - 65 + 13) % 26) + 65);
    if (c >= 97 && c <= 122) return String.fromCharCode(((c - 97 + 13) % 26) + 97);
    if (c >= 48 && c <= 57) return String.fromCharCode(((c - 48 + 5) % 10) + 48);
    return ch;
  }).join('');
}

function encodeSubst(query) {
  return encodeURIComponent(rot13rot5(query)).replace(/%20/g, '+');
}

function decodeSubst(encoded) {
  return rot13rot5(decodeURIComponent(encoded.replace(/\+/g, '%20')));
}

// --- Base64 helpers ---

function encodeB64(query) {
  const bytes = new TextEncoder().encode(query);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeB64(encoded) {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// --- Public API (unchanged signatures) ---

function encodeQuery(query) {
  const trimmed = query.trim();
  const subst = '~' + encodeSubst(trimmed);
  const b64 = encodeB64(trimmed);
  return subst.length <= b64.length ? subst : b64;
}

function decodeQuery(encoded) {
  if (encoded.startsWith('~')) return decodeSubst(encoded.slice(1));
  return decodeB64(encoded);
}

function slugHash(query) {
  let h = 0;
  for (const ch of query) h = ((h << 5) - h + ch.charCodeAt(0)) | 0;
  return Math.abs(h).toString(36).slice(0, 4).padStart(4, '0');
}

/**
 * Build a full share URL.
 * @param {string} query - The question text
 * @param {string} aiCode - One of 'p', 'g', 'c', 'x', 'm', 'k', 'l'
 * @param {number} imageCode - Avatar image index (0, 1, or 2)
 * @returns {string} The full lmpt.io URL
 */
function buildShareURL(query, aiCode = 'p', imageCode = 0) {
  const trimmed = query.trim();
  if (!trimmed) return '';
  const slug = slugHash(trimmed);
  const encoded = encodeQuery(trimmed);
  return `lmpt.io/${slug}#${aiCode}${imageCode}${encoded}`;
}

/**
 * Parse a share URL path + hash into { query, aiCode, imageCode }.
 * Backward-compatible: old links without imageCode return imageCode 0.
 * @param {string} _pathname - ignored (slug is cosmetic)
 * @param {string} hash - e.g. "#p0~uryyb+jbeyq" or "#p1aG93K3RvK2NlbnRlcg"
 * @returns {{ query: string|null, aiCode: string, imageCode: number }}
 */
function parseShareURL(_pathname, hash) {
  const fragment = hash ? hash.replace(/^#/, '') : '';
  if (!fragment) return { query: null, aiCode: 'p', imageCode: 0 };

  const aiCode = /^[pgcxmkl]/.test(fragment) ? fragment[0] : 'p';
  const rest = /^[pgcxmkl]/.test(fragment) ? fragment.slice(1) : fragment;

  // Try new format: imageCode digit followed by encoded query
  if (/^[012]/.test(rest)) {
    const candidateImageCode = Number(rest[0]);
    const candidateEncoded = rest.slice(1);
    try {
      return { query: decodeQuery(candidateEncoded), aiCode, imageCode: candidateImageCode };
    } catch {
      // Fall through to old format
    }
  }

  // Old format (no imageCode) or fallback
  try {
    return { query: decodeQuery(rest), aiCode, imageCode: 0 };
  } catch {
    return { query: null, aiCode, imageCode: 0 };
  }
}

// Export for both module and browser contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { encodeQuery, decodeQuery, slugHash, buildShareURL, parseShareURL };
}
if (typeof window !== 'undefined') {
  window.encodeQuery = encodeQuery;
  window.decodeQuery = decodeQuery;
  window.slugHash = slugHash;
  window.buildShareURL = buildShareURL;
  window.parseShareURL = parseShareURL;
}
