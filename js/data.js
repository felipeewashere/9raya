// ─────────────────────────────────────────────────────────────
// SCHOOL DATA: AP1 (S1), transcribed from the PDFs in /data
//   - "EMPLOI DU TEMPS -AP1- S1 (26-31 Octobre 2026)"
//   - "Emploi du temps de TP de Mécanique du point (26-31 octobre 2026)"
// Groups: G1-G4 = Section 1, G5-G6 = Section 2. TP groups "Gr1-C".."Gr6-C" are read as G1..G6.
// To add a new week, add another block like WEEKS below (same format).
// ─────────────────────────────────────────────────────────────
const SLOT = { A: ['08:30', '10:15'], B: ['10:30', '12:15'], C: ['12:45', '14:30'], D: ['14:45', '16:30'] };
const SEC1 = ['G1', 'G2', 'G3', 'G4'], SEC2 = ['G5', 'G6'];

const SUBJ = {
  algo: 'Algorithmique et Résolution de Problèmes',
  ana: 'Analyse 1',
  alg: 'Algèbre 1',
  meca: 'Mécanique du point',
  elec: 'Électrostatique',
  ent: 'Entrepreneuriat et Compétences Digitales',
};

const SHORT = { algo: 'Algo', ana: 'Analyse 1', alg: 'Algèbre 1', meca: 'Méca', elec: 'Électro', ent: 'Entrepreneuriat' };

// day: 0 = Monday ... 4 = Friday.  [day, slot, type, subject, prof, room, groups]
const cours = (day, slot, subj, prof, room, groups) => [day, slot, 'cours', subj, prof, room, groups];
const td = (day, slot, subj, prof, room, group) => [day, slot, 'td', subj, prof, room, [group]];

const WEEKS = [{
  monday: '2026-10-26',
  holidays: { '2026-10-31': "Fête de l'Unité" },
  rows: [
    // Lundi
    td(0, 'A', 'algo', 'H. BOUTGOULA', '4 Med', 'G3'),
    cours(0, 'A', 'ana', 'Said TAARABTI', 'Amphi 2', SEC2),
    cours(0, 'B', 'ana', 'Said TAARABTI', 'Amphi 1', SEC1),
    td(0, 'B', 'algo', 'H. BOUTGOULA', '4 Med', 'G5'),
    td(0, 'C', 'meca', 'L. BENCHOUAF', '5 Med', 'G4'),
    td(0, 'C', 'elec', 'M. EL AZZAOUI', '6 Med', 'G6'),
    td(0, 'D', 'meca', 'L. BENCHOUAF', '5 Med', 'G1'),
    td(0, 'D', 'elec', 'M. EL AZZAOUI', '6 Med', 'G2'),
    // Mardi
    td(1, 'A', 'algo', 'H. BOUTGOULA', '5 Med', 'G2'),
    td(1, 'A', 'elec', 'A. NARJIS', '4 Med', 'G4'),
    td(1, 'B', 'elec', 'A. NARJIS', '4 Med', 'G1'),
    td(1, 'B', 'alg', 'S. HADIRI', '6 Med', 'G3'),
    td(1, 'B', 'algo', 'H. BOUTGOULA', '5 Med', 'G4'),
    td(1, 'C', 'alg', 'K. DLIOU', '5 Med', 'G2'),
    td(1, 'C', 'ana', 'Z. FATIMA OUGHAJJI', '6 Med', 'G3'),
    td(1, 'D', 'alg', 'K. DLIOU', '5 Med', 'G1'),
    td(1, 'D', 'ana', 'Z. FATIMA OUGHAJJI', '6 Med', 'G2'),
    td(1, 'D', 'meca', 'L. BENCHOUAF', '4 Med', 'G3'),
    // Mercredi
    cours(2, 'A', 'alg', 'Abdellah BNOUHACHEM', 'Amphi 1', SEC1),
    td(2, 'A', 'ana', 'K. DLIOU', '5 Med', 'G5'),
    td(2, 'A', 'algo', 'I. EL TAZY', '6 Med', 'G6'),
    td(2, 'B', 'algo', 'I. EL TAZY', '6 Med', 'G1'),
    td(2, 'B', 'ana', 'K. DLIOU', '5 Med', 'G4'),
    cours(2, 'B', 'alg', 'Abdellah BNOUHACHEM', 'Amphi 2', SEC2),
    cours(2, 'C', 'algo', 'Lamya OUKHOUYA', 'Amphi 1', SEC1),
    td(2, 'D', 'meca', 'L. BENCHOUAF', '6 Med', 'G2'),
    cours(2, 'D', 'algo', 'Lamya OUKHOUYA', 'Amphi 1', SEC2),
    // Jeudi
    cours(3, 'A', 'meca', 'Abdellah TIHANE', 'Amphi 1', SEC1),
    td(3, 'A', 'alg', 'A. BNOUHACHEM', '5 Med', 'G5'),
    td(3, 'B', 'alg', 'A. BNOUHACHEM', '5 Med', 'G4'),
    cours(3, 'B', 'elec', 'Marouane EL AZZAOUI', 'Amphi 2', SEC2),
    td(3, 'C', 'meca', 'L. BENCHOUAF', '5 Med', 'G5'),
    td(3, 'C', 'alg', 'B. LKAIHAL', '4 Med', 'G6'),
    td(3, 'D', 'meca', 'L. BENCHOUAF', '5 Med', 'G6'),
    // Vendredi
    cours(4, 'A', 'ent', 'Majda Radi Oubaha', 'Amphi 1', SEC1),
    cours(4, 'A', 'meca', 'Abdellah TIHANE', 'Amphi 2', SEC2),
    cours(4, 'B', 'elec', 'Marouane EL AZZAOUI', 'Amphi 1', SEC1),
    cours(4, 'B', 'ent', 'Majda Radi Oubaha', 'Amphi 2', SEC2),
  ],
}];

