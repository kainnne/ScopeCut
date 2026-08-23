(() => {
  'use strict';

  const DRAFT_KEY = 'scopecut_public_draft_v2';
  const LEGACY_DRAFT_KEY = 'scopecut_public_draft_v1';
  const QUOTA_KEY = 'scopecut_preview_quota_v1';
  const MOOD_KEY = 'scopecut_mood';
  const SESSION_KEY = 'scopecut_session_v1';
  const API_BASE = document.querySelector('meta[name="scopecut-api-base"]')?.content.replace(/\/$/, '') || '';
  const DAILY_POINTS = 2;

  const copy = {
    stepNames: [
      'Project 概念',
      '目標與成果',
      '使用者與情境',
      '交付形式',
      '核心內容',
      '體驗與風格',
      '素材與參考',
      '執行條件',
      '確認',
    ],
    purpose: {
      learn: '透過製作學習新能力',
      personal: '解決真實存在的問題',
      portfolio: '完成可公開展示的作品',
      validate: '驗證產品或服務概念',
      research: '整理內容或研究成果',
    },
    format: {
      website: '網站',
      tool: '互動工具',
      application: '應用程式',
      automation: '自動化流程',
      content: '內容或企劃',
      undecided: '由 ScopeCut 建議',
    },
    priorities: {
      function: '核心功能完整',
      content: '內容清楚',
      visual: '視覺有辨識度',
      interaction: '互動體驗',
      data: '資料保存與管理',
      sharing: '方便公開與分享',
    },
    styles: {
      professional: '專業可信',
      minimal: '簡潔明確',
      warm: '自然親切',
      playful: '活潑有趣',
      experimental: '實驗性',
      bold: '強烈鮮明',
    },
  };

  const totalSteps = copy.stepNames.length;
  const emptyDraft = () => ({
    projectName: '',
    idea: '',
    purpose: '',
    objective: '',
    audience: '',
    scenario: '',
    format: '',
    formatOther: '',
    core: '',
    priorities: [],
    styles: [],
    styleNotes: '',
    materials: '',
    references: '',
    technicalPreferences: '',
    constraints: '',
    exclusions: '',
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
  let remotePoints = null;
  let pendingEmail = '';
  let toastTimer;

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function readStoredDraft(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value && typeof value === 'object' ? value : null;
    } catch {
      return null;
    }
  }

  function loadDraft() {
    const stored = readStoredDraft(DRAFT_KEY);
    if (stored) {
      return {
        ...emptyDraft(),
        ...stored,
        priorities: Array.isArray(stored.priorities) ? stored.priorities.slice(0, 4) : [],
        styles: Array.isArray(stored.styles) ? stored.styles.slice(0, 3) : [],
        step: Math.max(0, Math.min(totalSteps - 1, Number(stored.step) || 0)),
      };
    }

    const legacy = readStoredDraft(LEGACY_DRAFT_KEY);
    if (!legacy) return emptyDraft();
    return {
      ...emptyDraft(),
      idea: String(legacy.idea || ''),
      purpose: copy.purpose[legacy.purpose] ? legacy.purpose : '',
      audience: String(legacy.audience || ''),
      constraints: String(legacy.constraints || ''),
      step: 0,
    };
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }

  function todayKey() {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }

  function quota() {
    try {
      const stored = JSON.parse(localStorage.getItem(QUOTA_KEY) || 'null');
      if (stored?.date === todayKey()) return { date: stored.date, used: Math.max(0, Number(stored.used) || 0) };
    } catch {}
    return { date: todayKey(), used: 0 };
  }

  function pointsRemaining() {
    if (remotePoints !== null) return Math.max(0, remotePoints);
    return Math.max(0, DAILY_POINTS - quota().used);
  }

  function updatePoints() {
    pointsElement.textContent = String(pointsRemaining());
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  function choice(group, value, title, selected, multi = false, limit = 1) {
    return `<button class="choice ${selected ? 'is-selected' : ''}" type="button" data-choice-group="${group}" data-choice-value="${value}" data-choice-multi="${multi}" data-choice-limit="${limit}"><strong>${escapeHtml(title)}</strong></button>`;
  }

  function nav(back = true, nextText = '下一步', action = 'next') {
    return `<div class="step-nav">
      ${back ? '<button class="back-button" type="button" data-action="back">上一步</button>' : '<span></span>'}
      <button class="next-button" type="button" data-action="${action}">${nextText} →</button>
    </div>`;
  }

  function bindInput(selector, key, countSelector = '') {
    const input = builder.querySelector(selector);
    if (!input) return;
    input.addEventListener('input', () => {
      draft[key] = input.value;
      if (countSelector) {
        const count = builder.querySelector(countSelector);
        if (count) count.textContent = `${input.value.length} / ${input.maxLength}`;
      }
      saveDraft();
    });
  }

  function renderStep() {
    const current = Math.max(0, Math.min(totalSteps - 1, draft.step));
    draft.step = current;
    stepLabel.textContent = `${current + 1} / ${totalSteps}`;
    stepName.textContent = copy.stepNames[current];
    progress.style.width = `${((current + 1) / totalSteps) * 100}%`;
    builder.classList.remove('result-view');

    if (current === 0) {
      builder.innerHTML = `
        <h2 class="step-title">請描述你想完成的 Project</h2>
        <div class="field-group">
          <label class="field-label" for="project-name">Project 名稱（選填）</label>
          <input class="text-input" id="project-name" maxlength="80" placeholder="目前使用的名稱即可" value="${escapeHtml(draft.projectName)}" />
        </div>
        <div class="field-group">
          <label class="field-label" for="idea-input">Project 概念</label>
          <textarea class="idea-textarea" id="idea-input" maxlength="1200" placeholder="描述主題、動機、目前的構想，以及你認為重要的背景。">${escapeHtml(draft.idea)}</textarea>
          <div class="field-meta" id="idea-count">${draft.idea.length} / 1200</div>
        </div>
        <p class="field-error" id="step-error" role="alert"></p>
        ${nav(false)}
      `;
      bindInput('#project-name', 'projectName');
      bindInput('#idea-input', 'idea', '#idea-count');
      return;
    }

    if (current === 1) {
      builder.innerHTML = `
        <h2 class="step-title">這個 Project 要達成什麼？</h2>
        <div class="choice-grid">
          ${Object.entries(copy.purpose).map(([value, title]) => choice('purpose', value, title, draft.purpose === value)).join('')}
        </div>
        <div class="field-group">
          <label class="field-label" for="objective-input">預期成果</label>
          <textarea class="compact-textarea" id="objective-input" maxlength="700" placeholder="具體描述完成後應該產生的結果，以及你會如何判斷它有價值。">${escapeHtml(draft.objective)}</textarea>
        </div>
        <p class="field-error" id="step-error" role="alert"></p>
        ${nav()}
      `;
      bindInput('#objective-input', 'objective');
      return;
    }

    if (current === 2) {
      builder.innerHTML = `
        <h2 class="step-title">誰會使用？在什麼情境下？</h2>
        <div class="field-group">
          <label class="field-label" for="audience-input">目標使用者</label>
          <input class="text-input" id="audience-input" maxlength="240" placeholder="例如：我自己、剛開始使用 AI Agent 的創作者、社團成員" value="${escapeHtml(draft.audience)}" />
        </div>
        <div class="field-group">
          <label class="field-label" for="scenario-input">使用情境</label>
          <textarea class="compact-textarea" id="scenario-input" maxlength="700" placeholder="描述他會在什麼情況下打開它、完成什麼事，以及希望得到什麼結果。">${escapeHtml(draft.scenario)}</textarea>
        </div>
        <p class="field-error" id="step-error" role="alert"></p>
        ${nav()}
      `;
      bindInput('#audience-input', 'audience');
      bindInput('#scenario-input', 'scenario');
      return;
    }

    if (current === 3) {
      builder.innerHTML = `
        <h2 class="step-title">第一版應該以什麼形式呈現？</h2>
        <div class="choice-grid three">
          ${Object.entries(copy.format).map(([value, title]) => choice('format', value, title, draft.format === value)).join('')}
        </div>
        <div class="field-group">
          <label class="field-label" for="format-other-input">指定平台或其他形式（選填）</label>
          <input class="text-input" id="format-other-input" maxlength="240" placeholder="例如：手機優先的網頁、Discord Bot、可下載的文件" value="${escapeHtml(draft.formatOther)}" />
        </div>
        <p class="field-error" id="step-error" role="alert"></p>
        ${nav()}
      `;
      bindInput('#format-other-input', 'formatOther');
      return;
    }

    if (current === 4) {
      builder.innerHTML = `
        <h2 class="step-title">第一版必須包含什麼？</h2>
        <div class="choice-grid three">
          ${Object.entries(copy.priorities).map(([value, title]) => choice('priorities', value, title, draft.priorities.includes(value), true, 4)).join('')}
        </div>
        <div class="field-meta selection-limit">最多選四項</div>
        <div class="field-group">
          <label class="field-label" for="core-input">核心內容或功能</label>
          <textarea class="idea-textarea medium" id="core-input" maxlength="1000" placeholder="列出你已經想到的內容、功能、流程或必要頁面；不需要使用技術語言。">${escapeHtml(draft.core)}</textarea>
        </div>
        <p class="field-error" id="step-error" role="alert"></p>
        ${nav()}
      `;
      bindInput('#core-input', 'core');
      return;
    }

    if (current === 5) {
      builder.innerHTML = `
        <h2 class="step-title">你希望它呈現什麼樣的體驗？</h2>
        <div class="choice-grid three">
          ${Object.entries(copy.styles).map(([value, title]) => choice('styles', value, title, draft.styles.includes(value), true, 3)).join('')}
        </div>
        <div class="field-meta selection-limit">最多選三項</div>
        <div class="field-group">
          <label class="field-label" for="style-notes-input">風格補充（選填）</label>
          <textarea class="compact-textarea" id="style-notes-input" maxlength="600" placeholder="描述語氣、色彩、操作感受，或任何你不希望出現的視覺印象。">${escapeHtml(draft.styleNotes)}</textarea>
        </div>
        <p class="field-error" id="step-error" role="alert"></p>
        ${nav()}
      `;
      bindInput('#style-notes-input', 'styleNotes');
      return;
    }

    if (current === 6) {
      builder.innerHTML = `
        <h2 class="step-title">你已經有哪些素材與參考？</h2>
        <div class="field-group">
          <label class="field-label" for="materials-input">現有素材（選填）</label>
          <textarea class="compact-textarea" id="materials-input" maxlength="800" placeholder="可使用的文字、圖片、資料、品牌素材、檔案或既有內容。">${escapeHtml(draft.materials)}</textarea>
        </div>
        <div class="field-group">
          <label class="field-label" for="references-input">參考方向（選填）</label>
          <textarea class="compact-textarea" id="references-input" maxlength="600" placeholder="可以填入網站、產品、作品名稱或連結，並說明你想參考的部分。">${escapeHtml(draft.references)}</textarea>
        </div>
        <p class="field-error" id="step-error" role="alert"></p>
        ${nav()}
      `;
      bindInput('#materials-input', 'materials');
      bindInput('#references-input', 'references');
      return;
    }

    if (current === 7) {
      builder.innerHTML = `
        <h2 class="step-title">有哪些執行條件需要保留？</h2>
        <div class="field-group">
          <label class="field-label" for="technical-input">指定工具或平台（選填）</label>
          <input class="text-input" id="technical-input" maxlength="300" placeholder="如果沒有指定，ScopeCut 會依 Project 選擇合適方案" value="${escapeHtml(draft.technicalPreferences)}" />
        </div>
        <div class="field-group two-fields">
          <div>
            <label class="field-label" for="constraints-input">必須遵守</label>
            <textarea class="compact-textarea" id="constraints-input" maxlength="600" placeholder="品牌規範、資料來源、裝置需求或其他必要條件。">${escapeHtml(draft.constraints)}</textarea>
          </div>
          <div>
            <label class="field-label" for="exclusions-input">不要加入</label>
            <textarea class="compact-textarea" id="exclusions-input" maxlength="600" placeholder="不需要的功能、風格、內容或複雜度。">${escapeHtml(draft.exclusions)}</textarea>
          </div>
        </div>
        <p class="field-error" id="step-error" role="alert"></p>
        ${nav()}
      `;
      bindInput('#technical-input', 'technicalPreferences');
      bindInput('#constraints-input', 'constraints');
      bindInput('#exclusions-input', 'exclusions');
      return;
    }

    const priorities = draft.priorities.map((value) => copy.priorities[value]).join('、');
    const styles = draft.styles.map((value) => copy.styles[value]).join('、');
    const format = [copy.format[draft.format], draft.formatOther].filter(Boolean).join('／');
    builder.innerHTML = `
      <h2 class="step-title">確認 Project Brief</h2>
      <div class="review-grid">
        ${draft.projectName ? `<div class="review-item"><span>Project</span><p>${escapeHtml(draft.projectName)}</p></div>` : ''}
        <div class="review-item"><span>主要目的</span><p>${escapeHtml(copy.purpose[draft.purpose])}</p></div>
        <div class="review-item full"><span>Project 概念</span><p>${escapeHtml(draft.idea)}</p></div>
        <div class="review-item full"><span>預期成果</span><p>${escapeHtml(draft.objective)}</p></div>
        <div class="review-item"><span>目標使用者</span><p>${escapeHtml(draft.audience)}</p></div>
        <div class="review-item"><span>交付形式</span><p>${escapeHtml(format)}</p></div>
        <div class="review-item full"><span>使用情境</span><p>${escapeHtml(draft.scenario)}</p></div>
        <div class="review-item full"><span>核心內容或功能</span><p>${escapeHtml(draft.core)}</p></div>
        <div class="review-item"><span>優先重點</span><p>${escapeHtml(priorities)}</p></div>
        <div class="review-item"><span>體驗與風格</span><p>${escapeHtml(styles)}</p></div>
        ${draft.styleNotes ? `<div class="review-item full"><span>風格補充</span><p>${escapeHtml(draft.styleNotes)}</p></div>` : ''}
        ${draft.materials ? `<div class="review-item full"><span>現有素材</span><p>${escapeHtml(draft.materials)}</p></div>` : ''}
        ${draft.references ? `<div class="review-item full"><span>參考方向</span><p>${escapeHtml(draft.references)}</p></div>` : ''}
        ${draft.technicalPreferences ? `<div class="review-item full"><span>指定工具或平台</span><p>${escapeHtml(draft.technicalPreferences)}</p></div>` : ''}
        ${draft.constraints ? `<div class="review-item full"><span>必須遵守</span><p>${escapeHtml(draft.constraints)}</p></div>` : ''}
        ${draft.exclusions ? `<div class="review-item full"><span>不要加入</span><p>${escapeHtml(draft.exclusions)}</p></div>` : ''}
      </div>
      ${nav(true, '登入並產生 · 1 點', 'generate')}
    `;
  }

  function validateStep() {
    if (draft.step === 0 && draft.idea.trim().length < 10) return '請補充 Project 的主題、動機或目前構想。';
    if (draft.step === 1 && !draft.purpose) return '請選擇這個 Project 的主要目的。';
    if (draft.step === 1 && draft.objective.trim().length < 10) return '請具體描述希望完成的成果。';
    if (draft.step === 2 && draft.audience.trim().length < 2) return '請說明這個 Project 的目標使用者。';
    if (draft.step === 2 && draft.scenario.trim().length < 5) return '請補充主要使用情境。';
    if (draft.step === 3 && !draft.format) return '請選擇第一版的主要交付形式。';
    if (draft.step === 4 && draft.priorities.length === 0) return '請至少選擇一項第一版重點。';
    if (draft.step === 4 && draft.core.trim().length < 10) return '請描述第一版必須包含的內容或功能。';
    if (draft.step === 5 && draft.styles.length === 0) return '請至少選擇一項體驗或風格。';
    return '';
  }

  function showError(message) {
    const element = builder.querySelector('#step-error');
    if (element) element.textContent = message;
  }

  function goToStep(next) {
    draft.step = Math.max(0, Math.min(totalSteps - 1, next));
    saveDraft();
    renderStep();
    document.querySelector('#builder-shell').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function scrollToBuilder() {
    document.querySelector('#builder').scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => builder.querySelector('textarea, input, button')?.focus({ preventScroll: true }), 600);
  }

  function openPayment() {
    paymentDialog.showModal();
    document.body.classList.add('modal-open');
  }

  function openAuth() {
    if (!API_BASE && pointsRemaining() <= 0) {
      openPayment();
      return;
    }
    document.querySelector('#auth-email-step').classList.remove('hidden');
    document.querySelector('#auth-code-step').classList.add('hidden');
    document.querySelector('#auth-status').textContent = '';
    authDialog.showModal();
    document.body.classList.add('modal-open');
    window.setTimeout(() => document.querySelector('#auth-email').focus(), 80);
  }

  function closeDialog(dialog) {
    if (dialog?.open) dialog.close();
    if (![...document.querySelectorAll('dialog')].some((item) => item.open)) document.body.classList.remove('modal-open');
  }

  function createProjectPrompt() {
    const projectName = draft.projectName.trim() || '未命名 AI Project';
    const format = [copy.format[draft.format], draft.formatOther.trim()].filter(Boolean).join('／');
    const priorities = draft.priorities.map((value) => copy.priorities[value]).join('、');
    const styles = draft.styles.map((value) => copy.styles[value]).join('、');
    const sections = [
      ['Project 名稱', projectName],
      ['Project 概念', draft.idea.trim()],
      ['主要目的', `${copy.purpose[draft.purpose]}。\n${draft.objective.trim()}`],
      ['目標使用者與情境', `${draft.audience.trim()}。\n${draft.scenario.trim()}`],
      ['第一版形式', format],
      ['第一版必須包含', draft.core.trim()],
      ['優先重點', priorities],
      ['體驗與風格', [styles, draft.styleNotes.trim()].filter(Boolean).join('。')],
      ['現有素材', draft.materials.trim()],
      ['參考方向', draft.references.trim()],
      ['指定工具或平台', draft.technicalPreferences.trim()],
      ['必須遵守', draft.constraints.trim()],
      ['不要加入', draft.exclusions.trim()],
    ].filter(([, value]) => value);

    const prompt = [
      '請根據以下 Project Brief，提出最適合的第一版方向，整理成可直接執行的 Project 規格，並開始完成第一版。',
      '',
      ...sections.flatMap(([title, value]) => [`## ${title}`, value, '']),
    ].join('\n').trim();

    return { projectName, format, priorities, styles, prompt };
  }

  function renderResult() {
    const result = createProjectPrompt();
    stepLabel.textContent = '完成';
    stepName.textContent = 'Project Prompt';
    progress.style.width = '100%';
    builder.classList.add('result-view');
    builder.innerHTML = `
      <h2 class="step-title">${escapeHtml(result.projectName)}</h2>
      <section class="result-card">
        <span class="result-label">Project Brief</span>
        <p>${escapeHtml(draft.idea)}</p>
        <ul class="result-list">
          <li>${escapeHtml(copy.purpose[draft.purpose])}</li>
          <li>${escapeHtml(result.format)}</li>
          <li>${escapeHtml(draft.audience)}</li>
        </ul>
      </section>
      <section class="result-card">
        <span class="result-label">第一版重點</span>
        <p>${escapeHtml(draft.core)}</p>
        <ul class="result-list">
          ${draft.priorities.map((value) => `<li>${escapeHtml(copy.priorities[value])}</li>`).join('')}
          ${draft.styles.map((value) => `<li>${escapeHtml(copy.styles[value])}</li>`).join('')}
        </ul>
      </section>
      <section class="result-prompt">
        <div><span class="result-label">給 AI Agent 的 Project Prompt</span><button class="copy-button" type="button" data-action="copy">複製</button></div>
        <pre id="generated-prompt">${escapeHtml(result.prompt)}</pre>
      </section>
      <div class="result-actions">
        <a class="text-button" href="https://github.com/google-gemini/gemini-cli" target="_blank" rel="noreferrer">使用 Gemini CLI ↗</a>
        <button class="text-button" type="button" data-action="edit">修改 Project</button>
        <button class="text-button" type="button" data-action="restart">重新開始</button>
      </div>
    `;
    document.querySelector('#builder-shell').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function copyPrompt() {
    const text = builder.querySelector('#generated-prompt')?.textContent || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const input = document.createElement('textarea');
      input.value = text;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    showToast('已複製 Project Prompt');
  }

  builder.addEventListener('click', (event) => {
    const option = event.target.closest('[data-choice-group]');
    if (option) {
      const group = option.dataset.choiceGroup;
      const value = option.dataset.choiceValue;
      if (option.dataset.choiceMulti === 'true') {
        const limit = Math.max(1, Number(option.dataset.choiceLimit) || 1);
        if (draft[group].includes(value)) draft[group] = draft[group].filter((item) => item !== value);
        else if (draft[group].length < limit) draft[group].push(value);
        else return showToast(`最多選${limit === 3 ? '三' : '四'}項`);
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
  document.querySelectorAll('[data-open-pricing]').forEach((button) => button.addEventListener('click', openPayment));
  document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));

  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
    dialog.addEventListener('close', () => {
      if (![...document.querySelectorAll('dialog')].some((item) => item.open)) document.body.classList.remove('modal-open');
    });
  });

  async function apiRequest(path, options = {}) {
    if (!API_BASE) throw new Error('驗證服務尚未上線');
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || '服務暫時無法使用');
    return body;
  }

  function setFormBusy(form, busy) {
    [...form.elements].forEach((element) => {
      element.disabled = busy;
    });
  }

  document.querySelector('#auth-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.querySelector('#auth-email').value.trim();
    if (!email) return;
    const form = event.currentTarget;
    setFormBusy(form, true);
    try {
      await apiRequest('/api/auth/send-code', { method: 'POST', body: JSON.stringify({ email }) });
      pendingEmail = email;
      document.querySelector('#auth-email-display').textContent = email;
      document.querySelector('#auth-email-step').classList.add('hidden');
      document.querySelector('#auth-code-step').classList.remove('hidden');
      document.querySelector('#auth-status').textContent = '驗證碼已寄出';
      document.querySelector('#auth-code').focus();
    } catch (error) {
      showToast(error.message);
    } finally {
      setFormBusy(form, false);
    }
  });

  document.querySelector('#back-to-email').addEventListener('click', () => {
    document.querySelector('#auth-code-step').classList.add('hidden');
    document.querySelector('#auth-email-step').classList.remove('hidden');
    document.querySelector('#auth-email').focus();
  });

  document.querySelector('#auth-code-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = document.querySelector('#auth-code').value.trim();
    if (!/^\d{6}$/.test(code) || !pendingEmail) return;
    const form = event.currentTarget;
    setFormBusy(form, true);
    try {
      const verified = await apiRequest('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ email: pendingEmail, code }),
      });
      sessionStorage.setItem(SESSION_KEY, verified.token);
      remotePoints = Number(verified.points);
      updatePoints();
      const usage = await apiRequest('/api/usage/consume', {
        method: 'POST',
        headers: { Authorization: `Bearer ${verified.token}` },
      });
      remotePoints = Number(usage.points);
      updatePoints();
      closeDialog(authDialog);
      renderResult();
    } catch (error) {
      document.querySelector('#auth-status').textContent = error.message;
    } finally {
      setFormBusy(form, false);
    }
  });

  const root = document.documentElement;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const initialMood = localStorage.getItem(MOOD_KEY) === 'dusk' ? 'dusk' : 'dream';
  root.dataset.mood = initialMood;
  themeMeta.content = initialMood === 'dusk' ? '#160b19' : '#fff8fc';

  document.querySelector('#theme-toggle').addEventListener('click', () => {
    const mood = root.dataset.mood === 'dusk' ? 'dream' : 'dusk';
    root.dataset.mood = mood;
    try {
      localStorage.setItem(MOOD_KEY, mood);
    } catch {}
    themeMeta.content = mood === 'dusk' ? '#160b19' : '#fff8fc';
    document.querySelector('#theme-toggle').setAttribute('aria-label', mood === 'dusk' ? '切換淺色模式' : '切換深色模式');
  });

  updatePoints();
  renderStep();
})();
