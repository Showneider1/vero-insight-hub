import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Loader2, LogOut, Send } from "lucide-react";

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
import { BlockPicker, Field, LongText, Repeater } from "@/components/vero/inputs";
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
            <SectionPanel sectionKey={active} data={responses[active] ?? {}} update={update} />
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
  hint?: string;
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

function SectionPanel({
  sectionKey,
  data,
  update,
}: {
  sectionKey: SectionKey;
  data: SectionData;
  update: (section: SectionKey, key: string, value: unknown) => void;
}) {
  const meta = SECTIONS.find((s) => s.key === sectionKey)!;
  const set = (key: string) => (value: unknown) => update(sectionKey, key, value);
  const text = (key: string) => (data[key] as string) ?? "";
  const rows = (key: string) => (data[key] as Record<string, string>[]) ?? [];

  return (
    <section className="surface-card space-y-6 p-5 sm:p-7">
      <header className="space-y-2">
        <Pill tone="info">{meta.label}</Pill>
        <h1 className="font-display text-xl font-bold text-foreground">{meta.title}</h1>
        <p className="text-sm text-muted-foreground">{meta.intro}</p>
      </header>

      {sectionKey === "diagnostico" ? (
        <div className="space-y-6">
          <LongText
            label="Principais processos a mapear"
            hint="Quais processos de RH você levantaria primeiro e por quê?"
            value={text("processos")}
            onChange={set("processos")}
          />
          <LongText
            label="Stakeholders e entrevistas"
            hint="Quem você entrevistaria e quais perguntas faria."
            value={text("stakeholders")}
            onChange={set("stakeholders")}
          />
          <LongText
            label="Dados e sistemas"
            hint="Que dados e sistemas precisam ser avaliados para medir a maturidade atual."
            value={text("dados")}
            onChange={set("dados")}
          />
          <LongText
            label="Critérios de priorização"
            hint="Como você priorizaria as oportunidades encontradas."
            value={text("priorizacao")}
            onChange={set("priorizacao")}
          />
        </div>
      ) : null}

      {sectionKey === "analytics" ? (
        <div className="space-y-6">
          <Repeater
            label="Indicadores do dashboard executivo"
            hint="Adicione de 4 a 8 indicadores, com fórmula, fonte, periodicidade e visualização."
            rows={rows("indicadores")}
            onChange={set("indicadores")}
            columns={[
              { key: "indicador", label: "Indicador", placeholder: "Turnover voluntário" },
              { key: "formula", label: "Fórmula / cálculo", placeholder: "Desligamentos / headcount médio" },
              { key: "fonte", label: "Fonte de dados", placeholder: "Sistema de folha" },
              { key: "periodicidade", label: "Periodicidade", options: PERIODICITY_OPTIONS },
              { key: "widget", label: "Visualização", options: WIDGET_OPTIONS },
            ]}
          />
          <LongText
            label="Fontes de dados e integrações"
            hint="Como os dados seriam consolidados e integrados."
            value={text("fontes")}
            onChange={set("fontes")}
          />
          <LongText
            label="Governança e qualidade de dados"
            hint="Responsabilidades, dicionário de dados, LGPD e confiabilidade."
            value={text("governanca")}
            onChange={set("governanca")}
          />
          <SelectField
            label="Periodicidade do ritual executivo"
            hint="Com que frequência o dashboard seria apresentado à diretoria."
            options={PERIODICITY_OPTIONS}
            value={text("periodicidade")}
            onChange={set("periodicidade")}
          />
        </div>
      ) : null}

      {sectionKey === "automacao" ? (
        <div className="space-y-6">
          <Repeater
            label="Três primeiras automações"
            hint="Máximo de 3 processos, com dor atual, tecnologia e ganho esperado."
            max={3}
            addLabel="Adicionar automação"
            rows={rows("automacoes")}
            onChange={set("automacoes")}
            columns={[
              { key: "processo", label: "Processo", placeholder: "Admissão de novos colaboradores" },
              { key: "dor", label: "Dor atual", placeholder: "Conferência manual de documentos" },
              { key: "tecnologia", label: "Tecnologia", options: TECH_OPTIONS },
              { key: "ganho", label: "Ganho principal", options: GAIN_OPTIONS },
              { key: "impacto", label: "Impacto estimado", placeholder: "-40% no tempo de ciclo" },
            ]}
          />
          <LongText
            label="Como você mediria o resultado"
            hint="Indicadores de acompanhamento e forma de comprovar o ganho."
            value={text("medicao")}
            onChange={set("medicao")}
          />
        </div>
      ) : null}

      {sectionKey === "ia" ? (
        <div className="space-y-6">
          <LongText
            label="Problema a ser resolvido"
            value={text("problema")}
            onChange={set("problema")}
            hint="Qual dor de RH a IA Generativa endereçaria."
          />
          <LongText
            label="Usuários e jornada"
            value={text("usuarios")}
            onChange={set("usuarios")}
            hint="Quem usaria a solução e em que momento."
          />
          <LongText
            label="Solução proposta"
            value={text("solucao")}
            onChange={set("solucao")}
            hint="Funcionamento, fontes de conhecimento e integração com os sistemas atuais."
          />
          <BlockPicker
            label="Arquitetura da solução"
            hint="Selecione os blocos na ordem do fluxo."
            options={ARCHITECTURE_BLOCKS}
            value={(data["arquitetura"] as string[]) ?? []}
            onChange={set("arquitetura")}
          />
          <LongText label="Riscos" value={text("riscos")} onChange={set("riscos")} hint="Riscos técnicos, éticos e de LGPD." />
          <LongText
            label="Mitigações"
            value={text("mitigacoes")}
            onChange={set("mitigacoes")}
            hint="Controles, governança e supervisão humana."
          />
          <LongText
            label="Indicadores de sucesso"
            value={text("indicadores")}
            onChange={set("indicadores")}
            hint="Como você comprovaria o valor gerado."
          />
        </div>
      ) : null}

      {sectionKey === "roadmap" ? (
        <div className="space-y-6">
          <LongText
            label="Onda 1 — primeiros 30 dias"
            value={text("d30")}
            onChange={set("d30")}
            hint="Entregas, foco e quick wins."
          />
          <LongText label="Onda 2 — 60 dias" value={text("d60")} onChange={set("d60")} hint="Escala e consolidação." />
          <LongText
            label="Onda 3 — 90 dias"
            value={text("d90")}
            onChange={set("d90")}
            hint="Resultados esperados e próximos passos."
          />
          <LongText
            label="Riscos do plano e como comunicá-lo à diretoria"
            value={text("comunicacao")}
            onChange={set("comunicacao")}
          />
        </div>
      ) : null}
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
