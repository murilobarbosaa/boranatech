// Validacao de e-mail para ENVIO (campanhas e listas). Fonte UNICA: sintaxe +
// bloqueio de dominios reservados IANA. Antes desta funcao a validacao estava
// espalhada (EMAIL_PATTERN no admin, EMAIL_RE no contactImport) e NENHUMA
// bloqueava dominios reservados (example.com etc), o que deixou enderecos de
// teste/probe (@example.com) chegarem ao Resend em producao e falharem com
// "Invalid `to` field ... example.com".

// Mesma validacao do POST /api/waitlist: presenca de local, arroba e dominio
// com ponto. Suficiente pra triagem; a autoridade final de entregabilidade e o
// Resend/supressao no envio.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_EMAIL_LENGTH = 254;

// Dominios reservados de segundo nivel (RFC 2606): nunca entregaveis, so
// aparecem em producao como dado de teste/probe vazado. Lista nomeada e facil
// de estender.
export const RESERVED_EMAIL_DOMAINS = new Set<string>([
  "example.com",
  "example.org",
  "example.net",
]);

// TLDs reservados / de uso especial (RFC 2606, RFC 6761): qualquer e-mail cujo
// dominio termine nestes sufixos e bloqueado (ex.: foo@bar.test,
// foo@host.localhost). Cobre tambem os dominios "nus" example/test/invalid/
// localhost (sem ponto), que ja falham na sintaxe, mas ficam aqui documentados
// e faceis de estender.
export const RESERVED_EMAIL_TLDS = new Set<string>([
  "test",
  "example",
  "invalid",
  "localhost",
]);

export type EmailRejectReason = "syntax" | "reserved";
export type EmailValidation =
  | { ok: true }
  | { ok: false; reason: EmailRejectReason };

// Distingue "sintaxe invalida" de "dominio reservado" para facilitar o log e a
// decisao de tratamento (dado sujo conhecido vs. entrada malformada).
export function validateEmailForSending(email: string): EmailValidation {
  const trimmed = email.trim();
  if (trimmed.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(trimmed)) {
    return { ok: false, reason: "syntax" };
  }
  const domain = trimmed.slice(trimmed.lastIndexOf("@") + 1).toLowerCase();
  if (RESERVED_EMAIL_DOMAINS.has(domain)) {
    return { ok: false, reason: "reserved" };
  }
  const tld = domain.slice(domain.lastIndexOf(".") + 1);
  if (RESERVED_EMAIL_TLDS.has(tld)) {
    return { ok: false, reason: "reserved" };
  }
  return { ok: true };
}

// Particiona uma lista de destinatarios em enviaveis e rejeitados (com motivo).
// Usado no dispatch pra NUNCA inserir dado sujo como recipient da campanha.
export function partitionSendableEmails(emails: string[]): {
  sendable: string[];
  rejected: Array<{ email: string; reason: EmailRejectReason }>;
} {
  const sendable: string[] = [];
  const rejected: Array<{ email: string; reason: EmailRejectReason }> = [];
  for (const email of emails) {
    const check = validateEmailForSending(email);
    if (check.ok) {
      sendable.push(email);
    } else {
      rejected.push({ email, reason: check.reason });
    }
  }
  return { sendable, rejected };
}
