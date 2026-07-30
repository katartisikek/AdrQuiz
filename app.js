/* ============================================
   ADR QUIZ - Main Application Logic
   ============================================ */

'use strict';

// ============================================
// STATE
// ============================================
let state = {
  currentQuizType: null,       // 'basiko' | 'vytia' | 'ekriktika' | 'radienerga' | 'all' | 'renewal'
  currentCategories: [],       // array of category ids for renewal
  questions: [],               // shuffled question set for this quiz
  currentIndex: 0,
  answers: [],                 // { selectedIdx: number|null, isCorrect: bool|null }
  timerInterval: null,
  elapsedSeconds: 0,
  quizLabel: '',
  lastRetryConfig: null,       // stores config for retry
  reviewOpen: false,
  chapterType: null,           // current category open in chapter select
};

// ============================================
// CHAPTER SELECT CONFIG
// ============================================
const CATEGORY_CONFIG = {
  all: {
    label: 'Γενικό Τεστ',
    desc: 'Ερωτήσεις από όλες τις κατηγορίες μαζί',
    image: 'basiki.png',
    color: '#059669',
    defaultCount: 25,
    // no chapters - goes straight to quiz
  },
  basiko: {
    label: 'Βασική Εκπαίδευση',
    desc: 'Νομοθεσία, Μεταφορά, Ασφάλεια',
    image: 'basiki.png',
    color: '#2563eb',
    defaultCount: 20,
    chapterNames: [
      'Κεφάλαιο 1 - Νομοθετικό πλαίσιο – Ταξινόμηση επικινδύνων εμπορευμάτων',
      'Κεφάλαιο 2 - Είδη κινδύνων – Πρόληψη και αντιμετώπιση ατυχημάτων',
      'Κεφάλαιο 3 - Τρόποι μεταφοράς επικίνδυνων εμπορευμάτων',
      'Κεφάλαιο 4 - Οχήματα μεταφοράς επικίνδυνων εμπορευμάτων και οδική ασφάλεια',
      'Κεφάλαιο 5 - Κανόνες ασφαλούς φόρτωσης – Μικτή φόρτωση',
    ],
  },
  vytia: {
    label: 'Εκπαίδευση Βυτίων',
    desc: 'Δεξαμενές & Βυτιοφόρα Οχήματα',
    image: 'metaforaB.png',
    color: '#0891b2',
    defaultCount: 20,
    chapterNames: [
      'Κεφάλαιο 1 - Δεξαμενή',
      'Κεφάλαιο 2 - Ειδικές προδιαγραφές βυτιοφόρων οχημάτων',
      'Κεφάλαιο 3 - Σήμανση βυτιοφόρων οχημάτων',
    ],
  },
  ekriktika: {
    label: 'Εκρηκτικά – Κλάση 1',
    desc: 'Εκρηκτικές Ουσίες και Αντικείμενα',
    image: 'metaforak1.png',
    color: '#ea580c',
    defaultCount: 15,
    chapterNames: [
      'Κεφάλαιο 1 - Εκρηκτικές ουσίες και αντικείμενα',
      'Κεφάλαιο 2 - Συσκευασίες',
      'Κεφάλαιο 3 - Οχήματα',
      'Κεφάλαιο 4 - Η μεταφορά ουσιών και αντικειμένων κλάσης 1',
      'Κεφάλαιο 5 - Κίνδυνοι, ατυχήματα και οδηγίες αντιμετώπισης',
    ],
  },
  radienerga: {
    label: 'Ραδιενεργά – Κλάση 7',
    desc: 'Ραδιενεργές Ουσίες',
    image: 'metaforak7.png',
    color: '#7c3aed',
    defaultCount: 15,
    chapterNames: [
      'Κεφάλαιο 1 - Ραδιενέργεια – Ταξινόμηση ραδιενεργών',
      'Κεφάλαιο 2 - Ειδικοί κίνδυνοι',
      'Κεφάλαιο 3 - Σήμανση οχημάτων και συσκευασίες',
      'Κεφάλαιο 4 - Μεταφορά – Έγγραφα - Οδηγοί',
    ],
  },
};

