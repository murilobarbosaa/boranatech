import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type {
  CertificateStatus,
  Eligibility,
  PublicCertificate,
} from "@shared/certificates/types";

// Reexporta a fonte unica (shared) para os consumidores atuais do client
// (RoadmapsV2Index importa daqui) sem duplicar a definicao.
export type { CertificateStatus };

// Service dos certificados (C1, fase 2B). Mesmo padrao dos demais services:
// apiUrl + Bearer da sessao Supabase, resposta em { data }. O gabarito de
// elegibilidade e emissao mora no server; aqui so consumimos.

async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export interface CertificateListItem {
  code: string;
  roadmapSlug: string;
  roadmapTitle: string;
  hours: number;
  issuedAt: string;
}

export interface RoadmapCertificateStatus {
  roadmapSlug: string;
  status: CertificateStatus;
}

export type IssueResult =
  | { ok: true; code: string }
  | { ok: false; reason: Eligibility }
  | { ok: false; error: true };

// Elegibilidade da trilha. null = falha de rede/servidor: a UI trata como o
// estado "unavailable" (erro e erro, nao sucesso nem perfil incompleto).
export async function getEligibility(
  slug: string,
): Promise<Eligibility | null> {
  try {
    const header = await authHeader();
    const res = await fetch(
      apiUrl(`/api/certificates/eligibility/${encodeURIComponent(slug)}`),
      { headers: { ...header } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Eligibility };
    return json.data ?? null;
  } catch (err) {
    console.error("[certificates] getEligibility error:", err);
    return null;
  }
}

// Emissao. Body vazio de proposito: o server reavalia tudo. 201 -> code;
// 409 -> reason (Eligibility); qualquer outra falha -> { error: true }.
export async function issueCertificate(slug: string): Promise<IssueResult> {
  try {
    const header = await authHeader();
    const res = await fetch(
      apiUrl(`/api/certificates/issue/${encodeURIComponent(slug)}`),
      { method: "POST", headers: { ...header } },
    );
    const json = (await res.json().catch(() => null)) as {
      data?: { code?: string; reason?: Eligibility };
    } | null;
    if (res.status === 201 && json?.data?.code) {
      return { ok: true, code: json.data.code };
    }
    if (res.status === 409 && json?.data?.reason) {
      return { ok: false, reason: json.data.reason };
    }
    return { ok: false, error: true };
  } catch (err) {
    console.error("[certificates] issueCertificate error:", err);
    return { ok: false, error: true };
  }
}

// Status por trilha pro selo da vitrine. [] em qualquer falha (o selo some, a
// listagem cai no comportamento de hoje). Nao chame deslogado.
export async function getCertificateStatuses(): Promise<
  RoadmapCertificateStatus[]
> {
  try {
    const header = await authHeader();
    const res = await fetch(apiUrl("/api/certificates/status"), {
      headers: { ...header },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: RoadmapCertificateStatus[] };
    return json.data ?? [];
  } catch (err) {
    console.error("[certificates] getCertificateStatuses error:", err);
    return [];
  }
}

export async function listCertificates(): Promise<CertificateListItem[]> {
  try {
    const header = await authHeader();
    const res = await fetch(apiUrl("/api/certificates"), {
      headers: { ...header },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: CertificateListItem[] };
    return json.data ?? [];
  } catch (err) {
    console.error("[certificates] listCertificates error:", err);
    return [];
  }
}

export type DownloadResult =
  | { ok: true }
  | { ok: false; reason: "unavailable" | "forbidden" | "error" };

function filenameFromDisposition(value: string | null): string | null {
  if (!value) return null;
  const match = /filename="?([^"]+)"?/.exec(value);
  return match ? match[1] : null;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

// Download DONO-SO do certificado (PDF ou imagem PNG). A rota exige login e ser
// o dono; a trava real e server-side (403 pro nao-dono). 503/429 -> "tente mais
// tarde" (geracao indisponivel), sem quebrar a pagina. Dispara o download via
// blob usando o filename do header Content-Disposition.
export async function downloadCertificateFile(
  code: string,
  format: "pdf" | "image",
  lang: "pt" | "en" = "pt",
): Promise<DownloadResult> {
  try {
    const header = await authHeader();
    const query = lang === "en" ? "?lang=en" : "";
    const res = await fetch(
      apiUrl(`/api/certificates/${encodeURIComponent(code)}/${format}${query}`),
      { headers: { ...header } },
    );
    if (!res.ok) {
      if (res.status === 503 || res.status === 429) {
        return { ok: false, reason: "unavailable" };
      }
      if (res.status === 403) return { ok: false, reason: "forbidden" };
      return { ok: false, reason: "error" };
    }
    const blob = await res.blob();
    const filename =
      filenameFromDisposition(res.headers.get("Content-Disposition")) ??
      `certificado-${code}.${format === "pdf" ? "pdf" : "png"}`;
    triggerBlobDownload(blob, filename);
    return { ok: true };
  } catch (err) {
    console.error("[certificates] downloadCertificateFile error:", err);
    return { ok: false, reason: "error" };
  }
}

// SVG de TELA (leve, sem fontes embutidas) para a pagina renderizar INLINE.
// null se falhar (a pagina cai num placeholder). Publico, sem auth.
export async function getPublicCertificateSvg(
  code: string,
  lang: "pt" | "en" = "pt",
): Promise<string | null> {
  try {
    // lang SEMPRE explicito na URL (pt e en), e cache: "no-store" pra o browser
    // nunca reusar a versao de outro idioma ao trocar o toggle.
    const res = await fetch(
      apiUrl(
        `/api/public/certificates/${encodeURIComponent(code)}/svg?lang=${lang}`,
      ),
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.error("[certificates] getPublicCertificateSvg error:", err);
    return null;
  }
}

// Verificacao PUBLICA por code, sem auth. null se nao existir (404) ou falhar.
export async function getPublicCertificate(
  code: string,
): Promise<PublicCertificate | null> {
  try {
    const res = await fetch(
      apiUrl(`/api/public/certificates/${encodeURIComponent(code)}`),
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: PublicCertificate };
    return json.data ?? null;
  } catch (err) {
    console.error("[certificates] getPublicCertificate error:", err);
    return null;
  }
}
