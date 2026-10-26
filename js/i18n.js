// UI strings per language. Darija (latin) is the default.
// Missing keys fall back to darija, then english.
const LANGS = [
  { id: 'da', label: 'DAR', dir: 'ltr', html: 'en' },
  { id: 'ar', label: 'دارجة', dir: 'rtl', html: 'ar' },
  { id: 'fr', label: 'FR', dir: 'ltr', html: 'fr' },
  { id: 'en', label: 'EN', dir: 'ltr', html: 'en' },
];

const UI = {
  da: {
    intro: 'wrek (e) bach tbda(y)...',
    intro_back: 'merhba bik tani {name}... wrek (e) bach tkml(i)',
    back: '‹ rj3',
    ok: 'safi',
    home_title: 'salam {name}',
    home_sub: "l'emploi du temps dyalk jay 9rib...",
    retake: "3awd l'survey",
    reset_confirm: 'bghiti tms7 kolchi w tbda men jdid?',
    theme_neon: 'Neon', theme_sunset: 'Sunset', theme_matcha: 'Matcha',
    theme_bubblegum: 'Bubblegum', theme_terminal: 'Terminal', theme_paper: 'Paper', theme_ensa: 'ENSA',
    pin_new: 'dir code dyal 4 ar9am',
    pin_login: 'dkhl code dyalk',
    pin_wrong: 'code ghalat',
    net_error: 'mochkil f connexion, 3awd',
    sound: 'sawt', reset: 'mse7',
    tab_plan: 'emploi', tab_week: 'simana',
    skip_hint: 'kliki 3la ay phase bach t-skipiha', now: 'daba', left: 'ba9i {t}', next: 'men b3d', p_meal: 'makla', tab_cal: 'calendrier', group: 'groupe',
    today: 'lyoum', see_plan: 'chof l emploi', note_noweek: 'ma3ndi emploi dyal had simana, hada plan 3am',
    p_wake: 'fi9', p_sleep: 'nss', p_breakfast: 'ftor', p_lunch: 'ghda', p_dinner: '3acha', p_study: '9raya', p_class: 'classe',
    p_fun: 'free time', p_nap: 'sieste', p_wind: 'rta7a', p_break: 'pause',
    type_cours: 'cours', type_td: 'TD', type_tp: 'TP',
    exam_s1: 'Exams S1 (t9riban)', exam_s2: 'Exams S2 (t9riban)', exam_label: 'exam (t9riban)',
    exam_note: 'tarikh t9ribi, kan bdlo melli ykhroj rsmi',
    holiday: '3otla', empty: 'walo had nhar',
  },
  ar: {
    intro: 'ضغط (ي) باش تبدا(ي)...',
    intro_back: 'مرحبا بيك تاني {name}... ضغط (ي) باش تكمل(ي)',
    back: '‹ رجع',
    ok: 'صافي',
    home_title: 'سلام {name}',
    home_sub: 'جدول الوقت ديالك جاي قريب...',
    retake: 'عاود السورفي',
    reset_confirm: 'بغيتي تمسح كلشي وتبدا من جديد؟',
    sound: 'الصوت', reset: 'مسح',
    tab_plan: 'الجدول', tab_week: 'السيمانة', tab_cal: 'الكالندري', group: 'الكروب',
    now: 'دابا', left: 'باقي {t}', next: 'من بعد', today: 'اليوم',
    skip_hint: 'كليكي على أي مرحلة باش تتخطاها',
    p_wake: 'فيق', p_sleep: 'نعس', p_breakfast: 'فطور', p_lunch: 'غدا', p_dinner: 'عشا', p_study: 'قراية', p_class: 'كلاس',
    p_fun: 'وقت فراغ', p_nap: 'قيلولة', p_wind: 'راحة', p_break: 'استراحة', p_meal: 'الماكلة',
    type_cours: 'كور', type_td: 'TD', type_tp: 'TP', see_plan: 'شوف الجدول',
    theme_neon: 'نيون', theme_sunset: 'غروب', theme_matcha: 'ماتشا', theme_bubblegum: 'علكة', theme_terminal: 'تيرمينال', theme_paper: 'ورق', theme_ensa: 'ENSA',
    exam_s1: 'امتحانات S1 (تقريبا)', exam_s2: 'امتحانات S2 (تقريبا)', exam_label: 'امتحان (تقريبا)',
    exam_note: 'تاريخ تقريبي، غادي يتبدل ملي يخرج الرسمي',
    holiday: 'عطلة', empty: 'والو هاد النهار',
  },
  fr: {
    intro: 'clique pour commencer...',
    intro_back: 'content de te revoir {name}... clique pour continuer',
    back: '‹ retour',
    ok: 'ok',
    home_title: 'salut {name}',
    home_sub: 'ton emploi du temps arrive bientôt...',
    retake: 'refaire le sondage',
    reset_confirm: 'tout effacer et recommencer ?',
    sound: 'son', reset: 'effacer',
    tab_plan: 'emploi', tab_week: 'semaine',
    skip_hint: 'clique sur une phase pour la sauter', now: 'maintenant', left: 'reste {t}', next: 'ensuite', p_meal: 'repas', tab_cal: 'calendrier', group: 'groupe',
    today: "aujourd'hui", see_plan: "voir l'emploi", note_noweek: "pas d'emploi du temps pour cette semaine, plan général",
    p_wake: 'réveil', p_sleep: 'dodo', p_breakfast: 'petit-déj', p_lunch: 'déjeuner', p_dinner: 'dîner', p_study: 'étude', p_class: 'cours',
    p_fun: 'temps libre', p_nap: 'sieste', p_wind: 'calme', p_break: 'pause',
    exam_s1: 'Examens S1 (approx.)', exam_s2: 'Examens S2 (approx.)', exam_label: 'examen (approx.)',
    exam_note: 'date approximative, à remplacer par la date officielle',
    holiday: 'jour férié', empty: 'rien ce jour',
  },
  en: {
    intro: 'click to begin...',
    intro_back: 'welcome back {name}... click to continue',
    back: '‹ back',
    ok: 'ok',
    home_title: 'hey {name}',
    home_sub: 'your timetable is coming soon...',
    retake: 'retake the survey',
    reset_confirm: 'erase everything and start over?',
    sound: 'sound', reset: 'reset',
    tab_plan: 'schedule', tab_week: 'week',
    skip_hint: 'click a phase to skip it', now: 'now', left: '{t} left', next: 'next', p_meal: 'meals', tab_cal: 'calendar', group: 'group',
    today: 'today', see_plan: 'see schedule', note_noweek: 'no timetable for this week, general plan',
    p_wake: 'wake up', p_sleep: 'sleep', p_breakfast: 'breakfast', p_lunch: 'lunch', p_dinner: 'dinner', p_study: 'study', p_class: 'class',
    p_fun: 'free time', p_nap: 'nap', p_wind: 'wind down', p_break: 'break',
    type_cours: 'lecture', type_td: 'TD', type_tp: 'lab',
    exam_s1: 'S1 exams (approx.)', exam_s2: 'S2 exams (approx.)', exam_label: 'exam (approx.)',
    exam_note: 'approximate date, will be replaced by the official one',
    holiday: 'holiday', empty: 'nothing this day',
  },
};

const DAYS = {
  da: ['tnin', 'tlata', 'larb3a', 'khmis', 'jm3a', 'sbt', 'l7ed'],
  ar: ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
  fr: ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'],
  en: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
};
const MONTHS = {
  da: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

// pick a translation out of {da, ar, fr, en} (or a plain string)
function T(obj, lang) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.da || obj.en || '';
}

function ui(lang, key, vars) {
  let s = (UI[lang] && UI[lang][key]) || UI.da[key] || UI.en[key] || key;
  if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
  return s;
}
