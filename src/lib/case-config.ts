export type SectionKey = "diagnostico" | "analytics" | "automacao" | "ia" | "roadmap";

export const SECTIONS: {
  key: SectionKey;
  label: string;
  title: string;
  intro: string;
}[] = [
  {
    key: "diagnostico",
    label: "Diagnóstico",
    title: "Etapa 1 — Diagnóstico",
    intro:
      "Como você iniciaria o diagnóstico da situação atual de RH e da maturidade da empresa em dados, automação e inteligência artificial?",
  },
  {
    key: "analytics",
    label: "Analytics",
    title: "Etapa 2 — Analytics",
    intro: "Proponha um dashboard executivo de RH: indicadores, fontes, governança e periodicidade.",
  },
  {
    key: "automacao",
    label: "Automação",
    title: "Etapa 3 — Automação",
    intro: "Escolha os 3 primeiros processos de RH que você automatizaria e detalhe cada um deles.",
  },
  {
    key: "ia",
    label: "IA Generativa",
    title: "Etapa 4 — IA Generativa",
    intro: "Proponha uma solução de IA Generativa aplicada a RH, com arquitetura, riscos e indicadores.",
  },
  {
    key: "roadmap",
    label: "Roadmap Executivo",
    title: "Etapa 5 — Roadmap Executivo",
    intro: "Construa um roadmap de 90 dias dividido em três ondas de entrega.",
  },
];

export const CASE_SCENARIO = [
  "A Vero deseja criar uma frente de Inteligência e Inovação de RH.",
  "Os dados estão distribuídos em múltiplas fontes e não existe uma visão consolidada dos principais indicadores.",
  "Grande parte dos processos depende de atividades manuais.",
  "A Diretoria deseja utilizar IA para aumentar produtividade e melhorar a tomada de decisão.",
  "Você foi contratado para liderar os primeiros 90 dias dessa transformação.",
];

export const CRITERIA: { key: string; name: string; weight: number }[] = [
  { key: "negocio", name: "Visão de Negócio e RH", weight: 0.2 },
  { key: "analytics", name: "Analytics e Indicadores", weight: 0.25 },
  { key: "automacao", name: "Automação e Power Platform", weight: 0.2 },
  { key: "ia", name: "IA Generativa", weight: 0.2 },
  { key: "comunicacao", name: "Comunicação e Stakeholders", weight: 0.15 },
];

export const TECH_OPTIONS = [
  "Power Automate",
  "Power Apps",
  "Power BI",
  "SharePoint",
  "Microsoft Teams",
  "RPA",
  "API",
  "Outra",
];

export const PERIODICITY_OPTIONS = ["Tempo real", "Diário", "Semanal", "Mensal", "Trimestral"];

export const GAIN_OPTIONS = [
  "Redução de tempo",
  "Redução de esforço manual",
  "Redução de erros",
  "Melhoria de experiência",
  "Ganho financeiro",
];

export const WIDGET_OPTIONS = ["KPI", "Gráfico de barras", "Gráfico de linha", "Funil", "Tabela", "Ranking"];

export const ARCHITECTURE_BLOCKS = [
  "Usuário",
  "Aplicação",
  "API",
  "Base de Dados",
  "Documentos",
  "Base de Conhecimento",
  "IA Generativa",
  "RAG",
  "Microsoft Azure",
  "Power Platform",
  "Sistema de RH",
  "Microsoft Teams",
];

export const POSITIONS = [
  "Inteligência e Inovação de RH",
  "Analytics e Transformação Digital",
];

export const CANDIDATE_STATUS: Record<string, { label: string; tone: "muted" | "warning" | "info" | "success" }> = {
  nao_iniciado: { label: "Não iniciado", tone: "muted" },
  em_andamento: { label: "Em andamento", tone: "warning" },
  enviado: { label: "Enviado", tone: "info" },
  em_avaliacao: { label: "Em avaliação", tone: "info" },
  avaliado: { label: "Avaliado", tone: "success" },
  finalizado: { label: "Finalizado", tone: "success" },
};

export const RECOMMENDATIONS = [
  "Forte recomendação",
  "Recomendação",
  "Avaliar com ressalvas",
  "Não recomendado neste momento",
];

export type SectionData = Record<string, unknown>;

const REQUIRED_FIELDS: Record<SectionKey, string[]> = {
  diagnostico: ["processos", "stakeholders", "dados", "priorizacao"],
  analytics: ["indicadores", "fontes", "governanca", "periodicidade"],
  automacao: ["automacoes"],
  ia: ["problema", "usuarios", "solucao", "riscos", "mitigacoes"],
  roadmap: ["d30", "d60", "d90"],
};

function filled(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return value !== null && value !== undefined;
}

export function sectionCompletion(section: SectionKey, data: SectionData | undefined): number {
  const required = REQUIRED_FIELDS[section];
  if (!data) return 0;
  const done = required.filter((field) => filled(data[field])).length;
  return Math.round((done / required.length) * 100);
}

export function overallProgress(responses: Partial<Record<SectionKey, SectionData>>): number {
  const total = SECTIONS.reduce((sum, s) => sum + sectionCompletion(s.key, responses[s.key]), 0);
  return Math.round(total / SECTIONS.length);
}

export function weightedScore(scores: Record<string, number | null | undefined>): number | null {
  let sum = 0;
  let weight = 0;
  for (const c of CRITERIA) {
    const value = scores[c.key];
    if (typeof value === "number" && !Number.isNaN(value)) {
      sum += value * c.weight;
      weight += c.weight;
    }
  }
  if (weight === 0) return null;
  return Math.round((sum / weight) * 100) / 100;
}

export function generateAccessCode(): string {
  const year = new Date().getFullYear();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `VERO-${year}-${suffix}`;
}
