const { test, expect } = require('@playwright/test');

const CREATOR_BASE = 'http://localhost:4174';

test.describe('Creator page', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto(CREATOR_BASE);
    await expect(page).toHaveTitle('Let Me Prompt That');
  });

  test('generate link produces correct URL format', async ({ page }) => {
    await page.goto(CREATOR_BASE);

    await page.fill('#question', 'how to center a div');
    await page.click('#generate');

    const resultUrl = page.locator('#result-url');
    await expect(resultUrl).toBeVisible();
    const url = await resultUrl.textContent();
    expect(url).toMatch(/^lmpt\.io\/[0-9a-z]{4}#p/);
  });

  test('different AI radio options change aiCode in output', async ({ page }) => {
    await page.goto(CREATOR_BASE);
    await page.fill('#question', 'test query');

    for (const code of ['g', 'c', 'p']) {
      // Expand picker if collapsed (after first generate, it auto-collapses)
      const toggle = page.locator('.collapse-toggle');
      if (await toggle.isVisible()) {
        await toggle.click();
        // Wait for expansion
        await expect(page.locator('.radio-option:visible')).toHaveCount(6, { timeout: 2000 });
      }
      await page.check(`input[name="ai"][value="${code}"]`);
      // Wait for auto-collapse to finish before next iteration
      await page.waitForTimeout(300);
      await page.click('#generate');

      const url = await page.locator('#result-url').textContent();
      expect(url).toContain(`#${code}`);
    }
  });

  test('changing AI option auto-regenerates link', async ({ page }) => {
    await page.goto(CREATOR_BASE);
    await page.fill('#question', 'test auto regen');
    await page.click('#generate');

    const resultUrl = page.locator('#result-url');
    const initialUrl = await resultUrl.textContent();
    expect(initialUrl).toContain('#p');

    // Expand picker (collapsed after generate)
    await page.click('.collapse-toggle');

    // Switch to ChatGPT without clicking generate
    await page.check('input[name="ai"][value="g"]');

    // URL should update automatically
    const updatedUrl = await resultUrl.textContent();
    expect(updatedUrl).toContain('#g');
    expect(updatedUrl).not.toEqual(initialUrl);
  });

  test('editing textarea auto-regenerates link', async ({ page }) => {
    await page.goto(CREATOR_BASE);
    await page.fill('#question', 'original question');
    await page.click('#generate');

    const resultUrl = page.locator('#result-url');
    const initialUrl = await resultUrl.textContent();

    // Edit the textarea without clicking generate
    await page.fill('#question', 'modified question');

    // Wait for debounce (300ms) + rendering
    await page.waitForFunction(
      (oldUrl) => document.getElementById('result-url').textContent !== oldUrl,
      initialUrl,
      { timeout: 2000 }
    );

    const updatedUrl = await resultUrl.textContent();
    expect(updatedUrl).not.toEqual(initialUrl);
  });

  test('empty input does not generate a link', async ({ page }) => {
    await page.goto(CREATOR_BASE);

    // Leave textarea empty
    await page.click('#generate');

    const result = page.locator('#result');
    await expect(result).toHaveClass(/hidden/);
  });
});

test.describe('Creator page placeholder animation', () => {
  test('placeholder text appears and changes over time', async ({ page }) => {
    await page.goto(CREATOR_BASE);

    const placeholder = page.locator('#placeholder-anim');

    // Wait for initial typing to start
    await page.waitForFunction(
      () => document.getElementById('placeholder-anim').textContent.length > 0,
      null,
      { timeout: 5000 }
    );

    const firstText = await placeholder.textContent();
    expect(firstText.length).toBeGreaterThan(0);
  });

  test('placeholder stops when user types', async ({ page }) => {
    await page.goto(CREATOR_BASE);

    // Wait for placeholder to start
    await page.waitForFunction(
      () => document.getElementById('placeholder-anim').textContent.length > 0,
      null,
      { timeout: 5000 }
    );

    // Type in textarea
    await page.fill('#question', 'hello');

    // Placeholder should be hidden
    const placeholder = page.locator('#placeholder-anim');
    await expect(placeholder).toHaveClass(/hidden/);
  });
});

