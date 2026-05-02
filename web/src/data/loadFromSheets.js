import Papa from 'papaparse';

// In-memory cache: url → { rows, expiresAt }
const cache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes, mirroring Streamlit ttl="2m"

// Extracts spreadsheet ID and gid from any Google Sheets URL variant.
function parseSheetUrl(url) {
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!idMatch) return null;
  const id = idMatch[1];

  const gidMatch = url.match(/[?&#]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  return { id, gid };
}

// Builds the public CSV export URL from a spreadsheet ID and gid.
export function toCsvExportUrl(url) {
  const parsed = parseSheetUrl(url);
  if (!parsed) return null;
  return `https://docs.google.com/spreadsheets/d/${parsed.id}/export?format=csv&gid=${parsed.gid}`;
}

// Parses a raw CSV string into an array of objects using PapaParse.
function parseCsv(text) {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  if (result.errors?.length) {
    const fatal = result.errors.find((e) => e.type === 'Delimiter' || e.row === undefined);
    if (fatal) throw new Error(`CSV parse error: ${fatal.message}`);
  }
  return result.data;
}

// Fetches and parses a public Google Sheets URL.
// Returns { rows } or throws with a user-facing message.
export async function loadFromSheets(url) {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && cached.expiresAt > now) {
    return { rows: cached.rows, fromCache: true };
  }

  const csvUrl = toCsvExportUrl(url);
  if (!csvUrl) throw new Error('URL inválida. Cole o link completo da planilha Google Sheets.');

  let response;
  try {
    response = await fetch(csvUrl);
  } catch {
    throw new Error('Não foi possível acessar a planilha. Verifique sua conexão.');
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error('Planilha privada. Compartilhe como "Qualquer pessoa com o link" antes de importar.');
  }
  if (!response.ok) {
    throw new Error(`Erro ao buscar planilha (HTTP ${response.status}). Verifique o link.`);
  }

  const text = await response.text();

  // Google returns an HTML login page when the sheet is private — detect it.
  if (text.trim().startsWith('<!') || text.includes('<html')) {
    throw new Error('Planilha privada ou link inválido. Certifique-se de que está compartilhada como "Qualquer pessoa com o link".');
  }

  const rows = parseCsv(text);
  if (!rows.length) throw new Error('A planilha está vazia ou sem linhas de dados.');

  cache.set(url, { rows, expiresAt: now + CACHE_TTL_MS });
  return { rows, fromCache: false };
}

// Parses a File (CSV upload) into rows.
export function loadFromFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        if (!result.data.length) return reject(new Error('Arquivo CSV vazio.'));
        resolve(result.data);
      },
      error: (err) => reject(new Error(`Erro ao ler CSV: ${err.message}`)),
    });
  });
}

// Clears the in-memory cache for a specific URL (or all if no url given).
export function clearCache(url) {
  if (url) cache.delete(url);
  else cache.clear();
}
