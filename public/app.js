(() => {
  'use strict';

  const DRAFT_KEY = 'scopecut_public_draft_v2';
  const LEGACY_DRAFT_KEY = 'scopecut_public_draft_v1';
  const MOOD_KEY = 'scopecut_mood';
  const ANON_KEY = 'scopecut_anonymous_v1';
  const API_BASE = document.querySelector('meta[name="scopecut-api-base"]')?.content.replace(/\/$/, '') || '';

  const copy = {
    stepNames: [
      'Project 概念',
      '目標與成果',
      '使用者與情境',
      '交付形式',
      '核心內容',
      '體驗與風格',
      '素材與參考',
      '其他備註',
      '確認',
    ],
    projectTypes: {
      website: '網站',
      aiTool: 'AI 工具',
      application: '應用程式',
      automation: '自動化流程',
      dashboard: '資料或管理面板',
      learning: '學習專案',
      portfolio: '作品集',
      content: '內容或企劃',
      research: '研究與整理',
      campaign: '活動或宣傳',
      community: '社群專案',
      service: '服務設計',
      event: '活動體驗',
      business: '商業概念',
      explore: '還不確定',
    },
    purpose: {
      learn: '透過製作學習新能力',
      personal: '解決真實存在的問題',
      portfolio: '完成可公開展示的作品',
      validate: '驗證產品或服務概念',
      research: '整理內容或研究成果',
      promote: '推廣品牌、服務或活動',
      teach: '協助別人理解或學習',
      explore: '把模糊想法發展成方向',
    },
    audiences: {
      self: '自己使用',
      beginners: '剛接觸這個主題的人',
      creators: '創作者',
      students: '學生或學習者',
      professionals: '專業工作者',
      team: '團隊成員',
      organization: '組織或社群',
      customers: '客戶或消費者',
      public: '一般大眾',
    },
    scenarios: {
      daily: '日常持續使用',
      oneTime: '完成一次性的成果',
      work: '工作或協作',
      study: '學習與練習',
      planning: '規劃與決策',
      creating: '創作與製作',
      managing: '整理與管理',
      sharing: '分享或公開發布',
      presenting: '展示與提案',
      testing: '測試一個想法',
    },
    format: {
      website: '網站',
      tool: '互動工具',
      application: '應用程式',
      chatbot: '對話式助手',
      dashboard: '資料或管理面板',
      automation: '自動化流程',
      content: '內容或企劃',
      document: '文件或指南',
      presentation: '簡報或提案',
      course: '教學或學習內容',
      undecided: '由 ScopeCut 建議',
    },
    features: {
      display: '呈現內容',
      categories: '分類與導覽',
      search: '搜尋',
      filter: '篩選',
      recommendations: '推薦內容',
      templates: '範例或模板',
      input: '輸入與表單',
      generate: 'AI 生成',
      analyze: 'AI 分析',
      edit: '編輯與調整',
      preview: '即時預覽',
      export: '匯出成果',
      upload: '上傳素材',
      save: '儲存進度',
      history: '歷史紀錄',
      account: '個人帳號',
      sync: '資料同步',
      stats: '統計與追蹤',
      publicLink: '公開連結',
      download: '下載',
      email: 'Email 寄送',
      collaboration: '多人協作',
      feedback: '回饋或留言',
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
      editorial: '編輯排版感',
      technology: '科技感',
      artistic: '藝術感',
      calm: '安靜柔和',
      colorful: '多彩明亮',
      dark: '深色氛圍',
    },
    materialTypes: {
      draft: '文字草稿',
      notes: '筆記與訪談',
      research: '研究資料',
      copy: '既有文案',
      logo: 'Logo 與品牌素材',
      photos: '照片',
      illustration: '插圖或圖像',
      video: '影音素材',
      spreadsheet: '試算表',
      dataset: '資料集',
      api: '既有 API',
      existingSite: '既有網站或產品',
      references: '參考案例',
      none: '目前沒有素材',
    },
  };

  const optionSections = {
    projectTypes: [
      ['產品與工具', ['website', 'aiTool', 'application', 'automation', 'dashboard']],
      ['內容與表達', ['learning', 'portfolio', 'content', 'research', 'campaign']],
      ['社群與服務', ['community', 'service', 'event', 'business']],
      ['還在探索', ['explore']],
    ],
    purpose: [
      ['解決與學習', ['personal', 'learn', 'research', 'teach']],
      ['發表與驗證', ['portfolio', 'validate', 'promote', 'explore']],
    ],
    audiences: [
      ['個人', ['self', 'beginners', 'creators', 'students', 'professionals']],
      ['群體', ['team', 'organization', 'customers', 'public']],
    ],
    scenarios: [
      ['使用頻率', ['daily', 'oneTime']],
      ['主要情境', ['work', 'study', 'planning', 'creating', 'managing']],
      ['成果用途', ['sharing', 'presenting', 'testing']],
    ],
    format: [
      ['數位產品', ['website', 'tool', 'application', 'chatbot', 'dashboard', 'automation']],
      ['內容成果', ['content', 'document', 'presentation', 'course']],
      ['尚未決定', ['undecided']],
    ],
    features: [
      ['內容與瀏覽', ['display', 'categories', 'search', 'filter', 'recommendations', 'templates']],
      ['輸入與 AI', ['input', 'generate', 'analyze', 'edit', 'preview', 'export']],
      ['資料與帳號', ['upload', 'save', 'history', 'account', 'sync', 'stats']],
      ['分享與協作', ['publicLink', 'download', 'email', 'collaboration', 'feedback']],
    ],
    styles: [
      ['整體感受', ['professional', 'minimal', 'warm', 'playful', 'experimental', 'bold']],
      ['視覺方向', ['editorial', 'technology', 'artistic', 'calm', 'colorful', 'dark']],
    ],
    materialTypes: [
      ['文字與內容', ['draft', 'notes', 'research', 'copy']],
      ['視覺與品牌', ['logo', 'photos', 'illustration', 'video']],
      ['資料與系統', ['spreadsheet', 'dataset', 'api', 'existingSite']],
      ['參考或尚未準備', ['references', 'none']],
    ],
  };

  const totalSteps = copy.stepNames.length;
  const emptyDraft = () => ({
    projectName: '',
    idea: '',
    projectTypes: [],
    purpose: '',
    objective: '',
    audienceTypes: [],
    audience: '',
    scenarioTypes: [],
    scenario: '',
    format: '',
    formatOther: '',
    features: [],
    core: '',
    priorities: [],
    styles: [],
    styleNotes: '',
    materialTypes: [],
    materials: '',
    references: '',
    materialVisual: false,
    notes: '',
    step: 0,
  });

  const builder = document.querySelector('#builder-content');
  const stepLabel = document.querySelector('#builder-step-label');
  const stepName = document.querySelector('#builder-step-name');
  const progress = document.querySelector('#builder-progress');
  const toast = document.querySelector('#toast');
  let draft = loadDraft();
  let selectedFiles = [];
  let currentQuote = null;
  let currentAgentPrompt = '';
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
      const migratedNotes = [stored.technicalPreferences, stored.constraints, stored.exclusions]
        .filter(Boolean)
        .join('\n');
      return {
        ...emptyDraft(),
        ...stored,
        projectTypes: Array.isArray(stored.projectTypes) ? stored.projectTypes.slice(0, 3) : [],
        audienceTypes: Array.isArray(stored.audienceTypes) ? stored.audienceTypes.slice(0, 3) : [],
        scenarioTypes: Array.isArray(stored.scenarioTypes) ? stored.scenarioTypes.slice(0, 4) : [],
        features: Array.isArray(stored.features) ? stored.features.slice(0, 8) : [],
        priorities: Array.isArray(stored.priorities) ? stored.priorities.slice(0, 4) : [],
        styles: Array.isArray(stored.styles) ? stored.styles.slice(0, 4) : [],
        materialTypes: Array.isArray(stored.materialTypes) ? stored.materialTypes.slice(0, 8) : [],
        notes: String(stored.notes || migratedNotes),
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
      notes: String(legacy.constraints || ''),
      step: 0,
    };
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  function choice(group, value, title, selected, multi = false, limit = 1) {
    return `<button class="choice ${selected ? 'is-selected' : ''}" type="button" aria-pressed="${selected}" data-choice-group="${group}" data-choice-value="${value}" data-choice-multi="${multi}" data-choice-limit="${limit}"><strong>${escapeHtml(title)}</strong></button>`;
  }

  function optionGroups(group, dictionary, sections, selected, multi = false, limit = 1) {
    return `<div class="option-groups">${sections.map(([title, values], index) => `
      <details class="option-group" ${index === 0 ? 'open' : ''}>
        <summary>${escapeHtml(title)}</summary>
        <div class="choice-grid three">
          ${values.map((value) => choice(group, value, dictionary[value], multi ? selected.includes(value) : selected === value, multi, limit)).join('')}
        </div>
      </details>
    `).join('')}</div>`;
  }

  function labels(values, dictionary) {
    return values.map((value) => dictionary[value]).filter(Boolean).join('、');
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
        <h2 class="step-title">你想做什麼？</h2>
        ${optionGroups('projectTypes', copy.projectTypes, optionSections.projectTypes, draft.projectTypes, true, 3)}
        <div class="field-group">
          <label class="field-label" for="idea-input">補充你的想法</label>
          <textarea class="idea-textarea" id="idea-input" maxlength="1200" placeholder="不用寫成完整企劃。告訴我們你想處理的主題、動機，或目前想到的任何片段。">${escapeHtml(draft.idea)}</textarea>
          <div class="field-meta" id="idea-count">${draft.idea.length} / 1200</div>
        </div>
        <div class="field-group">
          <label class="field-label" for="project-name">Project 名稱（選填）</label>
          <input class="text-input" id="project-name" maxlength="80" placeholder="還沒有名稱也沒關係" value="${escapeHtml(draft.projectName)}" />
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
        ${optionGroups('purpose', copy.purpose, optionSections.purpose, draft.purpose)}
        <div class="field-group">
          <label class="field-label" for="objective-input">想補充的成果（選填）</label>
          <textarea class="compact-textarea" id="objective-input" maxlength="700" placeholder="如果你已經想到完成後要看見什麼，可以寫在這裡。">${escapeHtml(draft.objective)}</textarea>
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
        <div class="field-block">
          <span class="field-label">目標使用者</span>
          ${optionGroups('audienceTypes', copy.audiences, optionSections.audiences, draft.audienceTypes, true, 3)}
        </div>
        <div class="field-group">
          <label class="field-label" for="audience-input">其他使用者（選填）</label>
          <input class="text-input" id="audience-input" maxlength="240" placeholder="也可以直接描述更具體的人" value="${escapeHtml(draft.audience)}" />
        </div>
        <div class="field-group">
          <span class="field-label">使用情境</span>
          ${optionGroups('scenarioTypes', copy.scenarios, optionSections.scenarios, draft.scenarioTypes, true, 4)}
        </div>
        <div class="field-group">
          <label class="field-label" for="scenario-input">情境補充（選填）</label>
          <textarea class="compact-textarea" id="scenario-input" maxlength="700" placeholder="有更明確的使用時機、流程或結果，再補充在這裡。">${escapeHtml(draft.scenario)}</textarea>
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
        ${optionGroups('format', copy.format, optionSections.format, draft.format)}
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
        <h2 class="step-title">第一版要做什麼？</h2>
        ${optionGroups('features', copy.features, optionSections.features, draft.features, true, 8)}
        <div class="field-meta selection-limit">最多選 8 項</div>
        <div class="field-group">
          <span class="field-label">優先重點</span>
          <div class="choice-grid three">
            ${Object.entries(copy.priorities).map(([value, title]) => choice('priorities', value, title, draft.priorities.includes(value), true, 4)).join('')}
          </div>
        </div>
        <div class="field-group">
          <label class="field-label" for="core-input">其他內容或功能（選填）</label>
          <textarea class="compact-textarea" id="core-input" maxlength="1000" placeholder="選項沒有涵蓋的內容，可以直接寫在這裡。">${escapeHtml(draft.core)}</textarea>
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
        ${optionGroups('styles', copy.styles, optionSections.styles, draft.styles, true, 4)}
        <div class="field-meta selection-limit">最多選 4 項</div>
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
      const fileNames = selectedFiles.map((file) => `<li><span>${escapeHtml(file.name)}</span><small>${(file.size / 1024 / 1024).toFixed(1)} MB</small></li>`).join('');
      builder.innerHTML = `
        <h2 class="step-title">你已經有哪些素材與參考？</h2>
        ${optionGroups('materialTypes', copy.materialTypes, optionSections.materialTypes, draft.materialTypes, true, 8)}
        <div class="field-group upload-field">
          <label class="file-picker" for="material-files"><strong>上傳附件</strong><span>PDF、文件、簡報或試算表，合計 50 MB 以內</span></label>
          <input id="material-files" type="file" multiple accept=".pdf,.txt,.md,.json,.html,.xml,.csv,.doc,.docx,.rtf,.odt,.ppt,.pptx,.xls,.xlsx,.tsv" />
          ${fileNames ? `<ul class="selected-files">${fileNames}</ul><button class="text-button clear-files" type="button" data-action="clear-files">清除附件</button>` : ''}
          <label class="visual-detail"><input id="material-visual" type="checkbox" ${draft.materialVisual ? 'checked' : ''} /><span>附件中的圖表、版面或小字很重要</span></label>
        </div>
        <div class="field-group">
          <label class="field-label" for="materials-input">素材補充（選填）</label>
          <textarea class="compact-textarea" id="materials-input" maxlength="800" placeholder="說明素材內容、存放位置，或 AI 應該如何使用。">${escapeHtml(draft.materials)}</textarea>
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
      const fileInput = builder.querySelector('#material-files');
      fileInput?.addEventListener('change', () => {
        selectedFiles = [...fileInput.files].slice(0, 5);
        if (fileInput.files.length > 5) showToast('一次最多上傳 5 個附件');
        renderStep();
      });
      builder.querySelector('#material-visual')?.addEventListener('change', (event) => {
        draft.materialVisual = event.currentTarget.checked;
        saveDraft();
      });
      return;
    }

    if (current === 7) {
      builder.innerHTML = `
        <h2 class="step-title">還有什麼需要讓 AI 知道？</h2>
        <div class="field-group">
          <label class="field-label" for="notes-input">備註（選填）</label>
          <textarea class="idea-textarea medium" id="notes-input" maxlength="1000" placeholder="指定工具、必要條件、不希望出現的內容，或其他補充。">${escapeHtml(draft.notes)}</textarea>
        </div>
        <p class="field-error" id="step-error" role="alert"></p>
        ${nav()}
      `;
      bindInput('#notes-input', 'notes');
      return;
    }

    const projectTypes = labels(draft.projectTypes, copy.projectTypes);
    const audiences = [labels(draft.audienceTypes, copy.audiences), draft.audience].filter(Boolean).join('、');
    const scenarios = [labels(draft.scenarioTypes, copy.scenarios), draft.scenario].filter(Boolean).join('、');
    const features = labels(draft.features, copy.features);
    const priorities = draft.priorities.map((value) => copy.priorities[value]).join('、');
    const styles = draft.styles.map((value) => copy.styles[value]).join('、');
    const materialTypes = labels(draft.materialTypes, copy.materialTypes);
    const format = [copy.format[draft.format], draft.formatOther].filter(Boolean).join('／');
    builder.innerHTML = `
      <h2 class="step-title">確認 Project Brief</h2>
      <div class="review-grid">
        ${draft.projectName ? `<div class="review-item"><span>Project</span><p>${escapeHtml(draft.projectName)}</p></div>` : ''}
        <div class="review-item"><span>主要目的</span><p>${escapeHtml(copy.purpose[draft.purpose])}</p></div>
        ${projectTypes ? `<div class="review-item"><span>Project 類型</span><p>${escapeHtml(projectTypes)}</p></div>` : ''}
        <div class="review-item full"><span>Project 概念</span><p>${escapeHtml(draft.idea)}</p></div>
        ${draft.objective ? `<div class="review-item full"><span>預期成果</span><p>${escapeHtml(draft.objective)}</p></div>` : ''}
        <div class="review-item"><span>目標使用者</span><p>${escapeHtml(audiences)}</p></div>
        <div class="review-item"><span>交付形式</span><p>${escapeHtml(format)}</p></div>
        <div class="review-item full"><span>使用情境</span><p>${escapeHtml(scenarios)}</p></div>
        ${features ? `<div class="review-item full"><span>第一版功能</span><p>${escapeHtml(features)}</p></div>` : ''}
        ${draft.core ? `<div class="review-item full"><span>功能補充</span><p>${escapeHtml(draft.core)}</p></div>` : ''}
        ${priorities ? `<div class="review-item"><span>優先重點</span><p>${escapeHtml(priorities)}</p></div>` : ''}
        <div class="review-item"><span>體驗與風格</span><p>${escapeHtml(styles)}</p></div>
        ${draft.styleNotes ? `<div class="review-item full"><span>風格補充</span><p>${escapeHtml(draft.styleNotes)}</p></div>` : ''}
        ${materialTypes ? `<div class="review-item full"><span>現有素材類型</span><p>${escapeHtml(materialTypes)}</p></div>` : ''}
        ${selectedFiles.length ? `<div class="review-item full"><span>附件</span><p>${escapeHtml(selectedFiles.map((file) => file.name).join('、'))}</p></div>` : ''}
        ${draft.materials ? `<div class="review-item full"><span>現有素材</span><p>${escapeHtml(draft.materials)}</p></div>` : ''}
        ${draft.references ? `<div class="review-item full"><span>參考方向</span><p>${escapeHtml(draft.references)}</p></div>` : ''}
        ${draft.notes ? `<div class="review-item full"><span>備註</span><p>${escapeHtml(draft.notes)}</p></div>` : ''}
      </div>
      ${nav(true, '產生 Project', 'generate')}
    `;
  }

  function validateStep() {
    if (draft.step === 0 && draft.idea.trim().length < 5) return '請補充一點你目前的想法。';
    if (draft.step === 1 && !draft.purpose) return '請選擇這個 Project 的主要目的。';
    if (draft.step === 2 && draft.audienceTypes.length === 0 && draft.audience.trim().length < 2) return '請選擇或補充目標使用者。';
    if (draft.step === 2 && draft.scenarioTypes.length === 0 && draft.scenario.trim().length < 2) return '請選擇或補充使用情境。';
    if (draft.step === 3 && !draft.format) return '請選擇第一版的主要交付形式。';
    if (draft.step === 4 && draft.features.length === 0 && draft.core.trim().length < 2) return '請選擇或補充第一版要有的內容。';
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

  function createProjectPrompt() {
    const projectName = draft.projectName.trim() || '未命名 AI Project';
    const format = [copy.format[draft.format], draft.formatOther.trim()].filter(Boolean).join('／');
    const projectTypes = labels(draft.projectTypes, copy.projectTypes);
    const audiences = [labels(draft.audienceTypes, copy.audiences), draft.audience.trim()].filter(Boolean).join('、');
    const scenarios = [labels(draft.scenarioTypes, copy.scenarios), draft.scenario.trim()].filter(Boolean).join('、');
    const features = [labels(draft.features, copy.features), draft.core.trim()].filter(Boolean).join('。');
    const priorities = labels(draft.priorities, copy.priorities);
    const styles = labels(draft.styles, copy.styles);
    const materialTypes = labels(draft.materialTypes, copy.materialTypes);
    const sections = [
      ['Project 名稱', projectName],
      ['Project 類型', projectTypes],
      ['Project 概念', draft.idea.trim()],
      ['主要目的', [copy.purpose[draft.purpose], draft.objective.trim()].filter(Boolean).join('。')],
      ['目標使用者', audiences],
      ['使用情境', scenarios],
      ['第一版形式', format],
      ['第一版必須包含', features],
      ['優先重點', priorities],
      ['體驗與風格', [styles, draft.styleNotes.trim()].filter(Boolean).join('。')],
      ['現有素材', [materialTypes, draft.materials.trim()].filter(Boolean).join('。')],
      ['參考方向', draft.references.trim()],
      ['其他備註', draft.notes.trim()],
    ].filter(([, value]) => value);

    const prompt = [
      '請根據以下 Project Brief，提出最適合的第一版方向，整理成可直接執行的 Project 規格，並開始完成第一版。',
      '',
      ...sections.flatMap(([title, value]) => [`## ${title}`, value, '']),
    ].join('\n').trim();

    return { projectName, format, audiences, features, priorities, styles, prompt };
  }

  function renderQuote(quote) {
    currentQuote = quote;
    const sizeText = quote.inputSize === 'standard' ? '一般資料量' : quote.inputSize === 'large' ? '較大型資料' : '極大型資料';
    const readingText = quote.readingMode === 'file_search' ? '會先定位附件中的相關內容' : '會直接閱讀 Project Brief 與附件';
    stepLabel.textContent = '確認';
    stepName.textContent = '測試點數';
    progress.style.width = '100%';
    builder.classList.add('result-view');
    builder.innerHTML = `
      <section class="quote-card">
        <span class="result-label">本次預估</span>
        <strong>${quote.estimatedPoints} 點</strong>
        <p>${escapeHtml(sizeText)}，${escapeHtml(readingText)}。目前為免費測試點數，不會收費。</p>
      </section>
      <div class="step-nav quote-actions">
        <button class="back-button" type="button" data-action="back-to-review">返回確認</button>
        <button class="next-button" type="button" data-action="confirm-generation">使用測試點數 →</button>
      </div>
    `;
  }

  function renderGenerating(status = '正在整理你的 Project') {
    stepLabel.textContent = '產生中';
    stepName.textContent = 'AI Project';
    progress.style.width = '100%';
    builder.classList.add('result-view');
    builder.innerHTML = `
      <div class="generating-state" role="status" aria-live="polite">
        <span></span>
        <h2 class="step-title">${escapeHtml(status)}</h2>
        <p class="generating-note">完成後會記錄預估與實際用量的差異</p>
      </div>
    `;
    document.querySelector('#builder-shell').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderResult(generated) {
    const result = createProjectPrompt();
    const plan = generated.plan;
    const prompt = typeof generated.agent_prompt === 'string' ? {
      objective: generated.agent_prompt,
      deliverable: '', requirements: [], content_and_experience: '', tools_and_execution: '', acceptance_criteria: [],
    } : generated.agent_prompt;
    const namedList = (items) => items.map((item) => `<li><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.purpose)}</span></li>`).join('');
    const reasonedList = (items, key) => items.map((item) => `<li><strong>${escapeHtml(item[key])}</strong><span>${escapeHtml(item.reason)}</span></li>`).join('');
    const promptList = (items) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    currentAgentPrompt = [
      `# 專案目標\n${prompt.objective}`,
      `# 成品\n${prompt.deliverable}`,
      `# 核心需求\n${prompt.requirements.map((item) => `- ${item}`).join('\n')}`,
      `# 內容與體驗\n${prompt.content_and_experience}`,
      `# 工具與執行\n${prompt.tools_and_execution}`,
      `# 完成標準\n${prompt.acceptance_criteria.map((item) => `- ${item}`).join('\n')}`,
    ].join('\n\n');
    stepLabel.textContent = '完成';
    stepName.textContent = 'Project Prompt';
    progress.style.width = '100%';
    builder.classList.add('result-view');
    builder.innerHTML = `
      <h2 class="step-title">${escapeHtml(result.projectName)}</h2>
      ${generated.usage ? `<div class="usage-note"><strong>${escapeHtml(generated.usage.points)} 點</strong><span>預估 ${escapeHtml(generated.usage.estimatedPoints)} 點 · ${(Number(generated.usage.latencyMs || 0) / 1000).toFixed(1)} 秒</span></div>` : ''}
      <section class="result-prompt">
        <div class="result-prompt-header">
          <div><span>READY FOR AGENT</span><h3>直接交給 AI Agent</h3></div>
          <button class="copy-button" type="button" data-action="copy">複製 Prompt</button>
        </div>
        <details open>
          <summary>完整 Prompt</summary>
          <div class="prompt-outline">
            <section><h4>專案目標</h4><p>${escapeHtml(prompt.objective)}</p></section>
            ${prompt.deliverable ? `<section><h4>成品</h4><p>${escapeHtml(prompt.deliverable)}</p></section>` : ''}
            ${prompt.requirements.length ? `<section><h4>核心需求</h4><ul>${promptList(prompt.requirements)}</ul></section>` : ''}
            ${prompt.content_and_experience ? `<section><h4>內容與體驗</h4><p>${escapeHtml(prompt.content_and_experience)}</p></section>` : ''}
            ${prompt.tools_and_execution ? `<section><h4>工具與執行</h4><p>${escapeHtml(prompt.tools_and_execution)}</p></section>` : ''}
            ${prompt.acceptance_criteria.length ? `<section><h4>完成標準</h4><ul>${promptList(prompt.acceptance_criteria)}</ul></section>` : ''}
          </div>
        </details>
      </section>
      <section class="result-plan">
        <h3 class="result-section-title">專案說明</h3>
        <div class="result-card result-overview">
          <h3>專案概念</h3>
          <p>${escapeHtml(plan.overview)}</p>
          <h3>第一版</h3>
          <p>${escapeHtml(plan.first_version)}</p>
        </div>
        <div class="result-card">
          <h3>核心功能</h3>
          <ul class="direction-list">${namedList(plan.features)}</ul>
        </div>
        <div class="result-card">
          <h3>工具與技術</h3>
          <ul class="direction-list">${namedList(plan.tools)}</ul>
        </div>
        <div class="result-card">
          <h3>可能需要理解的知識</h3>
          <ul class="direction-list">${reasonedList(plan.learning, 'topic')}</ul>
        </div>
        <div class="result-card">
          <h3>為什麼這樣規劃</h3>
          <ul class="direction-list">${reasonedList(plan.rationale, 'decision')}</ul>
        </div>
      </section>
      <div class="result-actions">
        <a class="text-button" href="https://github.com/google-gemini/gemini-cli" target="_blank" rel="noreferrer">使用 Gemini CLI ↗</a>
        <button class="text-button" type="button" data-action="edit">修改 Project</button>
        <button class="text-button" type="button" data-action="restart">重新開始</button>
      </div>
    `;
    document.querySelector('#builder-shell').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function ensureAnonymousToken(force = false) {
    if (!force) {
      const existing = localStorage.getItem(ANON_KEY);
      if (existing) return existing;
    }
    const session = await apiRequest('/api/session', { method: 'POST' }, false);
    localStorage.setItem(ANON_KEY, session.token);
    return session.token;
  }

  async function prepareQuote() {
    const brief = createProjectPrompt();
    renderGenerating(selectedFiles.length ? '正在讀取附件並估算點數' : '正在估算這次的測試點數');
    try {
      const token = await ensureAnonymousToken();
      const form = new FormData();
      form.append('brief', brief.prompt);
      form.append('visualDetail', draft.materialVisual ? 'high' : 'low');
      selectedFiles.forEach((file) => form.append('files', file, file.name));
      const quote = await apiRequest('/api/quote', {
        method: 'POST',
        headers: { 'X-ScopeCut-Anonymous': token },
        body: form,
      }, false);
      renderQuote(quote);
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem(ANON_KEY);
        return prepareQuote();
      }
      goToStep(totalSteps - 1);
      showToast(error.message);
    }
  }

  async function startQuotedProject() {
    if (!currentQuote) return goToStep(totalSteps - 1);
    const brief = createProjectPrompt();
    renderGenerating();
    try {
      const token = await ensureAnonymousToken();
      const started = await apiRequest('/api/generate', {
        method: 'POST',
        headers: { 'X-ScopeCut-Anonymous': token },
        body: JSON.stringify({ quoteId: currentQuote.quoteId, brief: brief.prompt }),
      });
      const startedAt = Date.now();
      while (Date.now() - startedAt < 5 * 60 * 1000 + 15000) {
        await new Promise((resolve) => window.setTimeout(resolve, 2500));
        const result = await apiRequest(`/api/jobs/${encodeURIComponent(started.jobId)}`, {
          headers: { 'X-ScopeCut-Anonymous': token },
        });
        if (result.status === 'completed') {
          currentQuote = null;
          renderResult(result);
          return;
        }
      }
      throw new Error('這次整理超過五分鐘，請稍後再試');
    } catch (error) {
      goToStep(totalSteps - 1);
      showToast(error.message);
    }
  }

  async function copyPrompt() {
    const text = currentAgentPrompt;
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
        else return showToast(`最多選 ${limit} 項`);
      } else {
        draft[group] = value;
      }
      saveDraft();
      builder.querySelectorAll(`[data-choice-group="${group}"]`).forEach((button) => {
        const selected = Array.isArray(draft[group])
          ? draft[group].includes(button.dataset.choiceValue)
          : draft[group] === button.dataset.choiceValue;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
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
    if (action === 'generate') return prepareQuote();
    if (action === 'confirm-generation') return startQuotedProject();
    if (action === 'back-to-review') return goToStep(totalSteps - 1);
    if (action === 'clear-files') {
      selectedFiles = [];
      return renderStep();
    }
    if (action === 'copy') return copyPrompt();
    if (action === 'edit') return goToStep(0);
    if (action === 'restart') {
      draft = emptyDraft();
      selectedFiles = [];
      currentQuote = null;
      saveDraft();
      renderStep();
      return scrollToBuilder();
    }
  });

  document.querySelectorAll('[data-start]').forEach((button) => button.addEventListener('click', scrollToBuilder));

  async function apiRequest(path, options = {}, jsonBody = true) {
    if (!API_BASE) throw new Error('AI 服務尚未上線');
    const headers = { ...(options.headers || {}) };
    if (jsonBody && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch {
      throw new Error('目前無法連線 AI 服務');
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.error || '服務暫時無法使用');
      error.status = response.status;
      throw error;
    }
    return body;
  }

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

  renderStep();
  ensureAnonymousToken().catch(() => {});
})();
