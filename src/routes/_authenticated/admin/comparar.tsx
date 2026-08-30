import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Pill, ScorePill } from "@/components/vero/brand";
import { CANDIDATE_STATUS } from "@/lib/case-config";
import { listCandidatesBoard } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/comparar")({
  validateSearch: (search: Record<string, unknown>) => ({
    ids: typeof search["ids"] === "string" ? (search["ids"] as string) : "",
  }),
  head: () => ({
    meta: [{ title: "Comparar candidatos — Vero Talent Assessment" }, { name: "robots", content: "noindex" }],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { ids } = Route.useSearch();
  const list = useServerFn(listCandidatesBoard);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "board"], queryFn: () => list() });

  const selectedIds = useMemo(() => ids.split(",").map((id) => id.trim()).filter(Boolean).slice(0, 5), [ids]);

  const candidates = useMemo(() => {
    const board = data ?? [];
    return selectedIds.map((id) => board.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
  }, [data, selectedIds]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Carregando candidatos…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link to="/admin/candidatos">
            <ArrowLeft className="mr-1.5 size-4" />
            Candidatos
          </Link>
        </Button>
        <h1 className="font-display text-2xl font-bold text-foreground">Comparacao de candidatos</h1>
        <p className="text-sm text-muted-foreground">Compare ate 5 candidatos lado a lado.</p>
      </div>

      {candidates.length < 2 ? (
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          Selecione de 2 a 5 candidatos na lista de{" "}
          <Link to="/admin/candidatos" className="font-semibold text-primary hover:underline">
            candidatos
          </Link>{" "}
          para compara-los aqui.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Criterio
                </th>
                {candidates.map((c) => (
                  <th key={c.id} className="px-4 py-3 text-left">
                    <p className="font-display text-sm font-bold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.position}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 font-medium text-muted-foreground">Status</td>
                {candidates.map((c) => (
                  <td key={c.id} className="px-4 py-3">
                    <Pill tone={CANDIDATE_STATUS[c.status]?.tone ?? "muted"}>
                      {CANDIDATE_STATUS[c.status]?.label ?? c.status}
                    </Pill>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-muted-foreground">Progresso</td>
                {candidates.map((c) => (
                  <td key={c.id} className="px-4 py-3 tabular-nums">
                    {c.progress}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-muted-foreground">Nota IA</td>
                {candidates.map((c) => (
                  <td key={c.id} className="px-4 py-3">
                    <ScorePill value={c.scoreAi} />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-muted-foreground">Recomendacao IA</td>
                {candidates.map((c) => (
                  <td key={c.id} className="px-4 py-3 text-muted-foreground">
                    {c.recommendationAi ?? "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-muted-foreground">Nota RH</td>
                {candidates.map((c) => (
                  <td key={c.id} className="px-4 py-3">
                    <ScorePill value={c.scoreHr} />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-muted-foreground">Recomendacao RH</td>
                {candidates.map((c) => (
                  <td key={c.id} className="px-4 py-3 text-muted-foreground">
                    {c.recommendationHr ?? "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 align-top font-medium text-muted-foreground">Pontos fortes (IA)</td>
                {candidates.map((c) => (
                  <td key={c.id} className="px-4 py-3 align-top text-xs text-muted-foreground">
                    {c.strengthsAi.length > 0 ? (
                      <ul className="space-y-1">
                        {c.strengthsAi.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
