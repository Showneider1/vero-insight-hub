import type { SectionData, SectionKey } from "./case-config";

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

export async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function loadSession(code: string): Promise<CandidateSession> {
  const db = await adminDb();
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
