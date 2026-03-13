# LetMePromptThat

LMGTFY for the AI age. When someone asks you a question they could've just asked AI, send them a [LetMePromptThat](https://letmeprompthat.com) link.

## How it works

1. Go to [letmeprompthat.com](https://letmeprompthat.com) and type in the question
2. Pick an AI target (Perplexity, ChatGPT, Claude, or copy-only)
3. Share the generated [lmpt.io](https://lmpt.io) link

The recipient sees a typewriter animation of the question being typed, then gets redirected to their answer.

## Local development

```sh
npm install
npx serve LetMePromptThat  # Creator site on :3000
npx serve share             # Share site on :3000
```

## Tests

```sh
npm test            # Unit tests
npm run test:e2e    # Playwright end-to-end tests
npm run test:smoke  # Production smoke tests
npm run test:all    # All local tests
```

## Inspired by

[Let Me Google That For You](https://letmegooglethat.com)
