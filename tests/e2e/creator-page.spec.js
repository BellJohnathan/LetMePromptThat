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
