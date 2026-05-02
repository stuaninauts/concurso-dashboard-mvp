import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Ico } from '../components/Icons';
import AuroraUtils from '../lib/auroraUtils';

export default function GoalsPage({ sessions, data, gamified }) {
  const k = useMemo(() => AuroraUtils.computeKPIs(sessions), [sessions]);
  const forecast = useMemo(() => AuroraUtils.forecastApproval(sessions), [sessions]);
  const streakN = useMemo(() => AuroraUtils.streak(sessions), [sessions]);
  const consistency = useMemo(() => AuroraUtils.consistencyScore(sessions), [sessions]);

  const [goals] = useState([
    { id: 1, label: "Resolver 500 questões/semana", target: 500, current: Math.min(500, k.totalQ), unit: "q" },
    { id: 2, label: "Atingir 90% de Taxa Real", target: 90, current: k.taxaReal, unit: "%" },
    { id: 3, label: "Estudar 5 dias por semana", target: 5, current: Math.min(5, streakN), unit: "d" },
    { id: 4, label: "Reduzir erros de Desatenção pela metade", target: 50, current: 32, unit: "%" },
  ]);

  const achievements = [
    { id: "a1", emoji: "🔥", label: "Streak de 7 dias", earned: streakN >= 7, desc: "Estude 7 dias seguidos" },
    { id: "a2", emoji: "💯", label: "Centena", earned: k.totalQ >= 100, desc: "Resolva 100 questões" },
    { id: "a3", emoji: "🎯", label: "Atirador", earned: k.taxaReal >= 85, desc: "Taxa real ≥ 85%" },
    { id: "a4", emoji: "👑", label: "Acima do corte", earned: forecast.mean >= 60, desc: "Projeção ≥ corte" },
    { id: "a5", emoji: "💎", label: "Consistente", earned: consistency >= 70, desc: "Score ≥ 70" },
    { id: "a6", emoji: "🚀", label: "Mestre TRT", earned: forecast.p >= 80, desc: "80%+ chance de aprovação" },
  ];

  const xp = Math.floor(k.totalQ * 1.2 + k.correct * 2 + streakN * 50);
  const level = Math.floor(Math.sqrt(xp / 100));
  const xpForNext = (level + 1) ** 2 * 100;
  const xpForCurrent = level ** 2 * 100;
  const levelProgress = ((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Metas & <span className="accent">conquistas</span></h1>
          <p className="page-sub">O que você precisa atingir e o quanto já caminhou.</p>
        </div>
      </div>

      {gamified && (
        <div className="panel" style={{ background: "linear-gradient(135deg, var(--pink-500), var(--pink-700))", color: "white", marginBottom: 18, border: "none" }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 24, alignItems: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: "rgba(255,255,255,0.2)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontSize: 42, fontWeight: 600 }}>{level}</div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Nível {level}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, margin: "2px 0" }}>{xp.toLocaleString("pt-BR")} XP</div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.25)", borderRadius: 4, overflow: "hidden", maxWidth: 400 }}>
                <div style={{ height: "100%", width: `${levelProgress}%`, background: "white", borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>{Math.floor(xpForNext - xp)} XP para o nível {level + 1}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Streak</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 600 }}>🔥 {streakN}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Metas ativas</h3>
            <button className="btn btn-ghost"><Ico name="plus" size={13} />Nova meta</button>
          </div>
          <div className="stack" style={{ gap: 12 }}>
            {goals.map((g) => {
              const pct = Math.min(100, (g.current / g.target) * 100);
              const done = pct >= 100;
              return (
                <div key={g.id} style={{ padding: "14px 16px", border: "1px solid var(--border-soft)", borderRadius: 12, background: done ? "var(--good-soft)" : "var(--bg-card)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {done && <Ico name="check" size={14} style={{ color: "var(--good)" }} stroke={2.5} />}
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{g.label}</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500, color: done ? "var(--good)" : "var(--accent)" }}>
                      {g.current.toFixed(0)}<span style={{ color: "var(--text-muted)", fontSize: 13 }}> / {g.target}{g.unit}</span>
                    </span>
                  </div>
                  <div className="bar-mini">
                    <div className="fill" style={{ width: `${pct}%`, background: done ? "var(--good)" : "var(--accent)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Conquistas</h3>
            <span className="badge badge-pink">{achievements.filter((a) => a.earned).length}/{achievements.length}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {achievements.map((a) => (
              <div key={a.id} style={{
                padding: 14, borderRadius: 12,
                border: "1px solid var(--border-soft)",
                background: a.earned ? "linear-gradient(135deg, var(--pink-50), var(--pink-100))" : "var(--bg-soft)",
                opacity: a.earned ? 1 : 0.5,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 32, marginBottom: 4 }}>{a.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: a.earned ? "var(--pink-700)" : "var(--text-muted)" }}>{a.label}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panel-header">
          <div>
            <h3 className="panel-title">Comparativo de cortes (TRTs anteriores)</h3>
            <div className="panel-sub">Sua nota projetada vs. cortes históricos</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={[
            { regiao: "TRT 1", corte: 58, voce: forecast.mean },
            { regiao: "TRT 2", corte: 62, voce: forecast.mean },
            { regiao: "TRT 6", corte: 55, voce: forecast.mean },
            { regiao: "TRT 7", corte: 51, voce: forecast.mean },
            { regiao: "TRT 15", corte: 65, voce: forecast.mean },
            { regiao: "TRT 20", corte: 53, voce: forecast.mean },
          ]} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} unit="%" />
            <YAxis type="category" dataKey="regiao" width={60} />
            <Tooltip />
            <Bar dataKey="corte" fill="#FFC9DD" name="Corte histórico" radius={[0, 6, 6, 0]} />
            <Bar dataKey="voce" fill="#FF4D8F" name="Sua projeção" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
