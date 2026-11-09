import { groupOf, groupsFor, skillsFor } from './groups.js';
import * as store from './store.js';

const $app = document.getElementById('app');
const $modal = document.getElementById('modal-root');
const CIRCLED = ['①', '②', '③', '④'];
const TIME_LIMIT = { reading: 70, listen: 60 }; // phút, như đề thật
const DRILL_SIZE = 10;

// ---------- Dữ liệu ----------
let INDEX = null;
const setCache = new Map();

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
async function loadIndex() {
  if (!INDEX) INDEX = await getJSON('data/index.json');
  return INDEX;
}
function setMeta(key) {
  return [...INDEX.reading, ...INDEX.listen].find(s => s.key === key);
}
async function loadSet(key) {
  if (setCache.has(key)) return setCache.get(key);
  const meta = setMeta(key);
  const data = await getJSON(`data/sets/${key}.json`);
  let explain = {};
  if (meta && meta.explained) {
    try { explain = await getJSON(`data/explain/${key}.json`); } catch (e) { explain = {}; }
  }
  const set = { ...data, explain };
  setCache.set(key, set);
  return set;
}

// ---------- Tiện ích ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Định dạng nhẹ cho lời giải: **đậm**, `ngữ pháp`, xuống dòng
const fmt = s => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/`(.+?)`/g, '<span class="gram">$1</span>')
  .replace(/\n/g, '<br>');
const sectionOf = key => key.startsWith('Listen') ? 'listen' : 'reading';
const sectionName = s => s === 'listen' ? 'Nghe' : 'Đọc';
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
function isOfficial(meta) { return Number(meta.label.replace(/\D/g, '')) > 50; }

// ---------- Định tuyến ----------
let session = null;
let timerId = null;

window.addEventListener('hashchange', route);
window.addEventListener('keydown', onKey);
route();

async function route() {
  clearInterval(timerId);
  closeModal();
  await loadIndex();
  const parts = (location.hash.replace(/^#\/?/, '') || 'read').split('/');
  const [view, a, b] = parts;
  document.querySelectorAll('[data-nav]').forEach(el =>
    el.classList.toggle('active', el.dataset.nav === view || (view === 'set' && el.dataset.nav === (sectionOf(a || '') === 'listen' ? 'listen' : 'read'))));
  window.scrollTo(0, 0);
  try {
    if (view === 'read' || view === 'listen') return renderHome(view === 'listen' ? 'listen' : 'reading');
    if (view === 'book') return renderBook();
    if (view === 'set') return startSet(a, b === 'exam' ? 'exam' : 'practice');
    if (view === 'result') return renderResult(a);
    if (view === 'review') return startReview(a === 'listen' ? 'listen' : 'reading');
    if (view === 'drill') return startDrill(a);
    if (view === 'search') return renderSearch(decodeURIComponent(a || ''));
    renderHome('reading');
  } catch (e) {
    console.error(e);
    $app.innerHTML = `<section class="wrap"><div class="notice">Không tải được dữ liệu. Kiểm tra kết nối mạng rồi tải lại trang.</div></section>`;
  }
}

// ---------- Trang chủ ----------
function renderHome(section) {
  session = null;
  const sets = INDEX[section];
  const st = store.stats();
  const due = store.dueCards(section).length;
  const hist = store.skillHistory();
  const skills = skillsFor(section);
  const groups = groupsFor(section);
  const explainedCount = sets.filter(s => s.explained).length;

  $app.innerHTML = `
  <section class="wrap home">
    <div class="home-head">
      <div>
        <p class="eyebrow">${section === 'listen' ? '듣기 · Nghe hiểu · 60 phút' : '읽기 · Đọc hiểu · 70 phút'}</p>
        <h1>${section === 'listen' ? 'Luyện nghe TOPIK II' : 'Luyện đọc TOPIK II'}</h1>
        <p class="lede">${sets.length} bộ đề, mỗi bộ 50 câu, 2 điểm/câu. Luyện tập để xem gợi ý và giải thích ngay sau mỗi câu; thi thử để bấm giờ như phòng thi.</p>
      </div>
      <form class="search" id="search-form" role="search">
        <label for="search-q" class="sr-only">Tìm trong đề</label>
        <input id="search-q" type="search" placeholder="Tìm từ, ngữ pháp trong đề… (vd: 는 바람에)" autocomplete="off">
        <button class="btn">Tìm</button>
      </form>
    </div>

    <div class="dash">
      <div class="dash-card review-card ${due ? 'has-due' : ''}">
        <div class="dash-num">${due}</div>
        <div class="dash-body">
          <h2>Câu cần ôn hôm nay</h2>
          <p>Câu sai hoặc "chưa chắc" quay lại theo lịch 1 → 3 → 7 → 16 ngày cho tới khi bạn làm đúng liên tục.</p>
          ${due ? `<a class="btn primary" href="#/review/${section === 'listen' ? 'listen' : 'read'}">Ôn ${due} câu</a>` : `<span class="muted small">Chưa có câu nào đến hạn.</span>`}
        </div>
      </div>
      <div class="dash-card">
        <h2>Độ chính xác theo kỹ năng</h2>
        <ul class="skill-bars">
          ${skills.map(sk => {
            const h = hist[sk];
            const p = h ? pct(h.right, h.total) : null;
            return `<li><span class="sk-name">${sk}</span>
              <span class="bar"><span style="width:${p ?? 0}%" class="${p == null ? '' : p >= 75 ? 'good' : p >= 50 ? 'mid' : 'low'}"></span></span>
              <span class="sk-val">${p == null ? '–' : p + '%'}</span></li>`;
          }).join('')}
        </ul>
        <p class="muted small">${st.answered ? `Đã làm ${st.answered} lượt câu · đúng ${pct(st.correct, st.answered)}%` : 'Làm xong một bộ đề để thấy điểm mạnh, điểm yếu.'}</p>
      </div>
    </div>

    <h2 class="section-title">Luyện theo dạng bài <span class="muted">· ${DRILL_SIZE} câu ngẫu nhiên từ mọi bộ đề</span></h2>
    <div class="drill-row">
      ${groups.map(g => `<a class="drill-chip" href="#/drill/${g.id}">
        <span class="range">${g.from}–${g.to}</span><span>${esc(g.vi.replace(/\.$/, ''))}</span></a>`).join('')}
    </div>

    <h2 class="section-title">Bộ đề <span class="muted">· ${explainedCount ? `${explainedCount} bộ đã có giải thích chi tiết` : 'giải thích chi tiết đang được bổ sung dần'}</span></h2>
    <div class="set-grid">
      ${sets.map(s => setCard(s)).join('')}
    </div>
  </section>`;

  document.getElementById('search-form').addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('search-q').value.trim();
    if (q) location.hash = `#/search/${encodeURIComponent(q)}`;
  });
}

