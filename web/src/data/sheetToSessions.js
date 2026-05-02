// Normalizes raw CSV/Sheets rows (Portuguese column names, multiple variations)
// into the Session schema expected by auroraUtils.js.
//
// Session schema:
//   id, date (YYYY-MM-DD), banca, materia, weight, total, correct,
//   naoEstudei, errors { Nao Estudei, Nao Sabia, Interpretacao, Desatencao },
//   topic, timeSpentMin, confidence

// Maps every known column name variant to a canonical key.
const RENAME = {
  // date
  data: 'data',
  data_simulado: 'data',
  date: 'data',

  // banca / concurso
  concurso: 'concurso',
  simulado: 'concurso',
  banca: 'concurso',

  // subject
  materia: 'materia',
  'matéria': 'materia',
  subject: 'materia',
  disciplina: 'materia',

  // topic (single value)
  assunto: 'assunto',
  topic: 'assunto',
  tópico: 'assunto',
  topico: 'assunto',

  // topics (comma-separated, legacy)
  assuntos_erro: 'assuntos_erro',
  'erro: assuntos': 'assuntos_erro',
  'erro: assunto': 'assuntos_erro',
  assuntos: 'assuntos_erro',

  // questions / answers
  'questões': 'questoes',
  questoes: 'questoes',
  qtd_questoes: 'questoes',
  total_questoes: 'questoes',
  questions: 'questoes',

  acertos: 'acertos',
  qtd_acertos: 'acertos',
  total_acertos: 'acertos',
  correct: 'acertos',

  // error columns
  erro_nao_estudei: 'erro_nao_estudei',
  'erro: não estudei': 'erro_nao_estudei',
  'erro: nao estudei': 'erro_nao_estudei',
  nao_estudei: 'erro_nao_estudei',

  erro_nao_sabia: 'erro_nao_sabia',
  'erro: não sabia': 'erro_nao_sabia',
  'erro: nao sabia': 'erro_nao_sabia',
  nao_sabia: 'erro_nao_sabia',

  erro_interpretacao: 'erro_interpretacao',
  'erro: interpretação': 'erro_interpretacao',
  'erro: interpretacao': 'erro_interpretacao',
  interpretacao: 'erro_interpretacao',

  erro_desatencao: 'erro_desatencao',
  'erro: desatenção': 'erro_desatencao',
  'erro: desatencao': 'erro_desatencao',
  desatencao: 'erro_desatencao',

  // weight / time
  peso: 'peso',
  weight: 'peso',
  tempo: 'tempo_min',
  tempo_min: 'tempo_min',
  time_min: 'tempo_min',
};

function normalizeKey(raw) {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // strip accents for lookup
}

function toNum(v, fallback = 0) {
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? fallback : n;
}

// Parses a date string (dd/mm/yyyy or yyyy-mm-dd or mm/dd/yyyy-ish) → YYYY-MM-DD.
function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  // already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // dd/mm/yyyy or dd-mm-yyyy (Brazilian)
  const brt = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (brt) {
    const [, d, m, y] = brt;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // fallback: let Date parse it
  const dt = new Date(s);
  if (!isNaN(dt)) return dt.toISOString().slice(0, 10);
  return null;
}

// Collects all unique subject names from the rows so the caller can build
// a subjects list (needed for sidebar filter chips).
export function collectSubjects(rows) {
  const seen = new Map();
  rows.forEach((r) => {
    const m = r.materia;
    const w = r.peso ?? 1;
    if (m && !seen.has(m)) seen.set(m, w);
  });
  const colors = [
    '#FF4D8F','#FF7AB6','#FFA3C7','#E8418B','#C72D72',
    '#FF5C9E','#FF85B8','#FFB8D4','#D63A82','#F2A0C0',
    '#FFC9DD','#B8295E',
  ];
  return [...seen.entries()].map(([name, weight], i) => ({
    name,
    weight,
    color: colors[i % colors.length],
  }));
}

// Collects unique banca names from already-normalised rows.
export function collectBancas(rows) {
  return [...new Set(rows.map((r) => r.concurso).filter(Boolean))];
}

// Main export: converts raw PapaParse rows → Session[].
export function sheetToSessions(rawRows) {
  if (!rawRows?.length) return [];

  // 1. Normalise headers once
  const firstRow = rawRows[0];
  const headerMap = {}; // rawKey → canonicalKey
  Object.keys(firstRow).forEach((raw) => {
    const norm = normalizeKey(raw);
    const canonical = RENAME[norm] || RENAME[raw] || null;
    if (canonical) headerMap[raw] = canonical;
  });

  // 2. Re-key each row
  const normed = rawRows.map((row) => {
    const out = {};
    Object.entries(row).forEach(([k, v]) => {
      const canon = headerMap[k];
      if (canon) out[canon] = v;
    });
    return out;
  });

  // 3. Convert to Session objects
  let idCounter = 1;
  const sessions = [];

  normed.forEach((r) => {
    const date = parseDate(r.data);
    if (!date) return; // skip rows with unparseable date

    const total = toNum(r.questoes);
    const correct = toNum(r.acertos);
    const naoEstudei = toNum(r.erro_nao_estudei);
    const naoSabia = toNum(r.erro_nao_sabia);
    const interpretacao = toNum(r.erro_interpretacao);
    const desatencao = toNum(r.erro_desatencao);
    const peso = toNum(r.peso, 1) || 1;
    const timeSpentMin = toNum(r.tempo_min, 0);

    // Determine topic: prefer single `assunto` column; fall back to first
    // value of comma-separated `assuntos_erro`.
    let topic = '';
    if (r.assunto && String(r.assunto).trim()) {
      topic = String(r.assunto).trim();
    } else if (r.assuntos_erro && String(r.assuntos_erro).trim()) {
      topic = String(r.assuntos_erro).split(',')[0].trim();
    }
    if (!topic) topic = r.materia || 'Geral';

    sessions.push({
      id: idCounter++,
      date,
      banca: r.concurso || 'Geral',
      materia: r.materia || 'Geral',
      weight: peso,
      total,
      correct,
      naoEstudei,
      errors: {
        'Nao Estudei': naoEstudei,
        'Nao Sabia': naoSabia,
        'Interpretacao': interpretacao,
        'Desatencao': desatencao,
      },
      topic,
      timeSpentMin,
      confidence: 80,
    });
  });

  return sessions;
}
