import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { CRITERIA, weightedScore } from "./case-config";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertStaff(context: any) {
  const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("admin") && !roles.includes("recruiter")) {
    throw new Error("Acesso restrito ao time de RH.");
  }
  return roles as string[];
}

export const getStaffProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await assertStaff(context);
    const { data } = await context.supabase
      .from("profiles")
      .select("name, email")
      .eq("id", context.userId)
      .maybeSingle();
    return { roles, name: data?.name ?? null, email: data?.email ?? null, userId: context.userId as string };
  });

async function fetchBoard() {
  const db = await adminDb();
  const [{ data: candidates }, { data: assessments }, { data: aiEvals }, { data: reviews }] = await Promise.all([
    db.from("candidates").select("*").order("created_at", { ascending: true }),
    db.from("assessments").select("*"),
    db.from("ai_evaluations").select("*"),
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

export type BoardCandidate = Awaited<ReturnType<typeof fetchBoard>>[number];

export const listCandidatesBoard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    return fetchBoard();
  });

export const getCandidateDetail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const db = await adminDb();
    const [{ data: candidate }, { data: responses }, { data: ai }, { data: review }, { data: assessment }] =
      await Promise.all([
        db.from("candidates").select("*").eq("id", data.id).maybeSingle(),
        db.from("candidate_responses").select("section, response, updated_at").eq("candidate_id", data.id),
        db
          .from("ai_evaluations")
          .select("*")
          .eq("candidate_id", data.id)
          .order("generated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        db.from("hr_reviews").select("*").eq("candidate_id", data.id).limit(1).maybeSingle(),
        db.from("assessments").select("*").eq("candidate_id", data.id).maybeSingle(),
      ]);

    if (!candidate) throw new Error("Candidato não encontrado.");

    const grouped: Record<string, any> = {};
    for (const row of responses ?? []) grouped[row.section] = row.response ?? {};

    return {
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        accessCode: candidate.access_code,
        position: candidate.position,
        status: candidate.status,
        progress: candidate.progress,
        startedAt: candidate.started_at,
        submittedAt: candidate.submitted_at,
      },
      responses: grouped,
      ai: ai
        ? {
            criteriaScores: (ai.criteria_scores ?? []) as any[],
            strengths: (ai.strengths ?? []) as string[],
            weaknesses: (ai.weaknesses ?? []) as string[],
            interviewQuestions: (ai.interview_questions ?? []) as string[],
            executiveSummary: (ai.executive_summary ?? []) as string[],
            recommendation: ai.recommendation,
            finalScore: ai.final_score != null ? Number(ai.final_score) : null,
            generatedAt: ai.generated_at,
          }
        : null,
      review: review
        ? {
            criteriaScores: (review.criteria_scores ?? {}) as Record<string, number>,
            comments: review.comments,
            strengths: review.strengths,
            attentionPoints: review.attention_points,
            finalScore: review.final_score != null ? Number(review.final_score) : null,
            finalRecommendation: review.final_recommendation,
            reviewerName: review.reviewer_name,
            updatedAt: review.updated_at,
          }
        : null,
      assessmentStatus: assessment?.assessment_status ?? "pendente",
    };
  });

export const saveHrReview = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        candidateId: z.string().uuid(),
        criteriaScores: z.record(z.number().min(0).max(10)),
        comments: z.string().max(4000).optional(),
        strengths: z.string().max(2000).optional(),
        attentionPoints: z.string().max(2000).optional(),
        finalRecommendation: z.string().max(80).optional(),
      })
      .parse(data),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const db = await adminDb();
    const finalScore = weightedScore(data.criteriaScores);
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("name, email")
      .eq("id", context.userId)
      .maybeSingle();

    const { error } = await db.from("hr_reviews").upsert(
      {
        candidate_id: data.candidateId,
        reviewer_id: context.userId,
        reviewer_name: profile?.name ?? profile?.email ?? "RH",
        criteria_scores: data.criteriaScores as never,
        comments: data.comments ?? null,
        strengths: data.strengths ?? null,
        attention_points: data.attentionPoints ?? null,
        final_score: finalScore,
        final_recommendation: data.finalRecommendation ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "candidate_id,reviewer_id" },
    );
    if (error) throw new Error("Não foi possível salvar a avaliação.");

    await db
      .from("assessments")
      .upsert(
        { candidate_id: data.candidateId, assessment_status: "avaliado", final_score_hr: finalScore },
        { onConflict: "candidate_id" },
      );
    await db.from("candidates").update({ status: "avaliado" }).eq("id", data.candidateId);

    return { finalScore };
  });