function setCard(s) {
  const best = store.bestScore(s.key);
  const draft = store.getDraft(s.key);
  const last = store.lastAttempt(s.key);
  const official = isOfficial(s);
  return `<article class="set-card">
    <div class="set-top">
      <span class="set-no">${esc(s.label.replace('Bộ đề ', ''))}</span>
      <div class="set-tags">
        ${official ? `<span class="tag official">Kỳ ${esc(s.label.replace(/\D/g, ''))}</span>` : ''}
        ${s.explained ? `<span class="tag explained">Có giải thích</span>` : ''}
      </div>
    </div>
    <div class="set-score">
      ${best != null ? `<b>${best}</b><span>/100 cao nhất</span>` : last ? `<span>Đã luyện ${last.answered} câu</span>` : `<span class="muted">Chưa làm</span>`}
    </div>
    <div class="set-actions">
      <a class="btn" href="#/set/${s.key}/practice">${draft && draft.mode === 'practice' ? 'Làm tiếp' : 'Luyện tập'}</a>
      <a class="btn ghost" href="#/set/${s.key}/exam">${draft && draft.mode === 'exam' ? 'Thi tiếp' : 'Thi thử'}</a>
      ${last && last.mode === 'exam' ? `<a class="link small" href="#/result/${s.key}">Kết quả</a>` : ''}
    </div>
  </article>`;
}

// ---------- Tạo phiên làm bài ----------
async function startSet(key, mode) {
  const meta = setMeta(key);
  if (!meta) return renderHome('reading');
  const set = await loadSet(key);
  const section = sectionOf(key);
  const draft = store.getDraft(key);
  session = {
    kind: 'set', key, mode, section,
    title: `${sectionName(section)} · ${meta.label}`,
    audio: meta.audio,
    items: set.questions.map(q => ({ setKey: key, n: q.n })),
    idx: 0, picks: {}, tries: {}, revealed: {}, flags: {}, unsure: {},
    remaining: TIME_LIMIT[section] * 60,
  };
  if (draft && draft.mode === mode) Object.assign(session, draft.data);
  renderSession();
}

async function startReview(section) {
  const due = store.dueCards(section).slice(0, 30);
  if (!due.length) { location.hash = section === 'listen' ? '#/listen' : '#/read'; return; }
  const items = due.map(c => { const [setKey, n] = c.id.split(':'); return { setKey, n: +n }; });
  await Promise.all([...new Set(items.map(i => i.setKey))].map(loadSet));
  session = { kind: 'review', mode: 'practice', section, title: `Ôn câu sai · ${sectionName(section)}`,
    items, idx: 0, picks: {}, tries: {}, revealed: {}, flags: {}, unsure: {} };
  renderSession();
}

async function startDrill(groupId) {
  const section = groupId.startsWith('l-') ? 'listen' : 'reading';
  const g = groupsFor(section).find(x => x.id === groupId);
  if (!g) return renderHome(section);
  const sets = INDEX[section];
  // ưu tiên bộ có giải thích, rồi trộn với bộ khác
  const pool = [];
  for (const s of sets) for (let n = g.from; n <= g.to; n++) pool.push({ setKey: s.key, n, w: s.explained ? 2 : 1 });
  const picked = shuffle(pool).sort((a, b) => b.w - a.w + (Math.random() - .5) * 1.5).slice(0, DRILL_SIZE);
  await Promise.all([...new Set(picked.map(i => i.setKey))].map(loadSet));
  session = { kind: 'drill', mode: 'practice', section, title: `Dạng bài ${g.from}–${g.to} · ${g.skill}`,
    items: picked.map(({ setKey, n }) => ({ setKey, n })), idx: 0, picks: {}, tries: {}, revealed: {}, flags: {}, unsure: {} };
  renderSession();
}

