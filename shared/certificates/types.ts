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

// Valida CPF pelos dois digitos verificadores.
//
// A IMPLEMENTACAO MUDOU DE CASA na Fase 2 da NFS-e: agora mora em
// shared/fiscalIdentity.ts, ao lado da validacao de CNPJ, CEP e UF, porque o
// CPF passou a ter dois donos (certificado e nota fiscal). Este re-export
// preserva `import { isValidCpf } from "@shared/certificates/types"` em todos os
// chamadores existentes, e garante que nao exista uma segunda copia da conta
// para divergir da primeira.
export { isValidCpf } from "../fiscalIdentity";
