// Camada server da validacao de e-mail. A fonte de verdade (sintaxe + dominios/
// TLDs reservados IANA + validateEmailForSending) vive em shared/emailValidation.ts,
// compartilhada com o client (cadastro/waitlist). Aqui ficam apenas os helpers
// que so o server usa (dispatch de campanha).

import {
  validateEmailForSending,
  type EmailRejectReason,
} from "../../shared/emailValidation";

export * from "../../shared/emailValidation";

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