// ============================================
// CHAPTER SELECT SCREEN
// ============================================

function openChapterSelect(type) {
  // For 'all' type, just start quiz directly
  if (type === 'all') {
    startQuiz('all', 25);
    return;
  }

  state.chapterType = type;
  const cfg = CATEGORY_CONFIG[type];
  const catData = QUIZ_DATA[type];
  const chapters = catData.chapters;
  const chapterKeys = Object.keys(chapters);

  const main = document.getElementById('chapter-main');
  main.innerHTML = '';

  // ── Hero section ──────────────────────────────────────────────
  const hero = document.createElement('div');
  hero.className = 'chapter-hero';
  hero.style.setProperty('--cat-color', cfg.color);
  hero.innerHTML = `
    <div class="chapter-hero-img">
      <img src="${cfg.image}" alt="${cfg.label}">
    </div>
    <div class="chapter-hero-info">
      <h2 class="chapter-hero-title">${cfg.label}</h2>
      <p class="chapter-hero-desc">${cfg.desc}</p>
    </div>
  `;
  main.appendChild(hero);

  // ── Quick start card ─────────────────────────────────────────
  const quickCard = document.createElement('div');
  quickCard.className = 'chapter-quick-card';
  quickCard.style.setProperty('--cat-color', cfg.color);
  quickCard.innerHTML = `
    <div class="chapter-quick-left">
      <span class="chapter-quick-icon">▶</span>
      <div>
        <div class="chapter-quick-title">Τεστ Ολόκληρης Κατηγορίας</div>
        <div class="chapter-quick-sub">${catData.allQuestions.length} ερωτήσεις &bull; ${cfg.defaultCount} τυχαίες / τεστ</div>
      </div>
    </div>
    <button class="chapter-start-btn" onclick="startQuiz('${type}', ${cfg.defaultCount})" style="background:${cfg.color}">
      Έναρξη
    </button>
  `;
  main.appendChild(quickCard);

  // ── Chapter list ──────────────────────────────────────────────
  const section = document.createElement('div');
  section.className = 'chapter-section';

  const sectionLabel = document.createElement('div');
  sectionLabel.className = 'section-label';
  sectionLabel.innerHTML = `<span class="section-dot" style="background:${cfg.color};box-shadow:0 0 6px ${cfg.color}"></span> Ανά Κεφάλαιο`;
  section.appendChild(sectionLabel);

  chapterKeys.forEach((chKey, idx) => {
    const chQuestions = chapters[chKey];
    const displayName = cfg.chapterNames[idx] || chKey;
    const testsPerChapter = Math.min(chQuestions.length, Math.ceil(chQuestions.length / 2));

    const chCard = document.createElement('div');
    chCard.className = 'chapter-item';
    chCard.style.setProperty('--cat-color', cfg.color);

    // Chapter header
    const chHeader = document.createElement('div');
    chHeader.className = 'chapter-item-header';
    chHeader.innerHTML = `
      <span class="chapter-num" style="color:${cfg.color};border-color:${cfg.color}20;background:${cfg.color}10">${idx + 1}</span>
      <span class="chapter-name" onclick="startChapterQuiz('${type}', ${idx})" title="${displayName}">${displayName}</span>
      <span class="chapter-q-count">${chQuestions.length} ερωτ.</span>
    `;
    chCard.appendChild(chHeader);

    // Test buttons row
    const testsRow = document.createElement('div');
    testsRow.className = 'chapter-tests-row';

    // "Όλες" button for this chapter
    const allBtn = document.createElement('button');
    allBtn.className = 'chapter-test-btn chapter-test-all';
    allBtn.textContent = 'Όλες';
    allBtn.style.setProperty('--cat-color', cfg.color);
    allBtn.onclick = () => startChapterQuiz(type, idx);
    testsRow.appendChild(allBtn);

    // Numbered mini-tests (splits of ~5-8 questions each)
    const batchSize = 5;
    const numBatches = Math.ceil(chQuestions.length / batchSize);
    for (let b = 0; b < numBatches; b++) {
      const btn = document.createElement('button');
      btn.className = 'chapter-test-btn';
      btn.textContent = `Τεστ ${b + 1}`;
      btn.style.setProperty('--cat-color', cfg.color);
      const batchIdx = b;
      btn.onclick = () => startChapterBatchQuiz(type, idx, batchIdx, batchSize);
      testsRow.appendChild(btn);
    }

    chCard.appendChild(testsRow);
    section.appendChild(chCard);
  });

  main.appendChild(section);
  showScreen('screen-chapter');
}

