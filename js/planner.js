// Home screen: "emploi" (the week as a horizontal timetable, with a live "now" card) and a month calendar.
const Planner = (() => {
  const $ = s => document.querySelector(s);
  let today = Clock.iso();   // Morocco date
  const ORDER = ['plan', 'cal'];
  let view = 'plan', sel = null, ym = null, switching = false;
  let ctx = { lang: 'da', group: 'G1', answers: {} };
  let live = null, timer = null;   // live = { t0 } of the emploi on screen, for the "now" updates


  const tt = (k, v) => ui(ctx.lang, k, v);
  const days = () => DAYS[ctx.lang] || DAYS.da;
  const months = () => MONTHS[ctx.lang] || MONTHS.da;
  const dayIdx = iso => (dateOf(iso).getDay() + 6) % 7;
  const hm = Scheduler.hhmm;
  const dur = min => { const h = Math.floor(min / 60), m = min % 60; return h ? h + 'h' + (m ? pad2(m) : '') : m + "'"; };
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const hasWeek = iso => WEEKS.some(w => { const d = Math.round((dateOf(iso) - dateOf(w.monday)) / 864e5); return d >= 0 && d <= 5; });
  const dayTitle = iso => { const d = dateOf(iso); return `${days()[dayIdx(iso)]} ${d.getDate()} ${months()[d.getMonth()]}`; };
  const nowMin = () => Clock.min();   // Morocco time

  // phases the user skipped ("scratched"), kept on this device
  const skips = (() => { try { return JSON.parse(localStorage.getItem('9raya.skips')) || {}; } catch (e) { return {}; } })();
  const skipKey = (iso, it) => iso + '|' + (it.s != null ? it.s : it);
  const skipped = (iso, it) => !!skips[skipKey(iso, it)];
  const saveSkips = () => { try { localStorage.setItem('9raya.skips', JSON.stringify(skips)); } catch (e) {} };

  /* ───────── one day -> display items ───────── */
  function compose(iso) {
    const plan = Scheduler.plan(iso, ctx.answers, ctx.group), bl = plan.blocks, items = [];
    let i = 0;
    while (i < bl.length) {
      const b = bl[i];
      if (b.kind === 'study') {            // merge back-to-back study blocks (and their pauses) into one session
        let j = i, subs = [], work = 0;
        while (j < bl.length && (bl[j].kind === 'study' || bl[j].kind === 'break')) {
          if (bl[j].kind === 'study') { subs.push(SHORT[bl[j].subj]); work += bl[j].end - bl[j].start; }
          j++;
        }
        items.push({ kind: 'study', s: b.start, e: bl[j - 1].end, title: tt('p_study'), sub: [...new Set(subs)].join(' · '), work });
        i = j; continue;
      }
      i++;
      const it = { kind: b.kind, s: b.start, e: b.end };
      if (b.kind === 'wake' || b.kind === 'sleep') { it.mark = true; it.title = tt('p_' + b.kind); }
      else if (b.kind === 'cours' || b.kind === 'td') {
        it.title = b.ev.short; it.full = b.ev.title; it.tag = tt('type_' + b.kind); it.room = b.ev.room; it.prof = b.ev.sub;
      } else if (b.kind === 'tp') {
        it.title = b.ev.short; it.full = b.ev.title; it.tag = tt('type_tp'); it.prof = b.ev.sub;
      } else if (b.kind === 'meal') it.title = tt('p_' + b.key);
      else it.title = tt('p_' + b.kind);   // fun ("free time"), nap, wind
      items.push(it);
    }
    return { plan, items };
  }

  /* ───────── which phase are we in right now? ───────── */
  function phaseAt(items, t, iso) {
    const real = items.filter(x => !x.mark && !skipped(iso, x));
    const wake = items[0].s, sleep = items[items.length - 1].s;
    const hit = real.find(x => x.s <= t && t < x.e);
    if (hit) return { item: hit, left: hit.e - t, pct: (t - hit.s) / (hit.e - hit.s), next: real[real.indexOf(hit) + 1] };
    if (t >= sleep) return { item: { kind: 'sleep', title: tt('p_sleep') }, left: wake + 1440 - t, next: null };
    const next = real.find(x => x.s > t);
    if (next) {
      const prevEnd = real.filter(x => x.e <= t).reduce((m, x) => Math.max(m, x.e), wake);
      return { item: { kind: 'fun', title: tt('p_fun') }, left: next.s - t, pct: (t - prevEnd) / Math.max(next.s - prevEnd, 1), next };
    }
    return { item: { kind: 'sleep', title: tt('p_sleep') }, left: sleep - t, next: null };
  }

  function currentPhase() {
    const t = nowMin(), cur = compose(today);
    if (t < cur.items[0].s) {                                  // after midnight: still inside yesterday's evening?
      const y = compose(addDays(today, -1));
      const p = phaseAt(y.items, t + 1440, addDays(today, -1));
      if (p.item.kind !== 'sleep' || t + 1440 < y.items[y.items.length - 1].s) return p;
      return { item: { kind: 'sleep', title: tt('p_sleep') }, left: cur.items[0].s - t, next: cur.items[1] };
    }
    return phaseAt(cur.items, t, today);
  }

  function nowCard() {
    const p = currentPhase(), t = nowMin(), it = p.item;
    const c = el('div', 'nowcard k-' + it.kind);
    const detail = it.kind === 'cours' || it.kind === 'td' || it.kind === 'tp'
      ? [it.tag, it.room, it.prof].filter(Boolean).join(' · ') : (it.sub || '');
    c.innerHTML = `<small>${tt('now')} · ${hm(t)}</small><b></b>${detail ? '<em></em>' : ''}<span>${tt('left', { t: dur(Math.max(p.left, 1)) })}</span>` +
      (p.pct != null ? `<div class="bar"><i style="width:${Math.round(Math.min(Math.max(p.pct, 0), 1) * 100)}%"></i></div>` : '') +
      (p.next ? `<small class="nx">${tt('next')}: ${p.next.title} · ${hm(p.next.s)}</small>` : '');
    c.querySelector('b').textContent = it.title;
    if (detail) c.querySelector('em').textContent = detail;
    return c;
  }

  // refresh the live bits without redrawing (so animations don't replay)
  function tick() {
    if (!live || document.hidden || !$('#home').classList.contains('active')) return;
    if (Clock.iso() !== today) return clockUpdated();
    const old = document.querySelector('.nowcard');
    if (old) old.replaceWith(nowCard());
    markNow();
    const nl = document.querySelector('.nowline');
    if (nl) nl.style.left = nowX() + 'px';
  }
  const nowX = () => { const n = nowMin(); return LW() + ((n < live.t0 ? n + 1440 : n) - live.t0) * PM; };
  // past phases fade out, the current one glows, skipped ones are scratched
  function markNow() {
    const t = nowMin();
    document.querySelectorAll('.hrow[data-iso]').forEach(row => {
      const iso = row.dataset.iso;
      row.classList.toggle('today', iso === today);
      row.querySelectorAll('.blk').forEach(b => {
        const s = +b.dataset.s, e = +b.dataset.e, skip = !!skips[iso + '|' + s];
        b.classList.toggle('past', iso < today || (iso === today && e <= t));
        b.classList.toggle('skipped', skip);
        b.classList.toggle('now', iso === today && s <= t && t < e && !skip);
      });
    });
  }

  /* ───────── compact chip (calendar) ───────── */
  function chip(e) {
    const c = el('div', 'ev t-' + e.type);
    let title = e.short || e.title;
    if (e.type === 'exam') title = tt(e.title);
    else if (e.type === 'off') title = tt('holiday');
    c.innerHTML = `${e.start ? `<time>${e.start}</time>` : ''}<b></b>`;
    c.querySelector('b').textContent = title;
    const more = [e.type === 'cours' || e.type === 'td' ? tt('type_' + e.type) : '', e.room].filter(Boolean).join(' · ');
    if (more) c.insertAdjacentHTML('beforeend', `<span>${more}</span>`);
    if (e.sub && e.type !== 'exam') c.insertAdjacentHTML('beforeend', `<span>${e.sub}</span>`);
    return c;
  }

  /* ───────── EMPLOI: the week as a horizontal timetable ───────── */
  const isMobile = () => innerWidth < 640;
  const LW = () => (isMobile() ? 54 : 88);     // day-label column
  const RH = () => (isMobile() ? 74 : 84);     // row height
  let PM = (() => {                              // pixels per minute = zoom (saved on this device)
    try { const z = parseFloat(localStorage.getItem('9raya.zoom')); if (z > 0) return z; } catch (e) {}
    return innerWidth < 640 ? 1.5 : 2.1;
  })();
  const clampPM = v => Math.min(4, Math.max(0.6, v));

  // simple blocks: title, then (for classes) "TD · room", then the prof. Size classes hide lines when narrow.
  function blockInner(it) {
    if (it.tag) return `<b></b><span><i>${it.tag}</i>${it.room ? ' · ' + it.room : ''}</span>${it.prof ? '<em></em>' : ''}`;
    if (it.kind === 'study') return `<b></b><span class="sub"></span>`;
    return `<b></b>`;
  }

  function fit(b, s, e) {
    const w = (e - s) * PM - 2;
    b.style.left = (s - live.t0) * PM + 1 + 'px';
    b.style.width = w + 'px';
    b.classList.toggle('tiny', w < 66);
    b.classList.toggle('mid', w >= 66 && w < 128);
  }

  // zoom without redrawing: just re-position everything and keep the same time in the middle
  function applyZoom(next) {
    if (!live || !live.grid) return;
    const g = live.grid, wrap = live.wrap, lw = LW();
    const center = (wrap.scrollLeft + wrap.clientWidth / 2 - lw) / PM + live.t0;
    PM = clampPM(next);
    try { localStorage.setItem('9raya.zoom', String(PM)); } catch (e) {}
    const TW = (live.t1 - live.t0) * PM;
    g.style.width = lw + TW + 'px';
    g.style.setProperty('--ph', 60 * PM + 'px');
    g.querySelectorAll('.track,.haxis').forEach(x => { x.style.width = TW + 'px'; });
    g.querySelectorAll('.haxis span').forEach(x => { x.style.left = (+x.dataset.m - live.t0) * PM + 'px'; });
    g.querySelectorAll('.blk,.zz').forEach(x => fit(x, +x.dataset.s, +x.dataset.e));
    const nl = g.querySelector('.nowline'); if (nl) nl.style.left = nowX() + 'px';
    wrap.scrollLeft = (center - live.t0) * PM + lw - wrap.clientWidth / 2;
  }

  function planView(body) {
    const lw = LW(), rh = RH();
    const monday = addDays(sel, -dayIdx(sel)), sunday = addDays(monday, 6);
    const nav = el('div', 'daynav', `<button type="button" data-n="-7">‹</button><h3></h3><button type="button" data-n="7">›</button>`);
    const d1 = dateOf(monday), d2 = dateOf(sunday);
    nav.querySelector('h3').textContent = `${d1.getDate()} ${d1.getMonth() === d2.getMonth() ? '' : months()[d1.getMonth()] + ' '}– ${d2.getDate()} ${months()[d2.getMonth()]}`;
    nav.onclick = e => {
      const n = e.target.dataset && e.target.dataset.n; if (!n) return;
      Sound.select(n > 0 ? 3 : 1); sel = addDays(sel, +n); draw();
    };
    body.appendChild(nav);

    const week = Array.from({ length: 7 }, (_, i) => { const iso = addDays(monday, i); return { iso, ...compose(iso) }; });
    const inWeek = week.some(d => d.iso === today);
    if (inWeek) body.appendChild(nowCard());
    if (!hasWeek(monday)) body.appendChild(el('p', 'note', tt('note_noweek')));

    const t0 = Math.floor(Math.min(...week.map(d => d.items[0].s)) / 60) * 60;
    const t1 = Math.ceil(Math.max(...week.map(d => d.items[d.items.length - 1].s)) / 60) * 60;
    live = { t0, t1 };

    // zoom buttons + one short hint
    const tools = el('div', 'tools', `<div class="zoom"><button type="button" data-z="-1" aria-label="zoom out">−</button><button type="button" data-z="1" aria-label="zoom in">+</button></div><span></span>`);
    tools.querySelector('span').textContent = tt('skip_hint');
    tools.querySelector('.zoom').onclick = e => {
      const z = e.target.dataset && e.target.dataset.z; if (!z) return;
      Sound.select(z > 0 ? 4 : 2); applyZoom(PM * (z > 0 ? 1.25 : 0.8));
    };
    body.appendChild(tools);

    const TW = (t1 - t0) * PM, wrap = el('div', 'hwrap'), grid = el('div', 'hgrid');
    grid.style.cssText = `--LW:${lw}px;--RH:${rh}px;--ph:${60 * PM}px;width:${lw + TW}px`;
    live.grid = grid; live.wrap = wrap;

    const head = el('div', 'hrow hhead', '<div class="lab"></div>');
    const axis = el('div', 'haxis'); axis.style.width = TW + 'px';
    for (let m = t0; m <= t1; m += 60) { const s = el('span', null, hm(m)); s.dataset.m = m; s.style.left = (m - t0) * PM + 'px'; axis.appendChild(s); }
    head.appendChild(axis); grid.appendChild(head);

    week.forEach((d, n) => {
      const isToday = d.iso === today, dt = dateOf(d.iso);
      const row = el('div', 'hrow' + (isToday ? ' today' : ''));
      row.dataset.iso = d.iso; row.style.setProperty('--i', n);
      row.appendChild(el('div', 'lab', `<b>${days()[n]}</b><small>${dt.getDate()}${isMobile() ? '' : ' ' + months()[dt.getMonth()].slice(0, 3)}</small>`));
      const track = el('div', 'track'); track.style.width = TW + 'px';

      const wake = d.items[0].s, sleep = d.items[d.items.length - 1].s;     // dim the hours you're asleep
      [[t0, wake], [sleep, t1]].forEach(([a, b]) => {
        if (b > a) { const z = el('div', 'zz'); z.dataset.s = a; z.dataset.e = b; fit(z, a, b); track.appendChild(z); }
      });
      d.items.filter(x => !x.mark && x.kind !== 'wind').forEach(it => {
        const b = el('div', 'blk k-' + it.kind, blockInner(it));
        b.dataset.s = it.s; b.dataset.e = it.e; fit(b, it.s, it.e);
        b.querySelector('b').textContent = it.title;
        const sp = b.querySelector('.sub'); if (sp) sp.textContent = it.sub || '';
        const pr = b.querySelector('em'); if (pr) pr.textContent = it.prof;
        b.title = [`${hm(it.s)}–${hm(it.e)}`, it.full || it.title, it.tag, it.room, it.prof].filter(Boolean).join(' · ');
        b.onclick = () => {                      // click = skip this phase (click again to bring it back)
          const k = skipKey(d.iso, it), on = !skips[k];
          if (on) skips[k] = 1; else delete skips[k];
          saveSkips(); on ? Sound.back() : Sound.select(2);
          markNow();
          const nc = document.querySelector('.nowcard'); if (nc) nc.replaceWith(nowCard());
        };
        track.appendChild(b);
      });
      row.appendChild(track); grid.appendChild(row);
    });

    if (inWeek) { const nl = el('div', 'nowline'); nl.style.left = nowX() + 'px'; grid.appendChild(nl); }
    wrap.appendChild(grid); body.appendChild(wrap);
    markNow();

    // ctrl+wheel and two-finger pinch zoom
    const dist = e => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    let pd = 0, p0 = 1;
    wrap.addEventListener('wheel', e => { if (e.ctrlKey) { e.preventDefault(); applyZoom(PM * (e.deltaY < 0 ? 1.1 : 0.9)); } }, { passive: false });
    wrap.addEventListener('touchstart', e => { if (e.touches.length === 2) { pd = dist(e); p0 = PM; } }, { passive: true });
    wrap.addEventListener('touchmove', e => { if (e.touches.length === 2 && pd) { e.preventDefault(); applyZoom(p0 * dist(e) / pd); } }, { passive: false });
    wrap.addEventListener('touchend', () => { pd = 0; }, { passive: true });

    // bring "now" (or the start of the day) into view
    setTimeout(() => { wrap.scrollTo({ left: inWeek ? Math.max(0, nowX() - lw - (isMobile() ? 60 : 160)) : 0, behavior: 'smooth' }); }, 500);
  }

  /* ───────── CALENDAR view ───────── */
  function calView(body) {
    if (!ym) { const d = dateOf(sel); ym = { y: d.getFullYear(), m: d.getMonth() }; }
    const head = el('div', 'calhead', `<button type="button" data-n="-1">‹</button><h3>${months()[ym.m]} ${ym.y}</h3><button type="button" data-n="1">›</button>`);
    head.onclick = e => {
      const n = e.target.dataset && e.target.dataset.n; if (!n) return;
      Sound.select(2); ym.m += +n;
      if (ym.m < 0) { ym.m = 11; ym.y--; } if (ym.m > 11) { ym.m = 0; ym.y++; }
      draw();
    };
    const grid = el('div', 'cal');
    days().slice(0, 7).forEach(n => grid.appendChild(el('span', 'dn', n.slice(0, 3))));
    const lead = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7, count = new Date(ym.y, ym.m + 1, 0).getDate();
    for (let i = 0; i < lead; i++) grid.appendChild(el('span'));
    for (let d = 1; d <= count; d++) {
      const iso = `${ym.y}-${pad2(ym.m + 1)}-${pad2(d)}`;
      const types = [...new Set(eventsOn(iso, ctx.group).map(e => e.type))];
      const b = el('button', 'cell' + (iso === today ? ' today' : '') + (iso === sel ? ' sel' : '') + (types.includes('exam') ? ' hasexam' : ''),
        `<span>${d}</span><em>${types.map(t => `<i class="dot t-${t}"></i>`).join('')}</em>`);
      b.type = 'button';
      b.style.setProperty('--i', d);
      b.onclick = () => { sel = iso; Sound.select(d % 7); draw(); };
      grid.appendChild(b);
    }
    const info = el('div', 'dayinfo');
    info.appendChild(el('h4', null, dayTitle(sel)));
    const evs = eventsOn(sel, ctx.group);
    if (!evs.length) info.appendChild(el('p', 'none', tt('empty')));
    evs.forEach(e => {
      const c = chip(e);
      if (e.type === 'exam' && e.approx) c.insertAdjacentHTML('beforeend', `<span>${tt('exam_note')}</span>`);
      info.appendChild(c);
    });
    const go = el('button', 'plan-link', tt('see_plan') + ' →'); go.type = 'button';
    go.onclick = () => switchView('plan');
    info.appendChild(go);
    const legend = el('div', 'legend', ['cours', 'td', 'tp', 'exam'].map(t =>
      `<span class="t-${t}"><i class="dot"></i>${t === 'exam' ? tt('exam_label') : tt('type_' + t)}</span>`).join(''));
    live = null;
    body.append(head, grid, info, legend);
  }

  /* ───────── drawing + animated tab switch ───────── */
  function draw() {
    const body = $('#homeBody'); body.innerHTML = '';
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === view));
    ({ plan: planView, cal: calView })[view](body);
  }

  function switchView(v) {
    if (view === v || switching) return;
    switching = true;
    const body = $('#homeBody');
    body.style.setProperty('--dir', ORDER.indexOf(v) > ORDER.indexOf(view) ? 1 : -1);
    Sound.whoosh();
    body.classList.add('vout');
    setTimeout(() => {
      view = v; body.classList.remove('vout'); draw();
      body.classList.add('vin');
      setTimeout(() => { body.classList.remove('vin'); switching = false; }, 650);
    }, 280);
  }

  // the time server answered (or the day changed): re-read "today" and redraw
  function clockUpdated() {
    const d = Clock.iso();
    if (d !== today) { if (sel === today) sel = d; today = d; }
    if (sel && $('#homeBody').childElementCount && view === 'plan') draw();
  }

  function render(opts) {
    ctx = opts;
    const tabs = $('#tabs'); tabs.innerHTML = '';
    [['plan', 'tab_plan'], ['cal', 'tab_cal']].forEach(([v, k]) => {
      const b = el('button', null, tt(k)); b.type = 'button'; b.dataset.v = v;
      b.onclick = () => switchView(v);
      tabs.appendChild(b);
    });
    if (!sel) sel = today;
    draw();
    if (!timer) timer = setInterval(tick, 30000);
  }

  return { render, clockUpdated };
})();
