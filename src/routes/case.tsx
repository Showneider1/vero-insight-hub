import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Layers,
  ListChecks,
  Loader2,
  LogOut,
  MessageSquareQuote,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pill, VeroLogo } from "@/components/vero/brand";
import { BlockPicker, Field, LongText, Repeater, type RepeaterColumn } from "@/components/vero/inputs";
import {
  ARCHITECTURE_BLOCKS,
  CASE_SCENARIO,
  GAIN_OPTIONS,
  PERIODICITY_OPTIONS,
  SECTIONS,
  TECH_OPTIONS,
  WIDGET_OPTIONS,
  overallProgress,
  sectionCompletion,
  type SectionData,
  type SectionKey,
} from "@/lib/case-config";
import { getCandidateSession, saveSectionResponse, submitCase } from "@/lib/candidate.functions";
import { clearCandidateCode, readCandidateCode } from "@/lib/candidate-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/case")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Case prático — Vero Talent Assessment" },
      {
        name: "description",
        content: "Responda as cinco etapas do case prático de Inteligência e Inovação de RH da Vero.",
      },
      { property: "og:title", content: "Case prático — Vero Talent Assessment" },
      { property: "og:description", content: "Diagnóstico, Analytics, Automação, IA Generativa e Roadmap Executivo." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CasePage,
});

type Responses = Partial<Record<SectionKey, SectionData>>;

