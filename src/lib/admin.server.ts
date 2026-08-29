/* eslint-disable @typescript-eslint/no-explicit-any */

export async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function assertStaff(context: any) {
  const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("admin") && !roles.includes("recruiter")) {
    throw new Error("Acesso restrito ao time de RH.");
  }
  return roles as string[];
}

export type BoardCandidate = {
  id: string;
  name: string;
  email: string | null;
  accessCode: string;
  position: string;
  status: string;
  progress: number;
  codeActive: boolean;
  codeExpiresAt: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  assessmentStatus: string;
  scoreAi: number | null;
  scoreHr: number | null;
  recommendationAi: string | null;
  recommendationHr: string | null;
  criteriaScoresAi: any[];
  criteriaScoresHr: Record<string, number>;
  strengthsAi: string[];
  weaknessesAi: string[];
  hasAi: boolean;
};

export async function fetchBoard(): Promise<BoardCandidate[]> {
  const db = await adminDb();
  const [{ data: candidates }, { data: assessments }, { data: aiEvals }, { data: reviews }] = await Promise.all([
    db.from("candidates").select("*").order("created_at", { ascending: true }),
    db.from("assessments").select("*"),
    db.from("ai_evaluations").select("*").order("generated_at", { ascending: false }),
    db.from("hr_reviews").select("*"),
  ]);

  return (candidates ?? []).map((candidate) => {
    const assessment = (assessments ?? []).find((a) => a.candidate_id === candidate.id) ?? null;
    const ai = (aiEvals ?? []).find((a) => a.candidate_id === candidate.id) ?? null;
    const review = (reviews ?? []).find((r) => r.candidate_id === candidate.id) ?? null;
    return {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      accessCode: candidate.access_code,
      position: candidate.position,
      status: candidate.status,
      progress: candidate.progress,
      codeActive: candidate.code_active,
      codeExpiresAt: candidate.code_expires_at,
      startedAt: candidate.started_at,
      submittedAt: candidate.submitted_at,
      createdAt: candidate.created_at,
      assessmentStatus: assessment?.assessment_status ?? "pendente",
      scoreAi: ai?.final_score != null ? Number(ai.final_score) : null,
      scoreHr: review?.final_score != null ? Number(review.final_score) : null,
      recommendationAi: ai?.recommendation ?? null,
      recommendationHr: review?.final_recommendation ?? null,
      criteriaScoresAi: (ai?.criteria_scores ?? []) as any[],
      criteriaScoresHr: (review?.criteria_scores ?? {}) as Record<string, number>,
      strengthsAi: (ai?.strengths ?? []) as string[],
      weaknessesAi: (ai?.weaknesses ?? []) as string[],
      hasAi: Boolean(ai),
    };
  });
}
