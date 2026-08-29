import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill, ScorePill } from "@/components/vero/brand";
import { CANDIDATE_STATUS, CRITERIA, RECOMMENDATIONS, SECTIONS } from "@/lib/case-config";
import { getCandidateDetail, runAiEvaluation, saveHrReview } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/candidatos/$candidateId")({
  head: () => ({
    meta: [{ title: "Detalhe do candidato — Vero Talent Assessment" }, { name: "robots", content: "noindex" }],
  }),
  component: CandidateDetailPage,
});

type ReviewState = {
  scores: Record<string, number>;
  comments: string;
  strengths: string;
  attentionPoints: string;
  finalRecommendation: string;
};

function CandidateDetailPage() {
  const { candidateId } = Route.useParams();
  const queryClient = useQueryClient();
  const getDetail = useServerFn(getCandidateDetail);
  const runAi = useServerFn(runAiEvaluation);
  const saveReview = useServerFn(saveHrReview);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "candidate", candidateId],
    queryFn: () => getDetail({ data: { id: candidateId } }),
  });

  const [runningAi, setRunningAi] = useState(false);
  const [review, setReview] = useState<ReviewState>({
    scores: {},
    comments: "",
    strengths: "",
    attentionPoints: "",
    finalRecommendation: "",
  });
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    if (data?.review) {
      setReview({
        scores: data.review.criteriaScores ?? {},
        comments: data.review.comments ?? "",
        strengths: data.review.strengths ?? "",
        attentionPoints: data.review.attentionPoints ?? "",
        finalRecommendation: data.review.finalRecommendation ?? "",
      });
    }
  }, [data?.review]);

  async function handleRunAi() {
    setRunningAi(true);
    try {
      await runAi({ data: { candidateId } });
      toast.success("Avaliacao por IA gerada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["admin", "candidate", candidateId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "board"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel gerar a avaliacao por IA.");
    } finally {
      setRunningAi(false);
    }
  }

  async function handleSaveReview() {
    setSavingReview(true);
    try {
      await saveReview({
        data: {
          candidateId,
          criteriaScores: review.scores,
          comments: review.comments,
          strengths: review.strengths,
          attentionPoints: review.attentionPoints,
          finalRecommendation: review.finalRecommendation,
        },
      });
      toast.success("Avaliacao salva com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["admin", "candidate", candidateId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "board"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel salvar a avaliacao.");
    } finally {
      setSavingReview(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Carregando candidato…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "Candidato nao encontrado."}
        </p>
        <Button variant="outline" asChild>
          <Link to="/admin/candidatos">
            <ArrowLeft className="mr-1.5 size-4" />
            Voltar
          </Link>
        </Button>
      </div>
    );
  }

  const { candidate, responses, ai } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link to="/admin/candidatos">
              <ArrowLeft className="mr-1.5 size-4" />
              Candidatos
            </Link>
          </Button>
          <h1 className="font-display text-2xl font-bold text-foreground">{candidate.name}</h1>
          <p className="text-sm text-muted-foreground">
            {candidate.position} · {candidate.email ?? "sem e-mail"} · codigo {candidate.accessCode}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={CANDIDATE_STATUS[candidate.status]?.tone ?? "muted"}>
            {CANDIDATE_STATUS[candidate.status]?.label ?? candidate.status}
          </Pill>
          <ScorePill value={ai?.finalScore} label="IA" />
          <ScorePill value={data.review?.finalScore} label="RH" />
        </div>
      </div>

      <Tabs defaultValue="respostas">
        <TabsList>
          <TabsTrigger value="respostas">Respostas</TabsTrigger>
          <TabsTrigger value="ia">Avaliacao IA</TabsTrigger>
          <TabsTrigger value="humana">Avaliacao humana</TabsTrigger>
        </TabsList>

        <TabsContent value="respostas" className="space-y-4 pt-4">
          {SECTIONS.map((section) => {
            const sectionData = responses[section.key] ?? {};
            const entries = Object.entries(sectionData).filter(([, value]) => value !== "" && value !== undefined);
            return (
              <div key={section.key} className="surface-card p-5">
                <h3 className="font-display text-sm font-bold text-foreground">{section.label}</h3>
                {entries.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Nenhuma resposta registrada.</p>
                ) : (
                  <dl className="mt-3 space-y-3">
                    {entries.map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{key}</dt>
                        <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                          {Array.isArray(value) ? JSON.stringify(value) : String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="ia" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {ai ? `Gerada em ${new Date(ai.generatedAt).toLocaleString("pt-BR")}` : "Ainda nao ha avaliacao por IA."}
            </p>
            <Button onClick={handleRunAi} disabled={runningAi}>
              {runningAi ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
              {ai ? "Gerar novamente" : "Gerar avaliacao por IA"}
            </Button>
          </div>

          {ai ? (
            <div className="space-y-4">
              <div className="surface-card p-5">
                <h3 className="font-display text-sm font-bold text-foreground">Criterios</h3>
                <div className="mt-3 space-y-2">
                  {ai.criteriaScores.map((c) => (
                    <div
                      key={c.key}
                      className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0"
                    >
                      <span className="text-sm text-foreground">{c.key}</span>
                      <ScorePill value={c.score} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="surface-card p-5">
                  <h3 className="font-display text-sm font-bold text-foreground">Pontos fortes</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {ai.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="surface-card p-5">
                  <h3 className="font-display text-sm font-bold text-foreground">Pontos de atencao</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {ai.weaknesses.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="surface-card p-5">
                <h3 className="font-display text-sm font-bold text-foreground">Perguntas sugeridas para entrevista</h3>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {ai.interviewQuestions.map((q, i) => (
                    <li key={i}>• {q}</li>
                  ))}
                </ul>
              </div>
              <div className="surface-card p-5">
                <h3 className="font-display text-sm font-bold text-foreground">Resumo executivo</h3>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {ai.executiveSummary.map((line, i) => (
                    <li key={i}>• {line}</li>
                  ))}
                </ul>
                <Pill tone="info" className="mt-3">
                  {ai.recommendation}
                </Pill>
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="humana" className="space-y-4 pt-4">
          <div className="surface-card space-y-4 p-5">
            <h3 className="font-display text-sm font-bold text-foreground">Notas por criterio (0 a 10)</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {CRITERIA.map((criterion) => (
                <div key={criterion.key} className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{criterion.name}</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={review.scores[criterion.key] ?? ""}
                    onChange={(e) =>
                      setReview((r) => ({
                        ...r,
                        scores: { ...r.scores, [criterion.key]: Number(e.target.value) },
                      }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Comentarios</label>
              <Textarea
                rows={3}
                value={review.comments}
                onChange={(e) => setReview((r) => ({ ...r, comments: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Pontos fortes</label>
              <Textarea
                rows={2}
                value={review.strengths}
                onChange={(e) => setReview((r) => ({ ...r, strengths: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Pontos de atencao</label>
              <Textarea
                rows={2}
                value={review.attentionPoints}
                onChange={(e) => setReview((r) => ({ ...r, attentionPoints: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Recomendacao final</label>
              <Select
                value={review.finalRecommendation}
                onValueChange={(value) => setReview((r) => ({ ...r, finalRecommendation: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione…" />
                </SelectTrigger>
                <SelectContent>
                  {RECOMMENDATIONS.map((rec) => (
                    <SelectItem key={rec} value={rec}>
                      {rec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSaveReview} disabled={savingReview}>
              {savingReview ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Salvar avaliacao
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
