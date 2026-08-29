import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pill } from "@/components/vero/brand";
import { CANDIDATE_STATUS, generateAccessCode } from "@/lib/case-config";
import { listCandidatesBoard, updateCandidateCode } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/codigos")({
  head: () => ({
    meta: [{ title: "Gestao de codigos — Vero Talent Assessment" }, { name: "robots", content: "noindex" }],
  }),
  component: CodesPage,
});

type CodePatch = { id: string; codeActive?: boolean; accessCode?: string; expiresAt?: string | null };

function CodesPage() {
  const queryClient = useQueryClient();
  const list = useServerFn(listCandidatesBoard);
  const update = useServerFn(updateCandidateCode);

  const { data, isLoading } = useQuery({ queryKey: ["admin", "board"], queryFn: () => list() });
  const [drafts, setDrafts] = useState<Record<string, { accessCode: string; expiresAt: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  function draftFor(id: string, accessCode: string, expiresAt: string | null) {
    return drafts[id] ?? { accessCode, expiresAt: expiresAt ? expiresAt.slice(0, 10) : "" };
  }

  async function persist(id: string, patch: CodePatch) {
    setSavingId(id);
    try {
      await update({ data: patch });
      toast.success("Codigo atualizado.");
      queryClient.invalidateQueries({ queryKey: ["admin", "board"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel atualizar o codigo.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Gestao de codigos</h1>
        <p className="text-sm text-muted-foreground">
          Ative, desative, regenere e defina validade dos codigos de acesso dos candidatos.
        </p>
      </div>

      <div className="surface-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando codigos…
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Codigo</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((candidate) => {
                const draft = draftFor(candidate.id, candidate.accessCode, candidate.codeExpiresAt);
                return (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{candidate.name}</p>
                      <p className="text-xs text-muted-foreground">{candidate.position}</p>
                    </TableCell>
                    <TableCell>
                      <Pill tone={CANDIDATE_STATUS[candidate.status]?.tone ?? "muted"}>
                        {CANDIDATE_STATUS[candidate.status]?.label ?? candidate.status}
                      </Pill>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Input
                          className="h-9 w-40 font-mono"
                          value={draft.accessCode}
                          onChange={(e) =>
                            setDrafts((d) => ({
                              ...d,
                              [candidate.id]: { ...draft, accessCode: e.target.value.toUpperCase() },
                            }))
                          }
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9"
                          onClick={() =>
                            setDrafts((d) => ({ ...d, [candidate.id]: { ...draft, accessCode: generateAccessCode() } }))
                          }
                          aria-label="Gerar novo codigo"
                        >
                          <RefreshCcw className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        className="h-9 w-40"
                        value={draft.expiresAt}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [candidate.id]: { ...draft, expiresAt: e.target.value } }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={candidate.codeActive}
                        disabled={savingId === candidate.id}
                        onCheckedChange={(checked) => persist(candidate.id, { id: candidate.id, codeActive: checked })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        disabled={savingId === candidate.id}
                        onClick={() =>
                          persist(candidate.id, {
                            id: candidate.id,
                            accessCode: draft.accessCode,
                            expiresAt: draft.expiresAt || null,
                          })
                        }
                      >
                        {savingId === candidate.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                        Salvar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
