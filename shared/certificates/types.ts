// Tipos compartilhados do certificado (C1) e validacao pura de CPF. Sem I/O,
// sem dependencia de server; pode viver em shared e ser consumido pelo client.

// Uma linha da ementa: seccao da trilha com a carga horaria congelada. O array
// de sections retornado por computeHours vira o campo `syllabus` do certificado.
export interface SyllabusSection {
  id: string;
  title: string;
  hours: number;
}

// Carga horaria calculada da trilha. totalHours e a soma exata de
// sections[*].hours (invariante garantida por computeHours).
export interface CertificateHours {
  totalHours: number;
  sections: SyllabusSection[];
}

// Campos de identidade que faltam preencher no perfil antes de certificar.
export type MissingProfileField = "full_name" | "cpf";

// Carga horaria anexada a toda resposta de elegibilidade (menos not_certifiable,
// onde nao ha roadmap para calcular): a UI mostra as horas ANTES de emitir.
export interface EligibilityHours {
  hours: number;
  syllabus: SyllabusSection[];
}

// Resultado da checagem de elegibilidade. Discriminated union pelo campo
// `status`; cada motivo carrega so o payload que faz sentido. `unavailable` e
// o bucket fail-closed para erro de query (nunca "eligible" em caso de falha).
export type Eligibility =
  | { status: "not_certifiable" }
  | ({ status: "no_quiz" } & EligibilityHours)
  | ({ status: "not_complete" } & EligibilityHours)
  | ({ status: "quiz_required" } & EligibilityHours)
  | ({ status: "score_below_cert"; score: number; certScore: number } & EligibilityHours)
  | ({ status: "profile_incomplete"; missing: MissingProfileField[] } & EligibilityHours)
  | ({ status: "already_issued"; code: string } & EligibilityHours)
  | ({ status: "unavailable" } & EligibilityHours)
  | ({ status: "eligible" } & EligibilityHours);

// Projecao PUBLICA de um certificado, exposta sem sessao na verificacao por
// code. Whitelist explicita (toPublicCertificate): NUNCA carrega user_id, cpf
// completo, score, cert_score, quiz_attempt_id nem o id interno. cpfMasked
// revela so os digitos do meio (***.456.789-**). revokedReason so aparece
// quando revoked e true.
export interface PublicCertificate {
  code: string;
  holderName: string;
  cpfMasked: string;
  roadmapSlug: string;
  roadmapTitle: string;
  hours: number;
  syllabus: SyllabusSection[];
  issuedAt: string;
  revoked: boolean;
  revokedReason?: string;
}

// Status por trilha para o selo da vitrine (/roadmaps). "certificada" >
// "concluida" > "em_progresso". Fonte unica: server e client leem daqui.
export type CertificateStatus = "em_progresso" | "concluida" | "certificada";

// Valida CPF pelos dois digitos verificadores. Opera so sobre digitos
// (qualquer mascara e ignorada). Rejeita comprimento != 11 e as sequencias de
// digito repetido (00000000000 ... 99999999999), que passam na conta mas nao
// sao CPFs validos.
export function isValidCpf(raw: string): boolean {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const nums = digits.split("").map((d) => Number(d));

  const checkDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i += 1) {
      sum += nums[i] * (length + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return checkDigit(9) === nums[9] && checkDigit(10) === nums[10];
}
