export const MOCK_DATA = (function () {
  const subjects = [
    { name: "Português", weight: 2, color: "#FF4D8F" },
    { name: "Raciocínio Lógico", weight: 2, color: "#FF7AB6" },
    { name: "Informática", weight: 1, color: "#FFA3C7" },
    { name: "Direito Constitucional", weight: 3, color: "#E8418B" },
    { name: "Direito Administrativo", weight: 3, color: "#C72D72" },
    { name: "Direito do Trabalho", weight: 4, color: "#FF5C9E" },
    { name: "Direito Processual do Trabalho", weight: 4, color: "#FF85B8" },
    { name: "Direito Civil", weight: 2, color: "#FFB8D4" },
    { name: "Direito Processual Civil", weight: 2, color: "#D63A82" },
    { name: "Direito Previdenciário", weight: 1, color: "#F2A0C0" },
    { name: "Legislação", weight: 1, color: "#FFC9DD" },
    { name: "Direitos PCD", weight: 1, color: "#B8295E" },
  ];

  const errorTypes = ["Nao Estudei", "Nao Sabia", "Interpretacao", "Desatencao"];

  const baselineRates = {
    "Português": 83,
    "Raciocínio Lógico": 95,
    "Informática": 62,
    "Direito Constitucional": 96,
    "Direito Administrativo": 81,
    "Direito do Trabalho": 97,
    "Direito Processual do Trabalho": 95,
    "Direito Civil": 100,
    "Direito Processual Civil": 93,
    "Direito Previdenciário": 100,
    "Legislação": 100,
    "Direitos PCD": 65,
  };

  const sessions = [];
  const start = new Date(2026, 2, 1);
  const end = new Date(2026, 3, 19);
  let id = 1;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (Math.random() < 0.3) continue;
    const numSessions = 1 + Math.floor(Math.random() * 3);
    for (let s = 0; s < numSessions; s++) {
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const banca = ["TRT 1", "TRT 2", "TRT 6", "TRT 7", "TRT 15", "TRT 20"][Math.floor(Math.random() * 6)];
      const baseline = baselineRates[subject.name];
      const total = 8 + Math.floor(Math.random() * 22);
      const noiseRate = (baseline + (Math.random() - 0.5) * 20) / 100;
      const known = Math.floor(total * (0.85 + Math.random() * 0.1));
      const naoEstudei = total - known;
      const correct = Math.min(known, Math.floor(known * noiseRate + Math.random() * 2));
      const wrong = known - correct;
      const errs = { "Nao Estudei": naoEstudei, "Nao Sabia": 0, "Interpretacao": 0, "Desatencao": 0 };
      for (let w = 0; w < wrong; w++) {
        const r = Math.random();
        if (r < 0.55) errs["Nao Sabia"]++;
        else if (r < 0.85) errs["Interpretacao"]++;
        else errs["Desatencao"]++;
      }
      sessions.push({
        id: id++,
        date: new Date(d).toISOString().slice(0, 10),
        banca,
        materia: subject.name,
        weight: subject.weight,
        total,
        correct,
        naoEstudei,
        errors: errs,
        topic: pickTopic(subject.name),
        timeSpentMin: Math.floor(15 + Math.random() * 45),
        confidence: Math.floor(60 + Math.random() * 40),
      });
    }
  }

  function pickTopic(materia) {
    const topics = {
      "Português": ["Crase", "Pontuação", "Concordância", "Interpretação textual", "Regência"],
      "Raciocínio Lógico": ["Proposições", "Conjuntos", "Análise combinatória", "Probabilidade", "Matemática básica"],
      "Informática": ["Office 365", "Gmail", "Outlook", "Windows 10", "Google Workspace", "PJE", "Redes"],
      "Direito Constitucional": ["Direitos fundamentais", "Organização do Estado", "Poder Legislativo", "Controle de constitucionalidade"],
      "Direito Administrativo": ["Licitações", "Servidores", "Atos administrativos", "Improbidade", "Lei 8.112"],
      "Direito do Trabalho": ["Dissídios coletivos", "FGTS", "Férias", "Rescisão", "Jornada de trabalho", "Dano moral"],
      "Direito Processual do Trabalho": ["Recursos", "Execução", "Dissídios coletivos", "Audiência", "Sentença"],
      "Direito Civil": ["Contratos", "Obrigações", "Posse", "Família", "Sucessões"],
      "Direito Processual Civil": ["Recursos", "Execução", "Tutela provisória", "Sentença"],
      "Direito Previdenciário": ["Benefícios", "Custeio", "RGPS", "Aposentadoria"],
      "Legislação": ["Lei 8.899/1994", "Lei nº 8.899/1994", "Estatuto", "Resoluções"],
      "Direitos PCD": ["Proteção do trabalho da mulher", "Inclusão", "Cotas", "Acessibilidade"],
    };
    const arr = topics[materia] || ["Geral"];
    return arr[Math.floor(Math.random() * arr.length)];
  }

  return { sessions, subjects, errorTypes, bancas: ["TRT 1", "TRT 2", "TRT 6", "TRT 7", "TRT 15", "TRT 20"] };
})();
