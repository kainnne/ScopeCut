(() => {
  'use strict';

  const ANON_KEY = 'scopecut_anonymous_v1';
  const ADMIN_KEY = 'scopecut_admin_v1';
  const MOOD_KEY = 'scopecut_mood';
  const API_BASE = document.querySelector('meta[name="scopecut-api-base"]')?.content.replace(/\/$/, '') || '';
  const toast = document.querySelector('#toast');
  let pendingEmail = '';
  let toastTimer;

  function escapeHtml(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  async function api(path, options = {}) {
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      });
    } catch {
      throw new Error('目前無法連線用量服務');
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.error || '服務暫時無法使用');
      error.status = response.status;
      throw error;
    }
    return body;
  }

  async function anonymousToken() {
    const existing = localStorage.getItem(ANON_KEY);
    if (existing) return existing;
    const session = await api('/api/session', { method: 'POST' });
    localStorage.setItem(ANON_KEY, session.token);
    return session.token;
  }

  function metric(label, value, note = '') {
    return `<article class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${note ? `<small>${escapeHtml(note)}</small>` : ''}</article>`;
  }

  const bandNames = { normal: '一般', elevated: '較高', heavy: '大量', extreme: '極端' };
  const statusNames = { quoted: '已估算', running: '產生中', completed: '完成', failed: '失敗', timeout: '逾時' };

  async function loadPublic() {
    const data = await api('/api/stats/public');
    document.querySelector('#dashboard-day').textContent = data.day;
    document.querySelector('#public-metrics').innerHTML = [
      metric('服務', data.service === 'available' ? '可使用' : data.service === 'busy' ? '較忙碌' : '今日暫停'),
      metric('完成', data.generated, 'Projects'),
      metric('測試點數', data.points, '不代表美元'),
    ].join('');
    document.querySelector('#public-bands').innerHTML = Object.entries(data.bands)
      .map(([band, count]) => `<div class="band ${band}"><span>${bandNames[band]}</span><strong>${count}</strong></div>`).join('');
  }

  async function loadPersonal(retry = true) {
    try {
      const token = await anonymousToken();
      const data = await api('/api/stats/me', { headers: { 'X-ScopeCut-Anonymous': token } });
      document.querySelector('#personal-metrics').innerHTML = [
        metric('今日完成', data.generated),
        metric('今日點數', data.points),
      ].join('');
      document.querySelector('#personal-history').innerHTML = data.history.length ? data.history.map((item) => `
        <article class="history-row">
          <div><strong>${escapeHtml(statusNames[item.status] || item.status)}</strong><span>${new Date(item.createdAt).toLocaleString('zh-TW')}</span></div>
          <div><strong>${item.actualPoints || item.estimatedPoints} 點</strong><span>預估 ${item.estimatedPoints} · ${item.fileCount} 附件</span></div>
        </article>`).join('') : '<p class="empty-state">目前沒有用量紀錄</p>';
    } catch (error) {
      if (error.status === 401 && retry) {
        localStorage.removeItem(ANON_KEY);
        return loadPersonal(false);
      }
      showToast(error.message);
    }
  }

  function money(microusd) { return `US$${(Number(microusd || 0) / 1000000).toFixed(4)}`; }
  function tokens(value) { return Number(value || 0).toLocaleString('en-US'); }

  async function loadAdmin() {
    const token = sessionStorage.getItem(ADMIN_KEY);
    if (!token) return;
    const day = document.querySelector('#admin-day').value;
    try {
      const data = await api(`/api/admin/usage${day ? `?day=${encodeURIComponent(day)}` : ''}`, { headers: { Authorization: `Bearer ${token}` } });
      document.querySelector('#admin-login').classList.add('hidden');
      document.querySelector('#admin-content').classList.remove('hidden');
      document.querySelector('#admin-day').value = data.day;
      const summary = data.summary || {};
      const average = Number(summary.success_count || 0) ? Number(summary.actual_cost_microusd || 0) / Number(summary.success_count) : 0;
      document.querySelector('#admin-metrics').innerHTML = [
        metric('實際成本', money(summary.actual_cost_microusd), `預算 ${money(data.budgetMicrousd)}`),
        metric('保留中', money(summary.reserved_cost_microusd)),
        metric('平均成本', money(average), '每次成功'),
        metric('成功／失敗', `${summary.success_count || 0}／${summary.failure_count || 0}`),
        metric('Input', tokens(summary.input_tokens), 'tokens'),
        metric('Output', tokens(summary.output_tokens), `reasoning ${tokens(summary.reasoning_tokens)}`),
      ].join('');
      document.querySelector('#admin-users').innerHTML = data.users.length ? data.users.map((user) => `
        <details class="admin-event admin-user">
          <summary><span>${escapeHtml(user.anon_id)}</span><strong>${money(user.actual_cost_microusd)}</strong></summary>
          <dl>
            <div><dt>請求</dt><dd>${user.success_count || 0}／${user.request_count || 0} 完成</dd></div>
            <div><dt>點數</dt><dd>${user.points || 0}</dd></div>
            <div><dt>Input</dt><dd>${tokens(user.input_tokens)}</dd></div>
            <div><dt>Output</dt><dd>${tokens(user.output_tokens)}</dd></div>
            <div><dt>Reasoning</dt><dd>${tokens(user.reasoning_tokens)}</dd></div>
            <div><dt>平均延遲</dt><dd>${user.average_latency_ms == null ? '—' : `${(user.average_latency_ms / 1000).toFixed(1)} 秒`}</dd></div>
            <div><dt>最高單次</dt><dd>${money(user.max_cost_microusd)}</dd></div>
          </dl>
        </details>`).join('') : '';
      document.querySelector('#admin-events').innerHTML = data.events.length ? data.events.map((item) => `
        <details class="admin-event ${escapeHtml(item.cost_band)}">
          <summary><span>${escapeHtml(item.status)} · ${escapeHtml(item.reading_mode)}</span><strong>${money(item.actual_cost_microusd || item.estimated_cost_microusd)}</strong></summary>
          <dl>
            <div><dt>匿名 ID</dt><dd>${escapeHtml(item.anon_id)}</dd></div>
            <div><dt>模型</dt><dd>${escapeHtml(item.model)} · ${escapeHtml(item.reasoning_effort)}</dd></div>
            <div><dt>Input</dt><dd>預估 ${tokens(item.input_tokens_estimated)}／實際 ${tokens(item.input_tokens_actual)}</dd></div>
            <div><dt>Output</dt><dd>${tokens(item.output_tokens_actual)}／reasoning ${tokens(item.reasoning_tokens_actual)}</dd></div>
            <div><dt>成本差</dt><dd>${money(item.prediction_error_microusd)} · ${item.prediction_error_ratio == null ? '—' : `${Number(item.prediction_error_ratio).toFixed(2)}×`}</dd></div>
            <div><dt>附件</dt><dd>${item.file_count} 個 · ${tokens(item.total_file_bytes)} bytes</dd></div>
            <div><dt>延遲</dt><dd>${item.latency_ms == null ? '—' : `${(item.latency_ms / 1000).toFixed(1)} 秒`}</dd></div>
            <div><dt>錯誤</dt><dd>${escapeHtml(item.error_code || '—')}</dd></div>
          </dl>
        </details>`).join('') : '<p class="empty-state">這一天沒有紀錄</p>';
    } catch (error) {
      if (error.status === 401) sessionStorage.removeItem(ADMIN_KEY);
      showToast(error.message);
    }
  }

  document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach((item) => item.classList.toggle('is-active', item === button));
    document.querySelectorAll('[data-panel]').forEach((panel) => panel.classList.toggle('hidden', panel.dataset.panel !== button.dataset.tab));
    if (button.dataset.tab === 'personal') loadPersonal();
    if (button.dataset.tab === 'admin') loadAdmin();
  }));

  document.querySelector('#admin-email-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    pendingEmail = document.querySelector('#admin-email').value.trim();
    try {
      await api('/api/auth/send-code', { method: 'POST', body: JSON.stringify({ email: pendingEmail }) });
      document.querySelector('#admin-email-form').classList.add('hidden');
      document.querySelector('#admin-code-form').classList.remove('hidden');
      document.querySelector('#admin-auth-status').textContent = '驗證碼已寄出';
    } catch (error) { showToast(error.message); }
  });

  document.querySelector('#admin-code-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const verified = await api('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ email: pendingEmail, code: document.querySelector('#admin-code').value.trim() }),
      });
      sessionStorage.setItem(ADMIN_KEY, verified.token);
      await loadAdmin();
    } catch (error) { showToast(error.message); }
  });

  document.querySelector('#admin-refresh').addEventListener('click', loadAdmin);
  const root = document.documentElement;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  root.dataset.mood = localStorage.getItem(MOOD_KEY) === 'dusk' ? 'dusk' : 'dream';
  themeMeta.content = root.dataset.mood === 'dusk' ? '#160b19' : '#fff8fc';
  document.querySelector('#theme-toggle').addEventListener('click', () => {
    root.dataset.mood = root.dataset.mood === 'dusk' ? 'dream' : 'dusk';
    localStorage.setItem(MOOD_KEY, root.dataset.mood);
    themeMeta.content = root.dataset.mood === 'dusk' ? '#160b19' : '#fff8fc';
  });

  loadPublic().catch((error) => {
    document.querySelector('#public-metrics').innerHTML = '<p class="empty-state">目前無法讀取用量</p>';
    showToast(error.message);
  });
})();
