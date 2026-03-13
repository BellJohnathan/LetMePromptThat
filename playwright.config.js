const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    browserName: 'chromium',
    headless: true,
  },
  webServer: [
    {
      command: 'npx serve share -l 4173 --no-clipboard --single',
      port: 4173,
      reuseExistingServer: true,
    },
    {
      command: 'npx serve LetMePromptThat -l 4174 --no-clipboard',
      port: 4174,
      reuseExistingServer: true,
    },
  ],
});