function startChapterQuiz(type, chapterIdx) {
  const catData = QUIZ_DATA[type];
  const chKeys = Object.keys(catData.chapters);
  const chKey = chKeys[chapterIdx];
  const chQuestions = catData.chapters[chKey];
  const cfg = CATEGORY_CONFIG[type];
  const chName = cfg.chapterNames[chapterIdx] || chKey;

  const questions = shuffle(chQuestions).map(q => shuffleOptions(q));
  state.lastRetryConfig = { type, count: questions.length, isRenewal: false, chapterIdx, isChapter: true };
  _initQuiz(questions, chName);
}

function startChapterBatchQuiz(type, chapterIdx, batchIdx, batchSize) {
  const catData = QUIZ_DATA[type];
  const chKeys = Object.keys(catData.chapters);
  const chKey = chKeys[chapterIdx];
  const allChQ = catData.chapters[chKey];
  const cfg = CATEGORY_CONFIG[type];
  const chName = cfg.chapterNames[chapterIdx] || chKey;

  // Take a deterministic slice (shuffled within batch)
  const start = batchIdx * batchSize;
  const slice = allChQ.slice(start, start + batchSize);
  const questions = shuffle(slice).map(q => shuffleOptions(q));
  const label = `${chName} — Τεστ ${batchIdx + 1}`;

  state.lastRetryConfig = { type, count: questions.length, isRenewal: false, chapterIdx, batchIdx, batchSize, isChapterBatch: true };
  _initQuiz(questions, label);
}

