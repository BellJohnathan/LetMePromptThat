/**
 * Production smoke tests — hit live URLs with plain HTTP requests.
 * No browser needed, no dependencies, just Node.js built-in fetch.
 *
 * Usage:
 *   node tests/smoke.js                          # test default production URLs
 *   SHARE_URL=https://lmpt.io CREATOR_URL=https://letmeprompthat.com node tests/smoke.js
 */

const SHARE_URL = process.env.SHARE_URL || 'https://lmpt.io';
const CREATOR_URL = process.env.CREATOR_URL || 'https://letmeprompthat.com';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✘ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// --- Share site tests ---

async function shareTests() {
  console.log(`\nShare site (${SHARE_URL})`);

  await test('homepage returns 200', async () => {
    const res = await fetch(SHARE_URL);
    assert(res.ok, `Expected 200, got ${res.status}`);
  });

  await test('homepage HTML contains expected elements', async () => {
    const res = await fetch(SHARE_URL);
    const html = await res.text();
    assert(html.includes('id="typed-text"'), 'Missing #typed-text element');
    assert(html.includes('id="send-btn"'), 'Missing #send-btn element');
    assert(html.includes('./shared/cipher.js'), 'Missing cipher.js script tag');
  });

  await test('cipher.js is accessible (not 404)', async () => {
    const res = await fetch(`${SHARE_URL}/shared/cipher.js`);
    assert(res.ok, `cipher.js returned ${res.status} — symlink bug may have regressed`);
    const text = await res.text();
    assert(text.includes('function encodeQuery'), 'cipher.js content looks wrong');
  });

  await test('slug path returns 200 with text/html (Worker routing)', async () => {
    const res = await fetch(`${SHARE_URL}/abcd`);
    assert(res.ok, `Slug path returned ${res.status}`);
    const ct = res.headers.get('content-type') || '';
    assert(ct.includes('text/html'), `Expected text/html, got ${ct}`);
  });

  await test('slug path returns non-empty HTML with page structure', async () => {
    const res = await fetch(`${SHARE_URL}/test`);
    const html = await res.text();
    assert(html.length > 0, 'Response body is empty');
    assert(html.includes('id="typed-text"'), 'Missing #typed-text element in slug response');
    assert(html.includes('cipher.js'), 'Missing cipher.js script in slug response');
  });

  await test('animation.js is accessible', async () => {
    const res = await fetch(`${SHARE_URL}/animation.js`);
    assert(res.ok, `animation.js returned ${res.status}`);
  });

  await test('styles.css is accessible', async () => {
    const res = await fetch(`${SHARE_URL}/styles.css`);
    assert(res.ok, `styles.css returned ${res.status}`);
  });

  await test('OG meta tags are present on homepage', async () => {
    const res = await fetch(SHARE_URL);
    const html = await res.text();
    assert(html.includes('og:title'), 'Missing og:title meta tag');
    assert(html.includes('og:description'), 'Missing og:description meta tag');
  });
}

// --- Creator site tests ---

async function creatorTests() {
  console.log(`\nCreator site (${CREATOR_URL})`);

  await test('homepage returns 200', async () => {
    const res = await fetch(CREATOR_URL);
    assert(res.ok, `Expected 200, got ${res.status}`);
  });

  await test('homepage HTML contains expected elements', async () => {
    const res = await fetch(CREATOR_URL);
    const html = await res.text();
    assert(html.includes('Let Me Prompt That'), 'Missing page title');
    assert(html.includes('id="question"'), 'Missing #question textarea');
    assert(html.includes('id="generate"'), 'Missing #generate button');
    assert(html.includes('./shared/cipher.js'), 'Missing cipher.js script tag');
  });

  await test('cipher.js is accessible (not 404)', async () => {
    const res = await fetch(`${CREATOR_URL}/shared/cipher.js`);
    assert(res.ok, `cipher.js returned ${res.status} — symlink bug may have regressed`);
    const text = await res.text();
    assert(text.includes('function encodeQuery'), 'cipher.js content looks wrong');
  });

  await test('app.js is accessible', async () => {
    const res = await fetch(`${CREATOR_URL}/app.js`);
    assert(res.ok, `app.js returned ${res.status}`);
  });

  await test('styles.css is accessible', async () => {
    const res = await fetch(`${CREATOR_URL}/styles.css`);
    assert(res.ok, `styles.css returned ${res.status}`);
  });
}

// --- Run ---

async function run() {
  console.log('Production smoke tests');
  console.log('======================');

  await shareTests();
  await creatorTests();

  console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('\nSmoke test runner crashed:', err.message);
  process.exit(1);
});
