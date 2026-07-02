'use strict';

const LS_KEY = 'message-studio-v1';
const $ = s => document.querySelector(s);

const phone = $('#phone');
const thread = $('#thread');
const topbar = $('#topbar');
const composer = $('#composer');

/* ---------------- state ---------------- */

function uid() { return Math.random().toString(36).slice(2, 10); }

function minsAgo(n) {
  const d = new Date(Date.now() - n * 60000);
  d.setSeconds(0, 0);
  return d.toISOString();
}

function defaultState() {
  return {
    contact: { name: 'Alex', avatar: null },
    battery: 82,
    showPercent: true,
    island: true,
    chrome: true,
    dark: false,
    receipt: 'delivered',
    messages: [
      { id: uid(), dir: 'received', text: "hey!! did you see it yet 👀", time: minsAgo(38) },
      { id: uid(), dir: 'sent', text: "see what", time: minsAgo(37) },
      { id: uid(), dir: 'received', text: "check the group chat lol", time: minsAgo(36) },
      { id: uid(), dir: 'received', text: "you're gonna lose it", time: minsAgo(36) },
      { id: uid(), dir: 'sent', text: "OMG 😭😭", time: minsAgo(3) },
      { id: uid(), dir: 'sent', text: "calling you rn", time: minsAgo(2) },
    ],
  };
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);
    const base = defaultState();
    return {
      ...base,
      ...saved,
      contact: { ...base.contact, ...(saved.contact || {}) },
      messages: Array.isArray(saved.messages) ? saved.messages : base.messages,
    };
  } catch (_) {
    return defaultState();
  }
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (_) {}
  }, 120);
}

/* ---------------- time formatting ---------------- */

function fmtClock(d) {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M\.?/i, '');
}

function fmtTime(d) {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function sepLabel(d) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startToday - day) / 864e5);
  let bold;
  if (diffDays <= 0) bold = 'Today';
  else if (diffDays === 1) bold = 'Yesterday';
  else if (diffDays < 7) bold = d.toLocaleDateString([], { weekday: 'long' });
  else {
    bold = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    if (d.getFullYear() !== now.getFullYear()) bold += ', ' + d.getFullYear();
  }
  return { bold, time: fmtTime(d) };
}

function toLocalInput(iso) {
  const d = new Date(iso);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ---------------- thread rendering ---------------- */

function sortedMessages() {
  return [...state.messages].sort((a, b) => new Date(a.time) - new Date(b.time));
}

function isJumbo(text) {
  try {
    const t = text.replace(/\s/g, '');
    return t.length > 0 &&
      /^(?:\p{Extended_Pictographic}(?:️)?(?:‍\p{Extended_Pictographic}(?:️)?)*){1,3}$/u.test(t);
  } catch (_) { return false; }
}

function renderThread() {
  const msgs = sortedMessages();
  thread.innerHTML = '';
  let prev = null;
  let lastSentEl = null;
  let lastSentTime = null;

  msgs.forEach((m, i) => {
    const t = new Date(m.time);

    if (!prev || t - new Date(prev.time) > 3600e3) {
      const sep = document.createElement('div');
      sep.className = 'sep';
      const lbl = sepLabel(t);
      const b = document.createElement('b');
      b.textContent = lbl.bold;
      sep.append(b, ' ' + lbl.time);
      thread.append(sep);
      prev = null;
    }

    const next = msgs[i + 1];
    const tail = !next || next.dir !== m.dir || (new Date(next.time) - t > 60e3);
    const groupStart = !prev || prev.dir !== m.dir;

    const el = document.createElement('div');
    el.className = `msg ${m.dir}${tail ? ' tail' : ''}${groupStart ? ' group-start' : ''}`;
    if (isJumbo(m.text)) el.classList.add('jumbo');
    el.textContent = m.text;
    thread.append(el);

    if (m.dir === 'sent') { lastSentEl = el; lastSentTime = t; }
    prev = m;
  });

  if (state.receipt !== 'none' && lastSentEl) {
    const r = document.createElement('div');
    r.className = 'receipt';
    r.textContent = state.receipt === 'read' ? 'Read ' + fmtTime(lastSentTime) : 'Delivered';
    lastSentEl.insertAdjacentElement('afterend', r);
  }

  thread.scrollTop = thread.scrollHeight;
}

/* ---------------- contact / status bar ---------------- */

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map(w => w[0]).join('') || '?').toUpperCase();
}

