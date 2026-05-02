import { useState, useEffect } from 'react';
import './styles.css';
import { DataProvider, useData } from './data/DataContext';
import AuroraUtils from './lib/auroraUtils';
import Sidebar from './components/Sidebar';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakToggle } from './components/TweaksPanel';
import DashboardPage from './pages/DashboardPage';
import SubjectsPage from './pages/SubjectsPage';
import GoalsPage from './pages/GoalsPage';
import ChecklistPage from './pages/ChecklistPage';

const TWEAK_DEFAULTS = {
  theme: "pink",
  kpiLayout: "cards",
  chartType: "line",
  density: "comfortable",
  gamified: true,
};

function AppInner() {
  const { data } = useData();
  const [page, setPage] = useState("dashboard");
  const [filters, setFilters] = useState({
    bancas: [], materias: [], errors: [], dateFrom: null, dateTo: null,
  });
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tweaks.theme);
  }, [tweaks.theme]);

  const filtered = AuroraUtils.filterSessions(data.sessions, filters);

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage sessions={filtered} data={data} kpiLayout={tweaks.kpiLayout} chartType={tweaks.chartType} gamified={tweaks.gamified} density={tweaks.density} />;
      case "subjects": return <SubjectsPage sessions={filtered} data={data} />;
      case "goals": return <GoalsPage sessions={filtered} data={data} gamified={tweaks.gamified} />;
      case "checklist": return <ChecklistPage />;
      default: return null;
    }
  };

  return (
    <div className="app" data-density={tweaks.density}>
      <Sidebar page={page} setPage={setPage} filters={filters} setFilters={setFilters} data={data} gamified={tweaks.gamified} />
      <main className="main">{renderPage()}</main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Aparência" />
        <TweakRadio label="Tema" value={tweaks.theme} onChange={(v) => setTweak("theme", v)} options={[
          { value: "pink", label: "Rosa" },
          { value: "cream", label: "Cream" },
          { value: "dark", label: "Dark" },
        ]} />
        <TweakRadio label="Densidade" value={tweaks.density} onChange={(v) => setTweak("density", v)} options={[
          { value: "comfortable", label: "Conforto" },
          { value: "compact", label: "Compacto" },
        ]} />
        <TweakSection label="Layout" />
        <TweakRadio label="KPIs" value={tweaks.kpiLayout} onChange={(v) => setTweak("kpiLayout", v)} options={[
          { value: "cards", label: "Cards" },
          { value: "list", label: "Lista" },
        ]} />
        <TweakSelect label="Gráfico de evolução" value={tweaks.chartType} onChange={(v) => setTweak("chartType", v)} options={[
          { value: "line", label: "Linha" },
          { value: "area", label: "Área" },
          { value: "bar", label: "Barras" },
        ]} />
        <TweakSection label="Modo" />
        <TweakToggle label="Gamificado" value={tweaks.gamified} onChange={(v) => setTweak("gamified", v)} />
      </TweaksPanel>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppInner />
    </DataProvider>
  );
}
