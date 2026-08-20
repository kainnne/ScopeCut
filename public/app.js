(() => {
  'use strict';

  const DRAFT_KEY = 'scopecut_public_draft_v1';
  const QUOTA_KEY = 'scopecut_preview_quota_v1';
  const MOOD_KEY = 'scopecut_mood';
  const SESSION_KEY = 'scopecut_session_v1';
  const API_BASE = document.querySelector('meta[name="scopecut-api-base"]')?.content.replace(/\/$/, '') || '';
  const DAILY_POINTS = 2;

  const labels = {
    purpose: {
      learn: '練習與學習',
      personal: '解決自己的問題',
      portfolio: '作品集或分享',
      validate: '測試產品想法',
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
      share: '可以分享',
      data: '能保存資料',
      simple: '越簡單越好',
    },
  };

  const stepNames = ['你的想法', '使用目的', '經驗與時間', '第一版重點', '確認'];
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

  function usePoint() {
    const current = quota();
    current.used += 1;
    try {
      localStorage.setItem(QUOTA_KEY, JSON.stringify(current));
    } catch {}
    updatePoints();
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

  function choice(group, value, title, selected, multi = false) {
    return `<button class="choice ${selected ? 'is-selected' : ''}" type="button" data-choice-group="${group}" data-choice-value="${value}" data-choice-multi="${multi}"><strong>${escapeHtml(title)}</strong></button>`;
  }

  function nav(back = true, nextText = '下一步', action = 'next') {
    return `<div class="step-nav">
      ${back ? '<button class="back-button" type="button" data-action="back">上一步</button>' : '<span></span>'}
      <button class="next-button" type="button" data-action="${action}">${nextText} →</button>
    </div>`;
  }

  function renderStep() {
    const current = Math.max(0, Math.min(4, draft.step));
    draft.step = current;
    stepLabel.textContent = `${current + 1} / 5`;
    stepName.textContent = stepNames[current];
    progress.style.width = `${(current + 1) * 20}%`;
    builder.classList.remove('result-view');

    if (current === 0) {
      builder.innerHTML = `
        <h2 class="step-title">你想做什麼？</h2>
        <textarea class="idea-textarea" id="idea-input" maxlength="600" aria-label="你的想法" placeholder="我想做一個⋯">${escapeHtml(draft.idea)}</textarea>
        <div class="field-meta" id="idea-count">${draft.idea.length} / 600</div>
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
        <h2 class="step-title">為什麼想做？</h2>
        <div class="choice-grid">
          ${choice('purpose', 'learn', '練習與學習', draft.purpose === 'learn')}
          ${choice('purpose', 'personal', '解決自己的問題', draft.purpose === 'personal')}
          ${choice('purpose', 'portfolio', '作品集或分享', draft.purpose === 'portfolio')}
          ${choice('purpose', 'validate', '測試產品想法', draft.purpose === 'validate')}
        </div>
        <div class="field-group"><input class="text-input" id="audience-input" maxlength="120" aria-label="誰會使用" placeholder="誰會使用？（選填）" value="${escapeHtml(draft.audience)}" /></div>
        <p class="field-error" id="step-error" role="alert"></p>
        ${nav()}
      `;
      const input = builder.querySelector('#audience-input');
      input.addEventListener('input', () => {
        draft.audience = input.value;
        saveDraft();
      });
      return;
    }

    if (current === 2) {
      builder.innerHTML = `
        <h2 class="step-title">你有多少經驗和時間？</h2>
        <div class="field-group">
          <span class="field-label">經驗</span>
          <div class="choice-grid three">
            ${choice('experience', 'first', '第一次做', draft.experience === 'first')}
            ${choice('experience', 'beginner', '做過一點', draft.experience === 'beginner')}
            ${choice('experience', 'assisted', '用過 AI Agent', draft.experience === 'assisted')}
          </div>
        </div>
        <div class="field-group">
          <span class="field-label">時間</span>
          <div class="choice-grid">
            ${choice('time', 'evening', '一個晚上', draft.time === 'evening')}
            ${choice('time', 'weekend', '一個週末', draft.time === 'weekend')}
            ${choice('time', 'week', '一週左右', draft.time === 'week')}
            ${choice('time', 'open', '先不限制', draft.time === 'open')}
          </div>
        </div>
        <p class="field-error" id="step-error" role="alert"></p>
        ${nav()}
      `;
      return;
    }

    if (current === 3) {
      builder.innerHTML = `
        <h2 class="step-title">第一版重視什麼？</h2>
        <div class="choice-grid">
          ${choice('priorities', 'usable', '先能操作', draft.priorities.includes('usable'), true)}
          ${choice('priorities', 'visual', '畫面好看', draft.priorities.includes('visual'), true)}
          ${choice('priorities', 'learn', '真的學到東西', draft.priorities.includes('learn'), true)}
          ${choice('priorities', 'share', '可以分享', draft.priorities.includes('share'), true)}
          ${choice('priorities', 'data', '能保存資料', draft.priorities.includes('data'), true)}
          ${choice('priorities', 'simple', '越簡單越好', draft.priorities.includes('simple'), true)}
        </div>
        <div class="field-group"><input class="text-input" id="constraints-input" maxlength="180" aria-label="其他要求" placeholder="其他要求（選填）" value="${escapeHtml(draft.constraints)}" /></div>
        <p class="field-error" id="step-error" role="alert"></p>
        ${nav()}
      `;
      const input = builder.querySelector('#constraints-input');
      input.addEventListener('input', () => {
        draft.constraints = input.value;
        saveDraft();
      });
      return;
    }

    const priorities = draft.priorities.map((value) => labels.priorities[value]).join('、');
    builder.innerHTML = `
      <h2 class="step-title">確認</h2>
      <div class="review-grid">
        <div class="review-item full"><span>想法</span><p>${escapeHtml(draft.idea)}</p></div>
        <div class="review-item"><span>目的</span><p>${escapeHtml(labels.purpose[draft.purpose])}</p></div>
        <div class="review-item"><span>時間</span><p>${escapeHtml(labels.time[draft.time])}</p></div>
        <div class="review-item"><span>經驗</span><p>${escapeHtml(labels.experience[draft.experience])}</p></div>
        <div class="review-item"><span>重點</span><p>${escapeHtml(priorities)}</p></div>
        ${draft.audience ? `<div class="review-item"><span>使用者</span><p>${escapeHtml(draft.audience)}</p></div>` : ''}
        ${draft.constraints ? `<div class="review-item"><span>其他</span><p>${escapeHtml(draft.constraints)}</p></div>` : ''}
      </div>
      ${nav(true, '以 1 點產生', 'generate')}
    `;
  }

  function validateStep() {
    if (draft.step === 0 && draft.idea.trim().length < 5) return '請再多寫一點。';
    if (draft.step === 1 && !draft.purpose) return '請選擇一項。';
    if (draft.step === 2 && (!draft.experience || !draft.time)) return '請完成兩項選擇。';
    if (draft.step === 3 && draft.priorities.length === 0) return '請至少選一項。';
    return '';
  }

  function showError(message) {
    const element = builder.querySelector('#step-error');
    if (element) element.textContent = message;
  }

  function goToStep(next) {
    draft.step = Math.max(0, Math.min(4, next));
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

  function classifyIdea(idea) {
    if (/學|課程|筆記|進度|練習|study|learn/i.test(idea)) return 'learning';
    if (/行政|表單|預約|管理|記錄|追蹤|清單|工具|排程/.test(idea)) return 'tool';
    if (/餐|食|旅|地圖|店|活動|推薦/.test(idea)) return 'guide';
    if (/音樂|作品|設計|照片|故事|創作|展示/.test(idea)) return 'creative';
    return 'general';
  }

  function createScopePack() {
    const packs = {
      learning: {
        title: '每日學習進度板',
        reason: '先把「想學會」變成每天能操作和看見累積的流程。',
        directions: ['每日學習進度板', '主題練習卡', '學習成果頁'],
        features: ['新增學習目標', '記錄每日進度', '顯示本週累積', '回顧最近紀錄'],
        learn: ['HTML / CSS', 'JavaScript', '瀏覽器儲存', 'GitHub Pages'],
      },
      tool: {
        title: '單一任務工具',
        reason: '先完成一次從輸入到結果的流程，確認它是否真的有用。',
        directions: ['單一任務工具', '簡易管理板', '紀錄摘要頁'],
        features: ['建立項目', '查看狀態', '編輯或完成', '保留資料'],
        learn: ['介面流程', 'JavaScript', '資料儲存', 'GitHub'],
      },
      guide: {
        title: '主題推薦清單',
        reason: '用最少功能驗證內容是否有用，也方便直接分享。',
        directions: ['主題推薦清單', '個人收藏地圖', '情境選擇器'],
        features: ['瀏覽分類', '查看項目', '搜尋篩選', '收藏內容'],
        learn: ['資訊架構', '響應式版面', 'JavaScript 篩選', '資料格式'],
      },
      creative: {
        title: '單一作品展示頁',
        reason: '先完整呈現一個作品，比先做整個平台更容易完成。',
        directions: ['單一作品頁', '互動式作品集', '主題收藏牆'],
        features: ['呈現主題', '展示內容', '補充背景', '提供分享連結'],
        learn: ['視覺層級', 'HTML / CSS', '素材最佳化', 'GitHub Pages'],
      },
      general: {
        title: '可操作的核心流程',
        reason: '先完成最小流程，再用實際結果決定下一步。',
        directions: ['核心流程版', '個人使用版', '可分享展示版'],
        features: ['開始主要任務', '完成必要輸入', '看見結果', '修改或重來'],
        learn: ['流程拆解', 'HTML / CSS', 'JavaScript', 'GitHub'],
      },
    };

    const pack = packs[classifyIdea(draft.idea)];
    const audience = draft.audience.trim() || '自己';
    const preference = draft.priorities.map((item) => labels.priorities[item]).join('、');
    const extras = draft.constraints.trim() ? `\n其他要求：${draft.constraints.trim()}。` : '';
    const features = pack.features.slice(0, draft.time === 'evening' ? 3 : 4);
    const prompt = [
      `請協助我做出「${pack.title}」的第一版。`,
      `原始想法：${draft.idea.trim()}`,
      `目的：${labels.purpose[draft.purpose]}；使用者：${audience}。`,
      '',
      '第一版：',
      ...features.map((item, index) => `${index + 1}. ${item}`),
      '',
      `偏好：${preference}。${extras}`,
      '完成標準：使用者能走完核心流程，並在手機與電腦上正常操作。',
      '請直接做出可操作的第一版；其他細節採用簡單合理的做法。',
    ].join('\n');

    return { ...pack, features, prompt };
  }

  function renderResult() {
    const pack = createScopePack();
    stepLabel.textContent = '完成';
    stepName.textContent = 'Scope Pack';
    progress.style.width = '100%';
    builder.classList.add('result-view');
    builder.innerHTML = `
      <h2 class="step-title">${escapeHtml(pack.title)}</h2>
      <section class="result-card">
        <span class="result-label">方向</span>
        <ul class="direction-list">${pack.directions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </section>
      <section class="result-card">
        <span class="result-label">第一版</span>
        <h3>${escapeHtml(pack.title)}</h3>
        <p>${escapeHtml(pack.reason)}</p>
        <ul class="result-list">${pack.features.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </section>
      <section class="result-card">
        <span class="result-label">可能會學到</span>
        <ul class="result-list">${pack.learn.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </section>
      <section class="result-prompt">
        <div><span class="result-label">Prompt</span><button class="copy-button" type="button" data-action="copy">複製</button></div>
        <pre id="generated-prompt">${escapeHtml(pack.prompt)}</pre>
      </section>
      <div class="result-actions">
        <a class="text-button" href="https://github.com/google-gemini/gemini-cli" target="_blank" rel="noreferrer">Gemini CLI ↗</a>
        <button class="text-button" type="button" data-action="edit">修改</button>
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
    showToast('已複製');
  }

  builder.addEventListener('click', (event) => {
    const option = event.target.closest('[data-choice-group]');
    if (option) {
      const group = option.dataset.choiceGroup;
      const value = option.dataset.choiceValue;
      if (option.dataset.choiceMulti === 'true') {
        if (draft.priorities.includes(value)) draft.priorities = draft.priorities.filter((item) => item !== value);
        else if (draft.priorities.length < 3) draft.priorities.push(value);
        else return showToast('最多三項');
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
    [...form.elements].forEach((element) => { element.disabled = busy; });
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
