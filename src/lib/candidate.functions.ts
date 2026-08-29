import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { overallProgress, type SectionData } from "./case-config";
import { adminDb, loadSession } from "./candidate.server";

export type { CandidateSession } from "./candidate.server";

export const validateAccessCode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ code: z.string().trim().min(4).max(40) }).parse(data))
  .handler(async ({ data }) => {
    const session = await loadSession(data.code);
    if (session.status === "nao_iniciado") {
      const db = await adminDb();
      await db
        .from("candidates")
        .update({ status: "em_andamento", started_at: new Date().toISOString() })
        .eq("id", session.id);
      session.status = "em_andamento";
    }
    return session;
  });

export const getCandidateSession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ code: z.string().trim().min(4).max(40) }).parse(data))
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

    const db = await adminDb();
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
  .inputValidator((data: unknown) => z.object({ code: z.string().trim().min(4).max(40) }).parse(data))
  .handler(async ({ data }) => {
    const session = await loadSession(data.code);
    if (session.submittedAt) return { submittedAt: session.submittedAt, accessCode: session.accessCode };

    const db = await adminDb();
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
