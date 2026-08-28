import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { overallProgress, type SectionData, type SectionKey } from "./case-config";

const codeSchema = z.object({ code: z.string().trim().min(4).max(40) });

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export type CandidateSession = {
  id: string;
  name: string;
  email: string | null;
  accessCode: string;
  position: string;
  status: string;
  progress: number;
  submittedAt: string | null;
  responses: Partial<Record<SectionKey, SectionData>>;
};

async function loadSession(code: string): Promise<CandidateSession> {
  const db = await admin();
  const normalized = code.trim().toUpperCase();

  const { data: candidate, error } = await db
    .from("candidates")
    .select("*")
    .eq("access_code", normalized)
    .maybeSingle();

  if (error) throw new Error("Não foi possível validar o código agora. Tente novamente.");
  if (!candidate) throw new Error("Código de acesso não encontrado. Confira com o time de RH.");
  if (!candidate.code_active) throw new Error("Este código de acesso está desativado.");
  if (candidate.code_expires_at && new Date(candidate.code_expires_at) < new Date()) {
    throw new Error("Este código de acesso expirou.");
  }

  const { data: rows } = await db
    .from("candidate_responses")
    .select("section, response")
    .eq("candidate_id", candidate.id);

  const responses: Partial<Record<SectionKey, SectionData>> = {};
  for (const row of rows ?? []) {
    responses[row.section as SectionKey] = (row.response ?? {}) as SectionData;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    accessCode: candidate.access_code,
    position: candidate.position,
    status: candidate.status,
    progress: candidate.progress,
    submittedAt: candidate.submitted_at,
    responses,
  };
}

export const validateAccessCode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => codeSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await loadSession(data.code);
    if (session.status === "nao_iniciado") {
      const db = await admin();
      await db
        .from("candidates")
        .update({ status: "em_andamento", started_at: new Date().toISOString() })
        .eq("id", session.id);
      session.status = "em_andamento";
    }
    return session;
  });

export const getCandidateSession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => codeSchema.parse(data))
  .handler(async ({ data }) => loadSession(data.code));

export const saveSectionResponse = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        code: z.string().trim().min(4).max(40),
        section: z.enum(["diagnostico", "analytics", "automacao", "ia", "roadmap"]),
        response: z.record(z.any()),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const session = await loadSession(data.code);
    if (session.submittedAt) throw new Error("Seu case já foi enviado e não pode mais ser alterado.");

    const db = await admin();
    const { error } = await db.from("candidate_responses").upsert(
      {
        candidate_id: session.id,
        section: data.section,
        question_id: "data",
        response: data.response as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "candidate_id,section,question_id" },
    );
    if (error) throw new Error("Não foi possível salvar sua resposta. Tente novamente.");

    const merged = { ...session.responses, [data.section]: data.response as SectionData };
    const progress = overallProgress(merged);
    await db
      .from("candidates")
      .update({ progress, status: session.status === "nao_iniciado" ? "em_andamento" : session.status })
      .eq("id", session.id);

    return { progress, savedAt: new Date().toISOString() };
  });

export const submitCase = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => codeSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await loadSession(data.code);
    if (session.submittedAt) return { submittedAt: session.submittedAt, accessCode: session.accessCode };

    const db = await admin();
    const submittedAt = new Date().toISOString();
    await db
      .from("candidates")
      .update({ status: "enviado", submitted_at: submittedAt, progress: overallProgress(session.responses) })
      .eq("id", session.id);

    await db
      .from("assessments")
      .upsert({ candidate_id: session.id, assessment_status: "pendente" }, { onConflict: "candidate_id" });

    return { submittedAt, accessCode: session.accessCode };
  });
