// Lưu tiến độ trên trình duyệt (localStorage).
// Ôn tập ngắt quãng kiểu Leitner: làm sai → hộp 0; làm đúng khi ôn → lên hộp, giãn lịch ôn.

const KEY = 'topik-on-thi.v1';
const DAY = 86400000;
export const BOX_DAYS = [0, 1, 3, 7, 16]; // hộp 0 ôn ngay, hộp 5 = đã thuộc

const empty = () => ({ attempts: {}, cards: {}, drafts: {}, stats: { answered: 0, correct: 0 } });
let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(empty(), JSON.parse(raw));
  } catch (e) { /* trình duyệt chặn lưu trữ */ }
  return empty();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* bỏ qua */ }
}

export const qid = (setKey, n) => `${setKey}:${n}`;

// Ghi nhận một lần trả lời (dùng cho cả luyện tập, thi thử, ôn tập)
export function recordAnswer(setKey, n, correct, { unsure = false, review = false } = {}) {
  state.stats.answered++;
  if (correct) state.stats.correct++;
  const id = qid(setKey, n);
  const now = Date.now();
  let c = state.cards[id];
  if (!correct || unsure) {
    c = c || { box: 0, wrong: 0, seen: 0 };
    if (!correct) c.wrong++;
    c.box = 0;
    c.due = now; // cần ôn ngay
    c.last = now;
    c.unsure = unsure && correct;
    state.cards[id] = c;
  } else if (c) {
    // đúng một câu đang nằm trong sổ ôn
    if (review || now >= (c.due || 0)) {
      c.box = Math.min(c.box + 1, BOX_DAYS.length);
      c.due = c.box >= BOX_DAYS.length ? Infinity : now + BOX_DAYS[c.box] * DAY;
    }
    c.last = now;
    c.unsure = false;
  }
  if (c) c.seen = (c.seen || 0) + 1;
  save();
}

export function dueCards(section) {
  const now = Date.now();
  return Object.entries(state.cards)
    .filter(([id, c]) => c.box < BOX_DAYS.length && (c.due ?? 0) <= now)
    .filter(([id]) => !section || id.toLowerCase().startsWith(section === 'listen' ? 'listen' : 'reading'))
    .sort((a, b) => (b[1].wrong - a[1].wrong) || (a[1].due - b[1].due))
    .map(([id, c]) => ({ id, ...c }));
}

export function allCards() {
  return Object.entries(state.cards).map(([id, c]) => ({ id, ...c }));
}

export function removeCard(id) { delete state.cards[id]; save(); }

export function saveAttempt(setKey, attempt) {
  (state.attempts[setKey] ||= []).push(attempt);
  delete state.drafts[setKey];
  save();
}
export function attemptsOf(setKey) { return state.attempts[setKey] || []; }
export function bestScore(setKey) {
  const a = attemptsOf(setKey).filter(x => x.mode === 'exam');
  return a.length ? Math.max(...a.map(x => x.score)) : null;
}
export function lastAttempt(setKey) {
  const a = attemptsOf(setKey);
  return a[a.length - 1] || null;
}

export function saveDraft(setKey, draft) { state.drafts[setKey] = draft; save(); }
export function getDraft(setKey) { return state.drafts[setKey] || null; }
export function clearDraft(setKey) { delete state.drafts[setKey]; save(); }

export function stats() {
  const cards = Object.values(state.cards);
  return {
    ...state.stats,
    inBook: cards.filter(c => c.box < BOX_DAYS.length).length,
    mastered: cards.filter(c => c.box >= BOX_DAYS.length).length,
  };
}

// Độ chính xác theo nhóm kỹ năng, tính trên mọi lần thi thử + luyện tập đã nộp
export function skillHistory() {
  const out = {};
  for (const list of Object.values(state.attempts)) {
    for (const a of list) {
      for (const [skill, v] of Object.entries(a.bySkill || {})) {
        const o = (out[skill] ||= { right: 0, total: 0 });
        o.right += v.right; o.total += v.total;
      }
    }
  }
  return out;
}

export function resetAll() { state = empty(); save(); }
