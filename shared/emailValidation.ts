// Fonte UNICA de validacao de e-mail para CADASTRO e ENVIO, compartilhada entre
// client (UX de signup/waitlist) e server (autoridade em waitlist/envio). Sintaxe
// + bloqueio de dominios/TLDs reservados IANA (RFC 2606/6761): endereco reservado
// (example.com, foo@bar.test) nunca e entregavel e so aparece em producao como
// dado de teste/probe, que antes chegava ao Resend e falhava com
// "Invalid `to` field ... example.com".
//
// A camada server (server/lib/emailValidation.ts) reexporta isto e adiciona os
// helpers so-de-server (partitionSendableEmails, usado no dispatch de campanha).

// Presenca de local, arroba e dominio com ponto. Suficiente pra triagem; a
// autoridade final de entregabilidade e o Resend/supressao no envio.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_EMAIL_LENGTH = 254;

// Dominios reservados de segundo nivel (RFC 2606): nunca entregaveis. Lista
// nomeada e facil de estender.
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
// mensagem ao usuario (dado sujo conhecido vs. entrada malformada).
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