function CasePage() {
  const navigate = useNavigate();
  const load = useServerFn(getCandidateSession);
  const save = useServerFn(saveSectionResponse);
  const send = useServerFn(submitCase);

  const [code, setCode] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [responses, setResponses] = useState<Responses>({});
  const [active, setActive] = useState<SectionKey | "revisao">("diagnostico");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const stored = readCandidateCode();
    if (!stored) {
      navigate({ to: "/" });
      return;
    }
    setCode(stored);
    load({ data: { code: stored } })
      .then((session) => {
        if (session.submittedAt) {
          navigate({ to: "/enviado" });
          return;
        }
        setName(session.name);
        setPosition(session.position);
        setResponses(session.responses);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Não foi possível carregar seu case.");
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = useMemo(() => overallProgress(responses), [responses]);

  const persist = useCallback(
    (section: SectionKey, data: SectionData) => {
      if (!code) return;
      clearTimeout(timers.current[section]);
      timers.current[section] = setTimeout(() => {
        setSaving(true);
        save({ data: { code, section, response: data } })
          .then((res) => {
            setSavedAt(res.savedAt);
            setError(null);
          })
          .catch((err: unknown) => setError(err instanceof Error ? err.message : "Falha ao salvar."))
          .finally(() => setSaving(false));
      }, 1000);
    },
    [code, save],
  );

  const update = useCallback(
    (section: SectionKey, key: string, value: unknown) => {
      setResponses((prev) => {
        const next = { ...(prev[section] ?? {}), [key]: value };
        persist(section, next);
        return { ...prev, [section]: next };
      });
    },
    [persist],
  );

  async function handleSubmit() {
    if (!code) return;
    setSending(true);
    try {
      await send({ data: { code } });
      setConfirmOpen(false);
      navigate({ to: "/enviado" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar seu case.");
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando seu case…
        </div>
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6">
        <div className="max-w-sm space-y-4 text-center">
          <AlertTriangle className="mx-auto size-8 text-warning" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            onClick={() => {
              clearCandidateCode();
              navigate({ to: "/" });
            }}
          >
            Voltar ao acesso
          </Button>
        </div>
      </div>
    );
  }

  const allComplete = progress >= 100;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <VeroLogo />
          <div className="flex flex-1 items-center gap-3 sm:max-w-xs">
            <Progress value={progress} className="h-2" />
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">{progress}%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3 animate-spin" /> Salvando…
                </span>
              ) : savedAt ? (
                <span className="flex items-center gap-1.5 text-success">
                  <Check className="size-3" /> Salvo automaticamente
                </span>
              ) : null}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearCandidateCode();
                navigate({ to: "/" });
              }}
            >
              <LogOut className="mr-1.5 size-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-3">
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Candidato</p>
            <p className="mt-1 font-display text-sm font-bold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{position}</p>
          </div>

          <nav className="surface-card divide-y divide-border p-1.5">
            {SECTIONS.map((section, index) => {
              const done = sectionCompletion(section.key, responses[section.key]);
              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActive(section.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    active === section.key ? "bg-accent font-semibold text-foreground" : "hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                      done === 100 ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done === 100 ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <span className="flex-1">{section.label}</span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">{done}%</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setActive("revisao")}
              className={cn(
                "mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                active === "revisao" ? "bg-accent font-semibold text-foreground" : "hover:bg-muted",
              )}
            >
              <Send className="size-4 text-primary" />
              Revisão e envio
            </button>
          </nav>

          <div className="surface-card space-y-2 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cenário</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {CASE_SCENARIO.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="space-y-4">
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {active === "revisao" ? (
            <ReviewPanel
              responses={responses}
              progress={progress}
              onGoTo={(key) => setActive(key)}
              onSubmit={() => setConfirmOpen(true)}
              allComplete={allComplete}
            />
          ) : (
            <SectionPanel
              key={active}
              sectionKey={active}
              data={responses[active] ?? {}}
              update={update}
              onCompleteSection={() => {
                const index = SECTIONS.findIndex((s) => s.key === active);
                const next = SECTIONS[index + 1];
                setActive(next ? next.key : "revisao");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </main>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar o case definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Após o envio suas respostas não poderão mais ser editadas. Confirme apenas se você concluiu a revisão de
              todas as etapas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
              disabled={sending}
            >
              {sending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Confirmar envio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SelectField({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string | undefined;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <option value="">Selecione…</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

type Step =
  | {
      kind: "text";
      key: string;
      label: string;
      hint?: string;
      from: string;
      brief: string;
      rows?: number;
    }
  | {
      kind: "select";
      key: string;
      label: string;
      hint?: string;
      from: string;
      brief: string;
      options: string[];
    }
  | {
      kind: "repeater";
      key: string;
      label: string;
      hint?: string;
      from: string;
      brief: string;
      columns: RepeaterColumn[];
      max?: number;
      addLabel?: string;
    }
  | {
      kind: "blocks";
      key: string;
      label: string;
      hint?: string;
      from: string;
      brief: string;
      options: string[];
    };

const SECTION_STEPS: Record<SectionKey, Step[]> = {
  diagnostico: [
    {
      kind: "text",
      key: "processos",
      label: "Principais processos a mapear",
      hint: "Quais processos de RH você levantaria primeiro e por quê?",
      from: "Diretora de Gente",
      brief:
        "“Tenho 90 dias para mostrar resultado ao board. Por onde você começa o mapeamento e por que essa ordem?”",
    },
    {
      kind: "text",
      key: "stakeholders",
      label: "Stakeholders e entrevistas",
      hint: "Quem você entrevistaria e quais perguntas faria.",
      from: "Business Partner de RH",
      brief: "“Cada área tem uma dor diferente. Com quem você fala primeiro e o que pergunta?”",
    },
    {
      kind: "text",
      key: "dados",
      label: "Dados e sistemas",
      hint: "Que dados e sistemas precisam ser avaliados para medir a maturidade atual.",
      from: "Time de TI",
      brief: "“Temos folha, ATS, planilhas e SharePoint. O que você quer olhar e em que ordem?”",
    },
    {
      kind: "text",
      key: "priorizacao",
      label: "Critérios de priorização",
      hint: "Como você priorizaria as oportunidades encontradas.",
      from: "CFO",
      brief: "“Não posso financiar tudo. Como você decide o que entra primeiro?”",
    },
  ],
  analytics: [
    {
      kind: "repeater",
      key: "indicadores",
      label: "Indicadores do dashboard executivo",
      hint: "Adicione de 4 a 8 indicadores, com fórmula, fonte, periodicidade e visualização.",
      from: "CEO",
      brief: "“Quero abrir um painel e entender a saúde de Gente em 30 segundos. Quais números aparecem?”",
      columns: [
        { key: "indicador", label: "Indicador", placeholder: "Turnover voluntário" },
        { key: "formula", label: "Fórmula / cálculo", placeholder: "Desligamentos / headcount médio" },
        { key: "fonte", label: "Fonte de dados", placeholder: "Sistema de folha" },
        { key: "periodicidade", label: "Periodicidade", options: PERIODICITY_OPTIONS },
        { key: "widget", label: "Visualização", options: WIDGET_OPTIONS },
      ],
    },
    {
      kind: "text",
      key: "fontes",
      label: "Fontes de dados e integrações",
      hint: "Como os dados seriam consolidados e integrados.",
      from: "Arquiteto de Dados",
      brief: "“As bases não conversam. Como você consolidaria tudo sem criar mais planilhas?”",
    },
    {
      kind: "text",
      key: "governanca",
      label: "Governança e qualidade de dados",
      hint: "Responsabilidades, dicionário de dados, LGPD e confiabilidade.",
      from: "Jurídico / DPO",
      brief: "“Dado de pessoas é dado sensível. Quem responde pelo quê e como garantimos conformidade?”",
    },
    {
      kind: "select",
      key: "periodicidade",
      label: "Periodicidade do ritual executivo",
      hint: "Com que frequência o dashboard seria apresentado à diretoria.",
      from: "Secretaria do Board",
      brief: "“Preciso reservar a agenda. Qual é o ritmo desse ritual?”",
      options: PERIODICITY_OPTIONS,
    },
  ],
  automacao: [
    {
      kind: "repeater",
      key: "automacoes",
      label: "Três primeiras automações",
      hint: "Máximo de 3 processos, com dor atual, tecnologia e ganho esperado.",
      from: "Coordenadora de Operações de RH",
      brief: "“Meu time vive apagando incêndio manual. Escolha 3 processos e me diga o ganho de cada um.”",
      max: 3,
      addLabel: "Adicionar automação",
      columns: [
        { key: "processo", label: "Processo", placeholder: "Admissão de novos colaboradores" },
        { key: "dor", label: "Dor atual", placeholder: "Conferência manual de documentos" },
        { key: "tecnologia", label: "Tecnologia", options: TECH_OPTIONS },
        { key: "ganho", label: "Ganho principal", options: GAIN_OPTIONS },
        { key: "impacto", label: "Impacto estimado", placeholder: "-40% no tempo de ciclo" },
      ],
    },
    {
      kind: "text",
      key: "medicao",
      label: "Como você mediria o resultado",
      hint: "Indicadores de acompanhamento e forma de comprovar o ganho.",
      from: "PMO",
      brief: "“Automação sem medição é promessa. Como você comprova o resultado em números?”",
    },
  ],
  ia: [
    {
      kind: "text",
      key: "problema",
      label: "Problema a ser resolvido",
      hint: "Qual dor de RH a IA Generativa endereçaria.",
      from: "Diretoria Executiva",
      brief: "“Queremos IA, mas com propósito. Qual problema real ela resolve primeiro?”",
    },
    {
      kind: "text",
      key: "usuarios",
      label: "Usuários e jornada",
      hint: "Quem usaria a solução e em que momento.",
      from: "Líder de Experiência do Colaborador",
      brief: "“Quem abre essa ferramenta no dia a dia e em qual momento da jornada?”",
    },
    {
      kind: "text",
      key: "solucao",
      label: "Solução proposta",
      hint: "Funcionamento, fontes de conhecimento e integração com os sistemas atuais.",
      from: "Time de Tecnologia",
      brief: "“Explique o funcionamento como se eu fosse construir na semana que vem.”",
    },
    {
      kind: "blocks",
      key: "arquitetura",
      label: "Arquitetura da solução",
      hint: "Selecione os blocos na ordem do fluxo — o desenho é montado na sequência escolhida.",
      from: "Arquiteto de Soluções",
      brief: "“Monte o fluxo da solução, bloco por bloco, do usuário até a resposta.”",
      options: ARCHITECTURE_BLOCKS,
    },
    {
      kind: "text",
      key: "riscos",
      label: "Riscos",
      hint: "Riscos técnicos, éticos e de LGPD.",
      from: "Comitê de Riscos",
      brief: "“O que pode dar errado? Seja honesto, isso conta a favor.”",
    },
    {
      kind: "text",
      key: "mitigacoes",
      label: "Mitigações",
      hint: "Controles, governança e supervisão humana.",
      from: "Comitê de Riscos",
      brief: "“Para cada risco citado, qual é o controle que dorme tranquilo?”",
    },
    {
      kind: "text",
      key: "indicadores",
      label: "Indicadores de sucesso",
      hint: "Como você comprovaria o valor gerado.",
      from: "CFO",
      brief: "“Em 6 meses, o que precisa ter mudado para o investimento se justificar?”",
    },
  ],
  roadmap: [
    {
      kind: "text",
      key: "d30",
      label: "Onda 1 — primeiros 30 dias",
      hint: "Entregas, foco e quick wins.",
      from: "Diretora de Gente",
      brief: "“Primeiro mês: o que eu já posso mostrar de concreto?”",
    },
    {
      kind: "text",
      key: "d60",
      label: "Onda 2 — 60 dias",
      hint: "Escala e consolidação.",
      from: "Diretora de Gente",
      brief: "“Segundo mês: onde ganhamos escala?”",
    },
    {
      kind: "text",
      key: "d90",
      label: "Onda 3 — 90 dias",
      hint: "Resultados esperados e próximos passos.",
      from: "Board",
      brief: "“No dia 90, o que apresentamos ao conselho?”",
    },
    {
      kind: "text",
      key: "comunicacao",
      label: "Riscos do plano e como comunicá-lo à diretoria",
      hint: "Transparência gera confiança: o que pode atrasar e como você comunica.",
      from: "Board",
      brief: "“E se algo atrasar? Como você nos conta isso?”",
    },
  ],
};

function depthOf(value: unknown): { level: 0 | 1 | 2 | 3; label: string; tone: string } {
  let weight = 0;
  if (typeof value === "string") weight = value.trim().split(/\s+/).filter(Boolean).length;
  else if (Array.isArray(value)) weight = value.length * 25;

  if (weight === 0) return { level: 0, label: "Aguardando resposta", tone: "bg-muted" };
  if (weight < 30) return { level: 1, label: "Resposta inicial", tone: "bg-warning" };
  if (weight < 80) return { level: 2, label: "Boa profundidade", tone: "bg-info" };
  return { level: 3, label: "Resposta consistente", tone: "bg-success" };
}

function StepMeter({ value }: { value: unknown }) {
  const depth = depthOf(value);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn("h-1.5 w-8 rounded-full transition-colors", i <= depth.level ? depth.tone : "bg-border")}
          />
        ))}
      </div>
      <span className="text-[11px] font-semibold text-muted-foreground">{depth.label}</span>
    </div>
  );
}

function SectionPanel({
  sectionKey,
  data,
  update,
  onCompleteSection,
}: {
  sectionKey: SectionKey;
  data: SectionData;
  update: (section: SectionKey, key: string, value: unknown) => void;
  onCompleteSection: () => void;
}) {
  const meta = SECTIONS.find((s) => s.key === sectionKey)!;
  const steps = SECTION_STEPS[sectionKey];
  const [stepIndex, setStepIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setStepIndex(0);
  }, [sectionKey]);

  const set = (key: string) => (value: unknown) => update(sectionKey, key, value);
  const text = (key: string) => (data[key] as string) ?? "";
  const rows = (key: string) => (data[key] as Record<string, string>[]) ?? [];

  const renderStep = (step: Step) => {
    if (step.kind === "text") {
      return (
        <LongText
          label={step.label}
          hint={step.hint}
          value={text(step.key)}
          onChange={set(step.key)}
          rows={step.rows ?? 6}
        />
      );
    }
    if (step.kind === "select") {
      return (
        <SelectField
          label={step.label}
          hint={step.hint}
          options={step.options}
          value={text(step.key)}
          onChange={set(step.key)}
        />
      );
    }
    if (step.kind === "repeater") {
      return (
        <Repeater
          label={step.label}
          hint={step.hint}
          rows={rows(step.key)}
          onChange={set(step.key)}
          columns={step.columns}
          {...(step.max !== undefined ? { max: step.max } : {})}
          {...(step.addLabel !== undefined ? { addLabel: step.addLabel } : {})}
        />
      );
    }
    return (
      <BlockPicker
        label={step.label}
        hint={step.hint}
        options={step.options}
        value={(data[step.key] as string[]) ?? []}
        onChange={set(step.key)}
      />
    );
  };

  const current = steps[Math.min(stepIndex, steps.length - 1)]!;
  const isLast = stepIndex >= steps.length - 1;

  return (
    <section className="surface-card space-y-6 p-5 sm:p-7">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Pill tone="info">{meta.label}</Pill>
          <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? (
              <>
                <ListChecks className="mr-1.5 size-4" /> Modo guiado
              </>
            ) : (
              <>
                <Layers className="mr-1.5 size-4" /> Ver etapa completa
              </>
            )}
          </Button>
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">{meta.title}</h1>
        <p className="text-sm text-muted-foreground">{meta.intro}</p>
      </header>

      {expanded ? (
        <div className="space-y-8">
          {steps.map((step) => (
            <div key={step.key} className="space-y-2">
              {renderStep(step)}
              <StepMeter value={data[step.key]} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-1.5">
            {steps.map((step, index) => {
              const done = depthOf(data[step.key]).level > 0;
              return (
                <button
                  key={step.key}
                  type="button"
                  aria-label={step.label}
                  onClick={() => setStepIndex(index)}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all",
                    index === stepIndex
                      ? "bg-primary"
                      : done
                        ? "bg-success/70"
                        : "bg-border hover:bg-muted-foreground/40",
                  )}
                />
              );
            })}
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-accent/50 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <MessageSquareQuote className="size-4" />
            </span>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{current.from}</p>
              <p className="text-sm font-medium leading-relaxed text-foreground">{current.brief}</p>
            </div>
          </div>

          <div key={current.key} className="animate-in space-y-3 fade-in slide-in-from-bottom-2 duration-300">
            {renderStep(current)}
            <StepMeter value={data[current.key]} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              Interação {stepIndex + 1} de {steps.length}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              >
                <ArrowLeft className="mr-1.5 size-4" />
                Anterior
              </Button>
              {isLast ? (
                <Button size="sm" onClick={onCompleteSection}>
                  Concluir etapa
                  <ArrowRight className="ml-1.5 size-4" />
                </Button>
              ) : (
                <Button size="sm" onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}>
                  Próxima
                  <ArrowRight className="ml-1.5 size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


function ReviewPanel({
  responses,
  progress,
  onGoTo,
  onSubmit,
  allComplete,
}: {
  responses: Responses;
  progress: number;
  onGoTo: (key: SectionKey) => void;
  onSubmit: () => void;
  allComplete: boolean;
}) {
  return (
    <section className="surface-card space-y-6 p-5 sm:p-7">
      <header className="space-y-2">
        <Pill tone={allComplete ? "success" : "warning"}>{progress}% concluído</Pill>
        <h1 className="font-display text-xl font-bold text-foreground">Revisão e envio</h1>
        <p className="text-sm text-muted-foreground">
          Confira o preenchimento de cada etapa antes de enviar. O envio é único e irreversível.
        </p>
      </header>

      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {SECTIONS.map((section) => {
          const done = sectionCompletion(section.key, responses[section.key]);
          return (
            <li key={section.key} className="flex items-center justify-between gap-4 bg-card px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{section.label}</p>
                <p className="text-xs text-muted-foreground">{section.title}</p>
              </div>
              <div className="flex items-center gap-3">
                {done === 100 ? (
                  <Pill tone="success">
                    <CheckCircle2 className="size-3.5" /> Completo
                  </Pill>
                ) : (
                  <Pill tone="warning">{done}%</Pill>
                )}
                <Button variant="outline" size="sm" onClick={() => onGoTo(section.key)}>
                  Revisar
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {!allComplete ? (
        <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Ainda existem campos obrigatórios em aberto. Você pode enviar, mas recomendamos concluir todas as etapas.
        </p>
      ) : null}

      <Button size="lg" className="w-full sm:w-auto" onClick={onSubmit}>
        <Send className="mr-2 size-4" />
        Enviar case para o RH
      </Button>
    </section>
  );
}
