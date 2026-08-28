import { CRITERIA } from "./case-config";

export type AiCriterionScore = {
  key: string;
  score: number;
  justification: string;
  strengths: string;
  attention: string;
};

export type AiEvaluationResult = {
  criteria_scores: AiCriterionScore[];
  executive_summary: string[];
  strengths: string[];
  weaknesses: string[];
  interview_questions: string[];
  recommendation: string;
  final_score: number;
};

const SYSTEM_PROMPT = `Você é um avaliador especialista em Transformação Digital, Recursos Humanos, Analytics, Automação, Power Platform e Inteligência Artificial.

Seu objetivo é avaliar a resposta de um candidato para uma posição relacionada à liderança ou construção de uma frente de Inteligência e Inovação de RH.

Analise exclusivamente as informações fornecidas pelo candidato. Não invente informações. Não penalize por estilo de escrita ou formato. Avalie a qualidade do raciocínio, a aplicabilidade das propostas e a capacidade de conectar negócio, dados e tecnologia.

Critérios e pesos:
- negocio — Visão de Negócio e RH (20%): compreensão de contexto, problemas relevantes, conexão entre tecnologia e resultado.
- analytics — Analytics e Indicadores (25%): qualidade dos KPIs, métricas, fontes, governança, priorização, visão executiva.
- automacao — Automação e Power Platform (20%): escolha de processos, priorização, tecnologia, viabilidade, clareza dos ganhos.
- ia — IA Generativa (20%): relevância do problema, solução, arquitetura, RAG/fontes, segurança, LGPD, riscos, indicadores.
- comunicacao — Comunicação e Stakeholders (15%): clareza, estrutura, priorização, visão executiva, influência.

Para cada critério dê nota de 0 a 10 com justificativa objetiva, pontos fortes e pontos de atenção. Depois calcule a nota final ponderada (0 a 10, uma casa decimal). Escreva sempre em português do Brasil. Retorne JSON no schema solicitado.

A avaliação é apenas uma recomendação e não deve ser usada como decisão automática de contratação.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    criteria_scores: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          key: { type: "string", enum: CRITERIA.map((c) => c.key) },
          score: { type: "number" },
          justification: { type: "string" },
          strengths: { type: "string" },
          attention: { type: "string" },
        },
        required: ["key", "score", "justification", "strengths", "attention"],
      },
    },
    executive_summary: { type: "array", items: { type: "string" } },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    interview_questions: { type: "array", items: { type: "string" } },
    recommendation: {
      type: "string",
      enum: ["Forte recomendação", "Recomendação", "Avaliar com ressalvas", "Não recomendado neste momento"],
    },
    final_score: { type: "number" },
  },
  required: [
    "criteria_scores",
    "executive_summary",
    "strengths",
    "weaknesses",
    "interview_questions",
    "recommendation",
    "final_score",
  ],
} as const;

export async function evaluateWithAi(input: {
  candidateName: string;
  position: string;
  responses: Record<string, unknown>;
}): Promise<AiEvaluationResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Serviço de IA não configurado.");

  const userContent = `Candidato: ${input.candidateName}
Vaga: ${input.position}

Respostas do case (JSON, no máximo 5 bullets no resumo executivo, 3 a 5 pontos fortes, 3 a 5 riscos ou lacunas e 3 a 7 perguntas de entrevista):
${JSON.stringify(input.responses, null, 2)}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-5.6-sol",
      stream: true,
      instructions: SYSTEM_PROMPT,
      input: [{ role: "user", content: [{ type: "input_text", text: userContent }] }],
      reasoning: { effort: "medium", summary: "auto" },
      text: { format: { type: "json_schema", name: "avaliacao", strict: true, schema: SCHEMA } },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em alguns instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados no workspace. Adicione créditos para continuar.");
    throw new Error(`Falha na avaliação por IA (${res.status}): ${detail.slice(0, 300)}`);
  }

  const raw = await res.text();
  let text = "";
  for (const line of raw.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const event = JSON.parse(payload) as { type?: string; delta?: string };
      if (event.type === "response.output_text.delta" && typeof event.delta === "string") text += event.delta;
    } catch {
      /* ignore keep-alive lines */
    }
  }

  if (!text.trim()) throw new Error("A IA não retornou uma avaliação. Tente novamente.");

  const parsed = JSON.parse(text) as AiEvaluationResult;
  return parsed;
}