test.describe('Creator page (mobile viewport)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('generates link on mobile', async ({ page }) => {
    await page.goto(CREATOR_BASE);

    await page.fill('#question', 'mobile test query');
    await page.click('#generate');

    const resultUrl = page.locator('#result-url');
    await expect(resultUrl).toBeVisible();
    const url = await resultUrl.textContent();
    expect(url).toMatch(/^lmpt\.io\/[0-9a-z]{4}#p/);
  });

  test('generate button is tappable-sized on mobile', async ({ page }) => {
    await page.goto(CREATOR_BASE);

    const btn = page.locator('#generate');
    const box = await btn.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('radio options are visible in single column on mobile', async ({ page }) => {
    await page.goto(CREATOR_BASE);

    // All radio options should be visible
    const radios = page.locator('.radio-option');
    await expect(radios).toHaveCount(6);

    for (let i = 0; i < 6; i++) {
      await expect(radios.nth(i)).toBeVisible();
    }
  });
});

test.describe('Creator page preview button', () => {
  test('preview button is visible after generating link', async ({ page }) => {
    await page.goto(CREATOR_BASE);
    await page.fill('#question', 'preview test');
    await page.click('#generate');

    const previewBtn = page.locator('#preview-btn');
    await expect(previewBtn).toBeVisible();
  });

  test('preview button opens link in new tab', async ({ page, context }) => {
    await page.goto(CREATOR_BASE);
    await page.fill('#question', 'preview test');
    await page.click('#generate');

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('#preview-btn'),
    ]);

    expect(newPage.url()).toContain('lmpt.io');
  });
});

