(() => {
  const CHEVRON_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

  const questionEl = document.getElementById('question');
  const generateBtn = document.getElementById('generate');
  const resultEl = document.getElementById('result');
  const resultUrlEl = document.getElementById('result-url');
  const copyBtn = document.getElementById('copy-btn');
  const copyFeedback = document.getElementById('copy-feedback');
  const placeholderEl = document.getElementById('placeholder-anim');
  const TEXTAREA_MAX = 200;

  function autoExpand() {
    questionEl.style.height = 'auto';
    const newHeight = Math.min(questionEl.scrollHeight, TEXTAREA_MAX);
    questionEl.style.height = newHeight + 'px';
    questionEl.style.overflowY = questionEl.scrollHeight > TEXTAREA_MAX ? 'auto' : 'hidden';
  }

  // ── Restore saved AI preference ──
  const savedAI = localStorage.getItem('lmpt-ai');
  if (savedAI) {
    const radio = document.querySelector(`input[name="ai"][value="${savedAI}"]`);
    if (radio) radio.checked = true;
  }

  const radioGroup = document.querySelector('.radio-group');
  const aiLabel = document.querySelector('.ai-options-label');
  let collapseToggle = null;

  function createCollapseToggle() {
    collapseToggle = document.createElement('button');
    collapseToggle.className = 'collapse-toggle';
    collapseToggle.innerHTML = `Change ${CHEVRON_SVG}`;
    collapseToggle.addEventListener('click', () => {
      if (radioGroup.classList.contains('collapsed')) {
        radioGroup.classList.remove('collapsed');
        collapseToggle.innerHTML = `Done ${CHEVRON_SVG}`;
        collapseToggle.classList.add('expanded');
      } else {
        radioGroup.classList.add('collapsed');
        collapseToggle.innerHTML = `Change ${CHEVRON_SVG}`;
        collapseToggle.classList.remove('expanded');
      }
    });
    aiLabel.appendChild(collapseToggle);
  }

  if (savedAI) {
    radioGroup.classList.add('collapsed');
    createCollapseToggle();
  }

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
    autoExpand();
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
      questionEl.style.height = 'auto';
      questionEl.style.overflowY = 'hidden';
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
    localStorage.setItem('lmpt-ai', aiCode);

    // Collapse picker and create toggle on first generate
    if (!collapseToggle) {
      radioGroup.classList.add('collapsed');
      createCollapseToggle();
    }

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
  // Auto-collapse picker on selection + create toggle if first time
  document.querySelectorAll('input[name="ai"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!resultEl.classList.contains('hidden')) {
        generateLink();
      }
      // Auto-collapse after selection
      if (collapseToggle && !radioGroup.classList.contains('collapsed')) {
        setTimeout(() => {
          radioGroup.classList.add('collapsed');
          collapseToggle.innerHTML = `Change ${CHEVRON_SVG}`;
          collapseToggle.classList.remove('expanded');
        }, 200);
      }
    });
  });

  copyBtn.addEventListener('click', () => {
    const url = `https://${resultUrlEl.textContent}`;
    copyToClipboard(url);
  });

  document.getElementById('preview-btn').addEventListener('click', () => {
    window.open('https://' + resultUrlEl.textContent, '_blank');
  });
})();