export const runAiEvaluation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ candidateId: z.string().uuid() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const db = await adminDb();
    const { data: candidate } = await db.from("candidates").select("*").eq("id", data.candidateId).maybeSingle();
    if (!candidate) throw new Error("Candidato não encontrado.");

    const { data: rows } = await db
      .from("candidate_responses")
      .select("section, response")
      .eq("candidate_id", data.candidateId);
    const responses: Record<string, unknown> = {};
    for (const row of rows ?? []) responses[row.section] = row.response;
    if (Object.keys(responses).length === 0) throw new Error("Este candidato ainda não possui respostas.");

    const { evaluateWithAi } = await import("./ai-evaluation.server");
    const result = await evaluateWithAi({
      candidateName: candidate.name,
      position: candidate.position,
      responses,
    });

    const computed =
      weightedScore(Object.fromEntries(result.criteria_scores.map((c) => [c.key, c.score]))) ?? result.final_score;

    await db.from("ai_evaluations").insert({
      candidate_id: data.candidateId,
      criteria_scores: result.criteria_scores as never,
      strengths: result.strengths as never,
      weaknesses: result.weaknesses as never,
      interview_questions: result.interview_questions as never,
      executive_summary: result.executive_summary as never,
      recommendation: result.recommendation,
      final_score: computed,
    });

    await db.from("assessments").upsert(
      {
        candidate_id: data.candidateId,
        assessment_status: "em_avaliacao",
        final_score_ai: computed,
        recommendation_ai: result.recommendation,
      },
      { onConflict: "candidate_id" },
    );
    if (candidate.status === "enviado") {
      await db.from("candidates").update({ status: "em_avaliacao" }).eq("id", data.candidateId);
    }

    return { finalScore: computed, recommendation: result.recommendation };
  });

export const createCandidate = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(200).optional().or(z.literal("")),
        position: z.string().trim().min(2).max(160),
        accessCode: z.string().trim().min(4).max(40),
        expiresAt: z.string().optional().or(z.literal("")),
      })
      .parse(data),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const db = await adminDb();
    const { data: created, error } = await db
      .from("candidates")
      .insert({
        name: data.name,
        email: data.email || null,
        position: data.position,
        access_code: data.accessCode.toUpperCase(),
        code_expires_at: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      })
      .select("id, access_code")
      .single();
    if (error) {
      throw new Error(
        error.code === "23505" || error.message.includes("duplicate")
          ? "Este código de acesso já existe. Gere outro."
          : "Não foi possível criar o candidato.",
      );
    }
    return { id: created.id, accessCode: created.access_code };
  });

export const updateCandidateCode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        codeActive: z.boolean().optional(),
        accessCode: z.string().trim().min(4).max(40).optional(),
        expiresAt: z.string().nullable().optional(),
      })
      .parse(data),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const db = await adminDb();
    const patch: {
      code_active?: boolean;
      access_code?: string;
      code_expires_at?: string | null;
    } = {};
    if (data.codeActive !== undefined) patch.code_active = data.codeActive;
    if (data.accessCode) patch.access_code = data.accessCode.toUpperCase();
    if (data.expiresAt !== undefined) {
      patch.code_expires_at = data.expiresAt ? new Date(data.expiresAt).toISOString() : null;
    }
    const { error } = await db.from("candidates").update(patch).eq("id", data.id);
    if (error) throw new Error("Não foi possível atualizar o código.");
    return { ok: true };
  });

export const CRITERIA_KEYS = CRITERIA.map((c) => c.key);
