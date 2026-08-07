'use strict';
const $ = id => document.getElementById(id);
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

$('year').textContent = new Date().getFullYear();

/* Copy the address ------------------------------------------------------ */
for (const id of ['', '2']) {
  const btn = $('copy' + id);
  btn.addEventListener('click', async () => {
    const ip = $('ip' + id).textContent.trim();
    try { await navigator.clipboard.writeText(ip); }
    catch { const t = document.createElement('textarea');
      t.value = ip; document.body.appendChild(t); t.select();
      document.execCommand('copy'); t.remove(); }
    btn.textContent = 'Copied!'; btn.dataset.done = '';
    setTimeout(() => { btn.textContent = 'Copy IP'; delete btn.dataset.done; }, 1800);
  });
}

/* Names the feed and the ledger kill each other with. Invented, not real. */
const NAMES = ['Brickable', 'TenHeartTerry', 'gh0stpepper', 'xX_VoidLine_Xx',
  'NoSkinNolan', 'Kelvriss', 'soupcan', 'WitherW0lf', 'BedlessBex',
  'PotatoWithAPlan', 'Miner_Mo', 'CleanestSteve', 'obsidianna', 'fullnetheriteguy'];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

/* The heart ledger ------------------------------------------------------
   Twenty slots, ten filled, and the server's three moves as buttons. A short
   scripted beat plays on load until the visitor takes over. */
(() => {
  const row = $('hearts'), count = $('hcount'), note = $('hnote');
  const inv = $('inv'), invCount = $('inv-count');
  const MAX = 20, FLOOR = 1;
  let n = 10, held = 0, driven = false;
  const slots = [];

  for (let i = 0; i < MAX; i++) {
    const s = document.createElement('span');
    s.innerHTML = '<svg viewBox="0 0 16 16"><use href="#i-heart"/></svg>';
    if (i < n) s.dataset.on = '';
    row.append(s);
    slots.push(s);
  }

  const say = (html, flag) => {
    count.textContent = n;
    delete count.dataset.gain; delete count.dataset.loss;
    if (flag) count.dataset[flag] = '';
    row.setAttribute('aria-label', `${n} of ${MAX} heart slots filled`);
    note.innerHTML = html;
  };

  const flash = (i, state) => {
    slots[i].dataset[state] = '';
    setTimeout(() => {
      delete slots[i].dataset[state];
      if (state === 'in') slots[i].dataset.on = '';
    }, still ? 0 : 420);
  };

  const gain = () => {
    if (n >= MAX) { say('<b>Twenty is the cap.</b> The rest of them can keep dying.'); return; }
    flash(n, 'in'); n++;
    say(`<b>You killed ${pick(NAMES)}.</b> Their heart is yours, permanently.`, 'gain');
  };
  const lose = () => {
    if (n <= FLOOR) { say('<b>The floor is one.</b> You never hit zero — you just lose everything else when you die.'); return; }
    n--; delete slots[n].dataset.on; flash(n, 'out');
    say(`<b>${pick(NAMES)} killed you.</b> One heart gone, and they walked off with it.`, 'loss');
  };
  const withdraw = () => {
    if (n <= FLOOR) { say(`<b>You can't withdraw your last heart.</b> The server keeps you on one.`); return; }
    n--; delete slots[n].dataset.on; flash(n, 'out');
    held++; invCount.textContent = held; inv.hidden = false;
    say(`<b>/withdraw</b> — one heart out of your body, into your inventory.`, 'loss');
  };
  const putBack = () => {
    if (!held) return;
    if (n >= MAX) { say('<b>Twenty is the cap.</b> That one stays in your pocket.'); return; }
    held--; invCount.textContent = held;
    if (!held) inv.hidden = true;
    flash(n, 'in'); n++;
    say('<b>Heart re-absorbed.</b> Back in the row where nobody can loot it.', 'gain');
  };

  const drive = fn => () => { driven = true; fn(); };
  $('act-kill').addEventListener('click', drive(gain));
  $('act-die').addEventListener('click', drive(lose));
  $('act-wd').addEventListener('click', drive(withdraw));
  $('inv-slot').addEventListener('click', drive(putBack));

  say('You spawn on ten. Every heart above that came off somebody else. Try it:');
  if (still) return;

  /* One demonstration kill, taken back if the visitor hasn't stepped in. */
  setTimeout(() => { if (!driven) gain(); }, 1600);
  setTimeout(() => { if (!driven) lose(); }, 4400);
  setTimeout(() => { if (!driven) say('You spawn on ten. Every heart above that came off somebody else. Try it:'); }, 7200);
})();

