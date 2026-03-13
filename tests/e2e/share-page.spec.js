const { test, expect } = require('@playwright/test');

// Helper: build a hash from a query and aiCode using the same logic as cipher.js
function buildHash(query, aiCode) {
  // We'll use the share page itself to test, so we need to construct the hash manually.
  // ROT13/ROT5 encode for ASCII-safe queries (prefix with ~)
  const rot13rot5 = (str) =>
    str.split('').map(ch => {
      const c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90) return String.fromCharCode(((c - 65 + 13) % 26) + 65);
      if (c >= 97 && c <= 122) return String.fromCharCode(((c - 97 + 13) % 26) + 97);
      if (c >= 48 && c <= 57) return String.fromCharCode(((c - 48 + 5) % 10) + 48);
      return ch;
    }).join('');
  const encoded = '~' + encodeURIComponent(rot13rot5(query)).replace(/%20/g, '+');
  return `#${aiCode}${encoded}`;
}

const SHARE_BASE = 'http://localhost:4173';

test.describe('Share page', () => {
  test('valid link loads and shows typewriter text', async ({ page }) => {
    const hash = buildHash('how to center a div', 'p');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    // Wait for typewriter to finish — the typed-text element should eventually contain the full query
    const typedText = page.locator('#typed-text');
    await expect(typedText).toHaveText('how to center a div', { timeout: 15000 });
  });

  test('no console errors (cipher.js loads successfully)', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    const hash = buildHash('test query', 'p');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    // Wait a moment for scripts to execute
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test('empty hash shows fallback message', async ({ page }) => {
    await page.goto(`${SHARE_BASE}/`);

    await expect(page.locator('.chat-body')).toContainText('Nothing to see here');
  });

  test('aiCode x shows copy behavior and buttons', async ({ page }) => {
    const hash = buildHash('test question', 'x');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    // Wait for typewriter, snarky message, then buttons should appear
    const buttons = page.locator('#ai-buttons');
    await expect(buttons).toBeVisible({ timeout: 25000 });
  });

  test('aiCode p shows redirect notice', async ({ page }) => {
    const hash = buildHash('test question', 'p');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    // Wait for the redirect notice to appear
    const redirectNotice = page.locator('#redirect-notice');
    await expect(redirectNotice).toBeVisible({ timeout: 25000 });
    await expect(redirectNotice).toContainText('Perplexity');
  });
});
