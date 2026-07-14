// Elegibilidade de certificado (C1). Toda a decisao e server-side e
// FAIL-CLOSED: qualquer erro de query resulta em nao-elegivel (status
// "unavailable"), nunca em "eligible". O userId vem SEMPRE do JWT (quem chama
// passa req.user.id), nunca de body ou param, e TODA query com supabaseAdmin
// filtra por user_id explicitamente porque o service role bypassa a RLS.
import { computeHours } from "../../shared/certificates/hours";
import {
  isValidCpf,
  type Eligibility,
  type EligibilityHours,
  type MissingProfileField,
} from "../../shared/certificates/types";
import { roadmapsV2 } from "../../shared/roadmapV2/content";
import { CERT_SCORE } from "../../shared/roadmapQuiz/types";
import { roadmapQuizPools } from "../data/roadmapQuizzes";
import { supabaseAdmin } from "./supabaseAdmin";

// Nome do titular aceitavel: pelo menos 2 palavras, cada uma com 2+ caracteres.
function isValidFullName(name: string | null | undefined): boolean {
  if (!name) return false;
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length >= 2 && words.every((word) => word.length >= 2);
}

export async function getCertificateEligibility(
  userId: string,
  slug: string,
): Promise<Eligibility> {
  // a. Roadmap estatico existente e nao gerado por IA.
  const roadmap = roadmapsV2.find((r) => r.slug === slug);
  if (!roadmap || slug.startsWith("ia-")) {
    return { status: "not_certifiable" };
  }

  // Carga horaria (pura, sem I/O) anexada a todos os desfechos abaixo.
  const { totalHours, sections } = computeHours(roadmap);
  const hours: EligibilityHours = { hours: totalHours, syllabus: sections };

  // b. Trilha tem pool de quiz (mesma fonte do hasQuiz do meta).
  if (!(slug in roadmapQuizPools)) {
    return { status: "no_quiz", ...hours };
  }

  // c. Conclusao registrada.
  const { data: completion, error: completionError } = await supabaseAdmin
    .from("roadmap_completions")
    .select("roadmap_slug")
    .eq("user_id", userId)
    .eq("roadmap_slug", slug)
    .maybeSingle();
  if (completionError) {
    return { status: "unavailable", ...hours };
  }
  if (!completion) {
    return { status: "not_complete", ...hours };
  }

  // d. Tentativa de quiz aprovada (unica por design: indice parcial).
  const { data: approvedRaw, error: approvedError } = await supabaseAdmin
    .from("roadmap_quiz_attempts")
    .select("score")
    .eq("user_id", userId)
    .eq("roadmap_slug", slug)
    .eq("status", "aprovada")
    .maybeSingle();
  if (approvedError) {
    return { status: "unavailable", ...hours };
  }
  const approved = approvedRaw as { score: number | null } | null;
  if (!approved) {
    return { status: "quiz_required", ...hours };
  }

  // e. Nota da aprovada acima da barra de certificado.
  // Linha 'aprovada' sem score e estado corrompido, nao nota zero. Colapsar
  // null em 0 faria a UI dizer "sua nota foi 0" pra quem passou. Fail-closed
  // honesto: nao sabemos, entao unavailable.
  if (approved.score == null) {
    return { status: "unavailable", ...hours };
  }
  const score = approved.score;
  if (score < CERT_SCORE) {
    return { status: "score_below_cert", score, certScore: CERT_SCORE, ...hours };
  }

  // f. Identidade do titular completa (snapshot da emissao sai daqui).
  const { data: profileRaw, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("full_name, cpf")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileError) {
    return { status: "unavailable", ...hours };
  }
  const profile = profileRaw as {
    full_name: string | null;
    cpf: string | null;
  } | null;
  const missing: MissingProfileField[] = [];
  if (!isValidFullName(profile?.full_name)) missing.push("full_name");
  if (!isValidCpf(profile?.cpf ?? "")) missing.push("cpf");
  if (missing.length > 0) {
    return { status: "profile_incomplete", missing, ...hours };
  }

  // g. Certificado nao revogado ja emitido.
  const { data: existingRaw, error: existingError } = await supabaseAdmin
    .from("certificates")
    .select("code")
    .eq("user_id", userId)
    .eq("roadmap_slug", slug)
    .is("revoked_at", null)
    .maybeSingle();
  if (existingError) {
    return { status: "unavailable", ...hours };
  }
  const existing = existingRaw as { code: string } | null;
  if (existing) {
    return { status: "already_issued", code: existing.code, ...hours };
  }

  // h. Tudo verde.
  return { status: "eligible", ...hours };
}