// TP Mécanique du point: [date, start, end, group, profs]
const TP = [
  ['2026-10-26', '10:30', '12:30', 'G6', 'SADIK / ETTIR'],
  ['2026-10-26', '12:30', '14:30', 'G2', 'SADIK / ETTIR'],
  ['2026-10-27', '10:30', '12:30', 'G5', 'ABOULAIDI / OUBBAD'],
  ['2026-10-27', '12:30', '14:30', 'G1', 'ABOULAIDI / OUBBAD'],
  ['2026-10-28', '10:30', '12:30', 'G3', 'OUBBAD / SADIK'],
  ['2026-10-29', '12:30', '14:30', 'G4', 'OUBBAD / SADIK'],
];

// EXAMS: !!! ESTIMATES (t9riban) !!!
// I could not find the official ENSA Agadir exam calendar online, so these windows follow the usual
// Moroccan university pattern (S1 exams in January, S2 exams in June). Replace with the real dates
// as soon as the school publishes them; set approx:false once a date is confirmed.
const EXAMS = [
  { sem: 'S1', from: '2027-01-11', to: '2027-01-22', approx: true },
  { sem: 'S2', from: '2027-05-31', to: '2027-06-11', approx: true },
];

// ───────── helpers ─────────
const pad2 = n => String(n).padStart(2, '0');
const isoOf = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const dateOf = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (iso, n) => { const d = dateOf(iso); d.setDate(d.getDate() + n); return isoOf(d); };

// every event of one date for one group: [{type, start, end, title, sub, room, ...}]
function eventsOn(iso, group) {
  const out = [];
  for (const w of WEEKS) {
    const day = Math.round((dateOf(iso) - dateOf(w.monday)) / 864e5);
    if (day >= 0 && day <= 4) {
      for (const [d, slot, type, subj, prof, room, groups] of w.rows) {
        if (d === day && groups.includes(group)) out.push({ type, key: subj, start: SLOT[slot][0], end: SLOT[slot][1], title: SUBJ[subj], short: SHORT[subj], sub: prof, room });
      }
    }
    if (w.holidays && w.holidays[iso]) out.push({ type: 'off', title: w.holidays[iso] });
  }
  for (const [date, start, end, g, profs] of TP) {
    if (date === iso && g === group) out.push({ type: 'tp', key: 'meca', start, end, title: 'TP ' + SUBJ.meca, short: 'TP Méca', sub: profs });
  }
  for (const e of EXAMS) {
    if (iso >= e.from && iso <= e.to) out.push({ type: 'exam', sem: e.sem, approx: e.approx, title: 'exam_' + e.sem.toLowerCase() });
  }
  return out.sort((a, b) => (a.start || '24').localeCompare(b.start || '24'));
}
