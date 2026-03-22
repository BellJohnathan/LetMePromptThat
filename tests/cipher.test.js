const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { encodeQuery, decodeQuery, slugHash, buildShareURL, parseShareURL } = require('../shared/cipher.js');

describe('ROT13/ROT5 roundtrip via encodeQuery/decodeQuery', () => {
  it('roundtrips plain ASCII text', () => {
    const input = 'how to center a div in CSS';
    assert.equal(decodeQuery(encodeQuery(input)), input);
  });

  it('roundtrips digits', () => {
    const input = 'what is 2 + 2?';
    assert.equal(decodeQuery(encodeQuery(input)), input);
  });

  it('roundtrips Unicode text', () => {
    const input = 'what does café mean?';
    assert.equal(decodeQuery(encodeQuery(input)), input);
  });

  it('roundtrips special characters', () => {
    const input = 'why does a && b || c work?';
    assert.equal(decodeQuery(encodeQuery(input)), input);
  });

  it('roundtrips emoji', () => {
    const input = 'explain this: 🚀🎉';
    assert.equal(decodeQuery(encodeQuery(input)), input);
  });

  it('handles empty string after trim', () => {
    // encodeQuery trims, so encoding a whitespace-only string yields the empty string encoded
    const encoded = encodeQuery('  ');
    // Empty string roundtrips
    assert.equal(decodeQuery(encoded), '');
  });
});

describe('slugHash', () => {
  it('returns a 4-character string', () => {
    const slug = slugHash('hello world');
    assert.equal(slug.length, 4);
  });

  it('uses base-36 characters', () => {
    const slug = slugHash('test query');
    assert.match(slug, /^[0-9a-z]{4}$/);
  });

  it('is deterministic', () => {
    const a = slugHash('same input');
    const b = slugHash('same input');
    assert.equal(a, b);
  });

  it('differs for different inputs', () => {
    const a = slugHash('input one');
    const b = slugHash('input two');
    assert.notEqual(a, b);
  });
});

describe('buildShareURL', () => {
  it('returns empty string for empty input', () => {
    assert.equal(buildShareURL(''), '');
    assert.equal(buildShareURL('   '), '');
  });

  it('produces correct format', () => {
    const url = buildShareURL('hello world', 'p');
    assert.match(url, /^lmpt\.io\/[0-9a-z]{4}#p![012]/);
  });

  it('defaults aiCode to p', () => {
    const url = buildShareURL('test');
    assert.ok(url.includes('#p!'));
  });

  it('uses specified aiCode', () => {
    for (const code of ['p', 'g', 'c', 'x', 'm', 'k', 'l']) {
      const url = buildShareURL('test', code);
      assert.ok(url.includes('#' + code + '!'), `Expected aiCode ${code} in URL`);
    }
  });
});

describe('parseShareURL', () => {
  it('roundtrips from buildShareURL output', () => {
    const query = 'how to center a div in CSS';
    const url = buildShareURL(query, 'g');
    const hash = '#' + url.split('#')[1];
    const result = parseShareURL('/whatever', hash);
    assert.equal(result.query, query);
    assert.equal(result.aiCode, 'g');
    assert.equal(result.imageCode, 0);
  });

  it('roundtrips all aiCodes', () => {
    for (const code of ['p', 'g', 'c', 'x', 'm', 'k', 'l']) {
      const query = 'test query for ' + code;
      const url = buildShareURL(query, code);
      const hash = '#' + url.split('#')[1];
      const result = parseShareURL('/', hash);
      assert.equal(result.query, query);
      assert.equal(result.aiCode, code);
      assert.equal(result.imageCode, 0);
    }
  });

  it('returns null query for empty hash', () => {
    const result = parseShareURL('/', '');
    assert.equal(result.query, null);
    assert.equal(result.aiCode, 'p');
    assert.equal(result.imageCode, 0);
  });

  it('returns null query for hash with no content', () => {
    const result = parseShareURL('/', '#');
    assert.equal(result.query, null);
    assert.equal(result.aiCode, 'p');
    assert.equal(result.imageCode, 0);
  });

  it('defaults aiCode to p when hash has no recognized prefix', () => {
    // Encode something without a recognized aiCode prefix
    const encoded = encodeQuery('hello');
    // If encoded starts with ~ it won't match [pgcx], so aiCode defaults to p
    // We need to construct a hash that doesn't start with p, g, c, or x
    const result = parseShareURL('/', '#~uryyb');
    // ~ doesn't match [pgcx], so aiCode defaults to 'p', and it tries to decode '~uryyb'
    // which starts with ~ so it goes through decodeSubst
    assert.equal(result.aiCode, 'p');
  });

  it('handles invalid encoding gracefully', () => {
    const result = parseShareURL('/', '#p!!!invalid!!!');
    // Should not throw, returns null on decode failure
    assert.equal(result.query, null);
    assert.equal(result.aiCode, 'p');
  });
});

describe('imageCode in buildShareURL and parseShareURL', () => {
  it('buildShareURL includes imageCode with ! sentinel', () => {
    const url = buildShareURL('test query', 'c', 1);
    // Should contain #c!1
    assert.ok(url.includes('#c!1'));
  });

  it('buildShareURL defaults imageCode to 0', () => {
    const url = buildShareURL('test query', 'p');
    assert.ok(url.includes('#p!0'));
  });

  it('roundtrips all imageCode values', () => {
    for (const imageCode of [0, 1, 2]) {
      const query = 'test query for image ' + imageCode;
      const url = buildShareURL(query, 'c', imageCode);
      const hash = '#' + url.split('#')[1];
      const result = parseShareURL('/', hash);
      assert.equal(result.query, query);
      assert.equal(result.aiCode, 'c');
      assert.equal(result.imageCode, imageCode);
    }
  });

  it('old-format URLs (no ! sentinel) default imageCode to 0', () => {
    // Manually construct an old-format hash (no ! separator)
    const result = parseShareURL('/', '#p~uryyb');
    assert.equal(result.imageCode, 0);
    assert.equal(result.aiCode, 'p');
    // 'uryyb' is ROT13 of 'hello'
    assert.equal(result.query, 'hello');
  });

  it('throws RangeError for invalid imageCode', () => {
    assert.throws(() => buildShareURL('test', 'p', 3), RangeError);
    assert.throws(() => buildShareURL('test', 'p', -1), RangeError);
  });
});
