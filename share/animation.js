(() => {
  // Parse URL
  const { query, aiCode } = parseShareURL(
    window.location.pathname,
    window.location.hash
  );

  if (!query) {
    document.querySelector('.chat-body').innerHTML =
      '<p style="text-align:center;color:#9e9590;padding:3rem 1rem;">Nothing to see here. Go to <a href="https://letmeprompthat.com" style="color:#e8a838;">letmeprompthat.com</a> to create a link.</p>';
    return;
  }

  // Elements
  const inputBar = document.getElementById('input-bar');
  const inputPreview = document.getElementById('input-preview');
  const inputCursor = document.getElementById('input-cursor');
  const sendBtn = document.getElementById('send-btn');
  const userMessage = document.getElementById('user-message');
  const typedText = document.getElementById('typed-text');
  const cursor = document.getElementById('cursor');
  const aiMessage = document.getElementById('ai-message');
  const thinkingDots = document.getElementById('thinking-dots');
  const snarkyMessage = document.getElementById('snarky-message');
  const snarkyTitle = document.getElementById('snarky-title');
  const snarkySubtitle = document.getElementById('snarky-subtitle');
  const redirectNotice = document.getElementById('redirect-notice');
  const redirectText = document.getElementById('redirect-text');
  const cancelRedirect = document.getElementById('cancel-redirect');
  const aiButtons = document.getElementById('ai-buttons');
  const toast = document.getElementById('toast');
  const headerStatus = document.getElementById('header-status');

  // Punchline variations — randomly selected each page load
  const punchlines = [
    { title: 'Was that so hard?', subtitle: 'Next time, just prompt it yourself.' },
    { title: 'You could\u2019ve just asked AI.', subtitle: 'But sure, let\u2019s bother a human.' },
    { title: 'AI can do this in 2 seconds.', subtitle: 'Just saying.' },
    { title: 'The future is now, old man.', subtitle: 'And the future has a search bar.' },
    { title: 'This is literally what AI is for.', subtitle: 'You\u2019re welcome.' },
    { title: 'I\u2019m not even real and I found the answer.', subtitle: 'Think about that.' },
  ];

  const punchline = punchlines[Math.floor(Math.random() * punchlines.length)];

  // Build redirect URLs
  const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+');
  const urls = {
    p: `https://www.perplexity.ai/search/?q=${encodedQuery}`,
    g: `https://chatgpt.com/?q=${encodedQuery}`,
    c: 'https://claude.ai/new',
    m: 'https://gemini.google.com/app',
    k: `https://grok.com/?q=${encodedQuery}`,
    l: `https://chat.mistral.ai/chat?q=${encodedQuery}`,
  };

  const aiNames = {
    p: 'Perplexity',
    g: 'ChatGPT',
    c: 'Claude',
    x: '',
    m: 'Gemini',
    k: 'Grok',
    l: 'Le Chat',
  };

  // Set up AI button hrefs
  document.getElementById('btn-perplexity').href = urls.p;
  document.getElementById('btn-chatgpt').href = urls.g;

  document.getElementById('btn-claude').addEventListener('click', () => {
    copyAndOpen(urls.c, 'Claude');
  });

  document.getElementById('btn-copy').addEventListener('click', () => {
    copyQuestion('Question copied to clipboard');
  });

  document.getElementById('btn-gemini').addEventListener('click', () => {
    copyAndOpen(urls.m, 'Gemini');
  });
  document.getElementById('btn-grok').href = urls.k;
  document.getElementById('btn-lechat').href = urls.l;

  // ── Phase 1: Typewriter in the input bar ──
  let charIndex = 0;
  const typingSpeed = 55; // ms per character

  function typeNextChar() {
    if (charIndex < query.length) {
      inputPreview.textContent += query[charIndex];
      charIndex++;

      // Extra pause on word boundaries for gravitas
      const extraDelay = query[charIndex - 1] === ' ' ? 80 + Math.random() * 40 : 0;
      setTimeout(typeNextChar, typingSpeed + Math.random() * 30 + extraDelay);
    } else {
      onTypingDone();
    }
  }

  // ── Phase 2: Send — input bar fades, user bubble appears ──
  function onTypingDone() {
    setTimeout(() => {
      sendBtn.classList.add('active');

      setTimeout(() => {
        // Press send
        sendBtn.style.transform = 'scale(0.88)';
        setTimeout(() => { sendBtn.style.transform = ''; }, 120);

        // Hide cursor in input bar
        inputCursor.classList.add('hidden');

        // After a beat, transition: input bar fades, user bubble appears
        setTimeout(() => {
          inputBar.classList.add('sent');

          // Show user message bubble with the full text
          typedText.textContent = query;
          cursor.classList.add('hidden');
          userMessage.classList.remove('hidden');

          // Phase 3: AI responds
          setTimeout(showAIResponse, 600);
        }, 300);
      }, 600);
    }, 700);
  }

  // ── Phase 3: AI thinking → snarky reveal ──
  function showAIResponse() {
    // Update header status to "typing..."
    headerStatus.textContent = 'typing\u2026';
    headerStatus.style.color = 'var(--accent)';

    aiMessage.classList.remove('hidden');

    // Thinking dots are already visible in the AI bubble — let them run for suspense
    setTimeout(() => {
      thinkingDots.classList.add('fade-out');

      setTimeout(() => {
        thinkingDots.classList.add('hidden');

        // Reset header status
        headerStatus.textContent = 'Online';
        headerStatus.style.color = '';

        // Reveal punchline with bubble flash
        snarkyTitle.textContent = punchline.title;
        snarkySubtitle.textContent = punchline.subtitle;
        snarkyMessage.classList.remove('hidden');
        aiMessage.querySelector('.message-bubble-ai').classList.add('reveal');

        // After punchline lands, do the redirect action
        setTimeout(doRedirect, 3000);
      }, 400);
    }, 2400);
  }

  let redirectTimer = null;

  function doRedirect() {
    if (aiCode === 'x') {
      // Copy only
      copyQuestion('Question copied to clipboard');
      showButtons();
      return;
    }

    if (aiCode === 'c' || aiCode === 'm') {
      // Claude/Gemini: copy + open
      copyAndOpen(urls[aiCode], aiNames[aiCode]);
      return;
    }

    // Perplexity or ChatGPT: auto-redirect with cancel option
    const name = aiNames[aiCode] || 'Perplexity';
    redirectText.textContent = `Redirecting to ${name}...`;
    redirectNotice.dataset.ai = aiCode;
    redirectNotice.classList.remove('hidden');

    redirectTimer = setTimeout(() => {
      window.location.href = urls[aiCode] || urls.p;
    }, 2000);

    cancelRedirect.addEventListener('click', () => {
      clearTimeout(redirectTimer);
      redirectNotice.classList.add('hidden');
      showButtons();
    });
  }

  function showButtons() {
    aiButtons.classList.remove('hidden');
  }

  async function copyQuestion(msg) {
    try {
      await navigator.clipboard.writeText(query);
      showToast(msg);
    } catch {
      // Fallback: show selectable text
      showToast('Could not copy automatically — select and copy manually');
      typedText.style.userSelect = 'text';
    }
  }

  async function copyAndOpen(url, name) {
    try {
      await navigator.clipboard.writeText(query);
      showToast(`Question copied to clipboard — just paste it in ${name}!`);
      setTimeout(() => {
        window.open(url, '_blank');
      }, 500);
    } catch {
      showToast('Could not copy — select the question above and copy manually');
      typedText.style.userSelect = 'text';
    }
    showButtons();
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 4000);
  }

  // Start the animation after a longer initial delay for anticipation
  setTimeout(typeNextChar, 1200);
})();
