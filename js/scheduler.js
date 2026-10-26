// Auto day planner. Takes the survey answers + the classes of that day and returns a list of blocks.
//
// answers used: focus (h), study (h), free (h), peak (morning|afternoon|night), sleep, wake, breakfast, lunch, dinner
//
// How it decides:
//  1. Fixed stuff goes first: classes, TDs, TPs.
//  2. Meals are slotted around them, and the wake-up / wind-down before sleep.
//  3. Study time = the "study" answer (capped by what you can focus, reduced on heavy class days,
//     lighter on weekends, boosted when an exam window is < 3 weeks away). It goes in your PEAK window
//     first (night = from 20:30), and spills into a second window only if it doesn't fit.
//  4. Block length depends on how long you can focus: 45/10, 60/10 or 90/15 (work/pause).
//  5. Fun time (your "free" answer) fills the non-peak parts of the day, more on the weekend.
//  6. Study subjects = today's classes (review) -> tomorrow's classes (prep) -> the rest.
const Scheduler = (() => {
  const STEP = 5;
  const mm = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const hhmm = n => { n = ((n % 1440) + 1440) % 1440; return pad2(Math.floor(n / 60)) + ':' + pad2(n % 60); };
  const up = n => Math.ceil(n / STEP) * STEP;

  function plan(iso, A, group) {
    A = A || {};
    const dow = (dateOf(iso).getDay() + 6) % 7;            // 0 = Monday
    const weekend = dow >= 5;
    const focusH = num(A.focus, 4), studyH = num(A.study, 3), freeH = num(A.free, 3);
    const peak = ['morning', 'afternoon', 'night'].includes(A.peak) ? A.peak : 'night';

    let wake = mm(A.wake || '07:00') + (weekend ? 60 : 0);
    const sleepT = mm(A.sleep || '23:30');
    const sleepEnd = sleepT <= wake ? sleepT + 1440 : sleepT;

    const events = eventsOn(iso, group);
    const classes = events.filter(e => e.start && e.type !== 'exam');
    const busy = [], blocks = [];
    const isFree = (s, e) => busy.every(b => e <= b.s || s >= b.e);
    // earliest-to-ideal free spot of `len` minutes inside [lo, hi]; `pad` reserves extra room after it
    function place(len, ideal, lo, hi, pad = 0) {
      let best = null, bd = Infinity;
      for (let s = up(lo); s + len <= hi; s += STEP) {
        if (!isFree(s, s + len + pad)) continue;
        const d = Math.abs(s - ideal);
        if (d < bd) { bd = d; best = s; }
      }
      if (best == null) return null;
      busy.push({ s: best, e: best + len + pad });
      return best;
    }
    const add = (kind, s, len, extra) => { blocks.push(Object.assign({ kind, start: s, end: s + len }, extra)); };

    // 1. classes
    let classMin = 0;
    for (const e of classes) {
      const s = mm(e.start), en = mm(e.end);
      busy.push({ s, e: en }); classMin += en - s;
      add(e.type, s, en - s, { ev: e });
    }

    // 2. meals + wind-down
    // meal times come from the survey (breakfast / lunch / dinner); defaults if the answer is missing
    const mealAt = (key, d) => (A[key] ? mm(A[key]) : d);
    const bIdeal = Math.max(mealAt('breakfast', wake + 15), wake + 10);
    const lIdeal = mealAt('lunch', 13 * 60), dIdeal = mealAt('dinner', 19 * 60 + 40);
    let t = place(25, bIdeal, wake, bIdeal + 120);                        if (t != null) add('meal', t, 25, { key: 'breakfast' });
    let lunch = 50;
    t = place(50, lIdeal, lIdeal - 90, lIdeal + 150);
    if (t == null) { lunch = 30; t = place(30, lIdeal, lIdeal - 120, lIdeal + 180); }
    if (t != null) add('meal', t, lunch, { key: 'lunch' });
    t = place(45, dIdeal, dIdeal - 90, dIdeal + 120);
    const dinnerEnd = t != null ? t + 45 : 0;
    if (t != null) add('meal', t, 45, { key: 'dinner' });
    t = place(30, sleepEnd - 30, sleepEnd - 50, sleepEnd);                if (t != null) add('wind', t, 30);

    // 3. study budget
    const dayFactor = [1, 1, 1, 1, 0.9, 0.7, 0.85][dow];
    let exam = null;
    for (const e of EXAMS) { const d = Math.round((dateOf(e.from) - dateOf(iso)) / 864e5); if (d >= 0 && (exam == null || d < exam)) exam = d; }
    const inExam = events.some(e => e.type === 'exam');
    let target = Math.min(studyH, Math.max(focusH * 1.5, 1)) * 60 * dayFactor;
    if (classMin >= 300) target *= 0.8;
    if (inExam || (exam != null && exam <= 21)) target *= 1.3;
    target = Math.min(Math.round(target / 5) * 5, 9 * 60);

    const [blen, brk] = focusH >= 5 ? [90, 15] : focusH >= 2.5 ? [60, 10] : [45, 10];

    const wins = {
      night:     [[Math.max(20 * 60 + 30, dinnerEnd ? dinnerEnd + 10 : 0), sleepEnd - 45], [16 * 60 + 30, Math.min(19 * 60 + 30, dIdeal - 15)]],
      morning:   [[wake + 60, 12 * 60 + 30], [15 * 60, 18 * 60 + 30]],
      afternoon: [[14 * 60 + 30, 19 * 60], [wake + 60, 12 * 60 + 30]],
    }[peak];

    const subjects = subjectOrder(iso, group, dow);
    let left = target, si = 0, studied = 0;
    for (const [lo, hi] of wins) {
      while (left >= 20) {
        const len = Math.min(blen, left);
        const s = place(len, lo, lo, hi, brk);
        if (s == null) break;
        add('study', s, len, { subj: subjects[si++ % subjects.length] });
        left -= len; studied += len;
      }
    }

    // 4. short nap for night people, then fun time
    if (peak === 'night') { t = place(25, 15 * 60 + 30, 14 * 60 + 30, 17 * 60); if (t != null) add('nap', t, 25); }

    const lastStudy = blocks.filter(b => b.kind === 'study').reduce((m, b) => Math.max(m, b.end), 0);
    const funWins = weekend ? [[10 * 60, 19 * 60 + 30], [lastStudy || 20 * 60, sleepEnd - 45]]
      : peak === 'night' ? [[16 * 60, 19 * 60 + 30], [lastStudy || 20 * 60 + 30, sleepEnd - 45]]
      : peak === 'morning' ? [[15 * 60 + 30, 19 * 60], [20 * 60 + 30, sleepEnd - 45]]
      : [[20 * 60, sleepEnd - 45], [wake + 60, 12 * 60 + 30]];
    let funLeft = Math.round(freeH * 60 * (weekend ? 1.3 : 1) * (inExam || (exam != null && exam <= 21) ? 0.8 : 1) / 5) * 5, fi = 0, fun = 0;
    for (const [lo, hi] of funWins) {
      while (funLeft >= 30) {
        const len = Math.min(75, funLeft);
        const s = place(len, lo, lo, hi, 5);
        if (s == null) break;
        add('fun', s, len, { idea: fi++ });
        funLeft -= len; fun += len;
      }
    }

    // 5. pauses between back-to-back study blocks
    blocks.sort((a, b) => a.start - b.start);
    for (let i = 0; i < blocks.length - 1; i++) {
      const a = blocks[i], b = blocks[i + 1];
      if (a.kind === 'study' && b.kind === 'study' && b.start > a.end) blocks.splice(++i, 0, { kind: 'break', start: a.end, end: b.start });
    }
    blocks.unshift({ kind: 'wake', start: wake, end: wake });
    blocks.push({ kind: 'sleep', start: sleepEnd, end: sleepEnd });

    return { blocks, totals: { study: studied, fun, cls: classMin }, exam, hhmm };
  }

  const num = (v, d) => (typeof v === 'number' && !isNaN(v) ? v : d);

  function subjectOrder(iso, group, dow) {
    const keys = ev => ev.filter(e => e.key).map(e => e.key);
    const out = [];
    const push = k => { if (k !== 'ent' && !out.includes(k)) out.push(k); };
    keys(eventsOn(iso, group)).forEach(push);
    keys(eventsOn(addDays(iso, 1), group)).forEach(push);
    const rest = Object.keys(SUBJ).filter(k => k !== 'ent' && !out.includes(k));
    const r = dow % Math.max(rest.length, 1);
    rest.slice(r).concat(rest.slice(0, r)).forEach(push);
    return out.length ? out : ['ana'];
  }

  return { plan, hhmm };
})();