async function startResultReview(key, attempt, startIdx) {
  const set = await loadSet(key);
  const meta = setMeta(key);
  const section = sectionOf(key);
  const revealed = {}; const picks = {};
  set.questions.forEach((q, i) => { revealed[i] = true; if (attempt.answers[i]) picks[i] = attempt.answers[i]; });
  session = { kind: 'result', key, mode: 'practice', section, title: `Xem lại · ${sectionName(section)} · ${meta.label}`,
    audio: meta.audio, items: set.questions.map(q => ({ setKey: key, n: q.n })), idx: startIdx || 0,
    picks, tries: {}, revealed, flags: {}, unsure: {}, readOnly: true };
  renderSession();
}

// ---------- Màn hình làm bài ----------
function qOf(item) {
  const set = setCache.get(item.setKey);
  const q = set.questions.find(x => x.n === item.n);
  const ex = set.explain[item.n] || null;
  // Đoạn văn dùng chung cho nhiều câu: lấy bản dịch từ câu đầu nhóm
  let passage = ex && ex.passage, passageFrom = null;
  if (ex && !passage && ex.passageRef) {
    passage = set.explain[ex.passageRef]?.passage;
    passageFrom = ex.passageRef;
  }
  // Đáp án web gốc nhập sai → dùng đáp án đã sửa (có ghi chú trong lời giải)
  const ans = ansOf(set, q);
  return { ...q, ans, origAns: q.ans, ex, passage, passageFrom, setKey: item.setKey, section: sectionOf(item.setKey) };
}

function ansOf(set, q) {
  return set.explain[q.n]?.correctedAns || q.ans;
}

function persistDraft() {
  if (!session || session.kind !== 'set') return;
  const { idx, picks, tries, revealed, flags, unsure, remaining } = session;
  store.saveDraft(session.key, { mode: session.mode, data: { idx, picks, tries, revealed, flags, unsure, remaining } });
}

function renderSession() {
  const s = session;
  const exam = s.mode === 'exam';
  const showAudio = s.section === 'listen';
  $app.innerHTML = `
  <section class="wrap exam ${exam ? 'is-exam' : 'is-practice'}">
    <div class="exam-bar">
      <a class="back" href="#/${s.section === 'listen' ? 'listen' : 'read'}" aria-label="Về danh sách">←</a>
      <div class="exam-title">
        <span class="mode-pill ${exam ? 'exam' : ''}">${exam ? 'Thi thử' : s.kind === 'review' ? 'Ôn tập' : s.kind === 'drill' ? 'Theo dạng' : s.kind === 'result' ? 'Xem lại' : 'Luyện tập'}</span>
        <h1>${esc(s.title)}</h1>
      </div>
      <div class="exam-tools">
        ${exam ? `<span class="timer" id="timer">${mmss(s.remaining)}</span>` : `<span class="progress-text" id="progress-text"></span>`}
        ${s.readOnly ? '' : `<button class="btn ${exam ? 'primary' : ''}" id="finish">${exam ? 'Nộp bài' : 'Kết thúc'}</button>`}
      </div>
    </div>
    ${showAudio ? audioBlock(s) : ''}
    <div class="exam-body">
      <div class="paper" id="paper"></div>
      <aside class="omr" aria-label="Phiếu trả lời">
        <div class="omr-head"><span>답안지</span><span class="muted small">Phiếu trả lời</span></div>
        <div class="omr-grid" id="omr"></div>
        <div class="omr-legend small muted">
          ${exam ? '<span><i class="lg picked"></i>Đã chọn</span><span><i class="lg flag"></i>Đánh dấu</span>'
                 : '<span><i class="lg ok"></i>Đúng</span><span><i class="lg bad"></i>Sai</span><span><i class="lg flag"></i>Đánh dấu</span>'}
        </div>
      </aside>
    </div>
  </section>`;

  document.getElementById('finish')?.addEventListener('click', confirmFinish);
  if (showAudio) bindAudio();
  if (exam) startTimer();
  renderQuestion();
  renderOMR();
}

function audioBlock(s) {
  const urls = [...new Set(s.items.map(i => setMeta(i.setKey).audio).filter(Boolean))];
  if (!urls.length) return '';
  const url = s.audio || urls[0];
  return `<div class="audio-bar">
    <audio id="audio" preload="none" src="${esc(url)}"></audio>
    <button class="btn audio-play" id="a-play" aria-label="Phát/Tạm dừng">▶</button>
    <button class="btn ghost small" data-seek="-5">−5s</button>
    <input type="range" id="a-seek" min="0" max="100" value="0" step="0.1" aria-label="Vị trí audio">
    <button class="btn ghost small" data-seek="5">+5s</button>
    <span class="a-time small" id="a-time">00:00</span>
    <select id="a-rate" aria-label="Tốc độ">
      <option value="0.8">0.8×</option><option value="1" selected>1×</option><option value="1.2">1.2×</option>
    </select>
    ${s.kind !== 'set' ? `<span class="small muted" id="a-note">File nghe của bộ đề chứa câu hiện tại</span>` : ''}
  </div>`;
}

function bindAudio() {
  const a = document.getElementById('audio');
  if (!a) return;
  const play = document.getElementById('a-play');
  const seek = document.getElementById('a-seek');
  const time = document.getElementById('a-time');
  play.onclick = () => a.paused ? a.play() : a.pause();
  a.onplay = () => play.textContent = '❚❚';
  a.onpause = () => play.textContent = '▶';
  a.ontimeupdate = () => {
    if (a.duration) seek.value = a.currentTime / a.duration * 100;
    time.textContent = `${mmss(Math.floor(a.currentTime))}${a.duration ? ' / ' + mmss(Math.floor(a.duration)) : ''}`;
  };
  seek.oninput = () => { if (a.duration) a.currentTime = seek.value / 100 * a.duration; };
  document.querySelectorAll('[data-seek]').forEach(b => b.onclick = () => { a.currentTime = Math.max(0, a.currentTime + +b.dataset.seek); });
  document.getElementById('a-rate').onchange = e => { a.playbackRate = +e.target.value; };
}

