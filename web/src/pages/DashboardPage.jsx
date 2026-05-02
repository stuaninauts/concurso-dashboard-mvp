import { useMemo, useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
  ResponsiveContainer, PieChart, Pie, Cell, Treemap,
} from 'recharts';
import { Ico } from '../components/Icons';
import { KpiCard, ForecastGauge, SubjectRow, HonestBanner } from '../components/Primitives';
import AuroraUtils from '../lib/auroraUtils';

export default function DashboardPage({ sessions, data, kpiLayout, chartType, gamified }) {
  const k = useMemo(() => AuroraUtils.computeKPIs(sessions), [sessions]);
  const series = useMemo(() => AuroraUtils.timeSeries(sessions), [sessions]);
  const ranking = useMemo(() => AuroraUtils.subjectRanking(sessions), [sessions]);
  const trendReal = useMemo(() => AuroraUtils.trend(sessions, "taxaReal"), [sessions]);
  const trendPontos = useMemo(() => AuroraUtils.trend(sessions, "taxaPontos"), [sessions]);
  const consistency = useMemo(() => AuroraUtils.consistencyScore(sessions), [sessions]);
  const forecast = useMemo(() => AuroraUtils.forecastApproval(sessions, { simulatedQuestions: 80, cutoff: 60 }), [sessions]);
  const errors = useMemo(() => AuroraUtils.errorDistribution(sessions), [sessions]);
  const topics = useMemo(() => AuroraUtils.topicErrors(sessions).slice(0, 30), [sessions]);
  const roi = useMemo(() => AuroraUtils.roiData(sessions).slice(0, 10), [sessions]);
  const streakN = useMemo(() => AuroraUtils.streak(sessions), [sessions]);

  const [tab, setTab] = useState("evolution");
  const [chartFilter, setChartFilter] = useState("all");

  const sparkData = (key) => series.slice(-14).map(d => ({ v: d[key] || 0 }));

  const kpis = [
    { label: "Questões Totais", value: AuroraUtils.fmtNum(k.totalQ), sub: `${streakN}d streak`, info: "Total de questões respondidas no período filtrado" },
    { label: "Acertos", value: AuroraUtils.fmtNum(k.correct), sub: AuroraUtils.fmtPct(k.taxaBruta), info: "Total de acertos absolutos" },
    { label: "Taxa Bruta", value: k.taxaBruta.toFixed(1), unit: "%", info: "% de acertos sobre o total de questões respondidas", spark: sparkData("taxaBruta") },
    { label: "Taxa Real", value: k.taxaReal.toFixed(1), unit: "%", featured: true, delta: trendReal, info: "% de acertos sobre questões que VOCÊ JÁ ESTUDOU. Métrica principal.", spark: sparkData("taxaReal"), sparkLabel: "14d" },
    { label: "Não Estudei", value: AuroraUtils.fmtNum(k.naoEstudei), sub: AuroraUtils.fmtPct((k.naoEstudei / k.totalQ) * 100, 1) + " do total", info: "Questões que você marcou como 'não estudei ainda'" },
    { label: "Taxa de Pontos", value: k.taxaPontos.toFixed(1), unit: "%", delta: trendPontos, info: "Pontuação ponderada pelo peso de cada matéria — simula a nota da prova", spark: sparkData("taxaPontos") },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Boa, <span className="accent">concurseira</span>.</h1>
          <p className="page-sub">Painel TRT · {sessions.length} sessões registradas</p>
        </div>
        <div className="page-actions">
          {gamified && <span className="streak-flame"><Ico name="flame" size={11} stroke={2.5} />{streakN} dias seguidos</span>}
          <button className="btn btn-ghost"><Ico name="refresh" size={13} />Atualizar</button>
          <button className="btn btn-primary"><Ico name="plus" size={13} />Nova sessão</button>
        </div>
      </div>

      <HonestBanner data={data} sessions={sessions} />

      {kpiLayout === "list" ? (
        <div className="kpi-list" style={{ marginBottom: 26 }}>
          {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} layout="compact" />)}
        </div>
      ) : (
        <div className="kpi-row">
          {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 26 }}>
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Forecast de aprovação</h3>
              <div className="panel-sub">Simulação Monte Carlo · 1000 cenários · corte 60%</div>
            </div>
            <span className={`badge ${forecast.p >= 70 ? "badge-good" : forecast.p >= 40 ? "badge-warn" : "badge-bad"}`}>
              {forecast.p >= 70 ? "PROVÁVEL" : forecast.p >= 40 ? "DEPENDENDO" : "INSUFICIENTE"}
            </span>
          </div>
          <div className="gauge-card">
            <ForecastGauge percentage={forecast.p} />
            <div className="gauge-stats">
              <div className="gauge-stat">
                <span className="gauge-stat-label">Nota esperada</span>
                <span className="gauge-stat-value">{forecast.mean.toFixed(1)}%</span>
              </div>
              <div className="gauge-stat">
                <span className="gauge-stat-label">Desvio padrão</span>
                <span className="gauge-stat-value">±{forecast.std.toFixed(1)}%</span>
              </div>
              <div className="gauge-stat">
                <span className="gauge-stat-label">Pior cenário (P10)</span>
                <span className="gauge-stat-value">{(forecast.mean - 1.28 * forecast.std).toFixed(1)}%</span>
              </div>
              <div className="gauge-stat">
                <span className="gauge-stat-label">Score consistência</span>
                <span className="gauge-stat-value">{consistency.toFixed(0)}<span style={{ color: "var(--text-muted)", fontSize: 13 }}>/100</span></span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">ROI por matéria</h3>
              <div className="panel-sub">Onde estudar dá mais resultado · peso × erro</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {roi.slice(0, 5).map((r, i) => (
              <div key={r.name} style={{ display: "grid", gridTemplateColumns: "20px 1fr auto", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px dashed var(--border-soft)" : "none" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--pink-500)", fontWeight: 600 }}>{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>peso {r.weight} · erro {r.errorRate.toFixed(0)}%</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div className="bar-mini" style={{ width: 60 }}>
                    <div className="fill" style={{ width: `${Math.min(100, (r.score / (roi[0].score || 1)) * 100)}%` }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500, color: "var(--accent)" }}>{r.score.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="tab-bar">
            <button className={`tab ${tab === "evolution" ? "active" : ""}`} onClick={() => setTab("evolution")}>📈 Evolução & Matérias</button>
            <button className={`tab ${tab === "errors" ? "active" : ""}`} onClick={() => setTab("errors")}>⚠ Análise de Erros</button>
            <button className={`tab ${tab === "topics" ? "active" : ""}`} onClick={() => setTab("topics")}>🔥 Assuntos Críticos</button>
          </div>
          <div className="panel-actions">
            <div className="toggle-pill">
              <button className={chartFilter === "all" ? "active" : ""} onClick={() => setChartFilter("all")}>Tudo</button>
              <button className={chartFilter === "real" ? "active" : ""} onClick={() => setChartFilter("real")}>Só Real</button>
              <button className={chartFilter === "pontos" ? "active" : ""} onClick={() => setChartFilter("pontos")}>Só Pontos</button>
            </div>
          </div>
        </div>

        {tab === "evolution" && <EvolutionTab series={series} ranking={ranking} chartType={chartType} chartFilter={chartFilter} />}
        {tab === "errors" && <ErrorsTab errors={errors} sessions={sessions} />}
        {tab === "topics" && <TopicsTab topics={topics} />}
      </div>
    </div>
  );
}

function EvolutionTab({ series, ranking, chartType, chartFilter }) {
  const showBruta = chartFilter === "all";
  const showReal = chartFilter === "all" || chartFilter === "real";
  const showPontos = chartFilter === "all" || chartFilter === "pontos";

  return (
    <div className="grid-2">
      <div>
        <h4 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Evolução temporal</h4>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>Comparativo: Taxa Bruta vs Real vs Pontos</div>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === "bar" ? (
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dateLabel" />
              <YAxis domain={[40, 100]} unit="%" />
              <Tooltip />
              {showBruta && <Bar dataKey="taxaBruta" fill="#FFA3C7" name="Taxa Bruta" />}
              {showReal && <Bar dataKey="taxaReal" fill="#FF4D8F" name="Taxa Real" />}
              {showPontos && <Bar dataKey="taxaPontos" fill="#C72D72" name="Taxa Pontos" />}
            </BarChart>
          ) : chartType === "area" ? (
            <AreaChart data={series}>
              <defs>
                <linearGradient id="grPontos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF4D8F" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#FF4D8F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dateLabel" />
              <YAxis domain={[40, 100]} unit="%" />
              <Tooltip />
              {showBruta && <Area type="monotone" dataKey="taxaBruta" stroke="#FFA3C7" strokeWidth={1.5} fill="transparent" name="Taxa Bruta" strokeDasharray="4 4" />}
              {showReal && <Area type="monotone" dataKey="taxaReal" stroke="#FF4D8F" strokeWidth={2.5} fill="url(#grPontos)" name="Taxa Real" />}
              {showPontos && <Area type="monotone" dataKey="taxaPontos" stroke="#C72D72" strokeWidth={2} fill="transparent" name="Taxa Pontos" />}
            </AreaChart>
          ) : (
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dateLabel" />
              <YAxis domain={[40, 100]} unit="%" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {showBruta && <Line type="monotone" dataKey="taxaBruta" stroke="#FFA3C7" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Taxa Bruta" />}
              {showReal && <Line type="monotone" dataKey="taxaReal" stroke="#FF4D8F" strokeWidth={2.5} dot={{ r: 3 }} name="Taxa Real" />}
              {showPontos && <Line type="monotone" dataKey="taxaPontos" stroke="#C72D72" strokeWidth={2} dot={{ r: 3 }} name="Taxa Pontos" />}
              <ReferenceLine y={60} stroke="var(--bad)" strokeDasharray="3 3" label={{ value: "Corte 60%", fontSize: 10, fill: "var(--bad)", position: "right" }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <div>
        <h4 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Ranking por matéria</h4>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>Taxa real (líquida)</div>
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {ranking.map((s) => <SubjectRow key={s.name} s={s} />)}
        </div>
      </div>
    </div>
  );
}

function ErrorsTab({ errors, sessions }) {
  const errorColors = { "Nao Estudei": "#FFA3C7", "Nao Sabia": "#FF4D8F", "Interpretacao": "#C72D72", "Desatencao": "#FF7AB6" };

  const heatData = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      if (!map[s.materia]) map[s.materia] = { "Nao Estudei": 0, "Nao Sabia": 0, "Interpretacao": 0, "Desatencao": 0 };
      Object.entries(s.errors).forEach(([k, v]) => (map[s.materia][k] += v));
    });
    return Object.entries(map).map(([m, errs]) => ({ materia: m, ...errs }));
  }, [sessions]);
  const maxHeat = Math.max(...heatData.flatMap((r) => ["Nao Estudei", "Nao Sabia", "Interpretacao", "Desatencao"].map((k) => r[k])));

  return (
    <div>
      <h4 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, margin: "0 0 14px" }}>Distribuição dos tipos de erro</h4>
      <div className="grid-2">
        <div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Proporção dos erros</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={errors} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {errors.map((e, i) => <Cell key={i} fill={errorColors[e.name]} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Mapa de calor: onde os erros acontecem</div>
          <div style={{ display: "grid", gridTemplateColumns: "auto repeat(4, 1fr)", gap: 4, fontSize: 11 }}>
            <div></div>
            {["Não Estudei", "Não Sabia", "Interpretação", "Desatenção"].map((h) => (
              <div key={h} style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", padding: "2px 0" }}>{h}</div>
            ))}
            {heatData.map((row) => (
              <span key={row.materia} style={{ display: 'contents' }}>
                <div style={{ fontSize: 11, color: "var(--text-soft)", padding: "6px 8px 6px 0", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
                  {row.materia.length > 18 ? row.materia.slice(0, 16) + "…" : row.materia}
                </div>
                {["Nao Estudei", "Nao Sabia", "Interpretacao", "Desatencao"].map((k) => {
                  const v = row[k];
                  const opacity = maxHeat ? v / maxHeat : 0;
                  return (
                    <div key={k} className="tip" data-tip={`${row.materia} · ${k}: ${v}`} style={{
                      background: opacity > 0 ? `rgba(255, 77, 143, ${0.15 + opacity * 0.85})` : "var(--bg-soft)",
                      borderRadius: 6,
                      display: "grid", placeItems: "center",
                      fontSize: 12, fontWeight: 600,
                      color: opacity > 0.5 ? "white" : "var(--text-soft)",
                      minHeight: 26,
                    }}>
                      {v || ""}
                    </div>
                  );
                })}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopicsTab({ topics }) {
  const top10 = topics.slice(0, 10);
  return (
    <div>
      <h4 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, margin: "0 0 14px" }}>Análise detalhada dos assuntos com erro</h4>
      <div className="grid-2">
        <div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Treemap: assuntos com mais erros</div>
          <ResponsiveContainer width="100%" height={320}>
            <Treemap data={topics} dataKey="value" stroke="white" fill="#FF4D8F" content={<TreemapCell />}>
              <Tooltip content={({ active, payload }) => {
                if (active && payload?.length) {
                  return <div style={{ background: "white", padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}>
                    <strong>{payload[0].payload.name}</strong><br />
                    {payload[0].payload.materia}<br />
                    {payload[0].payload.value} ocorrências
                  </div>;
                }
                return null;
              }} />
            </Treemap>
          </ResponsiveContainer>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Top 10 assuntos recorrentes</div>
          <table className="table">
            <thead>
              <tr><th>#</th><th>Assunto</th><th>Matéria</th><th style={{ textAlign: "right" }}>Erros</th></tr>
            </thead>
            <tbody>
              {top10.map((t, i) => (
                <tr key={t.name}>
                  <td style={{ color: "var(--pink-500)", fontFamily: "var(--font-display)", fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{t.name}</td>
                  <td style={{ color: "var(--text-soft)", fontSize: 12 }}>{t.materia}</td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`badge ${t.value >= 3 ? "badge-bad" : "badge-warn"}`}>{t.value}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TreemapCell({ x, y, width, height, name, value, depth }) {
  if (depth !== 1) return null;
  const intensity = Math.min(1, value / 5);
  const fill = `rgba(255, 77, 143, ${0.3 + intensity * 0.6})`;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="white" strokeWidth={2} rx={4} />
      {width > 60 && height > 30 && (
        <text x={x + 6} y={y + 16} fill="white" fontSize="11" fontWeight="600">
          {name?.length > Math.floor(width / 7) ? name.slice(0, Math.floor(width / 7) - 1) + "…" : name}
        </text>
      )}
      {width > 40 && height > 50 && (
        <text x={x + 6} y={y + 32} fill="rgba(255,255,255,0.8)" fontSize="10">{value}</text>
      )}
    </g>
  );
}
