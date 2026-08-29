import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { VeroLogo } from "@/components/vero/brand";
import { getCandidateSession } from "@/lib/candidate.functions";
import { clearCandidateCode, readCandidateCode } from "@/lib/candidate-session";

export const Route = createFileRoute("/enviado")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Case enviado — Vero Talent Assessment" },
      {
        name: "description",
        content: "Confirmacao de envio do case pratico de Inteligencia e Inovacao de RH da Vero.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubmittedPage,
});

function SubmittedPage() {
  const navigate = useNavigate();
  const load = useServerFn(getCandidateSession);
  const [state, setState] = useState<{
    loading: boolean;
    name: string | null;
    submittedAt: string | null;
  }>({ loading: true, name: null, submittedAt: null });

  useEffect(() => {
    const code = readCandidateCode();
    if (!code) {
      setState({ loading: false, name: null, submittedAt: null });
      return;
    }
    load({ data: { code } })
      .then((session) => {
        if (!session.submittedAt) {
          navigate({ to: "/case" });
          return;
        }
        setState({ loading: false, name: session.name, submittedAt: session.submittedAt });
      })
      .catch(() => setState({ loading: false, name: null, submittedAt: null }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const submittedDate = state.submittedAt
    ? new Date(state.submittedAt).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })
    : null;

  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <VeroLogo className="justify-center" />
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/12">
          <CheckCircle2 className="size-8 text-success" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-foreground">Case enviado com sucesso!</h1>
          <p className="text-sm text-muted-foreground">
            {state.name ? `Obrigado, ${state.name}. ` : ""}
            Suas respostas foram registradas{submittedDate ? ` em ${submittedDate}` : ""} e agora estao em analise
            pelo time de RH da Vero.
          </p>
        </div>
        <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          O envio e unico e suas respostas nao podem mais ser alteradas. Em breve o time de RH entrara em contato
          com os proximos passos.
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            clearCandidateCode();
            navigate({ to: "/" });
          }}
        >
          <LogOut className="mr-2 size-4" />
          Concluir
        </Button>
        <p className="text-xs text-muted-foreground">
          E do time de RH?{" "}
          <Link to="/auth" className="font-semibold text-primary hover:underline">
            Acessar o painel
          </Link>
        </p>
      </div>
    </div>
  );
}