// ============================================
// HELPERS
// ============================================

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleOptions(question) {
  // Shuffle options while preserving the correct answer flag
  const opts = shuffle(question.options);
  return { ...question, options: opts };
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  window.scrollTo(0, 0);
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getEl(id) { return document.getElementById(id); }

// ============================================
// QUIZ START
// ============================================

function startQuiz(type, count) {
  let allQ = [];
  let label = '';

  if (type === 'all') {
    allQ = [
      ...QUIZ_DATA.basiko.allQuestions,
      ...QUIZ_DATA.vytia.allQuestions,
      ...QUIZ_DATA.ekriktika.allQuestions,
      ...QUIZ_DATA.radienerga.allQuestions,
    ];
    label = 'Γενικό Τεστ';
  } else {
    allQ = QUIZ_DATA[type].allQuestions;
    label = QUIZ_DATA[type].category;
  }

  const selected = shuffle(allQ).slice(0, Math.min(count, allQ.length));
  const questions = selected.map(q => shuffleOptions(q));

  state.lastRetryConfig = { type, count, isRenewal: false, categories: [] };
  _initQuiz(questions, label);
}

function startRenewal(categories, count) {
  let allQ = [];
  for (const cat of categories) {
    allQ = allQ.concat(QUIZ_DATA[cat].allQuestions);
  }

  const catNames = categories.map(c => QUIZ_DATA[c].category).join(' + ');
  const label = `Ανανεωτικό: ${catNames}`;
  const selected = shuffle(allQ).slice(0, Math.min(count, allQ.length));
  const questions = selected.map(q => shuffleOptions(q));

  state.lastRetryConfig = { isRenewal: true, categories, count };
  _initQuiz(questions, label);
}

function _initQuiz(questions, label) {
  state.questions = questions;
  state.currentIndex = 0;
  state.answers = questions.map(() => ({ selectedIdx: null, isCorrect: null }));
  state.elapsedSeconds = 0;
  state.quizLabel = label;
  state.reviewOpen = false;

  // Update header label
  getEl('quiz-category-label').textContent = label;

  // Build nav dots
  buildNavDots();

  // Render first question
  renderQuestion(0);

  // Start timer
  clearInterval(state.timerInterval);
  updateTimerDisplay(0);
  state.timerInterval = setInterval(() => {
    state.elapsedSeconds++;
    updateTimerDisplay(state.elapsedSeconds);
  }, 1000);

  showScreen('screen-quiz');
}

// ============================================
// NAVIGATION DOTS
// ============================================

function buildNavDots() {
  const nav = getEl('q-nav');
  nav.innerHTML = '';
  state.questions.forEach((q, i) => {
    const btn = document.createElement('button');
    btn.className = 'q-dot unanswered';
    btn.textContent = i + 1;
    btn.setAttribute('aria-label', `Ερώτηση ${i + 1}`);
    btn.onclick = () => navigateTo(i);
    nav.appendChild(btn);
  });
  updateNavDots();
}

function updateNavDots() {
  const dots = getEl('q-nav').children;
  state.answers.forEach((ans, i) => {
    const dot = dots[i];
    dot.className = 'q-dot';
    if (i === state.currentIndex) {
      dot.classList.add('current');
    } else if (ans.selectedIdx === null) {
      dot.classList.add('unanswered');
    } else if (ans.isCorrect) {
      dot.classList.add('answered-correct');
    } else {
      dot.classList.add('answered-wrong');
    }
  });

  // Scroll dot into view
  const dots2 = getEl('q-nav').children;
  if (dots2[state.currentIndex]) {
    dots2[state.currentIndex].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }
}

// ============================================
// RENDER QUESTION
// ============================================

function renderQuestion(index) {
  const q = state.questions[index];
  const ans = state.answers[index];
  const total = state.questions.length;

  // Progress
  getEl('progress-current').textContent = index + 1;
  getEl('progress-total').textContent = total;
  getEl('progress-fill').style.width = `${((index + 1) / total) * 100}%`;

  // Chapter
  const chapEl = getEl('q-chapter');
  if (q.chapter) {
    chapEl.textContent = formatChapter(q.chapter);
    chapEl.style.display = '';
  } else {
    chapEl.style.display = 'none';
  }

  // Question text
  getEl('q-text').textContent = q.question;

  // Options
  const optList = getEl('options-list');
  optList.innerHTML = '';
  const letters = ['Α', 'Β', 'Γ', 'Δ'];

  q.options.forEach((opt, oi) => {
    const item = document.createElement('div');
    item.className = 'option-item';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');

    // Apply state if already answered
    const answered = ans.selectedIdx !== null;
    if (answered) {
      if (opt.correct) {
        item.classList.add('correct');
      } else if (oi === ans.selectedIdx) {
        item.classList.add('wrong');
      }
    } else if (oi === ans.selectedIdx) {
      item.classList.add('selected');
    }

    const letterSpan = document.createElement('span');
    letterSpan.className = 'option-letter';
    letterSpan.textContent = letters[oi] || oi + 1;

    const textSpan = document.createElement('span');
    textSpan.className = 'option-text';
    textSpan.textContent = opt.text;

    item.appendChild(letterSpan);
    item.appendChild(textSpan);

    if (answered) {
      const icon = document.createElement('span');
      icon.className = 'option-result-icon';
      icon.textContent = opt.correct ? '✓' : (oi === ans.selectedIdx ? '✗' : '');
      item.appendChild(icon);
    }

    if (!answered) {
      item.onclick = () => selectAnswer(oi);
      item.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectAnswer(oi); }
      };
    }

    optList.appendChild(item);
  });

  // Nav buttons
  const prevBtn = getEl('prev-btn');
  const nextBtn = getEl('next-btn');
  const finishBtn = getEl('finish-btn');

  prevBtn.disabled = index === 0;

  const isLast = index === total - 1;
  if (isLast) {
    nextBtn.style.display = 'none';
    finishBtn.style.display = '';
  } else {
    nextBtn.style.display = '';
    finishBtn.style.display = 'none';
  }

  // Re-trigger animation
  const card = getEl('question-card');
  card.style.animation = 'none';
  card.offsetHeight; // reflow
  card.style.animation = '';

  updateNavDots();
}

