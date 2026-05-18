import { AuthError } from "@supabase/supabase-js";

export interface FriendlyError {
  message: string;
  hint?: string;
  code: string;
}

const FALLBACK: FriendlyError = {
  message: "Não foi possível concluir a operação. Tente novamente em instantes.",
  code: "unknown",
};

const PATTERNS: Array<{ match: string; result: FriendlyError }> = [
  {
    match: "user already registered",
    result: {
      code: "email_already_registered",
      message: "Este email já está cadastrado.",
      hint: "Tente fazer login ou recupere sua senha.",
    },
  },
  {
    match: "invalid login credentials",
    result: {
      code: "invalid_credentials",
      message: "Email ou senha incorretos.",
      hint: "Confira os dados ou recupere sua senha.",
    },
  },
  {
    match: "email not confirmed",
    result: {
      code: "email_not_confirmed",
      message: "Confirme seu email antes de entrar.",
      hint: "Verifique sua caixa de entrada (e o spam) pelo link de confirmação.",
    },
  },
  {
    match: "email rate limit exceeded",
    result: {
      code: "rate_limited",
      message: "Muitas tentativas. Aguarde alguns minutos antes de tentar de novo.",
    },
  },
  {
    match: "for security purposes",
    result: {
      code: "security_cooldown",
      message: "Aguarde alguns segundos antes de tentar novamente.",
    },
  },
  {
    match: "password should be at least",
    result: {
      code: "weak_password",
      message: "A senha precisa ter pelo menos 6 caracteres.",
    },
  },
  {
    match: "signup is disabled",
    result: {
      code: "signup_disabled",
      message: "O cadastro está temporariamente indisponível.",
      hint: "Volte em alguns minutos.",
    },
  },
  {
    match: "database error saving new user",
    result: {
      code: "db_error",
      message: "Houve um problema ao criar sua conta.",
      hint: "Tente novamente em alguns instantes.",
    },
  },
  {
    match: "invalid email",
    result: {
      code: "invalid_email",
      message: "Email inválido.",
      hint: "Confira se o formato está correto.",
    },
  },
];

export function getAuthErrorMessage(error: unknown): FriendlyError {
  if (!error) return FALLBACK;

  const rawMessage =
    error instanceof AuthError
      ? error.message
      : error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : typeof error === "object" && error !== null && "message" in error
            ? String((error as { message: unknown }).message)
            : "";

  if (!rawMessage) return FALLBACK;

  const lower = rawMessage.toLowerCase();

  for (const { match, result } of PATTERNS) {
    if (lower.includes(match)) {
      return result;
    }
  }

  console.warn("[authErrors] Unmapped error:", rawMessage);
  return FALLBACK;
}
