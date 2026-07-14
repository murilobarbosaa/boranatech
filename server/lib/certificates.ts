// Elegibilidade de certificado (C1). Toda a decisao e server-side e
// FAIL-CLOSED: qualquer erro de query resulta em nao-elegivel (status
// "unavailable"), nunca em "eligible". O userId vem SEMPRE do JWT (quem chama
// passa req.user.id), nunca de body ou param, e TODA query com supabaseAdmin
// filtra por user_id explicitamente porque o service role bypassa a RLS.
import {
  generateCertificateCode,
  normalizeCertificateCode,
} from "../../shared/certificates/code";
import { computeHours } from "../../shared/certificates/hours";
import {
  isValidCpf,
  type Eligibility,
  type EligibilityHours,
  type MissingProfileField,
  type PublicCertificate,
  type SyllabusSection,
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
  isPro: boolean,
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

  // Gate Pro DEPOIS da barra de nota: so pede assinatura pra quem ja passou nos
  // 8 acertos. Quem reprovou ve "refaca a prova", nunca um paywall. Nao e 403;
  // e um status pra UI mostrar o certificado conquistado e o upgrade.
  if (!isPro) {
    return { status: "pro_required", ...hours };
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

// 23505 disparado por um unique index especifico? PostgREST devolve o nome da
// constraint na message/details; e assim que distinguimos colisao de code de
// corrida de emissao dupla.
function isUniqueViolationOn(
  error: { code: string; message: string; details?: string | null } | null,
  constraint: string,
): boolean {
  if (!error || error.code !== "23505") return false;
  return `${error.message} ${error.details ?? ""}`.includes(constraint);
}

// Emissao. NAO confia em NADA do client: reavalia a elegibilidade agora e so
// emite se o status for exatamente "eligible". Todo o snapshot e derivado
// server-side (perfil, conteudo estatico, tentativa aprovada); o front nunca
// informa nota, horas, nome nem trilha.
export async function issueCertificate(
  userId: string,
  slug: string,
  isPro: boolean,
): Promise<{ ok: true; code: string } | { ok: false; reason: Eligibility }> {
  const eligibility = await getCertificateEligibility(userId, slug, isPro);
  if (eligibility.status !== "eligible") {
    return { ok: false, reason: eligibility };
  }

  const roadmap = roadmapsV2.find((r) => r.slug === slug);
  if (!roadmap) {
    // Inalcancavel apos "eligible" (o roadmap existe), mas fail-closed sem "!".
    return { ok: false, reason: { status: "not_certifiable" } };
  }
  const { totalHours, sections } = computeHours(roadmap);
  const hours: EligibilityHours = { hours: totalHours, syllabus: sections };

  // Reconsulta perfil e tentativa aprovada pro snapshot (dado do server).
  const { data: profileRaw, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("full_name, cpf")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileError) {
    return { ok: false, reason: { status: "unavailable", ...hours } };
  }
  const profile = profileRaw as {
    full_name: string | null;
    cpf: string | null;
  } | null;

  const { data: attemptRaw, error: attemptError } = await supabaseAdmin
    .from("roadmap_quiz_attempts")
    .select("id, score")
    .eq("user_id", userId)
    .eq("roadmap_slug", slug)
    .eq("status", "aprovada")
    .maybeSingle();
  if (attemptError) {
    return { ok: false, reason: { status: "unavailable", ...hours } };
  }
  const attempt = attemptRaw as { id: string; score: number | null } | null;

  // Reconfirma o que a elegibilidade ja garantiu; qualquer buraco vira
  // unavailable, nunca um snapshot pela metade.
  if (
    !profile ||
    !profile.full_name ||
    profile.cpf == null ||
    !attempt ||
    attempt.score == null
  ) {
    return { ok: false, reason: { status: "unavailable", ...hours } };
  }
  const holderCpf = profile.cpf.replace(/\D/g, "");

  // Ate 3 tentativas contra colisao de code (unique certificates_code_key).
  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    const code = generateCertificateCode();
    const { error: insertError } = await supabaseAdmin
      .from("certificates")
      .insert({
        user_id: userId,
        roadmap_slug: slug,
        code,
        holder_name: profile.full_name,
        holder_cpf: holderCpf,
        roadmap_title: roadmap.title,
        hours: totalHours,
        score: attempt.score,
        cert_score: CERT_SCORE,
        quiz_attempt_id: attempt.id,
        syllabus: sections,
      });

    if (!insertError) {
      return { ok: true, code };
    }

    // Corrida de emissao dupla: o unique parcial one_per_roadmap disparou.
    // Releia o existente e devolva already_issued (nunca cria dois).
    if (isUniqueViolationOn(insertError, "certificates_one_per_roadmap")) {
      const { data: existingRaw } = await supabaseAdmin
        .from("certificates")
        .select("code")
        .eq("user_id", userId)
        .eq("roadmap_slug", slug)
        .is("revoked_at", null)
        .maybeSingle();
      const existing = existingRaw as { code: string } | null;
      if (existing) {
        return {
          ok: false,
          reason: { status: "already_issued", code: existing.code, ...hours },
        };
      }
      return { ok: false, reason: { status: "unavailable", ...hours } };
    }

    // So repete se foi colisao de code; qualquer outro erro aborta fail-closed.
    if (!isUniqueViolationOn(insertError, "certificates_code_key")) {
      return { ok: false, reason: { status: "unavailable", ...hours } };
    }
  }

  // Tres codes colidiram em sequencia (astronomicamente improvavel): desiste.
  return { ok: false, reason: { status: "unavailable", ...hours } };
}

// Linha crua do banco lida na verificacao publica. Nao sai deste modulo: o
// publico so ve o retorno de toPublicCertificate.
interface CertificateRow {
  code: string;
  holder_name: string;
  holder_cpf: string;
  roadmap_title: string;
  hours: number;
  syllabus: SyllabusSection[];
  issued_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
}

// Whitelist EXPLICITA do que o publico pode ver. Tudo que nao esta aqui
// (user_id, cpf completo, score, cert_score, quiz_attempt_id, id) fica de fora
// por construcao. cpfMasked revela so os digitos do meio.
function toPublicCertificate(row: CertificateRow): PublicCertificate {
  const digits = row.holder_cpf;
  const cpfMasked = `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
  const revoked = row.revoked_at != null;
  return {
    code: row.code,
    holderName: row.holder_name,
    cpfMasked,
    roadmapTitle: row.roadmap_title,
    hours: row.hours,
    syllabus: row.syllabus,
    issuedAt: row.issued_at,
    revoked,
    ...(revoked && row.revoked_reason
      ? { revokedReason: row.revoked_reason }
      : {}),
  };
}

// Leitura PUBLICA por code, via supabaseAdmin (fora da RLS de proposito:
// verificacao publica nao tem sessao). null se nao achar; revogado tambem
// retorna (a pagina precisa dizer "revogado", nao "nao existe").
export async function getCertificateByCode(
  code: string,
): Promise<PublicCertificate | null> {
  const normalized = normalizeCertificateCode(code);
  if (!normalized) return null;
  const { data, error } = await supabaseAdmin
    .from("certificates")
    .select(
      "code, holder_name, holder_cpf, roadmap_title, hours, syllabus, issued_at, revoked_at, revoked_reason",
    )
    .eq("code", normalized)
    .maybeSingle();
  if (error || !data) return null;
  return toPublicCertificate(data as CertificateRow);
}

// Status por trilha pro selo da vitrine (/roadmaps). NAO e recurso Pro.
// "certificada" > "concluida" > "em_progresso"; trilha sem atividade nao entra
// na resposta (cai no comportamento de hoje na UI).
//
// Regra central: "concluida" exige QUIZ APROVADO, nunca roadmap_completions
// sozinho (autodeclarado e falsificavel). Por isso a query e em
// roadmap_quiz_attempts, nao em roadmap_completions.
export type CertificateStatus = "em_progresso" | "concluida" | "certificada";

export async function getCertificateStatuses(
  userId: string,
): Promise<Array<{ roadmapSlug: string; status: CertificateStatus }>> {
  // Duas queries no maximo, ambas com user_id explicito. FAIL-CLOSED: erro em
  // qualquer uma zera tudo (array vazio), nunca um status parcial que pareca
  // legitimo. Melhor nenhum selo do que selo errado.
  const { data: certsRaw, error: certsError } = await supabaseAdmin
    .from("certificates")
    .select("roadmap_slug")
    .eq("user_id", userId)
    .is("revoked_at", null);
  if (certsError) return [];

  const { data: attemptsRaw, error: attemptsError } = await supabaseAdmin
    .from("roadmap_quiz_attempts")
    .select("roadmap_slug, status")
    .eq("user_id", userId);
  if (attemptsError) return [];

  const certifiedSlugs = (
    (certsRaw as { roadmap_slug: string }[] | null) ?? []
  ).map((row) => row.roadmap_slug);
  const attempts =
    (attemptsRaw as { roadmap_slug: string; status: string }[] | null) ?? [];
  const approved = new Set(
    attempts
      .filter((row) => row.status === "aprovada")
      .map((row) => row.roadmap_slug),
  );

  // Sets so pra .has (sem iterar Set, que exigiria target maior). Percorremos
  // arrays; seen deduplica trilha certificada + com multiplas tentativas.
  const seen = new Set<string>();
  const result: Array<{ roadmapSlug: string; status: CertificateStatus }> = [];
  for (const slug of certifiedSlugs) {
    if (seen.has(slug)) continue;
    seen.add(slug);
    result.push({ roadmapSlug: slug, status: "certificada" });
  }
  for (const row of attempts) {
    const slug = row.roadmap_slug;
    if (seen.has(slug)) continue;
    seen.add(slug);
    result.push({
      roadmapSlug: slug,
      status: approved.has(slug) ? "concluida" : "em_progresso",
    });
  }
  return result;
}
