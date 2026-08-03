/* 收斂一下 ScopeCut — 前端 */
(() => {
  const TOKEN_KEY = 'scopecut_token';
  const CONFIG_KEY = 'scopecut_last_config';

  const $ = (sel) => document.querySelector(sel);
  const loginView = $('#login-view');
  const appView = $('#app-view');
  const optionRoot = $('#option-groups');

  let groups = [];
  /** { groupId: { values: [], custom: '' } } */
  let selections = {};

  const token = () => localStorage.getItem(TOKEN_KEY) || '';
  const authHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

  // ---------- 檢視切換 ----------
  function showLogin() {
    loginView.classList.remove('hidden');
    appView.classList.add('hidden');
  }
  function showApp() {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
  }

  // ---------- 登入 ----------
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('#login-error');
    errEl.classList.add('hidden');
    $('#login-btn').disabled = true;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: $('#login-user').value.trim(),
          password: $('#login-pass').value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '登入失敗');
      localStorage.setItem(TOKEN_KEY, data.token);
      await enterApp();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    } finally {
      $('#login-btn').disabled = false;
    }
  });

  $('#logout-btn').addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', headers: authHeaders() });
    } catch { /* 忽略 */ }
    localStorage.removeItem(TOKEN_KEY);
    showLogin();
  });

  // ---------- 選項渲染 ----------
  function renderGroups() {
    optionRoot.innerHTML = '';
    for (const group of groups) {
      const sel = selections[group.id];
      const card = document.createElement('div');
      card.className = 'card group-card';

      const h = document.createElement('h3');
      h.textContent = group.label;
      if (group.type === 'multi' && group.maxSelect) {
        const hint = document.createElement('span');
        hint.className = 'group-hint';
        hint.textContent = `最多 ${group.maxSelect} 個`;
        h.appendChild(hint);
      }
      card.appendChild(h);

      const chips = document.createElement('div');
      chips.className = 'chips';

      for (const opt of group.options) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = opt.label;
        chip.dataset.value = opt.id;
        if (sel.values.includes(opt.id)) chip.classList.add('selected');
        chip.addEventListener('click', () => toggleOption(group, opt.id, card));
        chips.appendChild(chip);
      }

      let customInput = null;
      if (group.allowCustom) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip chip-custom';
        chip.textContent = '自訂…';
        if (sel.customOpen) chip.classList.add('selected');
        chip.addEventListener('click', () => {
          sel.customOpen = !sel.customOpen;
          chip.classList.toggle('selected', sel.customOpen);
          customInput.classList.toggle('hidden', !sel.customOpen);
          if (!sel.customOpen) {
            sel.custom = '';
            customInput.querySelector('input').value = '';
          } else {
            customInput.querySelector('input').focus();
          }
          saveConfig();
        });
        chips.appendChild(chip);

        customInput = document.createElement('div');
        customInput.className = `custom-input${sel.customOpen ? '' : ' hidden'}`;
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = group.customPlaceholder || '自訂內容';
        input.value = sel.custom || '';
        input.maxLength = 200;
        input.addEventListener('input', () => {
          sel.custom = input.value;
          saveConfig();
        });
        customInput.appendChild(input);
      }

      card.appendChild(chips);

      const hintEl = document.createElement('p');
      hintEl.className = 'chip-hint';
      card.appendChild(hintEl);
      updateHint(group, hintEl);

      if (customInput) card.appendChild(customInput);
      optionRoot.appendChild(card);
    }
  }

  function updateHint(group, hintEl) {
    const sel = selections[group.id];
    const hints = sel.values
      .map((v) => group.options.find((o) => o.id === v))
      .filter((o) => o && o.hint)
      .map((o) => `${o.label}:${o.hint}`);
    hintEl.textContent = hints.join(' / ');
  }

  function toggleOption(group, optId, card) {
    const sel = selections[group.id];
    if (group.type === 'single') {
      sel.values = sel.values.includes(optId) ? [] : [optId];
    } else {
      if (sel.values.includes(optId)) {
        sel.values = sel.values.filter((v) => v !== optId);
      } else {
        sel.values.push(optId);
        if (group.maxSelect && sel.values.length > group.maxSelect) {
          sel.values = sel.values.slice(-group.maxSelect);
        }
      }
    }
    for (const chip of card.querySelectorAll('.chip[data-value]')) {
      chip.classList.toggle('selected', sel.values.includes(chip.dataset.value));
    }
    updateHint(group, card.querySelector('.chip-hint'));
    saveConfig();
  }

  // ---------- 設定保存 ----------
  function saveConfig() {
    const config = {
      idea: $('#idea').value,
      extraNotes: $('#extra-notes').value,
      selections,
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }

  function loadConfig() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null');
    } catch {
      return null;
    }
  }

  // ---------- 產生流程 ----------
  const generateBtn = $('#generate-btn');
  const progressCard = $('#progress-card');
  const progressList = $('#progress-list');
  const elapsedEl = $('#elapsed');
  const resultCard = $('#result-card');
  const errorCard = $('#error-card');

  function addProgress(message) {
    const li = document.createElement('li');
    li.textContent = message;
    progressList.appendChild(li);
  }

  function fmtElapsed(ms) {
    const s = Math.round(ms / 1000);
    return s >= 60 ? `${Math.floor(s / 60)} 分 ${s % 60} 秒` : `${s} 秒`;
  }

  generateBtn.addEventListener('click', async () => {
    const idea = $('#idea').value.trim();
    if (!idea) {
      showError('請先輸入你這次的主要任務(原始想法)。');
      return;
    }

    saveConfig();
    generateBtn.disabled = true;
    generateBtn.textContent = '執行中…請不要關閉頁面';
    progressList.innerHTML = '';
    elapsedEl.textContent = '';
    progressCard.classList.remove('hidden');
    resultCard.classList.add('hidden');
    errorCard.classList.add('hidden');
    addProgress('已送出,正在組裝任務合約需求…');

    try {
      const payload = {
        idea,
        extraNotes: $('#extra-notes').value.trim(),
        selections: Object.fromEntries(
          Object.entries(selections).map(([k, v]) => [k, { values: v.values, custom: (v.custom || '').trim() }]),
        ),
      };
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        throw new Error(data.error || `伺服器錯誤(${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finished = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          let ev;
          try { ev = JSON.parse(line); } catch { continue; }
          if (ev.type === 'status') addProgress(ev.message);
          else if (ev.type === 'tick') elapsedEl.textContent = `已經過 ${fmtElapsed(ev.elapsedMs)}(Codex 深度規劃通常需要 1–5 分鐘)`;
          else if (ev.type === 'done') { finished = true; showResult(ev); }
          else if (ev.type === 'error') { finished = true; throw new Error(ev.error); }
        }
      }
      if (!finished) throw new Error('連線中斷,請確認伺服器仍在執行後重試');
    } catch (err) {
      showError(err.message);
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = '幫我組成完整任務並存進 WikiNB';
      progressCard.classList.add('hidden');
    }
  });

  function showResult(ev) {
    const dl = $('#result-detail');
    const rows = [
      ['文件標題', ev.title || '(未提供)'],
      ['本機位置', `<code>${escapeHtml(ev.localPath)}</code>`],
      ['WikiNB 推送', ev.pushed
        ? `已 commit(<code>${escapeHtml(ev.commit)}</code>)並推送至 GitHub,Pages 約 2–5 分鐘後更新`
        : '未推送(SCOPECUT_GIT_PUSH=false)'],
      ['上線網址', `<a href="${escapeHtml(ev.pageUrl)}" target="_blank" rel="noopener">${escapeHtml(ev.pageUrl)}</a>`],
      ['耗時', `${fmtElapsed(ev.totalElapsedMs)}(Codex:${fmtElapsed(ev.codexElapsedMs)},模型 ${escapeHtml(ev.model || '')})`],
    ];
    dl.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showError(message) {
    $('#error-message').textContent = message;
    errorCard.classList.remove('hidden');
    errorCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  $('#error-dismiss').addEventListener('click', () => errorCard.classList.add('hidden'));

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  $('#idea').addEventListener('input', saveConfig);
  $('#extra-notes').addEventListener('input', saveConfig);

  // ---------- 啟動 ----------
  async function enterApp() {
    const res = await fetch('/api/options', { headers: authHeaders() });
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      showLogin();
      return;
    }
    const data = await res.json();
    groups = data.groups;

    const saved = loadConfig();
    selections = {};
    for (const group of groups) {
      const savedSel = saved?.selections?.[group.id];
      const defaults = Array.isArray(group.default) ? group.default : group.default ? [group.default] : [];
      selections[group.id] = {
        values: Array.isArray(savedSel?.values) ? savedSel.values.filter((v) => group.options.some((o) => o.id === v)) : defaults,
        custom: savedSel?.custom || '',
        customOpen: Boolean(savedSel?.custom),
      };
      if (selections[group.id].values.length === 0 && !selections[group.id].custom) {
        selections[group.id].values = defaults;
      }
    }
    if (saved?.idea) $('#idea').value = saved.idea;
    if (saved?.extraNotes) $('#extra-notes').value = saved.extraNotes;

    renderGroups();
    showApp();
  }

  (async () => {
    if (!token()) {
      showLogin();
      return;
    }
    try {
      const res = await fetch('/api/auth/me', { headers: authHeaders() });
      if (res.ok) await enterApp();
      else {
        localStorage.removeItem(TOKEN_KEY);
        showLogin();
      }
    } catch {
      showLogin();
    }
  })();
})();