/* Live status into the server-list row ---------------------------------- */
(async () => {
  const row = $('mc-row'), mcCount = $('mc-count'), rowNote = $('row-note');
  try {
    const d = await (await fetch('https://api.mcstatus.io/v2/status/java/play.brickworks.world')).json();
    if (!d.online) {
      row.dataset.down = '';
      mcCount.textContent = 'offline';
      rowNote.textContent = 'Offline right now — check Discord.';
      return;
    }
    const n = d.players?.online ?? 0, max = d.players?.max;
    row.dataset.live = '';
    mcCount.innerHTML = `<b>${n}</b>${max ? '/' + max : ''}`;
    rowNote.textContent = n === 1
      ? 'How it looks in your server list. 1 player on right now.'
      : `How it looks in your server list. ${n} players on right now.`;
    const heads = $('heads');
    for (const p of (d.players?.list ?? []).slice(0, 6)) {
      const img = new Image();
      img.src = 'https://mc-heads.net/avatar/' + p.uuid + '/64';
      img.alt = p.name_clean || 'player';
      img.loading = 'lazy';
      heads.append(img);
    }
  } catch {
    /* No retry: if the status API is unreachable the row is just a picture. */
    mcCount.textContent = '';
  }
})();

/* Kill feed -------------------------------------------------------------
   Death messages in the game's own grammar. Decorative, aria-hidden, and a
   still single row under reduced motion. */
(() => {
  const track = $('feed');
  const heart = cls => `<svg class="${cls}" viewBox="0 0 16 16" aria-hidden="true"><use href="#i-heart"/></svg>`;
  const duels = [
    (a, b) => `<b>${a}</b> was slain by <b>${b}</b>`,
    (a, b) => `<b>${a}</b> was shot by <b>${b}</b>`,
    (a, b) => `<b>${a}</b> hit the ground too hard whilst trying to escape <b>${b}</b>`,
    (a, b) => `<b>${a}</b> tried to swim in lava to escape <b>${b}</b>`,
    (a, b) => `<b>${a}</b> was blown up by <b>${b}</b>`,
    (a, b) => `<b>${a}</b> drowned whilst trying to escape <b>${b}</b>`,
  ];
  const solos = [
    a => `<b>${a}</b> fell out of the world`,
    a => `<b>${a}</b> burned to death`,
    a => `<b>${a}</b> was pricked to death`,
  ];
  const items = [];
  const bag = [...NAMES].sort(() => Math.random() - .5);
  for (let i = 0; i < 12; i++) {
    const a = bag[i % bag.length], b = bag[(i + 1) % bag.length];
    const r = Math.random();
    if (r < .12) items.push(`${heart('f-wd')} <b>${a}</b> withdrew a heart`);
    else if (r < .3) items.push(`${heart('f-env')} ${pick(solos)(a)}`);
    else items.push(`${heart('f-gain')} ${pick(duels)(a, b)} <b class="gain">+1</b>`);
  }
  /* Two copies of the run make the loop seamless at translateX(-50%). */
  const half = items.map(h => `<span>${h}</span>`).join('');
  track.innerHTML = half + half;
})();

/* The chest: one tooltip, read from whichever slot has the pointer or
   focus, like the game reads an item. -------------------------------- */
(() => {
  const slots = document.querySelectorAll('.slot');
  const name = $('tip-name'), lore = $('tip-lore'), cmd = $('tip-cmd');
  let current = null;
  const show = btn => {
    if (current === btn) return;
    if (current) delete current.dataset.sel;
    current = btn; btn.dataset.sel = '';
    name.textContent = btn.dataset.name;
    name.style.color = btn.style.getPropertyValue('--c');
    lore.textContent = btn.dataset.lore;
    cmd.hidden = !btn.dataset.cmd;
    cmd.textContent = btn.dataset.cmd || '';
  };
  for (const btn of slots) {
    btn.addEventListener('mouseenter', () => show(btn));
    btn.addEventListener('focus', () => show(btn));
    btn.addEventListener('click', () => show(btn));
  }
  if (slots.length) show(slots[0]);
})();

/* Updates, newest first, from updates.json ------------------------------- */
(async () => {
  const log = $('log');
  const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  try {
    const items = await (await fetch('updates.json', { cache: 'no-cache' })).json();
    items.sort((a, b) => (a.date < b.date ? 1 : -1));
    log.replaceChildren(...items.map(u => {
      const li = document.createElement('li');
      li.className = 'entry';
      const t = document.createElement('time');
      t.dateTime = u.date;
      t.textContent = fmt.format(new Date(u.date + 'T00:00:00Z'));
      const h = document.createElement('h3');
      h.textContent = u.title;
      const p = document.createElement('p');
      p.textContent = u.body;
      li.append(t, h, p);
      return li;
    }));
  } catch {
    log.innerHTML = '<li class="entry"><time>&nbsp;</time><h3>No updates to show right now.</h3></li>';
  }
})();