function renderContact() {
  $('#navName').textContent = state.contact.name || ' ';
  for (const el of [$('#navAvatar'), $('#avatarPreview')]) {
    if (state.contact.avatar) {
      el.classList.add('has-photo');
      el.style.backgroundImage = `url(${state.contact.avatar})`;
      el.textContent = '';
    } else {
      el.classList.remove('has-photo');
      el.style.backgroundImage = '';
      el.textContent = initials(state.contact.name || '?');
    }
  }
}

function renderStatus() {
  const pct = Math.max(1, Math.min(100, state.battery | 0));
  $('#batFill').style.width = pct + '%';
  $('#batNum').textContent = pct;
  $('#batVal').textContent = pct;
  const bat = document.querySelector('.battery');
  bat.classList.toggle('pct', state.showPercent);
  bat.classList.toggle('low', pct <= 20);
}

function tick() {
  $('#sbTime').textContent = fmtClock(new Date());
}

/* ---------------- layout ---------------- */

function applyFlags() {
  phone.classList.toggle('dark', state.dark);
  phone.classList.toggle('no-island', !state.island);
  phone.classList.toggle('no-chrome', !state.chrome);
  requestAnimationFrame(() => {
    thread.style.paddingTop = (topbar.offsetHeight + 10) + 'px';
    thread.style.paddingBottom = (composer.offsetHeight + 8) + 'px';
    thread.scrollTop = thread.scrollHeight;
  });
}

function fit() {
  const W = 390, H = 844;
  const vw = window.innerWidth, vh = window.innerHeight;
  const portrait = vh / vw >= 1.25; // phone/tablet held upright: fill edge-to-edge
  let s, h;
  if (portrait) {
    s = vw / W;
    h = Math.round(vh / s);
  } else {
    s = Math.min(vw / W, vh / H);
    h = H;
  }
  phone.style.height = h + 'px';
  phone.style.transform = s === 1 ? '' : `scale(${s})`;
  phone.classList.toggle('framed', !portrait);
  applyFlags();
}

/* ---------------- editor panel ---------------- */

function autosize(ta) {
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 'px';
}

function renderEditor() {
  const list = $('#msgList');
  list.innerHTML = '';
  for (const m of sortedMessages()) {
    const row = document.createElement('div');
    row.className = 'mrow';

    const top = document.createElement('div');
    top.className = 'mrow-top';

    const dirBtn = document.createElement('button');
    dirBtn.className = 'dir ' + m.dir;
    dirBtn.textContent = m.dir === 'sent' ? 'Me' : 'Them';
    dirBtn.title = 'Toggle sender';
    dirBtn.onclick = () => {
      m.dir = m.dir === 'sent' ? 'received' : 'sent';
      dirBtn.className = 'dir ' + m.dir;
      dirBtn.textContent = m.dir === 'sent' ? 'Me' : 'Them';
      save(); renderThread();
    };

    const timeInput = document.createElement('input');
    timeInput.type = 'datetime-local';
    timeInput.className = 'mtime';
    timeInput.value = toLocalInput(m.time);
    timeInput.onchange = () => {
      const d = new Date(timeInput.value);
      if (!isNaN(d)) {
        m.time = d.toISOString();
        save(); renderThread(); renderEditor();
      }
    };

    const del = document.createElement('button');
    del.className = 'del';
    del.textContent = '✕';
    del.title = 'Delete message';
    del.onclick = () => {
      state.messages = state.messages.filter(x => x.id !== m.id);
      save(); renderThread(); renderEditor();
    };

    top.append(dirBtn, timeInput, del);

    const ta = document.createElement('textarea');
    ta.rows = 1;
    ta.value = m.text;
    ta.placeholder = 'Message text…';
    ta.oninput = () => {
      m.text = ta.value;
      autosize(ta);
      save(); renderThread();
    };

    row.append(top, ta);
    list.append(row);
    autosize(ta);
  }
}

function addMessage(dir, text = '') {
  const d = new Date();
  d.setSeconds(0, 0);
  state.messages.push({ id: uid(), dir, text, time: d.toISOString() });
  save(); renderThread(); renderEditor();
  const tas = document.querySelectorAll('#msgList textarea');
  const last = tas[tas.length - 1];
  if (last && !text) last.focus();
}

function setAvatarFromFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const size = 160;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const r = Math.max(size / img.width, size / img.height);
    const w = img.width * r, h = img.height * r;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    state.contact.avatar = c.toDataURL('image/jpeg', 0.85);
    URL.revokeObjectURL(url);
    save(); renderContact();
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}

/* ---------------- panel open/close, fullscreen ---------------- */

