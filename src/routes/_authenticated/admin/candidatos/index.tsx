import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pill, ScorePill } from "@/components/vero/brand";
import { CANDIDATE_STATUS, POSITIONS, generateAccessCode } from "@/lib/case-config";
import { createCandidate, listCandidatesBoard, type BoardCandidate } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/candidatos/")({
  head: () => ({
    meta: [{ title: "Candidatos — Vero Talent Assessment" }, { name: "robots", content: "noindex" }],
  }),
  component: CandidatesPage,
});

function CandidatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const list = useServerFn(listCandidatesBoard);
  const create = useServerFn(createCandidate);

  const { data, isLoading } = useQuery({ queryKey: ["admin", "board"], queryFn: () => list() });
  const candidates = data ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [selected, setSelected] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    position: POSITIONS[0],
    accessCode: generateAccessCode(),
    expiresAt: "",
  });

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        c.accessCode.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "todos" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [candidates, search, statusFilter]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 5) {
        toast.error("Voce pode comparar no maximo 5 candidatos.");
        return prev;
      }
      return [...prev, id];
    });
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      await create({
        data: {
          name: form.name,
          email: form.email,
          position: form.position,
          accessCode: form.accessCode,
          expiresAt: form.expiresAt,
        },
      });
      toast.success("Candidato criado com sucesso.");
      setDialogOpen(false);
      setForm({ name: "", email: "", position: POSITIONS[0], accessCode: generateAccessCode(), expiresAt: "" });
      queryClient.invalidateQueries({ queryKey: ["admin", "board"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel criar o candidato.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Candidatos</h1>
          <p className="text-sm text-muted-foreground">Gerencie candidatos, acompanhe status e envie para comparacao.</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 ? (
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/admin/comparar", search: { ids: selected.join(",") } })}
            >
              Comparar selecionados ({selected.length}/5)
            </Button>
          ) : null}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1.5 size-4" />
                Novo candidato
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo candidato</DialogTitle>
                <DialogDescription>Crie um acesso para um novo candidato do case pratico.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="c-name">Nome</Label>
                  <Input
                    id="c-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-email">E-mail</Label>
                  <Input
                    id="c-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vaga</Label>
                  <Select
                    value={form.position ?? ""}
                    onValueChange={(value) => setForm((f) => ({ ...f, position: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-code">Codigo de acesso</Label>
                  <div className="flex gap-2">
                    <Input
                      id="c-code"
                      required
                      className="font-mono"
                      value={form.accessCode}
                      onChange={(e) => setForm((f) => ({ ...f, accessCode: e.target.value.toUpperCase() }))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setForm((f) => ({ ...f, accessCode: generateAccessCode() }))}
                    >
                      Gerar
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-expires">Expira em (opcional)</Label>
                  <Input
                    id="c-expires"
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={creating}>
                    {creating ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Criar candidato
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou codigo"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(CANDIDATE_STATUS).map(([key, meta]) => (
              <SelectItem key={key} value={key}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando candidatos…
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Candidato</TableHead>
                <TableHead>Vaga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Codigo</TableHead>
                <TableHead>Nota IA</TableHead>
                <TableHead>Nota RH</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum candidato encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((candidate: BoardCandidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(candidate.id)}
                        onCheckedChange={() => toggleSelect(candidate.id)}
                        aria-label={`Selecionar ${candidate.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{candidate.name}</p>
                      <p className="text-xs text-muted-foreground">{candidate.email ?? "—"}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{candidate.position}</TableCell>
                    <TableCell>
                      <Pill tone={CANDIDATE_STATUS[candidate.status]?.tone ?? "muted"}>
                        {CANDIDATE_STATUS[candidate.status]?.label ?? candidate.status}
                      </Pill>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">{candidate.progress}%</TableCell>
                    <TableCell className="font-mono text-xs">{candidate.accessCode}</TableCell>
                    <TableCell>
                      <ScorePill value={candidate.scoreAi} />
                    </TableCell>
                    <TableCell>
                      <ScorePill value={candidate.scoreHr} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/admin/candidatos/$candidateId" params={{ candidateId: candidate.id }}>
                          Ver detalhe
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
