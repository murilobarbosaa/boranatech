import { validateEmailForSending } from "../../shared/emailValidation";

// Pecas puras da troca de e-mail pelo admin.
//
// Contexto: a identidade de LOGIN e auth.users.email, que tem UNIQUE.
// profiles.email e espelho e NAO tem UNIQUE. Trocar so o espelho cria
// divergencia silenciosa: a pessoa continua entrando com o endereco errado e o
// admin ve o certo.

export function normalizeEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/**
 * Valida o endereco novo com a MESMA fonte do cadastro e da waitlist
 * (shared/emailValidation.ts): sintaxe, tamanho e dominios/TLDs reservados da
 * IANA. O ultimo importa aqui mais que nas campanhas: trocar o login de alguem
 * para `@example.com` deixaria a conta inacessivel para sempre.
 */
export function validateNewEmail(
  email: string,
): { code: string; message: string } | null {
  const check = validateEmailForSending(normalizeEmail(email));
  if (check.ok) return null;
  return {
    code: "invalid_email",
    message:
      check.reason === "reserved"
        ? "Este domínio de e-mail não pode ser usado."
        : "E-mail inválido.",
  };
}

/**
 * O erro do Auth e colisao de e-mail?
 *
 * O GoTrue nao expoe um codigo estavel para isso em toda versao, entao a
 * deteccao olha o codigo QUANDO ele vem e cai para as mensagens conhecidas.
 * Reconhecimento amplo de propósito: classificar uma colisao como erro
 * generico manda o admin procurar o problema no lugar errado; o inverso (um
 * erro generico virar 409) e o que os testes barram.
 */
export function emailAlreadyTakenError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  if (typeof code === "string" && code.toLowerCase().includes("email_exists")) {
    return true;
  }
  const message = (err as { message?: unknown }).message;
  if (typeof message !== "string") return false;
  const m = message.toLowerCase();
  return (
    ((m.includes("already been registered") ||
      m.includes("already registered") ||
      m.includes("already exists")) &&
      m.includes("email")) ||
    m.includes("users_email_partial_key")
  );
}

/**
 * Metadata do Auth com o e-mail trocado, PRESERVANDO todo o resto.
 *
 * Devolve o objeto INTEIRO, e nao so `{ email }`: a semantica de merge do
 * GoTrue para user_metadata nao foi verificada nesta base, e a diferenca entre
 * merge e substituicao seria apagar name e avatar_url de 3200 contas. Passar o
 * objeto completo esta correto nas duas semanticas.
 *
 * Vale dizer o que isto NAO cobre: auth.identities.identity_data tambem guarda
 * o email (3280 de 3280 linhas em producao) e NAO e alcancavel pela API admin
 * do supabase-js. Fica com o endereco antigo. Nao afeta login: o GoTrue casa
 * identidade por provider + provider_id, nao por email.
 */
export function mergedUserMetadata(
  current: Record<string, unknown> | null | undefined,
  novoEmail: string,
): Record<string, unknown> {
  return { ...(current ?? {}), email: novoEmail };
}