test.describe('Creator page localStorage persistence', () => {
  test('remembers selected AI on reload', async ({ page }) => {
    await page.goto(CREATOR_BASE);

    // Select ChatGPT
    await page.check('input[name="ai"][value="g"]');
    await page.fill('#question', 'test query');
    await page.click('#generate');

    // Reload
    await page.reload();

    // ChatGPT should be pre-selected
    const checked = await page.locator('input[name="ai"][value="g"]').isChecked();
    expect(checked).toBe(true);
  });

  test('shows collapsed state on reload with saved preference', async ({ page }) => {
    await page.goto(CREATOR_BASE);

    // Select ChatGPT and generate
    await page.check('input[name="ai"][value="g"]');
    await page.fill('#question', 'test');
    await page.click('#generate');

    await page.reload();

    // Only 1 radio option should be visible (collapsed)
    const visibleOptions = page.locator('.radio-option:visible');
    await expect(visibleOptions).toHaveCount(1);
  });

  test('Change button expands all options', async ({ page }) => {
    await page.goto(CREATOR_BASE);

    // Select ChatGPT and generate to save preference
    await page.check('input[name="ai"][value="g"]');
    await page.fill('#question', 'test');
    await page.click('#generate');

    await page.reload();

    // Click Change toggle
    await page.click('.collapse-toggle');

    // All options should be visible now
    const visibleOptions = page.locator('.radio-option:visible');
    const count = await visibleOptions.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('can re-collapse after expanding', async ({ page }) => {
    await page.goto(CREATOR_BASE);

    // Select ChatGPT and generate to save preference
    await page.check('input[name="ai"][value="g"]');
    await page.fill('#question', 'test');
    await page.click('#generate');

    await page.reload();

    // Expand
    await page.click('.collapse-toggle');
    const expandedCount = await page.locator('.radio-option:visible').count();
    expect(expandedCount).toBeGreaterThanOrEqual(6);

    // Re-collapse
    await page.click('.collapse-toggle');
    const collapsedCount = await page.locator('.radio-option:visible').count();
    expect(collapsedCount).toBe(1);
  });

  test('auto-collapses when selecting a different AI', async ({ page }) => {
    await page.goto(CREATOR_BASE);

    // Select ChatGPT and generate to save preference
    await page.check('input[name="ai"][value="g"]');
    await page.fill('#question', 'test');
    await page.click('#generate');

    await page.reload();

    // Expand
    await page.click('.collapse-toggle');
    await expect(page.locator('.radio-option:visible')).toHaveCount(6);

    // Pick a new AI
    await page.check('input[name="ai"][value="c"]');

    // Wait for auto-collapse (200ms delay)
    await page.waitForTimeout(400);
    const collapsedCount = await page.locator('.radio-option:visible').count();
    expect(collapsedCount).toBe(1);
  });

  test('first visit shows all options (no localStorage)', async ({ page, context }) => {
    // Clear localStorage
    await page.goto(CREATOR_BASE);
    await page.evaluate(() => localStorage.removeItem('lmpt-ai'));
    await page.reload();

    // All options visible
    const visibleOptions = page.locator('.radio-option:visible');
    await expect(visibleOptions).toHaveCount(6);
  });
});

test.describe('Creator page auto-expanding textarea', () => {
  test('textarea has resize none', async ({ page }) => {
    await page.goto(CREATOR_BASE);
    const resize = await page.locator('#question').evaluate(
      (el) => getComputedStyle(el).resize
    );
    expect(resize).toBe('none');
  });

  test('typing multi-line content increases textarea height', async ({ page }) => {
    await page.goto(CREATOR_BASE);
    const textarea = page.locator('#question');

    const initialHeight = await textarea.evaluate((el) => el.offsetHeight);

    // Type enough lines to grow
    await textarea.fill('line 1\nline 2\nline 3\nline 4\nline 5\nline 6');

    const expandedHeight = await textarea.evaluate((el) => el.offsetHeight);
    expect(expandedHeight).toBeGreaterThan(initialHeight);
  });

  test('textarea height does not exceed 200px', async ({ page }) => {
    await page.goto(CREATOR_BASE);
    const textarea = page.locator('#question');

    // Fill with many lines
    const longText = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join('\n');
    await textarea.fill(longText);

    const height = await textarea.evaluate((el) => el.offsetHeight);
    expect(height).toBeLessThanOrEqual(200);
  });

  test('clearing textarea resets to original height', async ({ page }) => {
    await page.goto(CREATOR_BASE);
    const textarea = page.locator('#question');

    const initialHeight = await textarea.evaluate((el) => el.offsetHeight);

    // Expand
    await textarea.fill('line 1\nline 2\nline 3\nline 4\nline 5\nline 6');
    const expandedHeight = await textarea.evaluate((el) => el.offsetHeight);
    expect(expandedHeight).toBeGreaterThan(initialHeight);

    // Clear
    await textarea.fill('');

    const resetHeight = await textarea.evaluate((el) => el.offsetHeight);
    expect(resetHeight).toBeLessThanOrEqual(initialHeight);
  });
});

test.describe('Creator page mobile subtitles', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    hasTouch: true,
    isMobile: true,
  });

  test('subtitles are present in DOM for all radio options', async ({ page }) => {
    await page.goto(CREATOR_BASE);

    const subtitles = page.locator('.radio-subtitle');
    await expect(subtitles).toHaveCount(6);

    const expectedSubtitles = [
      'Auto-submits your question',
      'Auto-submits your question',
      'Auto-submits your question',
      'Pre-fills in the chat',
      'Copies question, opens Claude',
      'Copies question, opens Gemini',
    ];

    for (let i = 0; i < expectedSubtitles.length; i++) {
      await expect(subtitles.nth(i)).toHaveText(expectedSubtitles[i]);
    }
  });

  test('subtitles are visible on touch devices via hover:none media query', async ({ page }) => {
    await page.goto(CREATOR_BASE);

    const hasHoverNoneRule = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.conditionText && rule.conditionText.includes('hover: none')) {
              for (const innerRule of rule.cssRules) {
                if (innerRule.selectorText === '.radio-subtitle' &&
                    innerRule.style.display === 'block') {
                  return true;
                }
              }
            }
          }
        } catch { /* cross-origin sheets */ }
      }
      return false;
    });

    expect(hasHoverNoneRule).toBe(true);
  });

  test('subtitles are hidden by default (desktop)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      hasTouch: false,
      isMobile: false,
    });
    const page = await context.newPage();
    await page.goto(CREATOR_BASE);

    const subtitle = page.locator('.radio-subtitle').first();
    const display = await subtitle.evaluate((el) => getComputedStyle(el).display);
    expect(display).toBe('none');

    await context.close();
  });

  test('cursor-following tooltip element exists', async ({ page }) => {
    await page.goto(CREATOR_BASE);

    const tooltip = page.locator('#radio-tooltip');
    await expect(tooltip).toHaveCount(1);

    // Tooltip should be hidden by default
    const opacity = await tooltip.evaluate((el) => getComputedStyle(el).opacity);
    expect(opacity).toBe('0');
  });
});

