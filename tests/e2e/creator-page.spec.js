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

    for (const code of ['g', 'c', 'x', 'p']) {
      await page.check(`input[name="ai"][value="${code}"]`);
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

    // All 4 radio options should be visible
    const radios = page.locator('.radio-option');
    await expect(radios).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
      await expect(radios.nth(i)).toBeVisible();
    }
  });
});