function syncAudioForItem() {
  const a = document.getElementById('audio');
  if (!a || session.kind === 'set') return;
  const url = setMeta(session.items[session.idx].setKey).audio;
  if (url && a.getAttribute('src') !== url) { a.pause(); a.setAttribute('src', url); }
}

function startTimer() {
  clearInterval(timerId);
  timerId = setInterval(() => {
    if (!session || session.mode !== 'exam') return clearInterval(timerId);
    session.remaining = Math.max(0, session.remaining - 1);
    const t = document.getElementById('timer');
    if (t) {
      t.textContent = mmss(session.remaining);
      t.classList.toggle('warn', session.remaining <= 300);
    }
    if (session.remaining % 15 === 0) persistDraft();
    if (session.remaining === 0) { clearInterval(timerId); finishSession(true); }
  }, 1000);
}

function renderQuestion() {
  const s = session;
  const i = s.idx;
  const item = s.items[i];
  const q = qOf(item);
  const g = groupOf(q.section, q.n);
  const exam = s.mode === 'exam';
  const revealed = !!s.revealed[i];
  const tries = s.tries[i] || [];
  const pick = s.picks[i];
  const ex = q.ex;
  const showHint = !exam && !revealed && tries.length === 1 && ex && ex.hint;
  const crossSet = s.kind !== 'set' && s.kind !== 'result';

  const optState = k => {
    if (exam) return pick === k ? 'picked' : '';
    if (revealed) {
      if (k === q.ans) return 'correct';
      if (tries.includes(k) || pick === k) return 'wrong';
      return 'dim';
    }
    return tries.includes(k) ? 'wrong' : '';
  };

  document.getElementById('paper').innerHTML = `
    <div class="q-meta">
      <span class="q-type">[${g.from}~${g.to}] ${esc(g.ko)}</span>
      <span class="q-type-vi">${esc(g.vi)}</span>
      ${crossSet ? `<span class="q-src">${esc(setMeta(item.setKey).label)} · câu ${q.n}</span>` : ''}
    </div>
    <figure class="q-figure">
      <img src="${esc(q.img)}" alt="Câu ${q.n}: ${esc((q.text || '').slice(0, 140))}" id="q-img">
    </figure>
    <div class="choices" role="group" aria-label="Chọn đáp án">
      ${[1, 2, 3, 4].map(k => `<button class="choice ${optState(k)}" data-k="${k}" ${revealed && !exam ? 'aria-disabled="true"' : ''}>
        <span class="bubble">${CIRCLED[k - 1]}</span>
        <span class="choice-label">${choiceLabel(k, q, revealed, exam, pick, tries)}</span></button>`).join('')}
    </div>
    <div class="q-tools">
      ${s.readOnly ? '' : `<button class="toggle ${s.flags[i] ? 'on' : ''}" id="flag" title="Phím F">⚑ ${exam ? 'Đánh dấu xem lại' : 'Đánh dấu'}</button>`}
      ${!exam && !revealed && !s.readOnly ? `<button class="toggle ${s.unsure[i] ? 'on' : ''}" id="unsure" title="Câu đúng nhưng chưa chắc vẫn được đưa vào sổ ôn">? Chưa chắc</button>` : ''}
      <span class="spacer"></span>
      <button class="btn ghost" id="prev" ${i === 0 ? 'disabled' : ''}>← Câu trước</button>
      <button class="btn" id="next">${i === s.items.length - 1 ? (s.readOnly ? 'Về kết quả' : exam ? 'Nộp bài' : 'Kết thúc') : 'Câu sau →'}</button>
    </div>
    <div id="feedback">${showHint ? hintBlock(ex) : ''}${!exam && revealed ? explainBlock(q, g, pick, tries) : ''}</div>
  `;

  document.querySelectorAll('.choice').forEach(b => b.addEventListener('click', () => choose(+b.dataset.k)));
  document.getElementById('flag')?.addEventListener('click', () => { s.flags[i] = !s.flags[i]; persistDraft(); renderQuestion(); renderOMR(); });
  document.getElementById('unsure')?.addEventListener('click', () => { s.unsure[i] = !s.unsure[i]; persistDraft(); renderQuestion(); });
  document.getElementById('prev').addEventListener('click', () => go(i - 1));
  document.getElementById('next').addEventListener('click', () => {
    if (i < s.items.length - 1) return go(i + 1);
    if (s.readOnly) location.hash = `#/result/${s.key}`; else confirmFinish();
  });
  document.querySelectorAll('[data-reveal]').forEach(b => b.addEventListener('click', () => {
    b.closest('.recall').classList.add('open');
  }));
  document.getElementById('give-up')?.addEventListener('click', () => reveal(i, false));
  updateProgress();
  syncAudioForItem();
  // tải trước ảnh câu tiếp theo
  const nx = s.items[i + 1];
  if (nx) { const im = new Image(); im.src = qOf(nx).img; }
}

function choiceLabel(k, q, revealed, exam, pick, tries) {
  if (exam || !revealed) return '';
  if (k === q.ans) return 'Đáp án đúng';
  if (pick === k || tries.includes(k)) return 'Bạn chọn';
  return '';
}