test.describe('Creator page Personalise section', () => {
  test('personalise toggle shows and hides panel', async ({ page }) => {
    await page.goto(CREATOR_BASE);

    // Panel should start hidden
    const panel = page.locator('#personalise-panel');
    await expect(panel).toBeHidden();

    // Click toggle to expand
    await page.click('#personalise-toggle');
    await expect(panel).toBeVisible();

    // Click again to collapse
    await page.click('#personalise-toggle');
    await expect(panel).toBeHidden();
  });

  test('avatar selector shows 3 options', async ({ page }) => {
    await page.goto(CREATOR_BASE);
    await page.click('#personalise-toggle');

    const avatars = page.locator('.avatar-option');
    await expect(avatars).toHaveCount(3);
  });

  test('clicking avatar updates selection', async ({ page }) => {
    await page.goto(CREATOR_BASE);
    await page.click('#personalise-toggle');

    // First avatar should be selected by default
    const firstAvatar = page.locator('.avatar-option').nth(0);
    await expect(firstAvatar).toHaveClass(/selected/);

    // Click second avatar
    const secondAvatar = page.locator('.avatar-option').nth(1);
    await secondAvatar.click();

    await expect(secondAvatar).toHaveClass(/selected/);
    await expect(firstAvatar).not.toHaveClass(/selected/);
  });

  test('generated link includes imageCode', async ({ page }) => {
    await page.goto(CREATOR_BASE);
    await page.click('#personalise-toggle');

    // Select avatar 1
    await page.locator('.avatar-option').nth(1).click();

    await page.fill('#question', 'test avatar');
    await page.click('#generate');

    const url = await page.locator('#result-url').textContent();
    // URL should contain !1 for imageCode 1
    expect(url).toMatch(/!1/);
  });

  test('avatar choice persists across reload', async ({ page }) => {
    await page.goto(CREATOR_BASE);
    await page.click('#personalise-toggle');

    // Select avatar 2
    await page.locator('.avatar-option').nth(2).click();

    await page.reload();
    await page.click('#personalise-toggle');

    // Third avatar should be selected
    const thirdAvatar = page.locator('.avatar-option').nth(2);
    await expect(thirdAvatar).toHaveClass(/selected/);
  });

  test('changing avatar auto-regenerates link', async ({ page }) => {
    await page.goto(CREATOR_BASE);
    await page.fill('#question', 'test auto regen avatar');
    await page.click('#generate');

    const resultUrl = page.locator('#result-url');
    const initialUrl = await resultUrl.textContent();

    // Open personalise panel and change avatar
    await page.click('#personalise-toggle');
    await page.locator('.avatar-option').nth(1).click();

    const updatedUrl = await resultUrl.textContent();
    expect(updatedUrl).not.toEqual(initialUrl);
  });
});
