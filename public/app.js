/* ScopeCut — 粉色分步精靈 + OTP 登入 */
(() => {
  const TOKEN_KEY = 'scopecut_token';
  const CONFIG_KEY = 'scopecut_last_config';

  /** GitHub Pages 靜態站呼叫本機 Bridge */
  const API_BASE =
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? ''
      : 'http://localhost:8788';

  const $ = (sel) => document.querySelector(sel);
  const loginView = $('#login-view');
  const appView = $('#app-view');
  const panel = $('#wizard-panel');

  let groups = [];
  /** { groupId: { values: [], custom: '', customOpen: bool } } */
  let selections = {};
  let idea = '';
  let extraNotes = '';
  /** wizard step index into STEPS */
  let stepIndex = 0;
  let STEPS = [];

  const token = () => localStorage.getItem(TOKEN_KEY) || '';
  const authHeaders = () => ({
    Authorization: `Bearer ${token()}`,
    'Content-Type': 'application/json',
  });

  async function api(path, opts = {}) {
    const res = await fetch(`${API_BASE}${path}`, opts);
    return res;
  }

  function showLogin() {
    loginView.classList.remove('hidden');
    appView.classList.add('hidden');
    $('#step-credentials').classList.remove('hidden');
    $('#step-verify').classList.add('hidden');
  }
  function showApp() {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
  }

  // ---------- OTP 登入 ----------
  async function sendCode() {
    const errEl = $('#login-error');
    errEl.classList.add('hidden');
    $('#login-btn').disabled = true;
    try {
      const res = await api('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: $('#login-user').value.trim(),
          password: $('#login-pass').value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '寄送失敗');
      $('#verify-hint').textContent = data.message || '驗證碼已寄出';
      $('#step-credentials').classList.add('hidden');
      $('#step-verify').classList.remove('hidden');
      $('#login-code').value = '';
      $('#login-code').focus();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    } finally {
      $('#login-btn').disabled = false;
    }
  }

  $('#login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    sendCode();
  });

  $('#resend-btn').addEventListener('click', () => sendCode());

  $('#back-credentials').addEventListener('click', () => {
    $('#step-verify').classList.add('hidden');
    $('#step-credentials').classList.remove('hidden');
    $('#verify-error').classList.add('hidden');
  });

  $('#verify-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('#verify-error');
    errEl.classList.add('hidden');
    $('#verify-btn').disabled = true;
    try {
      const res = await api('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: $('#login-code').value.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '驗證失敗');
      localStorage.setItem(TOKEN_KEY, data.token);
      await enterApp();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    } finally {
      $('#verify-btn').disabled = false;
    }
  });

  $('#logout-btn').addEventListener('click', async () => {
    try {
      await api('/api/auth/logout', { method: 'POST', headers: authHeaders() });
    } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    showLogin();
  });

  // ---------- Wizard steps ----------
  function buildSteps() {
    STEPS = [
      { kind: 'idea', id: 'idea', label: '你現在突然想做什麼?' },
      ...groups.map((g) => ({ kind: 'group', id: g.id, group: g, label: g.label })),
      { kind: 'extra', id: 'extra', label: '額外補充' },
      { kind: 'review', id: 'review', label: '確認並產生' },
    ];
  }

  function go(nextIndex) {
    stepIndex = Math.max(0, Math.min(nextIndex, STEPS.length - 1));
    renderStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateProgress() {
    const total = STEPS.length;
    const n = stepIndex + 1;
    $('#progress-label').textContent = `${n} / ${total}`;
    $('#progress-bar').style.width = `${(n / total) * 100}%`;
  }

  function saveConfig() {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ idea, extraNotes, selections }),
    );
  }

  function loadConfig() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function renderStep() {
    updateProgress();
    const step = STEPS[stepIndex];
    panel.classList.remove('hidden');
    $('#progress-card').classList.add('hidden');
    $('#result-card').classList.add('hidden');
    $('#error-card').classList.add('hidden');

    if (step.kind === 'idea') {
      panel.innerHTML = `
        <h2>${escapeHtml(step.label)}</h2>
        <textarea id="idea-input" rows="5" maxlength="1000" placeholder="一句話或一段筆記都可以"></textarea>
        <div class="wizard-nav">
          <span class="spacer"></span>
          <button type="button" class="btn-primary" id="next-btn">下一步</button>
        </div>`;
      const input = $('#idea-input');
      input.value = idea;
      input.focus();
      input.addEventListener('input', () => {
        idea = input.value;
        saveConfig();
      });
      $('#next-btn').addEventListener('click', () => {
        idea = input.value.trim();
        if (!idea) {
          showError('請先輸入想法');
          return;
        }
        saveConfig();
        go(stepIndex + 1);
      });
      return;
    }

    if (step.kind === 'extra') {
      panel.innerHTML = `
        <h2>${escapeHtml(step.label)}</h2>
        <p class="step-sub">選填</p>
        <textarea id="extra-input" rows="4" maxlength="1000" placeholder="選項沒涵蓋到的要求"></textarea>
        <div class="wizard-nav">
          <button type="button" class="btn-ghost" id="back-btn">上一步</button>
          <span class="spacer"></span>
          <button type="button" class="btn-primary" id="next-btn">下一步</button>
        </div>`;
      const input = $('#extra-input');
      input.value = extraNotes;
      input.addEventListener('input', () => {
        extraNotes = input.value;
        saveConfig();
      });
      $('#back-btn').addEventListener('click', () => go(stepIndex - 1));
      $('#next-btn').addEventListener('click', () => {
        extraNotes = input.value.trim();
        saveConfig();
        go(stepIndex + 1);
      });
      return;
    }

    if (step.kind === 'review') {
      const summary = groups
        .map((g) => {
          const sel = selections[g.id] || { values: [], custom: '' };
          const labels = (sel.values || [])
            .map((v) => g.options.find((o) => o.id === v)?.label || v)
            .filter(Boolean);
          if (sel.custom) labels.push(`自訂:${sel.custom}`);
          return `<dt>${escapeHtml(g.label)}</dt><dd>${escapeHtml(labels.join('、') || '—')}</dd>`;
        })
        .join('');
      panel.innerHTML = `
        <h2>${escapeHtml(step.label)}</h2>
        <dl id="review-summary">
          <dt>想法</dt><dd>${escapeHtml(idea)}</dd>
          ${summary}
          ${extraNotes ? `<dt>額外補充</dt><dd>${escapeHtml(extraNotes)}</dd>` : ''}
        </dl>
        <div class="wizard-nav">
          <button type="button" class="btn-ghost" id="back-btn">上一步</button>
          <span class="spacer"></span>
          <button type="button" class="btn-primary big" id="generate-btn">產生並存進 WikiNB</button>
        </div>`;
      $('#back-btn').addEventListener('click', () => go(stepIndex - 1));
      $('#generate-btn').addEventListener('click', runGenerate);
      return;
    }

    // group step
    const group = step.group;
    const sel = selections[group.id];
    const isMulti = group.type === 'multi';
    const chips = group.options
      .map(
        (opt) =>
          `<button type="button" class="chip${sel.values.includes(opt.id) ? ' selected' : ''}" data-value="${escapeHtml(opt.id)}">${escapeHtml(opt.label)}</button>`,
      )
      .join('');

    panel.innerHTML = `
      <h2>${escapeHtml(group.label)}</h2>
      ${isMulti && group.maxSelect ? `<p class="step-sub">最多 ${group.maxSelect} 個</p>` : isMulti ? '<p class="step-sub">可複選</p>' : '<p class="step-sub"></p>'}
      <div class="chips" id="chips">${chips}
        ${group.allowCustom ? `<button type="button" class="chip chip-custom${sel.customOpen ? ' selected' : ''}" id="custom-chip">自訂…</button>` : ''}
      </div>
      <p class="chip-hint" id="chip-hint"></p>
      ${
        group.allowCustom
          ? `<div class="custom-input${sel.customOpen ? '' : ' hidden'}" id="custom-box">
              <input type="text" id="custom-input" maxlength="200" placeholder="${escapeHtml(group.customPlaceholder || '自訂內容')}" />
            </div>`
          : ''
      }
      <div class="wizard-nav">
        <button type="button" class="btn-ghost" id="back-btn">上一步</button>
        <span class="spacer"></span>
        ${isMulti || group.allowCustom ? '<button type="button" class="btn-primary" id="next-btn">下一步</button>' : ''}
      </div>`;

    updateHint(group);
    $('#back-btn').addEventListener('click', () => go(stepIndex - 1));

    for (const chip of panel.querySelectorAll('.chip[data-value]')) {
      chip.addEventListener('click', () => {
        toggleOption(group, chip.dataset.value);
        // 單選：點完直接跳下一步(若無開著的自訂欄)
        if (!isMulti && !(sel.customOpen && (sel.custom || '').trim())) {
          saveConfig();
          go(stepIndex + 1);
        } else {
          refreshChipSelection(group);
          updateHint(group);
          saveConfig();
        }
      });
    }

    if (group.allowCustom) {
      const customChip = $('#custom-chip');
      const customBox = $('#custom-box');
      const customInput = $('#custom-input');
      customInput.value = sel.custom || '';
      customChip.addEventListener('click', () => {
        sel.customOpen = !sel.customOpen;
        customChip.classList.toggle('selected', sel.customOpen);
        customBox.classList.toggle('hidden', !sel.customOpen);
        if (!sel.customOpen) {
          sel.custom = '';
          customInput.value = '';
        } else {
          customInput.focus();
        }
        saveConfig();
      });
      customInput.addEventListener('input', () => {
        sel.custom = customInput.value;
        saveConfig();
      });
    }

    const nextBtn = $('#next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const hasPick = sel.values.length > 0 || (sel.custom || '').trim();
        if (!hasPick) {
          showError('請至少選一個選項,或填寫自訂內容');
          return;
        }
        saveConfig();
        go(stepIndex + 1);
      });
    }
  }

  function refreshChipSelection(group) {
    const sel = selections[group.id];
    for (const chip of panel.querySelectorAll('.chip[data-value]')) {
      chip.classList.toggle('selected', sel.values.includes(chip.dataset.value));
    }
  }

  function updateHint(group) {
    const sel = selections[group.id];
    const hintEl = $('#chip-hint');
    if (!hintEl) return;
    const hints = sel.values
      .map((v) => group.options.find((o) => o.id === v))
      .filter((o) => o && o.hint)
      .map((o) => `${o.label}:${o.hint}`);
    hintEl.textContent = hints.join(' / ');
  }

  function toggleOption(group, optId) {
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
  }

  // ---------- Generate ----------
  let elapsedTimer = null;
  let elapsedStartedAt = 0;

  function addProgress(message) {
    const li = document.createElement('li');
    li.textContent = message;
    $('#progress-list').appendChild(li);
  }

  /** 1s / 2s / … / 3m40s / 3m41s */
  function fmtElapsed(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}m${r}s`;
  }

  function setElapsedText(ms) {
    $('#elapsed').textContent = `已經過 ${fmtElapsed(ms)}（通常約 1–5 分鐘，請稍候）`;
  }

  function startElapsedClock() {
    stopElapsedClock();
    elapsedStartedAt = Date.now();
    setElapsedText(0);
    elapsedTimer = setInterval(() => {
      setElapsedText(Date.now() - elapsedStartedAt);
    }, 1000);
  }

  function stopElapsedClock() {
    if (elapsedTimer) {
      clearInterval(elapsedTimer);
      elapsedTimer = null;
    }
  }

  async function runGenerate() {
    if (!idea.trim()) {
      showError('請先輸入想法');
      return;
    }
    saveConfig();
    panel.classList.add('hidden');
    $('#progress-list').innerHTML = '';
    $('#elapsed').textContent = '';
    $('#progress-card').classList.remove('hidden');
    $('#result-card').classList.add('hidden');
    $('#error-card').classList.add('hidden');
    addProgress('已送出…');
    startElapsedClock();

    try {
      const payload = {
        idea: idea.trim(),
        extraNotes: extraNotes.trim(),
        selections: Object.fromEntries(
          Object.entries(selections).map(([k, v]) => [
            k,
            { values: v.values, custom: (v.custom || '').trim() },
          ]),
        ),
      };
      const res = await api('/api/generate', {
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
          try {
            ev = JSON.parse(line);
          } catch {
            continue;
          }
          if (ev.type === 'status') addProgress(ev.message);
          else if (ev.type === 'done') {
            finished = true;
            showResult(ev);
          } else if (ev.type === 'error') {
            finished = true;
            throw new Error(ev.error);
          }
        }
      }
      if (!finished) throw new Error('連線中斷,請確認本機 Bridge 仍在執行');
    } catch (err) {
      showError(err.message);
      panel.classList.remove('hidden');
    } finally {
      stopElapsedClock();
      $('#progress-card').classList.add('hidden');
    }
  }

  function showResult(ev) {
    const dl = $('#result-detail');
    const rows = [
      ['文件標題', ev.title || '(未提供)'],
      ['本機位置', `<code>${escapeHtml(ev.localPath)}</code>`],
      [
        'WikiNB 推送',
        ev.pushed
          ? `已 commit(<code>${escapeHtml(ev.commit)}</code>)並推送`
          : '未推送',
      ],
      [
        '上線網址',
        `<a href="${escapeHtml(ev.pageUrl)}" target="_blank" rel="noopener">${escapeHtml(ev.pageUrl)}</a><br><span class="muted">GitHub Pages 約需 2 分鐘才會更新，若現在打不開請稍後再重整。</span>`,
      ],
      ['耗時', `${fmtElapsed(ev.totalElapsedMs)}`],
    ];
    dl.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    $('#result-card').classList.remove('hidden');
    $('#result-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showError(message) {
    $('#error-message').textContent = message;
    $('#error-card').classList.remove('hidden');
    $('#error-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  $('#error-dismiss').addEventListener('click', () => $('#error-card').classList.add('hidden'));
  $('#again-btn').addEventListener('click', () => {
    $('#result-card').classList.add('hidden');
    go(0);
  });

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }

  // ---------- Boot ----------
  async function enterApp() {
    const res = await api('/api/options', { headers: authHeaders() });
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      showLogin();
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showLogin();
      const err = $('#login-error');
      err.textContent = data.error || '無法連線本機 Bridge(請先 npm start)';
      err.classList.remove('hidden');
      return;
    }
    const data = await res.json();
    groups = data.groups;
    buildSteps();

    const saved = loadConfig();
    idea = saved?.idea || '';
    extraNotes = saved?.extraNotes || '';
    selections = {};
    for (const group of groups) {
      const savedSel = saved?.selections?.[group.id];
      const defaults = Array.isArray(group.default)
        ? group.default
        : group.default
          ? [group.default]
          : [];
      selections[group.id] = {
        values: Array.isArray(savedSel?.values)
          ? savedSel.values.filter((v) => group.options.some((o) => o.id === v))
          : defaults,
        custom: savedSel?.custom || '',
        customOpen: Boolean(savedSel?.custom),
      };
      if (selections[group.id].values.length === 0 && !selections[group.id].custom) {
        selections[group.id].values = defaults;
      }
    }

    showApp();
    go(0);
  }

  (async () => {
    if (!token()) {
      showLogin();
      return;
    }
    try {
      const res = await api('/api/auth/me', { headers: authHeaders() });
      if (res.ok) await enterApp();
      else {
        localStorage.removeItem(TOKEN_KEY);
        showLogin();
      }
    } catch {
      showLogin();
      const err = $('#login-error');
      err.textContent = '無法連線本機 Bridge — 請在本機執行 npm start';
      err.classList.remove('hidden');
    }
  })();
})();
