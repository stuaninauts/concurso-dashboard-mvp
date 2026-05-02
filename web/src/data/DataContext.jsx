import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_DATA } from './mockData';
import { loadFromSheets, loadFromFile, clearCache } from './loadFromSheets';
import { sheetToSessions, collectSubjects, collectBancas } from './sheetToSessions';

const LS_URL_KEY = 'aurora-sheets-url';

const DataContext = createContext(null);

function buildDataFromSessions(sessions) {
  const subjects = collectSubjects(sessions);
  const bancas = collectBancas(sessions);
  return {
    sessions,
    subjects,
    bancas: bancas.length ? bancas : ['Geral'],
    errorTypes: ['Nao Estudei', 'Nao Sabia', 'Interpretacao', 'Desatencao'],
  };
}

export function DataProvider({ children }) {
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState(null);
  // 'mock' | 'sheets' | 'file'
  const [source, setSource] = useState('mock');
  const [data, setData] = useState(MOCK_DATA);
  const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem(LS_URL_KEY) || '');

  const applyRows = useCallback((rows, src) => {
    const sessions = sheetToSessions(rows);
    if (!sessions.length) {
      setError('Nenhuma sessão válida encontrada. Verifique o formato da planilha.');
      setStatus('error');
      return;
    }
    setData(buildDataFromSessions(sessions));
    setSource(src);
    setStatus('ready');
    setError(null);
  }, []);

  const loadUrl = useCallback(async (url) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setStatus('loading');
    setError(null);
    try {
      const { rows } = await loadFromSheets(trimmed);
      localStorage.setItem(LS_URL_KEY, trimmed);
      setSheetUrl(trimmed);
      applyRows(rows, 'sheets');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [applyRows]);

  const loadCsv = useCallback(async (file) => {
    setStatus('loading');
    setError(null);
    try {
      const rows = await loadFromFile(file);
      applyRows(rows, 'file');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [applyRows]);

  const refresh = useCallback(() => {
    if (source === 'sheets' && sheetUrl) {
      clearCache(sheetUrl);
      loadUrl(sheetUrl);
    }
  }, [source, sheetUrl, loadUrl]);

  const resetToMock = useCallback(() => {
    localStorage.removeItem(LS_URL_KEY);
    setSheetUrl('');
    setData(MOCK_DATA);
    setSource('mock');
    setStatus('idle');
    setError(null);
  }, []);

  // Auto-load saved URL on mount
  useEffect(() => {
    const saved = localStorage.getItem(LS_URL_KEY);
    if (saved) loadUrl(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DataContext.Provider value={{ data, status, error, source, sheetUrl, loadUrl, loadCsv, refresh, resetToMock }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}
