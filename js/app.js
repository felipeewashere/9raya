(() => {
  const $ = s => document.querySelector(s);
  const KEY = '9raya.';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(KEY + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(KEY + k); } catch (e) {} },
  };

  const THEMES = [
    { id: 'neon',       a: '#b86bff', b: '#3df2ff', bg: '#07040f' },
    { id: 'sunset',     a: '#ff5e7e', b: '#ffb347', bg: '#16041f' },
    { id: 'matcha',     a: '#9ad06b', b: '#e8d98b', bg: '#0c150e' },
    { id: 'bubblegum',  a: '#ff3d97', b: '#6c5ce7', bg: '#ffe3f2' },
    { id: 'terminal',   a: '#26ff4f', b: '#00ffc3', bg: '#010601' },
    { id: 'paper',      a: '#d94f2b', b: '#2b5fd9', bg: '#f4efe6' },
    { id: 'ensa',       a: '#e01b24', b: '#f9f9f9', bg: '#141416' },
  ];

  let lang = store.get('lang', 'da');
  let theme = store.get('theme', 'paper');
  let profile = store.get('profile', null);          // { answers, done }
  let answers = (profile && profile.answers) || store.get('draft', {}) || {};
  let screen = 'intro', idx = 0, busy = false, cur = null;
  let session = store.get('session', null);          // { name, pin } for this browser
  let steps = QUESTIONS, authMode = 'signup', pin = null, finishing = false; // authMode: signup | login | retake
  const PIN_Q = { id: 'pin', type: 'pin' };

  const t = (key, vars) => ui(lang, key, vars);
  const tr = o => T(o, lang);
  const root = document.documentElement;

  /* ───────── helpers ───────── */
  function split(text, perChar) {
    const f = document.createDocumentFragment();
    let n = 0;
    text.split(' ').forEach(word => {
      if (perChar && lang !== 'ar') {
        const w = document.createElement('span'); w.className = 'wd';
        for (const ch of word) {
          const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch;
          s.style.setProperty('--i', n++); w.appendChild(s);
        }
        f.appendChild(w);
      } else {
        const w = document.createElement('span'); w.className = perChar ? 'wd' : 'w';
        const s = document.createElement('span'); s.textContent = word;
        if (perChar) s.className = 'ch';
        s.style.setProperty('--i', n++);
        w.appendChild(s); f.appendChild(w);
      }
      f.appendChild(document.createTextNode(' '));
    });
    return { frag: f, count: n };
  }

  function wipe(x, y, color, mid) {
    return new Promise(res => {
      const w = document.createElement('div');
      w.className = 'wipe'; w.style.background = color;
      document.body.appendChild(w);
      const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const a = w.animate(
        [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${r}px at ${x}px ${y}px)` }],
        { duration: 650, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' });
      a.onfinish = () => {
        mid && mid();
        w.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' }).onfinish = () => { w.remove(); res(); };
      };
    });
  }

  function burst(x, y, n = 14, power = 1) {
    const cs = getComputedStyle(root);
    const cols = [cs.getPropertyValue('--accent'), cs.getPropertyValue('--accent2'), cs.getPropertyValue('--fg')];
    for (let i = 0; i < n; i++) {
      const b = document.createElement('div'); b.className = 'bit';
      const s = 5 + Math.random() * 7;
      b.style.cssText = `left:${x}px;top:${y}px;width:${s}px;height:${s * (Math.random() > .5 ? 1 : 2.2)}px;background:${cols[i % 3]}`;
      document.body.appendChild(b);
      const ang = Math.random() * 6.283, d = (60 + Math.random() * 160) * power;
      const dx = Math.cos(ang) * d, dy = Math.sin(ang) * d;
      b.animate([
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${dx}px,${dy + 90}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => b.remove();
    }
  }

  function showScreen(name) {
    screen = name;
    document.body.dataset.screen = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === name));
    $('#progress').classList.toggle('on', name === 'survey');
  }

  function go(name, x, y, enter) {
    if (busy) return;
    busy = true;
    wipe(x, y, getComputedStyle(root).getPropertyValue('--accent'), () => { showScreen(name); enter && enter(); })
      .then(() => { busy = false; });
  }

  /* ───────── intro ───────── */
  function renderIntro() {
    const el = $('#introText');
    el.innerHTML = '';
    const text = profile && profile.done ? t('intro_back', { name: answers.name || '' }) : t('intro');
    const { frag } = split(text, true);
    el.appendChild(frag);
    const cur = document.createElement('span'); cur.className = 'cursor'; el.appendChild(cur);
  }

  /* ───────── home ───────── */
  function renderHome() {
    const group = answers.group || 'G1';
    $('#homeTitle').textContent = t('home_title', { name: answers.name || '' });
    $('#homeSub').textContent = `AP1 · ${t('group')} ${group}`;
    $('#retake').textContent = t('retake');
    Planner.render({ lang, group, answers });
  }

  /* ───────── survey ───────── */
  function startSurvey(retake) {
    authMode = retake === true && session ? 'retake' : 'signup';
    // QUESTIONS[0] must be the name question; the PIN step goes right after it when Supabase is on
    finishing = false;
    steps = authMode === 'retake' ? QUESTIONS.slice(1)
      : DB.enabled ? [QUESTIONS[0], PIN_Q, ...QUESTIONS.slice(1)] : QUESTIONS;
    idx = 0;
    $('#qwrap').innerHTML = '';
    showQuestion(1, true);
  }

  function showQuestion(dir, first) {
    const q = steps[idx];
    const wrap = $('#qwrap');
    const old = wrap.firstElementChild;
    const el = build(q);
    el.style.setProperty('--dir', dir);

    const mount = () => {
      wrap.innerHTML = '';
      wrap.appendChild(el);
      busy = false;
      const inp = el.querySelector('input[type=text],input[type=time],input[type=password]');
      if (inp && !matchMedia('(pointer:coarse)').matches) setTimeout(() => inp.focus({ preventScroll: true }), 650);
    };

    $('#progress i').style.width = (idx / steps.length * 100) + '%';
    $('#count').textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(steps.length).padStart(2, '0');
    $('#back').classList.toggle('on', idx > 0);
    $('#back').textContent = t('back');

    if (old && !first) {
      busy = true;
      old.style.setProperty('--dir', dir);
      old.classList.add('out');
      Sound.whoosh();
      setTimeout(mount, 380);
    } else mount();
  }

  function flash(msg) {
    if (!cur || !cur.msg) return;
    cur.msg.textContent = msg;
    if (cur.shake) cur.shake();
  }

  async function commit(v) {
    if (busy) return;
    const q = steps[idx];
    if (q.id === 'pin') {
      if (authMode === 'login') return tryLogin(v);
      pin = v;
    } else {
      answers[q.id] = v;
      store.set('draft', answers);
      if (q.id === 'name' && DB.enabled && authMode !== 'retake') {
        busy = true;
        try { authMode = (await DB.exists(v)) ? 'login' : 'signup'; }
        catch (e) { busy = false; return flash(t('net_error')); }
        busy = false;
      }
    }
    if (idx < steps.length - 1) { idx++; showQuestion(1); }
    else finish();
  }

  async function tryLogin(v) {
    const name = answers.name;
    busy = true;
    try {
      const a = await DB.login(name, v);
      answers = a; session = { name, pin: v };
      store.set('session', session);
      profile = { answers, done: true, synced: true };
      store.set('profile', profile); store.del('draft');
      busy = false;
      Sound.chime(); burst(innerWidth / 2, innerHeight / 2, 50, 2.2);
      renderHome(); renderIntro();
      go('home', innerWidth / 2, innerHeight / 2);
    } catch (e) {
      busy = false;
      flash(e.code === 'bad_login' ? t('pin_wrong') : t('net_error'));
      const i = cur && cur.input; if (i) { i.value = ''; i.focus(); }
    }
  }

  function back() {
    if (busy || idx === 0) return;
    Sound.back(); idx--; showQuestion(-1);
  }

  async function finish() {
    if (finishing) return;
    finishing = true;
    busy = true;
    profile = { answers, done: true, synced: !DB.enabled };
    if (DB.enabled) {
      if (authMode === 'signup') { session = { name: answers.name, pin }; store.set('session', session); }
      try {
        if (authMode === 'retake') await DB.save(session.name, session.pin, answers);
        else await DB.signup(session.name, session.pin, answers);
        profile.synced = true;
      } catch (e) { /* kept locally, sync() retries on next visit */ }
    }
    busy = false;
    store.set('profile', profile);
    store.del('draft');
    $('#progress i').style.width = '100%';
    Sound.chime();
    burst(innerWidth / 2, innerHeight / 2, 60, 2.6);
    renderHome(); renderIntro();
    setTimeout(() => go('home', innerWidth / 2, innerHeight / 2), 500);
  }

  // refresh from Supabase (and push anything that failed to upload) when this browser has a session
  async function sync() {
    if (!DB.enabled || !session) return;
    try {
      if (profile && profile.synced === false) { await DB.signup(session.name, session.pin, answers); }
      const a = await DB.login(session.name, session.pin);
      answers = a; profile = { answers: a, done: true, synced: true };
      store.set('profile', profile);
      renderIntro(); renderHome();
    } catch (e) { /* offline or bad pin: keep local copy */ }
  }

  function okButton(submit) {
    const b = document.createElement('button');
    b.className = 'ok'; b.type = 'button';
    b.innerHTML = t('ok') + ' <i>↵</i>';
    b.onclick = submit;
    b.onmouseenter = () => Sound.hover();
    return b;
  }

  function build(q) {
    const el = document.createElement('div');
    el.className = 'q t-' + q.type;
    const h = document.createElement('h2');
    h.appendChild(split(q.type === 'pin' ? t(authMode === 'login' ? 'pin_login' : 'pin_new') : tr(q.q), false).frag);
    const body = document.createElement('div'); body.className = 'body';
    el.append(h, body);
    cur = { q, pick: null, submit: null };
    const msg = document.createElement('div'); msg.className = 'msg'; cur.msg = msg;
    const shakeOf = inp => () => inp.animate([{ transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'none' }], { duration: 250 });
    const prev = answers[q.id];
    const commitQ = v => { if (steps[idx] === q) commit(v); };

    if (q.type === 'choice' || q.type === 'scale') {
      const opts = q.type === 'scale'
        ? Array.from({ length: 10 }, (_, i) => ({ v: i + 1, label: String(i + 1) }))
        : q.opts.map(o => ({ v: o.v, label: tr(o.t) }));
      const list = document.createElement('div');
      list.className = 'opts ' + (q.type === 'scale' ? 'row' : (q.layout || (opts.length > 5 ? 'cols' : '')));
      const buttons = opts.map((o, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'opt' + (prev === o.v ? ' sel' : '');
        b.style.setProperty('--i', i);
        b.innerHTML = (i < 9 ? `<kbd>${i + 1}</kbd>` : '') + `<span></span>`;
        b.lastChild.textContent = o.label;
        b.onmouseenter = () => Sound.hover();
        b.onclick = () => pick(i);
        list.appendChild(b);
        return b;
      });
      let picked = false;
      const pick = i => {
        if (busy || picked) return;
        picked = true;
        buttons.forEach((b, j) => b.classList.toggle('sel', j === i));
        Sound.select(i);
        const r = buttons[i].getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, 16);
        setTimeout(() => commitQ(opts[i].v), 320);
      };
      cur.pick = pick;
      body.appendChild(list);
    }

    else if (q.type === 'slider') {
      const val = prev != null ? prev : q.def;
      const out = document.createElement('div'); out.className = 'readout';
      const num = document.createElement('span'); num.className = 'num';
      const unit = document.createElement('span'); unit.className = 'unit'; unit.textContent = tr(q.unit);
      out.append(num, unit);
      const inp = document.createElement('input');
      inp.type = 'range'; inp.min = q.min; inp.max = q.max; inp.step = q.step; inp.value = val;
      let last = null;
      const upd = () => {
        const p = (inp.value - q.min) / (q.max - q.min);
        inp.style.setProperty('--p', (p * 100) + '%');
        num.textContent = String(Number(inp.value));
        if (last !== inp.value) { if (last !== null) Sound.tick(p); last = inp.value; num.animate([{ transform: 'scale(1.06)' }, { transform: 'none' }], { duration: 160 }); }
      };
      inp.oninput = upd; upd();
      const submit = () => { Sound.select(3); commitQ(Number(inp.value)); };
      cur.submit = submit;
      body.append(out, inp, okButton(submit));
    }

    else if (q.type === 'time') {
      const inp = document.createElement('input');
      inp.type = 'time'; inp.className = 'big-input time'; inp.value = prev || q.def || '12:00';
      const submit = () => { if (!inp.value) return; Sound.select(4); commitQ(inp.value); };
      cur.submit = submit;
      body.append(inp, okButton(submit));
    }

    else if (q.type === 'text') {
      const inp = document.createElement('input');
      inp.type = 'text'; inp.className = 'big-input text'; inp.maxLength = 24; inp.autocomplete = 'off';
      inp.placeholder = tr(q.ph); inp.value = prev || '';
      inp.oninput = () => Sound.type(inp.value.length);
      const submit = () => {
        if (!inp.value.trim()) return cur.shake();
        msg.textContent = '';
        Sound.select(5); commitQ(inp.value.trim());
      };
      cur.submit = submit; cur.input = inp; cur.shake = shakeOf(inp);
      body.append(inp, msg, okButton(submit));
    }

    else if (q.type === 'pin') {
      const inp = document.createElement('input');
      inp.type = 'password'; inp.inputMode = 'numeric'; inp.className = 'big-input pin';
      inp.maxLength = 4; inp.autocomplete = 'off'; inp.placeholder = '····';
      const submit = () => {
        if (inp.value.length !== 4) return cur.shake();
        Sound.select(5); commitQ(inp.value);
      };
      inp.oninput = () => {
        inp.value = inp.value.replace(/\D/g, '');
        Sound.type(inp.value.length); msg.textContent = '';
        if (inp.value.length === 4) setTimeout(submit, 250);
      };
      cur.submit = submit; cur.input = inp; cur.shake = shakeOf(inp);
      body.append(inp, msg, okButton(submit));
    }
    return el;
  }

  /* ───────── dock (lang / theme / sound / reset) ───────── */
  function buildDock() {
    const L = $('#langs'); L.innerHTML = '';
    LANGS.forEach(l => {
      const b = document.createElement('button');
      b.textContent = l.label; b.className = l.id === lang ? 'on' : '';
      b.onclick = () => { Sound.init(); Sound.select(1); setLang(l.id); };
      L.appendChild(b);
    });
    const Tm = $('#themes'); Tm.innerHTML = '';
    THEMES.forEach(th => {
      const b = document.createElement('button');
      b.style.background = `linear-gradient(135deg,${th.a} 0 50%,${th.b} 50% 100%)`;
      b.title = t('theme_' + th.id); b.setAttribute('aria-label', b.title);
      b.className = th.id === theme ? 'on' : '';
      b.onmouseenter = () => Sound.hover();
      b.onclick = e => {
        if (th.id === theme || busy) return;
        Sound.init(); Sound.theme();
        const r = b.getBoundingClientRect();
        busy = true;
        wipe(r.left + r.width / 2, r.top + r.height / 2, th.bg, () => setTheme(th.id)).then(() => { busy = false; });
      };
      Tm.appendChild(b);
    });
    $('#mute').textContent = Sound.isMuted() ? '🔇' : '🔊';
    $('#mute').title = t('sound'); $('#reset').title = t('reset');
  }

  function setTheme(id) {
    theme = id; store.set('theme', id);
    root.dataset.theme = id;
    document.querySelector('meta[name=theme-color]').content = THEMES.find(x => x.id === id).bg;
    Sound.setTheme(id); BG.readTheme(); buildDock();
  }

  function setLang(id) {
    lang = id; store.set('lang', id);
    const l = LANGS.find(x => x.id === id);
    root.dataset.lang = id; root.lang = l.html; root.dir = l.dir;
    buildDock(); renderIntro(); renderHome();
    if (screen === 'survey') { busy = false; showQuestion(1, true); }
  }

  const dock = $('#dock');
  $('#dockToggle').onclick = e => { e.stopPropagation(); Sound.init(); Sound.select(1); dock.classList.toggle('open'); };
  document.addEventListener('click', e => { if (!dock.contains(e.target)) dock.classList.remove('open'); });

  $('#mute').onclick = () => {
    Sound.init(); const m = !Sound.isMuted(); Sound.setMuted(m); store.set('muted', m); buildDock();
    if (!m) Sound.select(2);
  };
  $('#reset').onclick = () => {
    if (!confirm(t('reset_confirm'))) return;
    store.del('profile'); store.del('draft'); store.del('session'); session = null; profile = null; answers = {}; idx = 0;
    renderIntro(); showScreen('intro');
  };
  $('#retake').onclick = e => { Sound.start(); go('survey', e.clientX, e.clientY, () => startSurvey(true)); };
  $('#back').onclick = back;

  /* ───────── start ───────── */
  function begin(x, y) {
    if (busy || screen !== 'intro') return;
    Sound.init(); Sound.start();
    if (profile && profile.done) { renderHome(); go('home', x, y); }
    else go('survey', x, y, startSurvey);
  }
  $('#intro').addEventListener('click', e => begin(e.clientX, e.clientY));

  addEventListener('keydown', e => {
    const typing = e.target.tagName === 'INPUT' && e.target.type !== 'range';
    if (screen === 'intro' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); begin(innerWidth / 2, innerHeight / 2); return; }
    if (screen !== 'survey' || !cur) return;
    if (e.key === 'Enter' && cur.submit) { e.preventDefault(); cur.submit(); }
    else if (!typing && (e.key === 'Backspace' || (e.key === 'ArrowLeft' && !(e.target.type === 'range')))) back();
    else if (!typing && cur.pick && /^[0-9]$/.test(e.key)) {
      const n = e.key === '0' ? 9 : +e.key - 1;
      if (n < (cur.q.type === 'scale' ? 10 : cur.q.opts.length)) cur.pick(n);
    }
  });

  Sound.setMuted(store.get('muted', false));
  root.dataset.theme = theme; Sound.setTheme(theme); BG.readTheme();
  setLang(lang);
  sync();
  Clock.onSync(() => Planner.clockUpdated());
  Clock.sync();
  setInterval(Clock.sync, 10 * 60 * 1000);
})();
