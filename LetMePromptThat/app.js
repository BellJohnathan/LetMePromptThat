(() => {
  const questionEl = document.getElementById('question');
  const generateBtn = document.getElementById('generate');
  const resultEl = document.getElementById('result');
  const resultUrlEl = document.getElementById('result-url');
  const copyBtn = document.getElementById('copy-btn');
  const copyFeedback = document.getElementById('copy-feedback');
  const placeholderEl = document.getElementById('placeholder-anim');

  // ── Rotating placeholder animation ──
  const placeholders = [
    'can you summarise this 47-page PDF for me',
    'what\u2019s the dress code for a business casual BBQ',
    'how do I write a polite email saying no',
    'what\u2019s a good out-of-office message',
    'how many days until Christmas',
    'can you explain what OKRs are again',
    'what\u2019s the capital of Ecuador',
    'how to merge two PDFs',
    'what\u2019s the difference between CC and BCC',
  ];

  let phIndex = 0;
  let phCharIndex = 0;
  let phTimer = null;
  let phDirection = 'typing'; // 'typing' | 'pausing' | 'erasing'
  let phStopped = false;

  function phType() {
    if (phStopped) return;
    const text = placeholders[phIndex];

    if (phDirection === 'typing') {
      if (phCharIndex < text.length) {
        phCharIndex++;
        placeholderEl.textContent = text.slice(0, phCharIndex);
        phTimer = setTimeout(phType, 50 + Math.random() * 30);
      } else {
        phDirection = 'pausing';
        phTimer = setTimeout(phType, 2200);
      }
    } else if (phDirection === 'pausing') {
      phDirection = 'erasing';
      phTimer = setTimeout(phType, 30);
    } else if (phDirection === 'erasing') {
      if (phCharIndex > 0) {
        phCharIndex--;
        placeholderEl.textContent = placeholders[phIndex].slice(0, phCharIndex);
        phTimer = setTimeout(phType, 25);
      } else {
        phIndex = (phIndex + 1) % placeholders.length;
        phDirection = 'typing';
        phTimer = setTimeout(phType, 400);
      }
    }
  }

  function phStop() {
    phStopped = true;
    clearTimeout(phTimer);
    placeholderEl.classList.add('hidden');
  }

  // Stop on focus if user has typed, or on any input
  questionEl.addEventListener('focus', () => {
    if (questionEl.value.length > 0) phStop();
  });
  questionEl.addEventListener('input', () => {
    if (questionEl.value.length > 0) {
      phStop();
    } else if (phStopped) {
      // Restart if textarea is cleared
      phStopped = false;
      phIndex = 0;
      phCharIndex = 0;
      phDirection = 'typing';
      placeholderEl.textContent = '';
      placeholderEl.classList.remove('hidden');
      phTimer = setTimeout(phType, 400);
    }
  });

  // Start animation
  phTimer = setTimeout(phType, 800);

  const COPY_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>`;

  const CHECK_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`;

  function getSelectedAI() {
    return document.querySelector('input[name="ai"]:checked').value;
  }

  function generateLink() {
    const query = questionEl.value.trim();
    if (!query) {
      questionEl.focus();
      return;
    }

    const aiCode = getSelectedAI();
    const url = buildShareURL(query, aiCode);

    resultUrlEl.textContent = url;
    resultEl.classList.remove('hidden');

    // Auto-copy
    copyToClipboard(`https://${url}`);
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showCopySuccess();
      showCopyFeedback('Copied to clipboard!');
    } catch {
      // Fallback: select text
      showCopyFeedback('Right-click the link to copy');
    }
  }

  function showCopySuccess() {
    copyBtn.innerHTML = CHECK_SVG;
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.innerHTML = COPY_SVG;
      copyBtn.classList.remove('copied');
    }, 1500);
  }

  function showCopyFeedback(msg) {
    copyFeedback.textContent = msg;
    copyFeedback.classList.add('visible');
    setTimeout(() => copyFeedback.classList.remove('visible'), 2500);
  }

  generateBtn.addEventListener('click', generateLink);

  // Enter key in textarea generates link (Cmd/Ctrl+Enter)
  questionEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      generateLink();
    }
  });

  // Auto-regenerate when textarea changes (debounced, if link already visible)
  let debounceTimer;
  questionEl.addEventListener('input', () => {
    if (!resultEl.classList.contains('hidden')) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(generateLink, 300);
    }
  });

  // Auto-regenerate when AI selection changes (if link already visible)
  document.querySelectorAll('input[name="ai"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!resultEl.classList.contains('hidden')) {
        generateLink();
      }
    });
  });

  copyBtn.addEventListener('click', () => {
    const url = `https://${resultUrlEl.textContent}`;
    copyToClipboard(url);
  });
})();
