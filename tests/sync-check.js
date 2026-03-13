const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const canonical = path.join(root, 'shared', 'cipher.js');
const copies = [
  path.join(root, 'share', 'shared', 'cipher.js'),
  path.join(root, 'LetMePromptThat', 'shared', 'cipher.js'),
];

const canonicalContent = fs.readFileSync(canonical, 'utf8');
let failed = false;

for (const copy of copies) {
  const relative = path.relative(root, copy);
  if (!fs.existsSync(copy)) {
    console.error(`FAIL: ${relative} does not exist`);
    failed = true;
    continue;
  }
  const content = fs.readFileSync(copy, 'utf8');
  if (content !== canonicalContent) {
    console.error(`FAIL: ${relative} differs from shared/cipher.js`);
    failed = true;
  } else {
    console.log(`OK: ${relative} matches shared/cipher.js`);
  }
}

if (failed) {
  console.error('\nSync check failed. Copy shared/cipher.js to the locations above.');
  process.exit(1);
} else {
  console.log('\nAll cipher.js copies are in sync.');
}
