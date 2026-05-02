# concurso-dashboard-mvp

Dashboard de acompanhamento de performance para concurseiros. Monitora taxa bruta, taxa real, taxa de pontos, análise de erros e assuntos críticos a partir dos seus dados de estudo.

## Versões

### v2 — React (ativa) [`web/`](web/)

Frontend SPA em React + Vite. Dados via Google Sheets público ou upload de CSV. Pronto para deploy na Vercel.

```bash
cd web && npm install && npm run dev
# abre em http://localhost:5173
```

Ver [web/README.md](web/README.md) para instruções detalhadas e formato esperado da planilha.

### v1 — Streamlit (legacy) [`streamlit_app.py`](streamlit_app.py)

Versão original em Python/Streamlit, mantida para comparação de resultados durante a migração.

```bash
pip install -r requirements.txt
streamlit run streamlit_app.py
```

## Métricas calculadas

| Métrica | Fórmula |
|---|---|
| **Taxa Bruta** | acertos / total de questões |
| **Taxa Real** | acertos / (total − não estudei) |
| **Taxa de Pontos** | média ponderada por peso de matéria |
| **Forecast de Aprovação** | Monte Carlo: P(nota ≥ corte) com base nos últimos 14 dias |
| **Score de Consistência** | 100 − coef. variação × 2 |
| **ROI por matéria** | peso × (100 − taxa real) — onde estudar rende mais |

## Dados de exemplo

[`sample_data.csv`](sample_data.csv) — formato compatível com ambas as versões.