function togglePanel(force) {
  document.body.classList.toggle('panel-open', force);
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  } else {
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el)?.catch?.(() => {});
  }
}

/* ---------------- wiring ---------------- */

function wire() {
  // contact
  $('#cName').oninput = e => { state.contact.name = e.target.value; save(); renderContact(); };
  $('#cAvatar').onchange = e => { setAvatarFromFile(e.target.files[0]); e.target.value = ''; };
  $('#cAvatarClear').onclick = () => { state.contact.avatar = null; save(); renderContact(); };

  // phone settings
  $('#battery').oninput = e => { state.battery = +e.target.value; save(); renderStatus(); };
  $('#showPercent').onchange = e => { state.showPercent = e.target.checked; save(); renderStatus(); };
  $('#islandChk').onchange = e => { state.island = e.target.checked; save(); applyFlags(); };
  $('#chrome').onchange = e => { state.chrome = e.target.checked; save(); applyFlags(); };
  $('#dark').onchange = e => { state.dark = e.target.checked; save(); applyFlags(); renderThread(); };
  $('#receipt').onchange = e => { state.receipt = e.target.value; save(); renderThread(); };

  // messages
  $('#addSent').onclick = () => addMessage('sent');
  $('#addRecv').onclick = () => addMessage('received');

  // actions
  $('#fsBtn').onclick = toggleFullscreen;
  $('#clearBtn').onclick = () => {
    if (confirm('Delete all messages?')) {
      state.messages = [];
      save(); renderThread(); renderEditor();
    }
  };
  $('#resetBtn').onclick = () => {
    if (confirm('Replace everything with the sample conversation?')) {
      state = defaultState();
      save(); renderAll();
    }
  };
  $('#exportBtn').onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'message-thread.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  $('#importFile').onchange = e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    f.text().then(txt => {
      const data = JSON.parse(txt);
      if (!data || !Array.isArray(data.messages)) throw new Error('bad file');
      const base = defaultState();
      state = { ...base, ...data, contact: { ...base.contact, ...(data.contact || {}) } };
      save(); renderAll();
    }).catch(() => alert('Could not read that file — export one from here first.'));
  };

  // panel toggles
  $('#editBtn').onclick = () => togglePanel(true);
  $('#closePanel').onclick = () => togglePanel(false);

  // composer acts like the real thing: type + send = new blue message at current time
  const input = $('#composerInput');
  const sendBtn = $('#sendBtn');
  const micIco = $('#micIco');
  const refreshComposer = () => {
    const has = input.value.trim().length > 0;
    sendBtn.hidden = !has;
    micIco.style.display = has ? 'none' : '';
  };
  input.oninput = refreshComposer;
  const sendNow = () => {
    const text = input.value.trim();
    if (!text) return;
    const d = new Date();
    d.setSeconds(0, 0);
    state.messages.push({ id: uid(), dir: 'sent', text, time: d.toISOString() });
    input.value = '';
    refreshComposer();
    save(); renderThread(); renderEditor();
    input.focus();
  };
  sendBtn.onclick = sendNow;
  input.onkeydown = e => { if (e.key === 'Enter') sendNow(); };
  refreshComposer();

  // keyboard shortcuts
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    if (e.key === 'e' || e.key === 'E') togglePanel();
    if (e.key === 'Escape') togglePanel(false);
  });

  // triple-tap the phone to reopen the editor (works in fullscreen / on touch)
  let taps = [];
  $('#stage').addEventListener('pointerdown', e => {
    if (e.target.closest('#composer')) return;
    const now = performance.now();
    taps = taps.filter(t => now - t < 650);
    taps.push(now);
    if (taps.length >= 3) { taps = []; togglePanel(true); }
  });

  document.addEventListener('fullscreenchange', () => {
    document.body.classList.toggle('fs', !!document.fullscreenElement);
    fit();
  });

  window.addEventListener('resize', fit);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
}

/* ---------------- init ---------------- */

function syncPanelInputs() {
  $('#cName').value = state.contact.name;
  $('#battery').value = state.battery;
  $('#showPercent').checked = state.showPercent;
  $('#islandChk').checked = state.island;
  $('#chrome').checked = state.chrome;
  $('#dark').checked = state.dark;
  $('#receipt').value = state.receipt;
}

function renderAll() {
  syncPanelInputs();
  renderContact();
  renderStatus();
  renderThread();
  renderEditor();
  applyFlags();
}

wire();
renderAll();
fit();
tick();
setInterval(tick, 1000);
