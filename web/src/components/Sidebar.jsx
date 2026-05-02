import { Ico } from './Icons';
import AuroraUtils from '../lib/auroraUtils';

export default function Sidebar({ page, setPage, filters, setFilters, data, gamified }) {
  const allBancas = data.bancas;
  const allMaterias = data.subjects.map((s) => s.name);

  const toggleArr = (key, val) => {
    setFilters((f) => {
      const cur = f[key] || [];
      return { ...f, [key]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] };
    });
  };

  const dateRanges = [
    { label: "7d", days: 7 },
    { label: "30d", days: 30 },
    { label: "Tudo", days: null },
  ];

  const setRange = (days) => {
    if (days === null) return setFilters((f) => ({ ...f, dateFrom: null, dateTo: null }));
    const latestDate = data.sessions.reduce((max, s) => s.date > max ? s.date : max, "2000-01-01");
    const d = new Date(latestDate);
    d.setDate(d.getDate() - days);
    setFilters((f) => ({ ...f, dateFrom: d.toISOString().slice(0, 10), dateTo: latestDate }));
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "home" },
    { id: "subjects", label: "Análise por Matéria", icon: "book" },
    { id: "goals", label: "Metas & Ranking", icon: "medal" },
    { id: "checklist", label: "Checklist Simulados", icon: "check_list" },
  ];

  const streakN = AuroraUtils.streak(data.sessions);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">A</div>
        <div>
          <div className="brand-name">Aurora</div>
          <div className="brand-sub">painel concurseira</div>
        </div>
      </div>

      {gamified && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border-soft)" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #FFD9E7, #FFA3C7)", display: "grid", placeItems: "center" }}>
            <Ico name="flame" size={16} stroke={2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Streak</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>{streakN} dias</div>
          </div>
        </div>
      )}

      <nav className="nav">
        <div className="nav-section-label">Navegação</div>
        {navItems.map((n) => (
          <button key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
            <Ico name={n.icon} size={16} className="ico" />
            {n.label}
          </button>
        ))}
      </nav>

      <div className="filters">
        <div className="nav-section-label">Filtros</div>

        <div className="filter-group">
          <div className="filter-label">
            <span>Período</span>
          </div>
          <div className="date-range">
            <Ico name="calendar" size={14} className="ico" />
            <span>
              {filters.dateFrom?.replace(/-/g, "/") || "01/03"} – {filters.dateTo?.replace(/-/g, "/") || "19/04"}
            </span>
          </div>
          <div className="date-pills">
            {dateRanges.map((r) => (
              <button key={r.label} className="date-pill" onClick={() => setRange(r.days)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <div className="filter-label">
            <span>Banca</span>
            {filters.bancas?.length > 0 && (
              <span className="filter-clear" onClick={() => setFilters((f) => ({ ...f, bancas: [] }))}>limpar</span>
            )}
          </div>
          <div className="chip-cloud">
            {allBancas.map((b) => (
              <button key={b} className={`chip ${filters.bancas?.includes(b) ? "active" : ""}`} onClick={() => toggleArr("bancas", b)}>
                {b}
                {filters.bancas?.includes(b) && <span className="x">×</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <div className="filter-label">
            <span>Matéria</span>
            {filters.materias?.length > 0 && (
              <span className="filter-clear" onClick={() => setFilters((f) => ({ ...f, materias: [] }))}>limpar</span>
            )}
          </div>
          <div className="chip-cloud" style={{ maxHeight: 180, overflowY: "auto" }}>
            {allMaterias.map((m) => (
              <button key={m} className={`chip ${filters.materias?.includes(m) ? "active" : ""}`} onClick={() => toggleArr("materias", m)}>
                {m.length > 18 ? m.slice(0, 16) + "…" : m}
                {filters.materias?.includes(m) && <span className="x">×</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <div className="filter-label">
            <span>Tipos de Erro</span>
            {filters.errors?.length > 0 && (
              <span className="filter-clear" onClick={() => setFilters((f) => ({ ...f, errors: [] }))}>limpar</span>
            )}
          </div>
          <div className="chip-cloud">
            {data.errorTypes.map((e) => (
              <button key={e} className={`chip ${filters.errors?.includes(e) ? "active" : ""}`} onClick={() => toggleArr("errors", e)}>
                {e}
                {filters.errors?.includes(e) && <span className="x">×</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
