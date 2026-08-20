(() => {
  'use strict';

  const DRAFT_KEY = 'scopecut_public_draft_v1';
  const QUOTA_KEY = 'scopecut_preview_quota_v1';
  const MOOD_KEY = 'scopecut_mood';
  const DAILY_POINTS = 2;

  const steps = [
    { name: '你的想法' },
    { name: '使用目的' },
    { name: '經驗與時間' },
    { name: '第一版重點' },
    { name: '確認內容' },
  ];

  const labels = {
    purpose: {
      learn: '練習與學習',
      personal: '解決自己的問題',
      portfolio: '作品集或分享',
      validate: '測試一個產品想法',
    },
    experience: {
      first: '第一次做',
      beginner: '做過一點',
      assisted: '用過 AI Agent',
    },
    time: {
      evening: '一個晚上',
      weekend: '一個週末',
      week: '一週左右',
      open: '先不限制',
    },
    priorities: {
      usable: '先能操作',
      visual: '畫面好看',
      learn: '真的學到東西',
      share: '可以分享給別人',
      data: '能保存資料',
      simple: '越簡單越好',
    },
  };

  const emptyDraft = () => ({
    idea: '',
    purpose: '',
    audience: '',
    experience: '',
    time: '',
    priorities: [],
    constraints: '',
    step: 0,
  });

  const builder = document.querySelector('#builder-content');
  const stepLabel = document.querySelector('#builder-step-label');
  const stepName = document.querySelector('#builder-step-name');
  const progress = document.querySelector('#builder-progress');
  const pointsElement = document.querySelector('#points-balance');
  const authDialog = document.querySelector('#auth-dialog');
  const paymentDialog = document.querySelector('#payment-dialog');
  const toast = document.querySelector('#toast');
  let draft = loadDraft();
  let toastTimer;

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function loadDraft() {
    try {
      const stored = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (!stored || typeof stored !== 'object') return emptyDraft();
      return {
        ...emptyDraft(),
        ...stored,
        priorities: Array.isArray(stored.priorities) ? stored.priorities.slice(0, 3) : [],
        step: Math.max(0, Math.min(4, Number(stored.step) || 0)),
      };
    } catch {
      return emptyDraft();
    }
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function todayKey() {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }

  function quota() {
    try {
      const stored = JSON.parse(localStorage.getItem(QUOTA_KEY) || 'null');
      if (stored?.date === todayKey()) return { date: stored.date, used: Math.max(0, Number(stored.used) || 0) };
    } catch {
      // A damaged preview counter can safely restart for the current day.
    }
    return { date: todayKey(), used: 0 };
  }

  function pointsRemaining() {
    return Math.max(0, DAILY_POINTS - quota().used);
  }

  function usePoint() {
    const current = quota();
    current.used += 1;
    localStorage.setItem(QUOTA_KEY, JSON.stringify(current));
    updatePoints();
  }

  function updatePoints() {
    pointsElement.textContent = String(pointsRemaining());
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  function scrollToBuilder() {
    document.querySelector('#builder').scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => builder.querySelector('textarea, input, button')?.focus({ preventScroll: true }), 650);
  }

  function choiceButton(group, value, title, description, selected, multi = false) {
    return `<button class="choice ${selected ? 'is-selected' : ''}" type="button" data-choice-group="${group}" data-choice-value="${value}" data-choice-multi="${multi}">
      <strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small>
    </button>`;
  }

  function nav(back = true, nextText = '下一步', nextAction = 'next') {
    return `<div class="step-nav">
      ${back ? '<button class="back-button" type="button" data-action="back">上一步</button>' : '<span></span>'}
      <button class="next-button" type="button" data-action="${nextAction}">${nextText} →</button>
    </div>`;
  }

  function renderStep() {
    const current = Math.max(0, Math.min(4, draft.step));
    draft.step = current;
    stepLabel.textContent = `STEP ${current + 1} / ${steps.length}`;
    stepName.textContent = steps[current].name;
    progress.style.width = `${((current + 1) / steps.length) * 100}%`;
    builder.classList.remove('result-view');

    if (current === 0) {
      builder.innerHTML = `
        <p class="step-kicker">START WITH WHAT YOU KNOW</p>
        <h2 class="step-title">你現在有什麼想法？</h2>
        <p class="step-copy">不用完整，也不用先想技術。描述想做的東西、遇到的問題，或最近想嘗試的方向。</p>
        <label class="field-label" for="idea-input">我的想法</label>
        <textarea class="idea-textarea" id="idea-input" maxlength="600" placeholder="例如：我想做一個幫我記錄每天學了什麼的東西，但還不知道應該長怎樣。">${escapeHtml(draft.idea)}</textarea>
        <div class="field-meta"><span>一句話就可以開始</span><span id="idea-count">${draft.idea.length} / 600</span></div>
        <p class="field-error" id="step-error" role="alert"></p>
        ${nav(false)}
      `;
      const input = builder.querySelector('#idea-input');
      input.addEventListener('input', () => {
        draft.idea = input.value;
        builder.querySelector('#idea-count').textContent = `${input.value.length} / 600`;
        saveDraft();
      });
      return;
    }

    if (current === 1) {
      builder.innerHTML = `
        <p class="step-kicker">WHY THIS PROJECT</p>
        <h2 class="step-title">你最想從這個專案得到什麼？</h2>
        <p class="step-copy">選一個最接近的目的，ScopeCut 會用它判斷第一版應該多簡單、重點放在哪裡。</p>
        <div class="field-group">
          <span class="field-label">主要目的</span>
          <div class="choice-grid">
            ${choiceButton('purpose','learn','練習與學習','邊做邊理解新的知識',draft.purpose === 'learn')}
            ${choiceButton('purpose','personal','解決自己的問題','做一個自己會實際使用的工具',draft.purpose === 'personal')}
            ${choiceButton('purpose','portfolio','作品集或分享','做出可以展示給別人的成果',draft.purpose === 'portfolio')}
            ${choiceButton('purpose','validate','測試產品想法','先確認這個方向值不值得繼續',draft.purpose === 'validate')}
          </div>
        </div>
        <div class="field-group"><label class="field-label" for="audience-input">誰會使用？（選填）</label><input class="text-input" id="audience-input" maxlength="120" placeholder="例如：我自己、同學、社團成員" value="${escapeHtml(draft.audience)}" /></div>
        <p class="field-error" id="step-error" role="alert"></p>
        ${nav()}
      `;
      const audience = builder.querySelector('#audience-input');
      audience.addEventListener('input', () => { draft.audience = audience.value; saveDraft(); });
      return;
    }

    if (current === 2) {
      builder.innerHTML = `
        <p class="step-kicker">KEEP THE FIRST VERSION REALISTIC</p>
        <h2 class="step-title">你做過多少？這次有多少時間？</h2>
        <p class="step-copy">這不是考試。誠實選擇能讓第一版更容易完成，也能讓學習建議更有用。</p>
        <div class="field-group">
          <span class="field-label">目前經驗</span>
          <div class="choice-grid three">
            ${choiceButton('experience','first','第一次做','還不知道從哪裡開始',draft.experience === 'first')}
            ${choiceButton('experience','beginner','做過一點','改過範例或做過小作品',draft.experience === 'beginner')}
            ${choiceButton('experience','assisted','用過 AI Agent','曾讓 AI 協助做專案',draft.experience === 'assisted')}
          </div>
        </div>
        <div class="field-group">
          <span class="field-label">希望第一版多久能完成</span>
          <div class="choice-grid">
            ${choiceButton('time','evening','一個晚上','只留下最核心的一件事',draft.time === 'evening')}
            ${choiceButton('time','weekend','一個週末','可以完成一個小而完整的流程',draft.time === 'weekend')}
            ${choiceButton('time','week','一週左右','可以多做一些畫面與細節',draft.time === 'week')}
            ${choiceButton('time','open','先不限制','仍然會先從最小版本開始',draft.time === 'open')}
          </div>
        </div>
        <p class="field-error" id="step-error" role="alert"></p>
        ${nav()}
      `;
      return;
    }

    if (current === 3) {
      builder.innerHTML = `
        <p class="step-kicker">CHOOSE UP TO THREE</p>
        <h2 class="step-title">第一版最重要的是什麼？</h2>
        <p class="step-copy">最多選三項。這些偏好會影響 ScopeCut 推薦的方向，但不會變成一大串限制 Agent 的規則。</p>
        <div class="field-group">
          <span class="field-label">第一版重點</span>
          <div class="choice-grid">
            ${choiceButton('priorities','usable','先能操作','核心流程真的可以使用',draft.priorities.includes('usable'),true)}
            ${choiceButton('priorities','visual','畫面好看','希望第一眼就像完整產品',draft.priorities.includes('visual'),true)}
            ${choiceButton('priorities','learn','真的學到東西','過程要能理解怎麼做',draft.priorities.includes('learn'),true)}
            ${choiceButton('priorities','share','可以分享給別人','完成後有一個公開入口',draft.priorities.includes('share'),true)}
            ${choiceButton('priorities','data','能保存資料','下次打開還看得到內容',draft.priorities.includes('data'),true)}
            ${choiceButton('priorities','simple','越簡單越好','避免加上不必要的功能',draft.priorities.includes('simple'),true)}
          </div>
        </div>
        <div class="field-group"><label class="field-label" for="constraints-input">還有一定要保留的事嗎？（選填）</label><input class="text-input" id="constraints-input" maxlength="180" placeholder="例如：要能在手機使用；想用自己的照片" value="${escapeHtml(draft.constraints)}" /></div>
        <p class="field-error" id="step-error" role="alert"></p>
        ${nav()}
      `;
      const constraints = builder.querySelector('#constraints-input');
      constraints.addEventListener('input', () => { draft.constraints = constraints.value; saveDraft(); });
      return;
    }

    const priorityText = draft.priorities.map((value) => labels.priorities[value]).join('、');
    builder.innerHTML = `
      <p class="step-kicker">REVIEW BEFORE LOGIN</p>
      <h2 class="step-title">這些資訊已經足夠開始。</h2>
      <p class="step-copy">確認後才會出現 Email 登入。你的草稿已保存在這台裝置，不會因登入流程消失。</p>
      <div class="review-grid">
        <div class="review-item full"><span>你的想法</span><p>${escapeHtml(draft.idea)}</p></div>
        <div class="review-item"><span>主要目的</span><p>${escapeHtml(labels.purpose[draft.purpose])}</p></div>
        <div class="review-item"><span>預計時間</span><p>${escapeHtml(labels.time[draft.time])}</p></div>
        <div class="review-item"><span>目前經驗</span><p>${escapeHtml(labels.experience[draft.experience])}</p></div>
        <div class="review-item"><span>第一版重點</span><p>${escapeHtml(priorityText)}</p></div>
        ${draft.audience ? `<div class="review-item"><span>使用者</span><p>${escapeHtml(draft.audience)}</p></div>` : ''}
        ${draft.constraints ? `<div class="review-item"><span>額外要求</span><p>${escapeHtml(draft.constraints)}</p></div>` : ''}
      </div>
      <p class="generate-note">產生一份 Scope Pack 使用 1 點；每日會補充 2 點免費額度。目前預覽結果不會呼叫 AI。</p>
      ${nav(true, '登入並產生', 'generate')}
    `;
  }

  function showError(message) {
    const element = builder.querySelector('#step-error');
    if (element) element.textContent = message;
    showToast(message);
  }

  function validateStep() {
    if (draft.step === 0 && draft.idea.trim().length < 5) return '再多寫一點點，至少讓我們知道你想做什麼。';
    if (draft.step === 1 && !draft.purpose) return '請選擇這個專案最主要的目的。';
    if (draft.step === 2 && (!draft.experience || !draft.time)) return '請選擇目前經驗與希望完成的時間。';
    if (draft.step === 3 && draft.priorities.length === 0) return '請至少選一項第一版重點。';
    return '';
  }

  function goToStep(next) {
    draft.step = Math.max(0, Math.min(4, next));
    saveDraft();
    renderStep();
    document.querySelector('#builder-shell').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openAuth() {
    if (pointsRemaining() <= 0) {
      openPayment('今日的 2 點前端預覽額度已使用完畢');
      return;
    }
    document.querySelector('#auth-email-step').classList.remove('hidden');
    document.querySelector('#auth-preview-step').classList.add('hidden');
    authDialog.showModal();
    document.body.classList.add('modal-open');
    window.setTimeout(() => document.querySelector('#auth-email').focus(), 80);
  }

  function openPayment(plan = '每日免費 2 點') {
    document.querySelector('#selected-plan').textContent = plan;
    paymentDialog.showModal();
    document.body.classList.add('modal-open');
  }

  function closeDialog(dialog) {
    if (dialog?.open) dialog.close();
    if (![...document.querySelectorAll('dialog')].some((item) => item.open)) document.body.classList.remove('modal-open');
  }

  function classifyIdea(idea) {
    const text = idea.toLowerCase();
    if (/學|課程|筆記|背|進度|練習|study|learn/.test(text)) return 'learning';
    if (/行政|表單|預約|管理|記錄|追蹤|清單|工具|排程/.test(text)) return 'tool';
    if (/餐|食|旅|地圖|店|活動|推薦/.test(text)) return 'guide';
    if (/音樂|作品|設計|照片|故事|創作|展示/.test(text)) return 'creative';
    return 'general';
  }

  function createScopePack() {
    const type = classifyIdea(draft.idea);
    const packs = {
      learning: {
        title: '先做一個能每天留下進度的學習板',
        reason: '它能最快把抽象的「想學會」變成可以每天操作與看見累積的流程。',
        directions: ['每日學習進度板：記錄今天做了什麼並看見累積', '主題練習卡：把要學的內容拆成可完成的小任務', '學習成果頁：整理筆記與作品，方便回顧或分享'],
        features: ['新增一個學習目標', '記錄今天完成的內容', '顯示本週的累積進度', '在同一頁回顧最近紀錄'],
        learn: ['HTML / CSS 基礎', 'JavaScript 互動', '瀏覽器資料儲存', 'GitHub Pages 發布'],
      },
      tool: {
        title: '先做一個只完成核心任務的小工具',
        reason: '先讓一個人能從輸入到看見結果，最容易確認這個工具是否真的有幫助。',
        directions: ['單一任務工具：只保留最常使用的輸入與結果', '簡易管理板：集中查看項目、狀態與下一步', '紀錄與摘要頁：保存資料並整理近期變化'],
        features: ['建立一筆新項目', '查看所有項目的目前狀態', '編輯或完成一筆項目', '重新開啟後保留資料'],
        learn: ['介面流程設計', 'JavaScript 狀態管理', '瀏覽器資料儲存', 'GitHub 基本操作'],
      },
      guide: {
        title: '先做一個可以搜尋與收藏的主題清單',
        reason: '它能用最少功能驗證資料是否有用，也容易在完成後直接分享給別人。',
        directions: ['主題推薦清單：用分類快速找到合適選項', '個人收藏地圖：保存想去或去過的地方', '情境選擇器：回答幾個問題後給出推薦'],
        features: ['瀏覽一組清楚分類的項目', '查看每個項目的必要資訊', '搜尋或篩選項目', '收藏自己想保留的項目'],
        learn: ['資訊架構', 'RWD 響應式版面', 'JavaScript 篩選', '資料格式基礎'],
      },
      creative: {
        title: '先做一個能完整呈現單一作品的展示頁',
        reason: '聚焦一個作品比先做完整平台更容易完成，也更能確認視覺與內容方向。',
        directions: ['單一作品展示頁：完整說明作品與創作過程', '互動式作品集：用一個操作呈現作品特色', '主題收藏牆：把同類創作整理成可瀏覽的系列'],
        features: ['清楚呈現作品主題', '展示主要圖片、聲音或內容', '補充簡短的創作背景', '提供一個可分享的公開連結'],
        learn: ['視覺層級', 'HTML / CSS 版面', '媒體素材最佳化', 'GitHub Pages 發布'],
      },
      general: {
        title: '先做一個可操作的核心流程',
        reason: '你的想法還有很多可能；先完成最小流程，能用實際結果決定下一步，而不是先猜完整產品。',
        directions: ['核心流程版：只完成最重要的輸入、處理與結果', '個人使用版：先針對你自己的情境做得順手', '可分享展示版：把想法做成別人能快速理解的體驗'],
        features: ['讓使用者開始一個主要任務', '完成必要的輸入或選擇', '立即看見清楚的結果', '可以重新開始或修改內容'],
        learn: ['使用流程拆解', 'HTML / CSS 基礎', 'JavaScript 互動', 'GitHub 基本操作'],
      },
    };
    const pack = packs[type];
    const purpose = labels.purpose[draft.purpose];
    const audience = draft.audience.trim() || '以你自己作為第一位使用者';
    const priorities = draft.priorities.map((item) => labels.priorities[item]);
    const preference = priorities.length ? priorities.join('、') : '先完成核心流程';
    const constraintsLine = draft.constraints.trim() ? `另外需要保留：${draft.constraints.trim()}。` : '';
    const prompt = [
      `請協助我做出「${pack.title}」的第一版。`,
      '',
      `這個專案來自我的想法：${draft.idea.trim()}`,
      `目標：${purpose}；第一位使用者是${audience}。`,
      '',
      '第一版先完成：',
      ...pack.features.slice(0, draft.time === 'evening' ? 3 : 4).map((item, index) => `${index + 1}. ${item}`),
      '',
      `偏好：${preference}。`,
      constraintsLine,
      '',
      '完成標準：使用者可以走完核心流程、看懂目前狀態，並在手機與電腦上正常操作。',
      '請先直接做出可操作的第一版；遇到不影響核心成果的細節，請自行選擇簡單合理的做法。',
    ].filter((line) => line !== '').join('\n');

    return { ...pack, purpose, audience, preference, prompt };
  }

  function renderResult() {
    const pack = createScopePack();
    stepLabel.textContent = 'SCOPE PACK / PREVIEW';
    stepName.textContent = '前端範例結果';
    progress.style.width = '100%';
    builder.classList.add('result-view');
    builder.innerHTML = `
      <div class="result-heading">
        <div><p class="step-kicker">YOUR FIRST VERSION</p><h2 class="step-title">${escapeHtml(pack.title)}</h2></div>
        <span class="result-badge">PREVIEW READY</span>
      </div>
      <section class="scope-block">
        <div class="scope-block-label"><span>01 / 我理解你的想法</span></div>
        <p>你想把「${escapeHtml(draft.idea.trim())}」整理成一個能實際開始的專案；這次主要是為了${escapeHtml(pack.purpose)}，並優先考慮${escapeHtml(pack.preference)}。</p>
      </section>
      <section class="scope-block">
        <div class="scope-block-label"><span>02 / 三個方向</span></div>
        <ul class="direction-list">${pack.directions.map((item, index) => `<li><span>0${index + 1}</span>${escapeHtml(item)}</li>`).join('')}</ul>
      </section>
      <section class="scope-block">
        <div class="scope-block-label"><span>03 / ScopeCut 主推薦</span></div>
        <h3>${escapeHtml(pack.title)}</h3><p>${escapeHtml(pack.reason)}</p>
      </section>
      <section class="scope-block">
        <div class="scope-block-label"><span>04 / 第一版長怎樣</span></div>
        <ul class="result-list">${pack.features.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </section>
      <section class="scope-block">
        <div class="scope-block-label"><span>05 / 完成時可能學到</span></div>
        <ul class="result-list">${pack.learn.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </section>
      <section class="scope-block">
        <div class="scope-block-label"><span>06 / 開始前準備</span></div>
        <p>準備一個你最想先解決的實際情境，以及 3–5 筆可以拿來測試的範例內容。其餘技術選擇可以先讓 Agent 採用最簡單的做法。</p>
      </section>
      <section class="result-prompt">
        <div class="scope-block-label"><span>07 / 複製給 Agent</span><button class="copy-button" type="button" data-action="copy">複製 Prompt</button></div>
        <pre id="generated-prompt">${escapeHtml(pack.prompt)}</pre>
      </section>
      <div class="result-actions">
        <button class="button button-primary" type="button" data-action="copy">複製 Prompt <span>↗</span></button>
        <a class="button button-secondary" href="https://github.com/google-gemini/gemini-cli" target="_blank" rel="noreferrer">認識免費 Gemini CLI ↗</a>
        <button class="button button-secondary" type="button" data-action="edit">修改這份想法</button>
        <button class="button button-secondary" type="button" data-action="restart">整理另一個想法</button>
      </div>
    `;
    document.querySelector('#builder-shell').scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('已完成一份 Scope Pack 前端範例，使用 1 點預覽額度。');
  }

  async function copyPrompt() {
    const text = builder.querySelector('#generated-prompt')?.textContent || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const input = document.createElement('textarea');
      input.value = text;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    showToast('Prompt 已複製，可以貼到 Gemini CLI、Codex 或 Claude Code。');
  }

  builder.addEventListener('click', (event) => {
    const choice = event.target.closest('[data-choice-group]');
    if (choice) {
      const group = choice.dataset.choiceGroup;
      const value = choice.dataset.choiceValue;
      const multi = choice.dataset.choiceMulti === 'true';
      if (multi) {
        if (draft.priorities.includes(value)) draft.priorities = draft.priorities.filter((item) => item !== value);
        else if (draft.priorities.length < 3) draft.priorities.push(value);
        else { showToast('第一版重點最多選三項。'); return; }
      } else {
        draft[group] = value;
      }
      saveDraft();
      renderStep();
      return;
    }

    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'back') return goToStep(draft.step - 1);
    if (action === 'next') {
      const error = validateStep();
      if (error) return showError(error);
      return goToStep(draft.step + 1);
    }
    if (action === 'generate') return openAuth();
    if (action === 'copy') return copyPrompt();
    if (action === 'edit') return goToStep(0);
    if (action === 'restart') {
      draft = emptyDraft();
      saveDraft();
      renderStep();
      return scrollToBuilder();
    }
  });

  document.querySelectorAll('[data-start]').forEach((button) => button.addEventListener('click', scrollToBuilder));
  document.querySelectorAll('[data-open-pricing]').forEach((button) => button.addEventListener('click', () => openPayment()));
  document.querySelectorAll('[data-plan]').forEach((button) => button.addEventListener('click', () => openPayment(button.dataset.plan)));
  document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
    dialog.addEventListener('close', () => {
      if (![...document.querySelectorAll('dialog')].some((item) => item.open)) document.body.classList.remove('modal-open');
    });
  });

  document.querySelector('#auth-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.querySelector('#auth-email').value.trim();
    if (!email) return;
    document.querySelector('#auth-email-display').textContent = email;
    document.querySelector('#auth-email-step').classList.add('hidden');
    document.querySelector('#auth-preview-step').classList.remove('hidden');
  });

  document.querySelector('#back-to-email').addEventListener('click', () => {
    document.querySelector('#auth-preview-step').classList.add('hidden');
    document.querySelector('#auth-email-step').classList.remove('hidden');
    document.querySelector('#auth-email').focus();
  });

  document.querySelector('#preview-auth-button').addEventListener('click', () => {
    if (pointsRemaining() <= 0) {
      closeDialog(authDialog);
      openPayment('今日的 2 點前端預覽額度已使用完畢');
      return;
    }
    usePoint();
    closeDialog(authDialog);
    renderResult();
  });

  const root = document.documentElement;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const initialMood = localStorage.getItem(MOOD_KEY) === 'dusk' ? 'dusk' : 'dream';
  root.dataset.mood = initialMood;
  themeMeta.content = initialMood === 'dusk' ? '#160b19' : '#fff8fc';
  document.querySelector('#theme-toggle').addEventListener('click', () => {
    const mood = root.dataset.mood === 'dusk' ? 'dream' : 'dusk';
    root.dataset.mood = mood;
    localStorage.setItem(MOOD_KEY, mood);
    themeMeta.content = mood === 'dusk' ? '#160b19' : '#fff8fc';
    document.querySelector('#theme-toggle').setAttribute('aria-label', mood === 'dusk' ? '切換淺色模式' : '切換深色模式');
  });

  window.addEventListener('pointermove', (event) => {
    root.style.setProperty('--mouse-x', `${event.clientX}px`);
    root.style.setProperty('--mouse-y', `${event.clientY}px`);
  }, { passive: true });

  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const percent = max > 0 ? (window.scrollY / max) * 100 : 0;
    document.querySelector('#scroll-progress').style.width = `${Math.min(100, percent)}%`;
  }, { passive: true });

  updatePoints();
  renderStep();
})();