function hintBlock(ex) {
  return `<div class="hint">
    <div class="hint-head">Chưa đúng — thử nghĩ lại một chút</div>
    <p>${fmt(ex.hint)}</p>
    <p class="small muted">Chọn lại một đáp án khác, hoặc <button class="link" id="give-up">xem đáp án luôn</button>.</p>
  </div>`;
}

function explainBlock(q, g, pick, tries) {
  const ex = q.ex;
  const first = tries[0] ?? pick;
  const right = first === q.ans;
  const verdict = first == null ? '' :
    right ? `<div class="verdict ok">Đúng ngay lần đầu · đáp án ${CIRCLED[q.ans - 1]}</div>`
          : `<div class="verdict bad">Lần đầu bạn chọn ${CIRCLED[first - 1]} · đáp án đúng là ${CIRCLED[q.ans - 1]}</div>`;
  if (!ex) {
    return `${verdict || `<div class="verdict">Đáp án đúng: ${CIRCLED[q.ans - 1]}</div>`}
      <div class="explain">
        <h3>Mẹo cho dạng bài này</h3>
        <p>${fmt(g.tip)}</p>
        <p class="small muted">Giải thích chi tiết cho câu này đang được biên soạn. Câu sai đã được đưa vào sổ ôn.</p>
      </div>`;
  }
  return `${verdict}
    ${ex.fixNote ? `<div class="fix-note"><span class="label">Đã sửa đáp án</span><p>${fmt(ex.fixNote)}</p></div>` : ''}
    <div class="explain">
      ${ex.point ? `<div class="point"><span class="label">Kiến thức trọng tâm</span><span>${fmt(ex.point)}</span></div>` : ''}
      ${q.passage ? `<details class="trans" open><summary>${q.passage.length > 180 ? 'Dịch đoạn văn' : 'Dịch nghĩa'}${q.passageFrom ? ` <span class="muted small">· đoạn văn dùng chung với câu ${q.passageFrom}</span>` : ''}</summary>
          <div class="trans-body">${q.passage.split('\n').map(p => `<p>${fmt(p)}</p>`).join('')}</div></details>` : ''}
      ${ex.translate ? `<div class="key-sent"><span class="label">${q.passage ? 'Câu trọng tâm' : 'Dịch nghĩa'}</span><p>${fmt(ex.translate)}</p></div>` : ''}
      ${ex.explain ? `<h3>Vì sao chọn ${CIRCLED[q.ans - 1]}</h3><p>${fmt(ex.explain)}</p>` : ''}
      ${ex.options ? `<h3>Phân tích từng đáp án</h3><ul class="opt-list">${ex.options.map((o, k) =>
        `<li class="${k + 1 === q.ans ? 'is-ans' : ''} ${k + 1 === first && first !== q.ans ? 'is-pick' : ''}"><span class="bubble sm">${CIRCLED[k]}</span><span>${fmt(o)}</span></li>`).join('')}</ul>` : ''}
      ${ex.vocab && ex.vocab.length ? `<h3>Từ vựng</h3><dl class="vocab">${ex.vocab.map(([k, v]) => `<div><dt lang="ko">${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      ${ex.recall ? `<div class="recall"><div class="recall-head"><span class="label">Tự kiểm tra</span><span>${fmt(ex.recall.q)}</span></div>
          <button class="btn ghost small" data-reveal>Xem đáp án</button><div class="recall-a">${fmt(ex.recall.a)}</div></div>` : ''}
      <p class="tip small"><b>Mẹo dạng ${g.from}–${g.to}:</b> ${fmt(g.tip)}</p>
    </div>`;
}

function choose(k) {
  const s = session;
  const i = s.idx;
  if (s.readOnly) return;
  const q = qOf(s.items[i]);
  if (s.mode === 'exam') {
    s.picks[i] = s.picks[i] === k ? undefined : k;
    persistDraft(); renderQuestion(); renderOMR();
    return;
  }
  if (s.revealed[i]) return;
  const tries = (s.tries[i] ||= []);
  if (tries.includes(k)) return;
  tries.push(k);
  if (tries.length === 1) s.picks[i] = k;
  if (k === q.ans) return reveal(i, tries.length === 1);
  // sai lần đầu và có gợi ý → cho thử lại
  if (tries.length === 1 && q.ex && q.ex.hint) { persistDraft(); renderQuestion(); renderOMR(); return; }
  reveal(i, false);
}

function reveal(i, correct) {
  const s = session;
  const q = qOf(s.items[i]);
  s.revealed[i] = true;
  if (!s.picks[i] && s.tries[i]?.length) s.picks[i] = s.tries[i][0];
  store.recordAnswer(q.setKey, q.n, correct, { unsure: !!s.unsure[i], review: s.kind === 'review' });
  persistDraft();
  renderQuestion(); renderOMR();
  document.getElementById('feedback')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
}

function go(i) {
  if (i < 0 || i >= session.items.length) return;
  session.idx = i;
  persistDraft();
  renderQuestion(); renderOMR();
  document.getElementById('paper').scrollIntoView({ block: 'start', behavior: 'auto' });
  window.scrollBy(0, -80);
}

function renderOMR() {
  const s = session;
  const exam = s.mode === 'exam';
  document.getElementById('omr').innerHTML = s.items.map((item, i) => {
    const q = qOf(item);
    const p = s.picks[i];
    const rev = s.revealed[i];
    const status = exam ? (p ? 'picked' : '') : rev ? (((s.tries[i] || [])[0] ?? p) === q.ans ? 'ok' : 'bad') : '';
    return `<button class="omr-row ${i === s.idx ? 'cur' : ''} ${status} ${s.flags[i] ? 'flag' : ''}" data-i="${i}" aria-label="Câu ${i + 1}">
      <span class="omr-n">${s.kind === 'set' || s.kind === 'result' ? q.n : i + 1}</span>
      ${[1, 2, 3, 4].map(k => `<span class="omr-b ${p === k ? 'fill' : ''} ${!exam && rev && k === q.ans ? 'ans' : ''}"></span>`).join('')}
    </button>`;
  }).join('');
  document.querySelectorAll('.omr-row').forEach(b => b.addEventListener('click', () => go(+b.dataset.i)));
  document.querySelector('.omr-row.cur')?.scrollIntoView({ block: 'nearest' });
}

function updateProgress() {
  const el = document.getElementById('progress-text');
  if (!el) return;
  const s = session;
  const done = Object.keys(s.revealed).length;
  const right = s.items.reduce((n, item, i) => {
    if (!s.revealed[i]) return n;
    const q = qOf(item);
    return n + (((s.tries[i] || [])[0] ?? s.picks[i]) === q.ans ? 1 : 0);
  }, 0);
  el.textContent = s.readOnly ? `Câu ${s.idx + 1}/${s.items.length}` : `${done}/${s.items.length} câu · đúng ${right}`;
}

function onKey(e) {
  if (!session || $modal.innerHTML || /input|select|textarea/i.test(e.target.tagName)) return;
  if (['1', '2', '3', '4'].includes(e.key)) { choose(+e.key); e.preventDefault(); }
  else if (e.key === 'ArrowRight') go(session.idx + 1);
  else if (e.key === 'ArrowLeft') go(session.idx - 1);
  else if (e.key.toLowerCase() === 'f' && !session.readOnly) document.getElementById('flag')?.click();
}

// ---------- Nộp bài ----------
function confirmFinish() {
  const s = session;
  const total = s.items.length;
  const answered = s.mode === 'exam' ? Object.values(s.picks).filter(Boolean).length : Object.keys(s.revealed).length;
  const flagged = Object.values(s.flags).filter(Boolean).length;
  openModal(`
    <h2>${s.mode === 'exam' ? 'Nộp bài?' : 'Kết thúc buổi luyện?'}</h2>
    <p>Bạn đã ${s.mode === 'exam' ? 'chọn' : 'làm'} <b>${answered}/${total}</b> câu${flagged ? `, còn <b>${flagged}</b> câu đánh dấu xem lại` : ''}.</p>
    ${s.mode === 'exam' && answered < total ? `<p class="small muted">Câu bỏ trống tính là sai. Trong phòng thi thật, đừng để trống câu nào.</p>` : ''}
    <div class="modal-actions">
      <button class="btn ghost" data-close>Làm tiếp</button>
      <button class="btn primary" id="do-finish">${s.mode === 'exam' ? 'Nộp bài' : 'Kết thúc'}</button>
    </div>`);
  document.getElementById('do-finish').onclick = () => finishSession(false);
}

function finishSession(timeUp) {
  const s = session;
  clearInterval(timerId);
  closeModal();
  const bySkill = {};
  let right = 0, answered = 0;
  const answers = [];
  s.items.forEach((item, i) => {
    const q = qOf(item);
    const g = groupOf(q.section, q.n);
    const first = (s.tries[i] || [])[0] ?? s.picks[i];
    const done = s.mode === 'exam' || s.revealed[i];
    answers[i] = s.picks[i] || null;
    if (!done) return;
    answered++;
    const ok = first === q.ans;
    if (ok) right++;
    const sk = (bySkill[g.skill] ||= { right: 0, total: 0 });
    sk.total++; if (ok) sk.right++;
    if (s.mode === 'exam') store.recordAnswer(q.setKey, q.n, ok);
  });
  const attempt = { date: Date.now(), mode: s.mode, score: right * 2, right, answered, total: s.items.length, bySkill, answers,
    used: s.mode === 'exam' ? TIME_LIMIT[s.section] * 60 - s.remaining : null, timeUp };
  if (s.kind === 'set') {
    store.saveAttempt(s.key, attempt);
    if (s.mode === 'exam') { location.hash = `#/result/${s.key}`; return; }
  }
  renderSummary(attempt);
}

// Tóm tắt nhanh cho luyện tập / ôn tập / theo dạng
function renderSummary(a) {
  const s = session;
  const wrong = s.items.map((item, i) => ({ item, i, q: qOf(item) }))
    .filter(({ i, q }) => s.revealed[i] && ((s.tries[i] || [])[0] ?? s.picks[i]) !== q.ans);
  $app.innerHTML = `
  <section class="wrap result">
    <p class="eyebrow">${esc(s.title)}</p>
    <h1>Đúng ${a.right}/${a.answered} câu đã làm</h1>
    ${skillTable(a.bySkill)}
    ${wrong.length ? `<h2 class="section-title">Câu làm sai đã vào sổ ôn</h2>
      <ul class="wrong-list">${wrong.map(({ q }) => `<li><span>${esc(setMeta(q.setKey).label)} · câu ${q.n}</span><span class="muted">${esc(groupOf(q.section, q.n).skill)}</span></li>`).join('')}</ul>` : ''}
    <div class="result-actions">
      <a class="btn primary" href="#/${s.section === 'listen' ? 'listen' : 'read'}">Về trang chính</a>
      ${s.kind === 'drill' ? `<button class="btn" id="again">Luyện thêm ${DRILL_SIZE} câu dạng này</button>` : ''}
    </div>
  </section>`;
  document.getElementById('again')?.addEventListener('click', () => route());
  session = null;
}

function skillTable(bySkill) {
  const rows = Object.entries(bySkill);
  if (!rows.length) return '';
  return `<table class="skill-table"><thead><tr><th>Kỹ năng</th><th>Đúng</th><th class="w">Tỉ lệ</th></tr></thead><tbody>
    ${rows.map(([k, v]) => { const p = pct(v.right, v.total); return `<tr><td>${esc(k)}</td><td class="num">${v.right}/${v.total}</td>
      <td><span class="bar"><span style="width:${p}%" class="${p >= 75 ? 'good' : p >= 50 ? 'mid' : 'low'}"></span></span><span class="num small">${p}%</span></td></tr>`; }).join('')}
  </tbody></table>`;
}

// ---------- Kết quả thi thử ----------
async function renderResult(key) {
  const meta = setMeta(key);
  const list = store.attemptsOf(key).filter(a => a.mode === 'exam');
  const a = list[list.length - 1];
  if (!a) { location.hash = `#/set/${key}/exam`; return; }
  const set = await loadSet(key);
  const section = sectionOf(key);
  session = null;
  const weakest = Object.entries(a.bySkill).filter(([, v]) => v.total >= 2).sort((x, y) => x[1].right / x[1].total - y[1].right / y[1].total)[0];
  const prev = list.length > 1 ? list[list.length - 2].score : null;

  $app.innerHTML = `
  <section class="wrap result">
    <a class="back-link" href="#/${section === 'listen' ? 'listen' : 'read'}">← ${sectionName(section)}</a>
    <div class="score-head">
      <div class="score-big"><b>${a.score}</b><span>/100</span></div>
      <div>
        <p class="eyebrow">${sectionName(section)} · ${esc(meta.label)}${a.timeUp ? ' · hết giờ' : ''}</p>
        <h1>Đúng ${a.right}/${a.total} câu</h1>
        <p class="muted">Thời gian ${mmss(a.used || 0)} / ${TIME_LIMIT[section]}:00${prev != null ? ` · lần trước ${prev} điểm (${a.score - prev >= 0 ? '+' : ''}${a.score - prev})` : ''}</p>
        ${weakest ? `<p class="advice">Cần tập trung nhất: <b>${esc(weakest[0])}</b> (${weakest[1].right}/${weakest[1].total}). Các câu sai đã vào sổ ôn, sẽ quay lại theo lịch.</p>` : ''}
      </div>
    </div>
    ${skillTable(a.bySkill)}
    <h2 class="section-title">Bảng đáp án <span class="muted">· bấm vào câu để xem giải thích</span></h2>
    <div class="answer-grid">
      ${set.questions.map((q, i) => { const p = a.answers[i]; const ans = ansOf(set, q); const ok = p === ans;
        return `<button class="ans-cell ${ok ? 'ok' : p ? 'bad' : 'skip'}" data-i="${i}">
          <span class="n">${q.n}</span><span class="v">${p ? CIRCLED[p - 1] : '–'}${ok ? '' : `<em>${CIRCLED[ans - 1]}</em>`}</span></button>`; }).join('')}
    </div>
    <div class="result-actions">
      <button class="btn primary" id="review-wrong">Xem lại các câu sai</button>
      <a class="btn" href="#/set/${key}/exam">Thi lại</a>
    </div>
  </section>`;
  document.querySelectorAll('.ans-cell').forEach(b => b.addEventListener('click', () => startResultReview(key, a, +b.dataset.i)));
  document.getElementById('review-wrong').addEventListener('click', () => {
    const firstWrong = set.questions.findIndex((q, i) => a.answers[i] !== ansOf(set, q));
    startResultReview(key, a, Math.max(0, firstWrong));
  });
}

// ---------- Sổ câu sai ----------
async function renderBook() {
  session = null;
  const cards = store.allCards().sort((a, b) => b.wrong - a.wrong || b.last - a.last);
  const st = store.stats();
  const now = Date.now();
  $app.innerHTML = `
  <section class="wrap book">
    <p class="eyebrow">오답 노트</p>
    <h1>Sổ câu sai</h1>
    <p class="lede">Mọi câu bạn làm sai hoặc đánh dấu "chưa chắc". Làm đúng khi ôn thì câu được giãn lịch; đúng 5 lần liên tiếp là coi như đã thuộc.</p>
    <div class="book-stats">
      <div><b>${st.inBook}</b><span>đang ôn</span></div>
      <div><b>${store.dueCards().length}</b><span>đến hạn hôm nay</span></div>
      <div><b>${st.mastered}</b><span>đã thuộc</span></div>
    </div>
    <div class="result-actions">
      <a class="btn primary" href="#/review/read">Ôn câu đọc</a>
      <a class="btn" href="#/review/listen">Ôn câu nghe</a>
    </div>
    ${cards.length ? `<table class="book-table"><thead><tr><th>Câu</th><th>Dạng</th><th>Sai</th><th>Lịch ôn</th><th></th></tr></thead><tbody>
      ${cards.map(c => { const [k, n] = c.id.split(':'); const m = setMeta(k); if (!m) return '';
        const box = c.box >= store.BOX_DAYS.length ? 'Đã thuộc' : c.due <= now ? 'Hôm nay' : `${Math.ceil((c.due - now) / 86400000)} ngày nữa`;
        return `<tr><td>${sectionName(sectionOf(k))} · ${esc(m.label)} · câu ${n}</td><td>${esc(groupOf(sectionOf(k), +n).skill)}</td>
          <td class="num">${c.wrong}${c.unsure ? ' <span class="tag">chưa chắc</span>' : ''}</td><td>${box}</td>
          <td><button class="link small" data-del="${esc(c.id)}">Bỏ</button></td></tr>`; }).join('')}
    </tbody></table>` : `<div class="notice">Sổ đang trống. Hãy luyện một bộ đề — câu sai sẽ tự động được ghi vào đây.</div>`}
    <p class="small muted" style="margin-top:2rem">Tiến độ được lưu trên trình duyệt này. <button class="link small" id="reset">Xoá toàn bộ tiến độ</button></p>
  </section>`;
  document.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { store.removeCard(b.dataset.del); renderBook(); }));
  document.getElementById('reset').addEventListener('click', () => {
    openModal(`<h2>Xoá toàn bộ tiến độ?</h2><p>Điểm các lần thi, sổ câu sai và bài đang làm dở sẽ bị xoá khỏi trình duyệt này. Không thể hoàn tác.</p>
      <div class="modal-actions"><button class="btn ghost" data-close>Huỷ</button><button class="btn danger" id="do-reset">Xoá</button></div>`);
    document.getElementById('do-reset').onclick = () => { store.resetAll(); closeModal(); renderBook(); };
  });
}

