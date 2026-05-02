import { useState, useMemo } from 'react';
import {
  AreaChart, Area, ResponsiveContainer,
} from 'recharts';
import { Ico } from './Icons';
import AuroraUtils from '../lib/auroraUtils';

export const PINKS = ["#FF4D8F", "#FF7AB6", "#FFA3C7", "#E8418B", "#C72D72", "#FFB8D4", "#9D1F58", "#FF85B8"];

export function KpiCard({ label, value, unit, sub, delta, featured, spark, sparkLabel, info, layout }) {
  const isUp = delta != null && delta >= 0;
  return (
    <div className={`kpi-card ${featured ? "featured" : ""}`}>
      <div className="kpi-label">
        {label}
        {info && <span className="info tip" data-tip={info}>i</span>}
      </div>
      <div className="kpi-value">
        {value}{unit && <span className="unit">{unit}</span>}
      </div>
      <div className="kpi-sub">
        {delta != null && (
          <span className={`kpi-delta ${isUp ? "up" : "down"}`}>
            <Ico name={isUp ? "trend_up" : "trend_down"} size={10} stroke={2.5} />
            {Math.abs(delta).toFixed(1)}{unit || ""}
          </span>
        )}
        {sub}
      </div>
      {spark && layout !== "compact" && (
        <div className="kpi-spark">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`sg-${label.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={featured ? "rgba(255,255,255,0.5)" : "var(--pink-500)"} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={featured ? "rgba(255,255,255,0.0)" : "var(--pink-500)"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={featured ? "white" : "var(--pink-500)"} strokeWidth={1.5} fill={`url(#sg-${label.replace(/\s/g, "")})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function ForecastGauge({ percentage }) {
  const angle = (percentage / 100) * 180;
  const r = 90, cx = 110, cy = 100;
  const polar = (ang) => {
    const rad = (180 - ang) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
  };
  const [ex, ey] = polar(angle);
  const large = angle > 180 ? 1 : 0;
  const arcPath = `M ${polar(0)[0]} ${polar(0)[1]} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  const fullPath = `M ${polar(0)[0]} ${polar(0)[1]} A ${r} ${r} 0 1 1 ${polar(180)[0]} ${polar(180)[1]}`;

  let color = "var(--bad)";
  if (percentage >= 70) color = "var(--good)";
  else if (percentage >= 50) color = "var(--warn)";
  else if (percentage >= 30) color = "var(--pink-500)";

  return (
    <svg viewBox="0 0 220 130" style={{ width: "100%", maxWidth: 220 }}>
      <path d={fullPath} fill="none" stroke="var(--border-soft)" strokeWidth="14" strokeLinecap="round" />
      <path d={arcPath} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
      <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 600, fill: "var(--text)" }}>
        {percentage.toFixed(0)}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 11, fill: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        chance de aprovação
      </text>
    </svg>
  );
}

export function SubjectRow({ s, max = 100, onClick }) {
  let color = "var(--good)";
  if (s.taxaReal < 70) color = "var(--bad)";
  else if (s.taxaReal < 85) color = "var(--warn)";
  return (
    <div className="subject-row" onClick={onClick}>
      <div className="subject-dot" style={{ background: color }} />
      <div>
        <div className="subject-name">{s.name}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          peso {s.weight} · {s.total} questões · {s.correct} acertos
        </div>
      </div>
      <div className="subject-bar-wrap">
        <div className="bar-mini">
          <div className="fill" style={{ width: `${(s.taxaReal / max) * 100}%`, background: color }} />
        </div>
      </div>
      <div className="subject-rate" style={{ color }}>{s.taxaReal.toFixed(1)}<span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 2 }}>%</span></div>
      <Ico name="chevron" size={14} style={{ color: "var(--text-muted)" }} />
    </div>
  );
}

export function HonestBanner({ data, sessions }) {
  const ranking = useMemo(() => AuroraUtils.subjectRanking(sessions), [sessions]);
  const worst = ranking[ranking.length - 1];
  const errs = useMemo(() => AuroraUtils.errorDistribution(sessions), [sessions]);
  const topErr = errs.filter((e) => e.name !== "Nao Estudei").sort((a, b) => b.value - a.value)[0];
  if (!worst) return null;
  const peso = data.subjects.find(s => s.name === worst.name)?.weight || 1;
  const isCritical = worst.taxaReal < 70 && peso >= 3;
  return (
    <div className="honest-banner">
      <div className="icon">{isCritical ? "🚨" : "💡"}</div>
      <div className="text">
        {isCritical ? <strong>Você precisa estudar </strong> : <strong>Foco da semana: </strong>}
        <span className="pink">{worst.name}</span>
        {" — "}taxa real <strong>{worst.taxaReal.toFixed(0)}%</strong> em matéria de peso <strong>{peso}</strong>.
        {topErr && <> Seu erro mais comum é <strong>{topErr.name}</strong> ({topErr.value} ocorrências) — {topErr.name === "Desatencao" ? "diminua a velocidade." : topErr.name === "Interpretacao" ? "leia duas vezes antes de marcar." : "abra o material e revise o conteúdo."}</>}
      </div>
    </div>
  );
}
