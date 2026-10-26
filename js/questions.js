// ─────────────────────────────────────────────────────────────
// SURVEY QUESTIONS
//
// Each question: { id, type, q: {da, ar, fr, en}, ... }
// Only `da` is required, other languages fall back to it.
// Darija rule: verbs get (e) for feminine when they end in a consonant, (y) when they end in a vowel.
// QUESTIONS[0] must stay the name question (the PIN step is inserted right after it).
//
// types:
//   text    -> big text input             (ph: placeholder)
//   slider  -> big number + slider        (min, max, step, def, unit)
//   time    -> big time picker            (def: 'HH:MM')
//   choice  -> typographic list           (opts: [{v, t:{da,..}}], layout: 'row' | 'cols')
//   scale   -> numbers 1..10
// ─────────────────────────────────────────────────────────────
const QUESTIONS = [
  { id: 'name', type: 'text',
    q: { da: 'achno smitek?', fr: "c'est quoi ton nom ?", en: "what's your name?" },
    ph: { da: 'smiytek...', fr: 'ton nom...', en: 'your name...' } },

  { id: 'focus', type: 'slider', min: 0, max: 12, step: 0.5, def: 4,
    q: { da: 'ch7al men sa3a katfocus(e) f nhar?', fr: "combien d'heures peux-tu te concentrer par jour ?", en: 'how many hours can you focus a day?' },
    unit: { da: 'sa3a', fr: 'h', en: 'h' } },

  { id: 'study', type: 'slider', min: 0, max: 12, step: 0.5, def: 3,
    q: { da: 'ch7al men sa3a kat9ra(y) f nhar?', fr: "combien d'heures étudies-tu par jour ?", en: 'how many hours do you study a day?' },
    unit: { da: 'sa3a', fr: 'h', en: 'h' } },

  { id: 'free', type: 'slider', min: 0, max: 10, step: 0.5, def: 3,
    q: { da: 'ch7al 3ndek men wa9t faragh f nhar?', fr: 'combien de temps libre as-tu par jour ?', en: 'how much free time do you have a day?' },
    unit: { da: 'sa3a', fr: 'h', en: 'h' } },

  { id: 'peak', type: 'choice', layout: 'row',
    q: { da: 'fach mn w9t katfocus(e) bzaf?', fr: 'quand es-tu le plus concentré ?', en: 'when do you focus the most?' },
    opts: [
      { v: 'morning',   t: { da: 'sbah',    fr: 'matin',      en: 'morning' } },
      { v: 'afternoon', t: { da: 'l3chiya', fr: 'après-midi', en: 'afternoon' } },
      { v: 'night',     t: { da: 'blil',    fr: 'nuit',       en: 'night' } },
    ] },

  { id: 'sleep', type: 'time', def: '23:30',
    q: { da: 'fach katn3ss(e)?', fr: 'à quelle heure tu dors ?', en: 'when do you go to sleep?' } },

  { id: 'wake', type: 'time', def: '07:00',
    q: { da: 'fach katfe9(e)?', fr: 'à quelle heure tu te réveilles ?', en: 'when do you wake up?' } },

  { id: 'breakfast', type: 'time', def: '07:30',
    q: { da: 'imta katfter(e)?', fr: 'à quelle heure tu prends ton petit-déj ?', en: 'when do you have breakfast?' } },

  { id: 'lunch', type: 'time', def: '13:00',
    q: { da: 'imta katghda(y)?', fr: 'à quelle heure tu déjeunes ?', en: 'when do you have lunch?' } },

  { id: 'dinner', type: 'time', def: '20:00',
    q: { da: 'imta kat3cha(y)?', fr: 'à quelle heure tu dînes ?', en: 'when do you have dinner?' } },

  { id: 'group', type: 'choice', layout: 'cols',
    q: { da: 'achmen grp fach kayen(a)?', fr: "dans quel groupe es-tu ?", en: 'which group are you in?' },
    opts: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'].map(g => ({ v: g, t: g })) },
];