// ---------- Tìm kiếm ----------
async function renderSearch(q) {
  session = null;
  $app.innerHTML = `<section class="wrap"><p class="muted">Đang tìm “${esc(q)}”…</p></section>`;
  const all = [...INDEX.reading, ...INDEX.listen];
  await Promise.all(all.map(s => loadSet(s.key)));
  const needle = q.replace(/\s+/g, '').toLowerCase();
  const hits = [];
  for (const s of all) {
    const set = setCache.get(s.key);
    for (const qq of set.questions) {
      const flat = (qq.text || '').replace(/\s+/g, '');
      const ex = set.explain[qq.n];
      const exFlat = ex ? JSON.stringify(ex).replace(/\s+/g, '').toLowerCase() : '';
      const at = flat.toLowerCase().indexOf(needle);
      if (at >= 0 || exFlat.includes(needle)) {
        const line = (qq.text || '').split('\n').find(l => l.replace(/\s+/g, '').toLowerCase().includes(needle)) || (qq.text || '').split('\n')[1] || '';
        hits.push({ s, q: qq, line, inExplain: at < 0 });
      }
    }
  }
  const hl = line => esc(line);
  $app.innerHTML = `
  <section class="wrap search-page">
    <form class="search" id="search-form" role="search">
      <label for="search-q" class="sr-only">Tìm trong đề</label>
      <input id="search-q" type="search" value="${esc(q)}" autocomplete="off">
      <button class="btn">Tìm</button>
    </form>
    <h1>${hits.length} câu có “${esc(q)}”</h1>
    <p class="muted small">Tìm trong chữ của đề (nhận dạng tự động từ ảnh, có thể sót) và trong lời giải.</p>
    ${hits.length ? `<div class="hit-actions"><button class="btn primary" id="drill-hits">Luyện ${Math.min(hits.length, 20)} câu này</button></div>` : ''}
    <ul class="hits">
      ${hits.slice(0, 200).map(h => `<li><a href="#" data-key="${h.s.key}" data-n="${h.q.n}">
        <span class="hit-src">${sectionName(sectionOf(h.s.key))} · ${esc(h.s.label)} · câu ${h.q.n}${h.inExplain ? ' · trong lời giải' : ''}</span>
        <span class="hit-line" lang="ko">${hl(h.line)}</span></a></li>`).join('')}
    </ul>
  </section>`;
  document.getElementById('search-form').addEventListener('submit', e => {
    e.preventDefault();
    const v = document.getElementById('search-q').value.trim();
    if (v) location.hash = `#/search/${encodeURIComponent(v)}`;
  });
  const startHits = (list, startIdx = 0) => {
    const section = sectionOf(list[0].s.key);
    const items = list.filter(h => sectionOf(h.s.key) === section).map(h => ({ setKey: h.s.key, n: h.q.n }));
    session = { kind: 'drill', mode: 'practice', section, title: `Tìm “${q}”`, items, idx: startIdx,
      picks: {}, tries: {}, revealed: {}, flags: {}, unsure: {} };
    renderSession();
  };
  document.getElementById('drill-hits')?.addEventListener('click', () => startHits(hits.slice(0, 20)));
  document.querySelectorAll('.hits a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const i = hits.findIndex(h => h.s.key === a.dataset.key && h.q.n === +a.dataset.n);
    const same = hits.filter(h => sectionOf(h.s.key) === sectionOf(a.dataset.key));
    startHits(same, same.indexOf(hits[i]));
  }));
}

// ---------- Hộp thoại ----------
function openModal(html) {
  $modal.innerHTML = `<div class="modal-back" data-close></div><div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  $modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  $modal.querySelector('.modal .btn.primary, .modal .btn.danger')?.focus();
}
function closeModal() { $modal.innerHTML = ''; }
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
