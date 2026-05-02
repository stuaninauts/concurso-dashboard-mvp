# Aurora — Dashboard do Concurseiro (v2)

Frontend React que substitui a versão Streamlit. Dados vêm direto do seu Google Sheets via CSV público, sem backend.

## Rodando localmente

Requer Node 20+ (recomendado: Node 24).

```bash
cd web
npm install
npm run dev        # abre em http://localhost:5173
npm run build      # gera dist/ estático pronto para Vercel
```

## Carregando seus dados

### Opção 1 — Google Sheets (recomendado)

1. Abra sua planilha no Google Sheets
2. Clique em **Compartilhar → Qualquer pessoa com o link → Leitor**
3. Copie a URL da barra do navegador
4. Cole no campo **"Link do Google Sheets"** na sidebar e clique em **Carregar**

Os dados ficam em cache por 2 minutos. Use o botão **Atualizar** para forçar reload.

### Opção 2 — CSV local

Clique em **Subir CSV** na sidebar e selecione o arquivo.

Use o botão **Demo** para voltar para os dados de exemplo.

---

## Formato esperado da planilha

Uma linha por sessão de estudo. Os nomes das colunas são flexíveis — variações com e sem acento são aceitas.

### Colunas obrigatórias

| Coluna | Variantes aceitas | Tipo | Exemplo |
|---|---|---|---|
| Data | `data`, `data_simulado` | `DD/MM/AAAA` ou `AAAA-MM-DD` | `10/01/2024` |
| Matéria | `materia`, `matéria` | Texto | `Direito Constitucional` |
| Questões | `questoes`, `questões`, `qtd_questoes` | Inteiro | `10` |
| Acertos | `acertos`, `qtd_acertos` | Inteiro | `7` |

### Colunas opcionais

| Coluna | Variantes aceitas | Padrão | Exemplo |
|---|---|---|---|
| Banca / Concurso | `concurso`, `simulado`, `banca` | `"Geral"` | `TRT 15` |
| Assunto | `assunto`, `topic` | matéria | `Direitos Fundamentais` |
| Não estudei | `erro_nao_estudei`, `erro: não estudei` | `0` | `1` |
| Não sabia | `erro_nao_sabia`, `erro: não sabia` | `0` | `2` |
| Interpretação | `erro_interpretacao`, `erro: interpretação` | `0` | `1` |
| Desatenção | `erro_desatencao`, `erro: desatenção` | `0` | `0` |
| Peso | `peso`, `weight` | `1` | `3` |
| Tempo (min) | `tempo_min`, `tempo` | `0` | `30` |

### Exemplo mínimo

```
data_simulado,simulado,materia,assunto,qtd_questoes,qtd_acertos,erro_nao_sabia,erro_interpretacao,erro_nao_estudei,erro_desatencao
10/01/2024,TRT 15,Direito Constitucional,Direitos Fundamentais,10,7,1,1,1,0
10/01/2024,TRT 15,Português,Crase,15,10,0,2,3,0
17/01/2024,TRT 2,Direito Administrativo,Licitações,10,5,3,1,1,0
```

---

## Estrutura do projeto

```
web/
├── src/
│   ├── App.jsx                    # Raiz: DataProvider + roteamento de páginas
│   ├── styles.css                 # Sistema de design Aurora (variáveis CSS)
│   ├── data/
│   │   ├── DataContext.jsx        # Estado global: sessions, status, source
│   │   ├── loadFromSheets.js      # Fetch CSV público do Google Sheets + cache 2min
│   │   ├── sheetToSessions.js     # Adapter: colunas PT → schema Session
│   │   └── mockData.js            # Dados demo gerados (fallback)
│   ├── lib/
│   │   └── auroraUtils.js         # Cálculos: KPIs, ranking, forecast, treemap
│   ├── components/
│   │   ├── Sidebar.jsx            # Navegação + filtros + painel de dados
│   │   ├── DataSourcePanel.jsx    # Input de URL, upload CSV, status
│   │   ├── Primitives.jsx         # KpiCard, ForecastGauge, SubjectRow, HonestBanner
│   │   ├── Icons.jsx              # Ícones SVG inline
│   │   └── TweaksPanel.jsx        # Painel flutuante de tema/densidade
│   └── pages/
│       ├── DashboardPage.jsx      # KPIs, forecast, evolução, erros, assuntos
│       ├── SubjectsPage.jsx       # Drilldown por matéria
│       ├── GoalsPage.jsx          # Metas e conquistas (dados demo)
│       └── ChecklistPage.jsx      # Checklist de simulados (localStorage)
└── README.md
```

## Deploy na Vercel

```bash
# Na raiz do repositório
vercel --cwd web
```

Ou conecte o repositório no painel da Vercel e configure:
- **Root Directory**: `web`
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
