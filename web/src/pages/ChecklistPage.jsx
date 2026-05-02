import { useState, useEffect } from 'react';
import { Ico } from '../components/Icons';
import { KpiCard } from '../components/Primitives';

export default function ChecklistPage() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("aurora-checklist");
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, text: "Simulado TRT 15 — Bloco I (Português + Lógica)", done: true, date: "2026-04-12", score: 78 },
      { id: 2, text: "Simulado TRT 2 — Direito do Trabalho", done: true, date: "2026-04-14", score: 82 },
      { id: 3, text: "Simulado TRT 6 — Completo (50 questões)", done: true, date: "2026-04-16", score: 71 },
      { id: 4, text: "Revisar erros do Simulado TRT 6", done: false, date: "2026-04-20", score: null },
      { id: 5, text: "Simulado TRT 1 — Direito Constitucional + Adm", done: false, date: "2026-04-21", score: null },
      { id: 6, text: "Simulado TRT 20 — Completo (50 questões)", done: false, date: "2026-04-23", score: null },
      { id: 7, text: "Simulado FGV 2024 — Prova oficial TRT 1", done: false, date: "2026-04-25", score: null },
      { id: 8, text: "Simulado Cebraspe 2023 — Prova TRT 8", done: false, date: "2026-04-27", score: null },
    ];
  });
  const [newText, setNewText] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    localStorage.setItem("aurora-checklist", JSON.stringify(items));
  }, [items]);

  const addItem = () => {
    if (!newText.trim()) return;
    setItems([...items, { id: Date.now(), text: newText, done: false, date: new Date().toISOString().slice(0, 10), score: null }]);
    setNewText("");
  };
  const toggle = (id) => setItems(items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const remove = (id) => setItems(items.filter(i => i.id !== id));
  const updateText = (id, text) => setItems(items.map(i => i.id === id ? { ...i, text } : i));
  const updateScore = (id, score) => setItems(items.map(i => i.id === id ? { ...i, score: parseFloat(score) || null } : i));

  const visible = items.filter(i => filter === "all" || (filter === "done" ? i.done : !i.done));
  const doneCount = items.filter(i => i.done).length;
  const avgScore = items.filter(i => i.score != null).reduce((a, b, _, arr) => a + b.score / arr.length, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Checklist de <span className="accent">simulados</span></h1>
          <p className="page-sub">Sua lista pessoal — adicione, marque, edite e acompanhe a média.</p>
        </div>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 18 }}>
        <KpiCard label="Simulados feitos" value={doneCount} sub={`${items.length - doneCount} pendentes`} />
        <KpiCard label="Total planejado" value={items.length} sub="lista pessoal" />
        <KpiCard label="Média dos simulados" value={avgScore.toFixed(1)} unit="%" featured info="Média das notas dos simulados concluídos" />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">Lista</h3>
            <div className="panel-sub">{doneCount} de {items.length} concluídos</div>
          </div>
          <div className="toggle-pill">
            <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Todos</button>
            <button className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>Pendentes</button>
            <button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>Feitos</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            className="search-input"
            style={{ paddingLeft: 14 }}
            placeholder="Adicionar novo simulado…"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />
          <button className="btn btn-primary" onClick={addItem}><Ico name="plus" size={14} />Adicionar</button>
        </div>

        <div className="stack" style={{ gap: 8 }}>
          {visible.map((item) => (
            <div key={item.id} className={`check-row ${item.done ? "done" : ""}`}>
              <button className={`check-box ${item.done ? "checked" : ""}`} onClick={() => toggle(item.id)}>
                {item.done && <Ico name="check" size={14} stroke={3} />}
              </button>
              <div>
                <input
                  className="check-text"
                  value={item.text}
                  onChange={(e) => updateText(item.id, e.target.value)}
                />
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {item.date}
                </div>
              </div>
              <div className="check-meta">
                {item.done ? (
                  <input
                    type="number"
                    placeholder="Nota %"
                    value={item.score || ""}
                    onChange={(e) => updateScore(item.id, e.target.value)}
                    style={{ width: 70, padding: "4px 8px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, textAlign: "right" }}
                  />
                ) : (
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>
                )}
                <button onClick={() => remove(item.id)} style={{ padding: 4, color: "var(--text-muted)" }}>
                  <Ico name="trash" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
