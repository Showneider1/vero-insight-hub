import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VeroLogo } from "@/components/vero/brand";
import { supabase } from "@/integrations/supabase/client";
import { getStaffProfile } from "@/lib/admin.functions";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso do RH — Vero Talent Assessment" },
      {
        name: "description",
        content: "Login e cadastro do time de RH da Vero para acompanhar e avaliar os candidatos do case pratico.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const getProfile = useServerFn(getStaffProfile);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        if (active) setChecking(false);
        return;
      }
      try {
        await getProfile();
        if (active) navigate({ to: "/admin" });
      } catch {
        if (active) setChecking(false);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="gradient-navy relative flex flex-col justify-between gap-10 px-6 py-10 text-navy-foreground sm:px-12 lg:py-14">
        <VeroLogo variant="light" />
        <div className="max-w-xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-navy-foreground/60">Painel de RH</p>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            Acompanhe, avalie e compare os candidatos do case pratico
          </h1>
          <ul className="space-y-3 text-sm text-navy-foreground/80">
            <li className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-navy-foreground/50" />
              Dashboard com KPIs de todo o processo seletivo.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-navy-foreground/50" />
              Avaliacao por IA e avaliacao humana lado a lado.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-navy-foreground/50" />
              Comparacao de ate 5 candidatos e gestao de codigos de acesso.
            </li>
          </ul>
        </div>
        <p className="text-xs text-navy-foreground/60">Acesso restrito ao time de RH da Vero.</p>
      </section>

      <section className="flex items-center justify-center bg-background px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-foreground">Painel de RH</h2>
            <p className="text-sm text-muted-foreground">Entre com sua conta ou solicite acesso.</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="pt-4">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup" className="pt-4">
              <SignupForm />
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground">
            E candidato?{" "}
            <Link to="/" className="font-semibold text-primary hover:underline">
              Acessar com codigo
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const getProfile = useServerFn(getStaffProfile);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error("E-mail ou senha invalidos.");
      await getProfile();
      toast.success("Login realizado com sucesso.");
      navigate({ to: "/admin" });
    } catch (err) {
      await supabase.auth.signOut();
      setError(err instanceof Error ? err.message : "Acesso restrito ao time de RH.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">E-mail</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 pl-9"
            placeholder="voce@vero.com"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Senha</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 pl-9"
            placeholder="••••••••"
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Entrar no painel
        {!loading ? <ArrowRight className="ml-2 size-4" /> : null}
      </Button>
    </form>
  );
}

function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas nao coincidem.");
      return;
    }
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (signUpError) throw new Error(signUpError.message);
      setDone(true);
      toast.success("Conta criada com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-5 text-center">
        <ShieldCheck className="size-6 text-success" />
        <p className="text-sm text-foreground">
          Conta criada! Peca a um administrador do time de RH para liberar seu acesso ao painel.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Nome</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 pl-9"
            placeholder="Seu nome completo"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">E-mail</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 pl-9"
            placeholder="voce@vero.com"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Senha</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 pl-9"
            placeholder="Minimo 6 caracteres"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-confirm">Confirmar senha</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-11 pl-9"
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Criar conta
      </Button>
    </form>
  );
}
