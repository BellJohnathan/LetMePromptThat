(() => {
  // Parse URL
  const { query, aiCode } = parseShareURL(
    window.location.pathname,
    window.location.hash
  );

  if (!query) {
    document.querySelector('.chat-body').innerHTML =
      '<p style="text-align:center;color:#888;padding:3rem 1rem;">Nothing to see here. Go to <a href="https://letmeprompthat.com" style="color:#7c6ef0;">letmeprompthat.com</a> to create a link.</p>';
    return;
  }

  // Elements
  const typedText = document.getElementById('typed-text');
  const cursor = document.getElementById('cursor');
  const sendBtn = document.getElementById('send-btn');
  const snarkyMessage = document.getElementById('snarky-message');
  const redirectNotice = document.getElementById('redirect-notice');
  const redirectText = document.getElementById('redirect-text');
  const cancelRedirect = document.getElementById('cancel-redirect');
  const aiButtons = document.getElementById('ai-buttons');
  const toast = document.getElementById('toast');

  // Build redirect URLs
  const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+');
  const urls = {
    p: `https://www.perplexity.ai/search/?q=${encodedQuery}`,
    g: `https://chatgpt.com/?q=${encodedQuery}`,
    c: 'https://claude.ai/new'
  };

  const aiNames = {
    p: 'Perplexity',
    g: 'ChatGPT',
    c: 'Claude',
    x: ''
  };

  // Set up AI button hrefs
  document.getElementById('btn-perplexity').href = urls.p;
  document.getElementById('btn-chatgpt').href = urls.g;

  document.getElementById('btn-claude').addEventListener('click', () => {
    copyAndOpenClaude();
  });

  document.getElementById('btn-copy').addEventListener('click', () => {
    copyQuestion('Question copied to clipboard');
  });

  // ── Typewriter animation ──
  let charIndex = 0;
  const typingSpeed = 55; // ms per character

  function typeNextChar() {
    if (charIndex < query.length) {
      typedText.textContent += query[charIndex];
      charIndex++;
      setTimeout(typeNextChar, typingSpeed + Math.random() * 30);
    } else {
      onTypingDone();
    }
  }

  function onTypingDone() {
    // Activate send button
    sendBtn.classList.add('active');

    // Click send after a brief pause
    setTimeout(() => {
      cursor.classList.add('hidden');
      sendBtn.style.transform = 'scale(0.9)';
      setTimeout(() => {
        sendBtn.style.transform = '';
      }, 100);

      // Dramatic pause, then snarky message
      setTimeout(showSnarkyMessage, 1200);
    }, 600);
  }

  function showSnarkyMessage() {
    snarkyMessage.classList.remove('hidden');

    // After 3 seconds, do the redirect action
    setTimeout(doRedirect, 3000);
  }

  let redirectTimer = null;

  function doRedirect() {
    if (aiCode === 'x') {
      // Copy only
      copyQuestion('Question copied to clipboard');
      showButtons();
      return;
    }

    if (aiCode === 'c') {
      // Claude: copy + open
      copyAndOpenClaude();
      return;
    }

    // Perplexity or ChatGPT: auto-redirect with cancel option
    const name = aiNames[aiCode] || 'Perplexity';
    redirectText.textContent = `Redirecting to ${name}...`;
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

  async function copyAndOpenClaude() {
    try {
      await navigator.clipboard.writeText(query);
      showToast('Question copied to clipboard — just paste it in Claude!');
      setTimeout(() => {
        window.open(urls.c, '_blank');
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

  // Start the animation after a brief initial delay
  setTimeout(typeNextChar, 800);
})();
