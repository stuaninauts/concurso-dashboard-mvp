import { useState, useRef, useEffect } from 'react';
import { Ico } from './Icons';
import { useData } from '../data/DataContext';

export default function DataSourcePanel() {
  const { status, error, source, sheetUrl, loadUrl, loadCsv, refresh, resetToMock } = useData();
  const [inputUrl, setInputUrl] = useState(sheetUrl || '');
  const fileRef = useRef(null);

  // Keep the text field in sync when sheetUrl changes externally (e.g. auto-load on mount).
  useEffect(() => {
    setInputUrl(sheetUrl || '');
  }, [sheetUrl]);

  const handleLoad = () => {
    if (inputUrl.trim()) loadUrl(inputUrl.trim());
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) loadCsv(file);
    e.target.value = '';
  };

  const statusColor = {
    idle: 'var(--text-muted)',
    loading: 'var(--warn)',
    ready: 'var(--good)',
    error: 'var(--bad)',
  }[status];

  const statusLabel = {
    idle: source === 'mock' ? 'dados demo' : 'aguardando',
    loading: 'carregando…',
    ready: source === 'file' ? 'CSV carregado' : 'sheets conectado',
    error: 'erro',
  }[status];

  return (
    <div className="filter-group" style={{ gap: 8 }}>
      <div className="filter-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Fonte de dados</span>
        <span style={{ fontSize: 10, color: statusColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
          {statusLabel}
        </span>
      </div>

      {/* URL input */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="url"
          placeholder="Link do Google Sheets…"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
          style={{
            flex: 1, minWidth: 0,
            padding: '5px 8px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 11,
            background: 'var(--bg-card)',
            color: 'var(--text)',
            outline: 'none',
          }}
        />
        <button
          onClick={handleLoad}
          disabled={status === 'loading' || !inputUrl.trim()}
          style={{
            padding: '5px 10px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: 'white',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            opacity: status === 'loading' || !inputUrl.trim() ? 0.5 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {status === 'loading' ? '…' : 'Carregar'}
        </button>
      </div>

      {/* Secondary actions */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={status === 'loading'}
          style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-soft)', fontSize: 10, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Ico name="layers" size={11} />
          Subir CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />

        {source === 'sheets' && status === 'ready' && (
          <button
            onClick={refresh}
            style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-soft)', fontSize: 10, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Ico name="refresh" size={11} />
            Atualizar
          </button>
        )}

        {source !== 'mock' && (
          <button
            onClick={resetToMock}
            style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer' }}
          >
            Demo
          </button>
        )}
      </div>

      {/* Error message */}
      {status === 'error' && error && (
        <div style={{ fontSize: 10, color: 'var(--bad)', background: 'rgba(229,72,77,0.08)', borderRadius: 7, padding: '6px 8px', lineHeight: 1.4 }}>
          {error}
        </div>
      )}
    </div>
  );
}
