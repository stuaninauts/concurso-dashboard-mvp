import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { SubjectRow } from '../components/Primitives';
import AuroraUtils from '../lib/auroraUtils';

export default function SubjectsPage({ sessions, data }) {
  const ranking = useMemo(() => AuroraUtils.subjectRanking(sessions), [sessions]);
  const [selected, setSelected] = useState(ranking[0]?.name || null);
  const [sortBy, setSortBy] = useState("taxaReal");

  const sorted = [...ranking].sort((a, b) => {
    if (sortBy === "taxaReal") return a.taxaReal - b.taxaReal;
    if (sortBy === "weight") return b.weight - a.weight;
    if (sortBy === "total") return b.total - a.total;
    if (sortBy === "roi") return (b.weight * (100 - b.taxaReal)) - (a.weight * (100 - a.taxaReal));
    return 0;
  });

  const subjectSessions = sessions.filter((s) => s.materia === selected);
  const subjectSeries = useMemo(() => AuroraUtils.timeSeries(subjectSessions), [subjectSessions]);
  const subjectData = ranking.find((r) => r.name === selected);
  const subjectErrors = useMemo(() => {
    const errs = { "Nao Estudei": 0, "Nao Sabia": 0, "Interpretacao": 0, "Desatencao": 0 };
    subjectSessions.forEach((s) => Object.entries(s.errors).forEach(([k, v]) => errs[k] += v));
    return Object.entries(errs).map(([name, value]) => ({ name, value }));
  }, [subjectSessions]);
  const subjectTopics = useMemo(() => AuroraUtils.topicErrors(subjectSessions).slice(0, 8), [subjectSessions]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Análise por <span className="accent">matéria</span></h1>
          <p className="page-sub">Onde você precisa focar. Comece pelas piores e mais pesadas.</p>
        </div>
        <div className="page-actions">
          <div className="toggle-pill">
            <button className={sortBy === "taxaReal" ? "active" : ""} onClick={() => setSortBy("taxaReal")}>Pior taxa</button>
            <button className={sortBy === "weight" ? "active" : ""} onClick={() => setSortBy("weight")}>Maior peso</button>
            <button className={sortBy === "roi" ? "active" : ""} onClick={() => setSortBy("roi")}>Melhor ROI</button>
            <button className={sortBy === "total" ? "active" : ""} onClick={() => setSortBy("total")}>+ estudada</button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel" style={{ padding: 0 }}>
          <div style={{ padding: "20px 24px 12px", borderBottom: "1px solid var(--border-soft)" }}>
            <h3 className="panel-title">Ranking detalhado</h3>
            <div className="panel-sub">Clique para ver detalhes</div>
          </div>
          <div style={{ maxHeight: 540, overflowY: "auto" }}>
            {sorted.map((s) => (
              <div key={s.name} style={{ background: selected === s.name ? "var(--pink-50)" : "transparent" }}>
                <SubjectRow s={s} onClick={() => setSelected(s.name)} />
              </div>
            ))}
          </div>
        </div>

        {subjectData && (
          <div className="stack">
            <div className="panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Matéria selecionada</div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: "4px 0 0", fontWeight: 500, letterSpacing: "-0.02em" }}>{subjectData.name}</h2>
                </div>
                <span className={`badge ${subjectData.taxaReal >= 85 ? "badge-good" : subjectData.taxaReal >= 70 ? "badge-warn" : "badge-bad"}`}>
                  {subjectData.taxaReal >= 85 ? "DOMINANDO" : subjectData.taxaReal >= 70 ? "EM PROGRESSO" : "PRECISA REVISAR"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                <div>
                  <div className="kpi-label">Taxa Real</div>
                  <div className="kpi-value" style={{ fontSize: 26 }}>{subjectData.taxaReal.toFixed(0)}<span className="unit">%</span></div>
                </div>
                <div>
                  <div className="kpi-label">Questões</div>
                  <div className="kpi-value" style={{ fontSize: 26 }}>{subjectData.total}</div>
                </div>
                <div>
                  <div className="kpi-label">Acertos</div>
                  <div className="kpi-value" style={{ fontSize: 26 }}>{subjectData.correct}</div>
                </div>
                <div>
                  <div className="kpi-label">Peso</div>
                  <div className="kpi-value" style={{ fontSize: 26 }}>{subjectData.weight}</div>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3 className="panel-title">Evolução em {subjectData.name}</h3>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={subjectSeries}>
                  <defs>
                    <linearGradient id="grSubj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF4D8F" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#FF4D8F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dateLabel" />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip />
                  <Area type="monotone" dataKey="taxaReal" stroke="#FF4D8F" strokeWidth={2.5} fill="url(#grSubj)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid-2-eq">
              <div className="panel">
                <div className="panel-header"><h3 className="panel-title" style={{ fontSize: 16 }}>Tipos de erro</h3></div>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={subjectErrors} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {subjectErrors.map((e, i) => <Cell key={i} fill={["#FFA3C7", "#FF4D8F", "#C72D72", "#FF7AB6"][i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", fontSize: 11 }}>
                  {subjectErrors.map((e, i) => (
                    <span key={e.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: ["#FFA3C7", "#FF4D8F", "#C72D72", "#FF7AB6"][i] }}></span>
                      {e.name} ({e.value})
                    </span>
                  ))}
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><h3 className="panel-title" style={{ fontSize: 16 }}>Assuntos críticos</h3></div>
                {subjectTopics.length === 0 && <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "24px 0", textAlign: "center" }}>Sem erros registrados 🎉</div>}
                {subjectTopics.map((t) => (
                  <div key={t.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed var(--border-soft)", fontSize: 13 }}>
                    <span>{t.name}</span>
                    <span className="badge badge-bad">{t.value} erros</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