function formatChapter(ch) {
  // Clean up chapter text
  return ch
    .replace(/^\s+|\s+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .toUpperCase();
}

// ============================================
// ANSWER SELECTION
// ============================================

function selectAnswer(optionIndex) {
  const ans = state.answers[state.currentIndex];
  if (ans.selectedIdx !== null) return; // already answered

  const q = state.questions[state.currentIndex];
  const isCorrect = q.options[optionIndex].correct;

  state.answers[state.currentIndex] = {
    selectedIdx: optionIndex,
    isCorrect,
  };

  // Re-render to show result
  renderQuestion(state.currentIndex);

  // Auto-advance after 1.2 seconds if correct, 1.8 if wrong
  const delay = isCorrect ? 1100 : 1700;
  setTimeout(() => {
    if (state.currentIndex < state.questions.length - 1) {
      navigateTo(state.currentIndex + 1);
    }
  }, delay);
}

// ============================================
// NAVIGATION
// ============================================

function navigateTo(index) {
  state.currentIndex = index;
  renderQuestion(index);
}

function prevQuestion() {
  if (state.currentIndex > 0) {
    navigateTo(state.currentIndex - 1);
  }
}

function nextQuestion() {
  if (state.currentIndex < state.questions.length - 1) {
    navigateTo(state.currentIndex + 1);
  }
}

// ============================================
// TIMER
// ============================================

function updateTimerDisplay(secs) {
  const el = getEl('timer-display');
  el.textContent = formatTime(secs);

  const wrap = getEl('timer-wrap');
  wrap.className = 'timer-wrap';
  if (secs > 1800) wrap.classList.add('danger');
  else if (secs > 1200) wrap.classList.add('warning');
}

// ============================================
// FINISH QUIZ
// ============================================

function finishQuiz() {
  clearInterval(state.timerInterval);

  const total = state.questions.length;
  const correct = state.answers.filter(a => a.isCorrect === true).length;
  const wrong = state.answers.filter(a => a.selectedIdx !== null && !a.isCorrect).length;
  const skipped = state.answers.filter(a => a.selectedIdx === null).length;
  const pct = Math.round((correct / total) * 100);
  const passed = pct >= 75;

  // Emoji & title
  getEl('results-emoji').textContent = passed ? '🏆' : (pct >= 50 ? '📚' : '😔');
  getEl('results-title').textContent = passed ? 'Συγχαρητήρια!' : (pct >= 50 ? 'Καλή προσπάθεια!' : 'Χρειάζεσαι εξάσκηση');

  // Score ring
  const ring = getEl('score-ring-fill');
  const circumference = 327;
  const offset = circumference - (circumference * pct / 100);
  ring.className = 'score-ring-fill' + (passed ? '' : ' fail');

  setTimeout(() => {
    ring.style.strokeDashoffset = offset;
  }, 200);

  // Score percentage
  getEl('score-pct').textContent = pct + '%';

  // Stats
  getEl('stat-correct').textContent = correct;
  getEl('stat-wrong').textContent = wrong;
  getEl('stat-skipped').textContent = skipped;
  getEl('stat-time').textContent = formatTime(state.elapsedSeconds);

  // Pass/fail badge
  const badge = getEl('pass-fail-badge');
  if (passed) {
    badge.className = 'pass-fail-badge pass';
    badge.textContent = `✓ ΕΠΙΤΥΧΙΑ — Απαιτείται ≥ 75% (${correct}/${total} σωστές)`;
  } else {
    badge.className = 'pass-fail-badge fail';
    badge.textContent = `✗ ΑΠΟΤΥΧΙΑ — Απαιτείται ≥ 75% (${correct}/${total} σωστές)`;
  }

  // Build review list
  buildReviewList();

  showScreen('screen-results');
  getEl('review-list').style.display = 'none';
  getEl('review-toggle-btn').textContent = '👁  Προβολή Ερωτήσεων';
  state.reviewOpen = false;
}

// ============================================
// REVIEW
// ============================================

function buildReviewList() {
  const list = getEl('review-list');
  list.innerHTML = '';
  const letters = ['Α', 'Β', 'Γ', 'Δ'];

  state.questions.forEach((q, qi) => {
    const ans = state.answers[qi];
    const isSkipped = ans.selectedIdx === null;
    const isCorrect = ans.isCorrect === true;
    const statusClass = isSkipped ? 'review-skipped' : (isCorrect ? 'review-correct' : 'review-wrong');
    const statusText = isSkipped ? 'Αναπάντητη' : (isCorrect ? '✓ Σωστή' : '✗ Λάθος');

    const item = document.createElement('div');
    item.className = `review-item ${statusClass}`;

    const header = document.createElement('div');
    header.className = 'review-item-header';

    const qnum = document.createElement('div');
    qnum.className = 'review-q-num';
    qnum.textContent = `Ερώτηση ${qi + 1}`;

    const status = document.createElement('div');
    status.className = 'review-status';
    status.textContent = statusText;

    header.appendChild(qnum);
    header.appendChild(status);

    const qtext = document.createElement('div');
    qtext.className = 'review-q-text';
    qtext.textContent = q.question;

    const opts = document.createElement('div');
    opts.className = 'review-options';

    q.options.forEach((opt, oi) => {
      const optEl = document.createElement('div');
      optEl.className = 'review-opt';
      const isThisCorrect = opt.correct;
      const wasSelected = oi === ans.selectedIdx;

      if (isThisCorrect) optEl.classList.add('was-correct');
      else if (wasSelected && !isThisCorrect) optEl.classList.add('was-selected-wrong');

      const letterEl = document.createElement('span');
      letterEl.className = 'review-opt-letter';
      letterEl.textContent = (letters[oi] || oi + 1) + '.';

      const textEl = document.createElement('span');
      textEl.className = 'review-opt-text';
      textEl.textContent = opt.text;

      optEl.appendChild(letterEl);
      optEl.appendChild(textEl);

      if (isThisCorrect) {
        const icon = document.createElement('span');
        icon.textContent = ' ✓';
        icon.style.fontWeight = '700';
        optEl.appendChild(icon);
      }
      if (wasSelected && !isThisCorrect) {
        const icon = document.createElement('span');
        icon.textContent = ' ✗';
        icon.style.fontWeight = '700';
        optEl.appendChild(icon);
      }

      opts.appendChild(optEl);
    });

    item.appendChild(header);
    item.appendChild(qtext);
    item.appendChild(opts);
    list.appendChild(item);
  });
}

function toggleReview() {
  state.reviewOpen = !state.reviewOpen;
  const list = getEl('review-list');
  const btn = getEl('review-toggle-btn');
  list.style.display = state.reviewOpen ? '' : 'none';
  btn.innerHTML = state.reviewOpen
    ? `<svg viewBox="0 0 24 24" fill="none" width="17" height="17"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Απόκρυψη Ερωτήσεων`
    : `<svg viewBox="0 0 24 24" fill="none" width="17" height="17"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg> Προβολή Ερωτήσεων`;
}

// ============================================
// RETRY / HOME
// ============================================

function retryQuiz() {
  if (!state.lastRetryConfig) { goHome(); return; }
  const cfg = state.lastRetryConfig;
  if (cfg.isRenewal) {
    startRenewal(cfg.categories, cfg.count);
  } else if (cfg.isChapterBatch) {
    startChapterBatchQuiz(cfg.type, cfg.chapterIdx, cfg.batchIdx, cfg.batchSize);
  } else if (cfg.isChapter) {
    startChapterQuiz(cfg.type, cfg.chapterIdx);
  } else {
    startQuiz(cfg.type, cfg.count);
  }
}

function goHome() {
  clearInterval(state.timerInterval);
  closeModal('exit-modal');
  state.chapterType = null;
  showScreen('screen-home');
}

// ============================================
// MODAL
// ============================================

function confirmExit() {
  getEl('exit-modal').classList.add('active');
}

function closeModal(id) {
  getEl(id).classList.remove('active');
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal('exit-modal');
});

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  showScreen('screen-home');

  // Add keyboard navigation on quiz card items
  document.querySelectorAll('.quiz-card').forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
});
