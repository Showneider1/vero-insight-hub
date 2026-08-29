import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ClipboardList, Loader2, Sparkles, TrendingUp, Users } from "lucide-react";

import { CANDIDATE_STATUS } from "@/lib/case-config";
import { listCandidatesBoard } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [{ title: "Dashboard de RH — Vero Talent Assessment" }, { name: "robots", content: "noindex" }],
  }),
  component: Dashboard,
});

const STATUS_COLORS: Record<string, string> = {
  nao_iniciado: "hsl(var(--muted-foreground))",
  em_andamento: "hsl(var(--warning))",
  enviado: "hsl(var(--info))",
  em_avaliacao: "hsl(var(--info))",
  avaliado: "hsl(var(--success))",
  finalizado: "hsl(var(--success))",
};

function Dashboard() {
  const list = useServerFn(listCandidatesBoard);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "board"],
    queryFn: () => list(),
  });

  const kpis = useMemo(() => {
    const candidates = data ?? [];
    const total = candidates.length;
    const submitted = candidates.filter((c) => c.status !== "nao_iniciado" && c.status !== "em_andamento").length;
    const withAi = candidates.filter((c) => c.scoreAi !== null);
    const withHr = candidates.filter((c) => c.scoreHr !== null);
    const avgAi = withAi.reduce((sum, c) => sum + (c.scoreAi ?? 0), 0) / (withAi.length || 1);
    const avgHr = withHr.reduce((sum, c) => sum + (c.scoreHr ?? 0), 0) / (withHr.length || 1);

    const statusCounts = Object.keys(CANDIDATE_STATUS).map((key) => ({
      key,
      label: CANDIDATE_STATUS[key].label,
      value: candidates.filter((c) => c.status === key).length,
    }));

    const recommendationCounts: Record<string, number> = {};
    for (const c of candidates) {
      const rec = c.recommendationHr ?? c.recommendationAi;
      if (rec) recommendationCounts[rec] = (recommendationCounts[rec] ?? 0) + 1;
    }

    return {
      total,
      submitted,
      avgAi: Number.isFinite(avgAi) ? avgAi : 0,
      avgHr: Number.isFinite(avgHr) ? avgHr : 0,
      statusCounts,
      recommendationData: Object.entries(recommendationCounts).map(([name, value]) => ({ name, value })),
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Carregando indicadores…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <AlertTriangle className="size-4" />
        Nao foi possivel carregar os indicadores.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visao geral do processo seletivo em andamento.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Users} label="Candidatos" value={kpis.total} />
        <KpiCard icon={ClipboardList} label="Cases enviados" value={kpis.submitted} />
        <KpiCard icon={Sparkles} label="Nota media IA" value={kpis.avgAi.toFixed(1)} />
        <KpiCard icon={TrendingUp} label="Nota media RH" value={kpis.avgHr.toFixed(1)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h2 className="mb-4 font-display text-sm font-bold text-foreground">Candidatos por status</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={kpis.statusCounts}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {kpis.statusCounts.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? "hsl(var(--primary))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="surface-card p-5">
          <h2 className="mb-4 font-display text-sm font-bold text-foreground">Recomendacoes</h2>
          {kpis.recommendationData.length === 0 ? (
            <p className="grid h-[280px] place-items-center text-sm text-muted-foreground">
              Ainda nao ha avaliacoes registradas.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={kpis.recommendationData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {kpis.recommendationData.map((_, index) => (
                    <Cell key={index} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="surface-card flex items-center gap-4 p-5">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10">
        <Icon className="size-5 text-primary" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
