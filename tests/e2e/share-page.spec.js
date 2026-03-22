const { test, expect } = require('@playwright/test');

// Helper: build a hash from a query and aiCode using the same logic as cipher.js
function buildHash(query, aiCode) {
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
  test('valid link loads and shows typed text in user bubble', async ({ page }) => {
    const hash = buildHash('how to center a div', 'p');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    // Wait for the user message bubble to appear with the full query
    const typedText = page.locator('#typed-text');
    await expect(typedText).toHaveText('how to center a div', { timeout: 15000 });

    // User message bubble should be visible
    const userMessage = page.locator('#user-message');
    await expect(userMessage).toBeVisible();
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

  test('AI response bubble appears after typing completes', async ({ page }) => {
    const hash = buildHash('test question', 'p');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    // Wait for AI message bubble to become visible
    const aiMessage = page.locator('#ai-message');
    await expect(aiMessage).toBeVisible({ timeout: 20000 });
  });

  test('snarky punchline appears in AI bubble', async ({ page }) => {
    const hash = buildHash('test question', 'p');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    // Wait for the snarky message to appear
    const snarkyMessage = page.locator('#snarky-message');
    await expect(snarkyMessage).toBeVisible({ timeout: 25000 });

    // Title should not be empty (it's randomly selected)
    const title = page.locator('#snarky-title');
    await expect(title).not.toHaveText('');
  });

  test('aiCode x shows copy behavior and buttons', async ({ page }) => {
    const hash = buildHash('test question', 'x');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    // Wait for typewriter, snarky message, then buttons should appear
    const buttons = page.locator('#ai-buttons');
    await expect(buttons).toBeVisible({ timeout: 30000 });
  });

  test('aiCode p shows redirect toast', async ({ page }) => {
    const hash = buildHash('test question', 'p');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    const toast = page.locator('#toast');
    await expect(toast).toBeVisible({ timeout: 30000 });
    await expect(toast).toContainText('Perplexity');
  });

  test('aiCode m shows copy+open behavior for Gemini', async ({ page }) => {
    const hash = buildHash('test question', 'm');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    // Gemini uses copy+open (like Claude), not redirect
    const aiButtons = page.locator('#ai-buttons');
    await expect(aiButtons).toBeVisible({ timeout: 30000 });
  });

  test('aiCode k shows redirect toast for Grok', async ({ page }) => {
    const hash = buildHash('test question', 'k');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    const toast = page.locator('#toast');
    await expect(toast).toBeVisible({ timeout: 30000 });
    await expect(toast).toContainText('Grok');
  });

  test('aiCode l shows redirect toast for Le Chat', async ({ page }) => {
    const hash = buildHash('test question', 'l');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    const toast = page.locator('#toast');
    await expect(toast).toBeVisible({ timeout: 30000 });
    await expect(toast).toContainText('Le Chat');
  });

  test('redirect toast shows cancel button', async ({ page }) => {
    const hash = buildHash('test question', 'g');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    const cancelBtn = page.locator('#toast-cancel');
    await expect(cancelBtn).toBeVisible({ timeout: 30000 });

    await cancelBtn.click();

    await expect(page.locator('#toast')).toBeHidden();
    await expect(page.locator('#ai-buttons')).toBeVisible();
  });

  test('input bar fades after send', async ({ page }) => {
    const hash = buildHash('test question', 'x');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    // Wait for user message to appear (which means input bar has faded)
    const userMessage = page.locator('#user-message');
    await expect(userMessage).toBeVisible({ timeout: 15000 });

    // Input bar should have the 'sent' class
    const inputBar = page.locator('#input-bar');
    await expect(inputBar).toHaveClass(/sent/);
  });
});

test.describe('Share page (mobile viewport)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('animation works on mobile', async ({ page }) => {
    const hash = buildHash('mobile test question', 'x');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    // User bubble appears with typed text
    const typedText = page.locator('#typed-text');
    await expect(typedText).toHaveText('mobile test question', { timeout: 15000 });

    // Snarky message appears
    const snarkyMessage = page.locator('#snarky-message');
    await expect(snarkyMessage).toBeVisible({ timeout: 25000 });

    // AI buttons are visible and tappable-sized (min 44px height)
    const buttons = page.locator('#ai-buttons');
    await expect(buttons).toBeVisible({ timeout: 30000 });

    const firstBtn = page.locator('.ai-btn').first();
    const box = await firstBtn.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('elements are not draggable on mobile', async ({ page }) => {
    // Emulate coarse pointer (touch device) so the JS guard works correctly
    await page.emulateMedia({ pointer: 'coarse' });

    const hash = buildHash('mobile drag test', 'x');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    // Wait for entrance animation
    await page.waitForTimeout(1500);

    const chatContainer = page.locator('.chat-container');
    const box = await chatContainer.boundingBox();

    const startX = box.x + box.width / 2;
    const startY = box.y + 15;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 100, startY + 50, { steps: 10 });
    await page.mouse.up();

    // Position should NOT have changed
    const newBox = await chatContainer.boundingBox();
    expect(Math.abs(newBox.x - box.x)).toBeLessThan(5);
  });
});

