/**
 * 把規劃文件寫進 WikiNB 的 wiki/Projects/,並比照 WikiNB Bridge 的同步習慣:
 * 更新 _meta.json、index.md 索引,最後 git commit + push(只動 wiki/)。
 */
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function resolveBin(name) {
  for (const dir of ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin']) {
    const full = path.join(dir, name);
    if (fs.existsSync(full)) return full;
  }
  return name;
}
const GIT_BIN = resolveBin('git');

export function wikinbRoot() {
  return process.env.WIKINB_ROOT || '/Users/kaine/Desktop/Projects/WikiNB';
}

function wikiDir() {
  return path.join(wikinbRoot(), 'wiki');
}

function yamlScalar(value) {
  const v = String(value ?? '');
  if (v === '') return '""';
  if (/[:#{}[\],&*?|>!%@`]/.test(v) || /^\s|\s$/.test(v) || /[\n"']/.test(v)) {
    return JSON.stringify(v);
  }
  return v;
}

function buildFrontmatter({ title, description, tags, date }) {
  const tagBlock =
    !tags || tags.length === 0
      ? 'tags: []\n'
      : `tags:\n${tags.map((t) => `  - ${yamlScalar(t)}`).join('\n')}\n`;
  return `---\ntitle: ${yamlScalar(title)}\ndescription: ${yamlScalar(description)}\ntype: note\nstatus: active\n${tagBlock}date: ${yamlScalar(date)}\n---\n`;
}

/** 檔名淨化:比照 WikiNB(中文/英文/數字/_/-/.) */
export function sanitizeStem(input, fallback = 'project') {
  let stem = String(input || '')
    .trim()
    .replace(/\.md$/i, '')
    .replace(/[^\w.\-()\u4e00-\u9fff]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!stem || stem === '.' || stem === '..' || stem.toLowerCase() === 'index') {
    stem = `${fallback}-${Date.now()}`;
  }
  return stem.slice(0, 120);
}

function uniqueStem(dir, stem) {
  let name = stem;
  let n = 2;
  while (fs.existsSync(path.join(dir, `${name}.md`))) {
    name = `${stem}-${n}`;
    n += 1;
  }
  return name;
}

function updateMetaJson(slug, { title, description, tags }) {
  const metaPath = path.join(wikiDir(), '_meta.json');
  let store = {};
  try {
    if (fs.existsSync(metaPath)) {
      const raw = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) store = raw;
    }
  } catch {
    store = {};
  }
  store[slug] = { title, description, tags: tags || [] };
  fs.writeFileSync(metaPath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

/** 比照 WikiNB Bridge:在 index.md 的「## 筆記」段落補上連結 */
function upsertIndexLink(slug, label) {
  const indexPath = path.join(wikiDir(), 'index.md');
  let text = fs.existsSync(indexPath)
    ? fs.readFileSync(indexPath, 'utf8')
    : '# Kainnne 知識庫索引\n\n## 筆記\n\n';

  const today = new Date().toISOString().slice(0, 10);
  // WikiNB index 使用全形冒號「：」；同時相容半形「:」
  if (/> 最後更新[：:]\d{4}-\d{2}-\d{2}/.test(text)) {
    text = text.replace(/> 最後更新[：:]\d{4}-\d{2}-\d{2}/, `> 最後更新：${today}`);
  }

  const link = label ? `- [[${slug}]] — ${label}` : `- [[${slug}]]`;
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (text.includes(`[[${slug}]]`)) {
    text = text.replace(new RegExp(`^- \\[\\[${escaped}\\]\\][^\\n]*$`, 'm'), link);
    fs.writeFileSync(indexPath, text, 'utf8');
    return;
  }

  const sectionHeader = '## 筆記';
  const headerIdx = text.indexOf(sectionHeader);
  if (headerIdx === -1) {
    text += `\n${sectionHeader}\n\n${link}\n`;
    fs.writeFileSync(indexPath, text, 'utf8');
    return;
  }

  const afterHeader = headerIdx + sectionHeader.length;
  let sectionEnd = text.length;
  for (const h of ['## 學習中', '## 元資料']) {
    const i = text.indexOf(`\n${h}`, afterHeader);
    if (i !== -1 && i < sectionEnd) sectionEnd = i;
  }
  const before = text.slice(0, sectionEnd).replace(/\s*$/, '\n');
  const after = text.slice(sectionEnd).replace(/^\n*/, '\n');
  fs.writeFileSync(indexPath, `${before}\n${link}\n${after}`, 'utf8');
}

function gitErr(err) {
  return String(err?.stderr || err?.stdout || err?.message || err || '').trim().slice(0, 500);
}

async function gitCommitAndPush(stem, onStatus) {
  const root = wikinbRoot();
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };

  try {
    await execFileAsync(GIT_BIN, ['add', '-A', '--', 'wiki/'], { cwd: root });
  } catch (err) {
    throw new Error(`git add 失敗:${gitErr(err)}`);
  }

  let committed = false;
  try {
    await execFileAsync(
      GIT_BIN,
      ['commit', '-m', `scopecut: add project contract ${stem}`],
      { cwd: root, env },
    );
    committed = true;
  } catch (err) {
    const msg = gitErr(err);
    if (!/nothing to commit|no changes added|clean working tree/i.test(msg)) {
      throw new Error(`git commit 失敗:${msg}`);
    }
  }

  onStatus?.('正在推送至 GitHub(WikiNB)…');
  try {
    await execFileAsync(GIT_BIN, ['push', 'origin', 'HEAD'], {
      cwd: root,
      env,
      timeout: 300000,
    });
  } catch (err) {
    throw new Error(
      `git push 失敗(文件已存到本機,但還沒推上 GitHub)。細節:${gitErr(err)}`,
    );
  }

  const { stdout: hash } = await execFileAsync(GIT_BIN, ['rev-parse', '--short', 'HEAD'], {
    cwd: root,
  });
  return { committed, commit: hash.trim() };
}

/**
 * 儲存文件並同步。回傳 { absPath, relPath, slug, pageUrl, pushed, commit }。
 */
export async function saveAndSync({ title, slug, description, tags, body }, { onStatus } = {}) {
  const projectsDir = path.join(wikiDir(), 'Projects');
  fs.mkdirSync(projectsDir, { recursive: true });

  const date = new Date().toISOString().slice(0, 10);
  const stem = uniqueStem(projectsDir, sanitizeStem(`${date}-${slug || title}`));
  const wikiSlug = `Projects/${stem}`;
  const absPath = path.join(projectsDir, `${stem}.md`);
  const displayTitle = title || stem;

  const frontmatter = buildFrontmatter({
    title: displayTitle,
    description: description || '',
    tags,
    date,
  });
  fs.writeFileSync(absPath, `${frontmatter}\n${body.trim()}\n`, 'utf8');
  onStatus?.(`已寫入 wiki/Projects/${stem}.md`);

  updateMetaJson(wikiSlug, { title: displayTitle, description, tags });
  upsertIndexLink(wikiSlug, displayTitle);

  let pushed = false;
  let commit = '';
  if (process.env.SCOPECUT_GIT_PUSH !== 'false') {
    const result = await gitCommitAndPush(stem, onStatus);
    pushed = true;
    commit = result.commit;
  }

  return {
    absPath,
    relPath: `wiki/Projects/${stem}.md`,
    slug: wikiSlug,
    pageUrl: `https://zx50416.github.io/WikiNB/wiki/${encodeURI(wikiSlug)}/`,
    pushed,
    commit,
  };
}