/* Status, from the JSON the box writes every minute ----------------------- */
(async () => {
  const list = $('svcs'), stamp = $('stamp');
  try {
    const d = await (await fetch('status.json', { cache: 'no-cache' })).json();
    list.replaceChildren(...d.services.map(s => {
      const li = document.createElement('li');
      li.className = 'svc';
      li.dataset.up = s.up ? 'yes' : 'no';
      let body = '';
      if (s.id === 'host' && s.up) {
        body = `<p class="plain">Up ${s.uptime_days}d</p>`;
      } else if (s.up && typeof s.players === 'number') {
        body = `<p class="plain">${s.players}${s.max ? ' / ' + s.max : ''} online</p>`;
      } else if (!s.up) {
        body = '<p class="plain">Not responding</p>';
      }
      li.innerHTML = `<span class="svc-name">${s.name}</span>
        <span class="dot-s">${s.up ? 'Up' : 'Down'}</span>${body}`;
      return li;
    }));
    stamp.textContent = 'Last checked ' + new Date(d.generated).toLocaleString('en-GB');
  } catch {
    /* Only the box writes status.json, so mirrors of this page have none. */
    list.innerHTML = '<li class="svc"><span class="svc-name">Status unavailable</span>' +
      '<p class="plain">Live status is on brickworks.world.</p></li>';
    stamp.textContent = '';
  }
})();

/* Embers behind the hero: pixel sparks drifting up off a dithered horizon —
   the gradient drawn the way the game would draw it, in cells, not a wash.
   Under reduced motion everything is painted once and left still. */
(() => {
  const cv = $('embers'), ctx = cv.getContext('2d');
  const COLORS = ['#FF6A3D', '#FF4D57', '#FFC857', '#6b4a75'];
  let W = 0, H = 0, sparks = [], horizon = null;

  function drawHorizon() {
    horizon = document.createElement('canvas');
    horizon.width = Math.max(1, Math.ceil(W)); horizon.height = Math.max(1, Math.ceil(H));
    const hx = horizon.getContext('2d');
    const CELL = 4, top = H * .62;
    // deepest bands first; the odd ember cell only near the very bottom
    const TONES = [
      { c: '#20101C', bias: 0 },
      { c: '#331424', bias: .30 },
      { c: '#4A1A28', bias: .55 },
      { c: '#7E2A2A', bias: .78 },
      { c: '#B3402A', bias: .93 },
    ];
    for (let y = top; y < H; y += CELL) {
      const t = (y - top) / (H - top);          // 0 at the top of the band, 1 at the floor
      for (let x = 0; x < W; x += CELL) {
        const r = Math.random();
        let tone = null;
        for (const k of TONES) if (t > k.bias && r < (t - k.bias) * 1.6) tone = k;
        if (!tone) continue;
        hx.fillStyle = tone.c;
        hx.fillRect(x, y, CELL, CELL);
      }
    }
  }

  function size() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawHorizon();
    sparks = Array.from({ length: Math.min(70, W / 14) }, () => spawn(true));
  }

  function spawn(anywhere) {
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 4,
      v: .12 + Math.random() * .3,          // upward drift, px per frame
      w: Math.random() * 2 * Math.PI,        // sideways wobble phase
      s: Math.random() > .85 ? 3 : 2,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      a: .25 + Math.random() * .5,
    };
  }

  function paint() {
    ctx.clearRect(0, 0, W, H);
    if (horizon) ctx.drawImage(horizon, 0, 0, W, H);
    for (const p of sparks) {
      // sparks fade as they climb out of the glow
      ctx.globalAlpha = p.a * Math.min(1, (H - p.y) / H + .35);
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x + Math.sin(p.w) * 6), Math.round(p.y), p.s, p.s);
    }
    ctx.globalAlpha = 1;
  }

  function frame() {
    for (let i = 0; i < sparks.length; i++) {
      const p = sparks[i];
      p.y -= p.v; p.w += .01;
      if (p.y < -4) sparks[i] = spawn(false);
    }
    paint();
    requestAnimationFrame(frame);
  }

  size();
  addEventListener('resize', () => { size(); if (still) paint(); });
  if (still) paint(); else frame();
})();
