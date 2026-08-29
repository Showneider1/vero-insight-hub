import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VeroLogo } from "@/components/vero/brand";
import { CASE_SCENARIO, SECTIONS } from "@/lib/case-config";
import { validateAccessCode } from "@/lib/candidate.functions";
import { storeCandidateCode } from "@/lib/candidate-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vero Talent Assessment — Acesso do Candidato" },
      {
        name: "description",
        content:
          "Entre com seu código de acesso para realizar o case prático de Inteligência e Inovação de RH da Vero.",
      },
      { property: "og:title", content: "Vero Talent Assessment — Acesso do Candidato" },
      {
        property: "og:description",
        content: "Case prático estruturado em cinco etapas para candidatos da frente de Inteligência e Inovação de RH.",
      },
    ],
  }),
  component: CandidateLogin,
});

function CandidateLogin() {
  const navigate = useNavigate();
  const validate = useServerFn(validateAccessCode);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await validate({ data: { code } });
      storeCandidateCode(session.accessCode);
      navigate({ to: session.submittedAt ? "/enviado" : "/case" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível validar o código.");
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="gradient-navy relative flex flex-col justify-between gap-10 px-6 py-10 text-navy-foreground sm:px-12 lg:py-14">
        <VeroLogo variant="light" />

        <div className="max-w-xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-navy-foreground/60">
            Inteligência e Inovação de RH
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            Case prático de transformação digital de RH
          </h1>
          <ul className="space-y-3 text-sm text-navy-foreground/80">
            {CASE_SCENARIO.map((line) => (
              <li key={line} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-navy-foreground/50" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((section, index) => (
            <span
              key={section.key}
              className="rounded-full border border-navy-foreground/20 bg-navy-foreground/10 px-3 py-1 text-xs font-semibold"
            >
              {index + 1}. {section.label}
            </span>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center bg-background px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-foreground">Acessar meu case</h2>
            <p className="text-sm text-muted-foreground">
              Informe o código de acesso enviado pelo time de RH da Vero.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de acesso</Label>
              <Input
                id="code"
                autoFocus
                autoComplete="off"
                placeholder="VERO-2026-XXXX"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                className="h-11 font-mono tracking-widest"
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={loading || code.trim().length < 4}>
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Entrar no case
              {!loading ? <ArrowRight className="ml-2 size-4" /> : null}
            </Button>
          </form>

          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Suas respostas são salvas automaticamente e ficam visíveis apenas para o time de RH da Vero. O envio final
              é único e não pode ser alterado.
            </span>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            É do time de RH?{" "}
            <Link to="/auth" className="font-semibold text-primary hover:underline">
              Acessar o painel
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