test.describe('Share page redirect toast', () => {
  test('redirect toast shows brand icon for Perplexity', async ({ page }) => {
    const hash = buildHash('test question', 'p');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    const toast = page.locator('#toast');
    await expect(toast).toBeVisible({ timeout: 30000 });

    const icon = page.locator('#toast-icon svg');
    await expect(icon).toBeVisible();
  });

  test('redirect toast shows brand icon for Grok', async ({ page }) => {
    const hash = buildHash('test question', 'k');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    const toast = page.locator('#toast');
    await expect(toast).toBeVisible({ timeout: 30000 });

    const icon = page.locator('#toast-icon svg');
    await expect(icon).toBeVisible();
  });

  test('redirect toast shows brand icon for ChatGPT', async ({ page }) => {
    const hash = buildHash('test question', 'g');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    const toast = page.locator('#toast');
    await expect(toast).toBeVisible({ timeout: 30000 });

    const icon = page.locator('#toast-icon svg');
    await expect(icon).toBeVisible();
  });

  test('redirect toast has brand color applied', async ({ page }) => {
    const hash = buildHash('test question', 'p');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    const toast = page.locator('#toast');
    await expect(toast).toBeVisible({ timeout: 30000 });
    await expect(toast).toHaveAttribute('data-ai', 'p');
  });

  test('redirect toast shows progress bar', async ({ page }) => {
    const hash = buildHash('test question', 'p');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    const toast = page.locator('#toast');
    await expect(toast).toBeVisible({ timeout: 30000 });

    const progressBar = page.locator('#toast-progress-bar');
    await expect(progressBar).toBeVisible();

    const animation = await progressBar.evaluate(el =>
      getComputedStyle(el).animationName
    );
    expect(animation).toBe('progressShrink');
  });
});

test.describe('Share page draggable elements (desktop)', () => {
  test('chat container is draggable via header', async ({ page }) => {
    const hash = buildHash('drag test', 'x');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    // Wait for entrance animation + some buffer
    await page.waitForTimeout(1500);

    const chatContainer = page.locator('.chat-container');
    const box = await chatContainer.boundingBox();

    // Drag from header area
    const startX = box.x + box.width / 2;
    const startY = box.y + 15; // within header area

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 100, startY + 50, { steps: 10 });

    // Should have dragging class during drag
    await expect(chatContainer).toHaveClass(/dragging/);

    await page.mouse.up();

    // Position should have changed (may be clamped by viewport edge)
    const newBox = await chatContainer.boundingBox();
    const movedX = Math.abs(newBox.x - box.x);
    const movedY = Math.abs(newBox.y - box.y);
    expect(movedX + movedY).toBeGreaterThan(10);
  });

  test('ai buttons are draggable after appearing', async ({ page }) => {
    const hash = buildHash('drag test', 'x');
    await page.goto(`${SHARE_BASE}/test${hash}`);

    const aiButtons = page.locator('#ai-buttons');
    await expect(aiButtons).toBeVisible({ timeout: 30000 });

    // Wait for fadeInUp animation
    await page.waitForTimeout(500);

    const box = await aiButtons.boundingBox();
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 80, startY - 40, { steps: 10 });
    await page.mouse.up();

    const newBox = await aiButtons.boundingBox();
    const movedX = Math.abs(newBox.x - box.x);
    const movedY = Math.abs(newBox.y - box.y);
    expect(movedX + movedY).toBeGreaterThan(10);
  });
});
