// Fonte UNICA das regras de campo de perfil, consumida por:
//   - server/routes/me.ts        (o proprio usuario editando o seu perfil)
//   - server/routes/admin.ts     (o admin corrigindo o perfil de alguem)
//
// Existe porque as duas rotas gravam nas MESMAS colunas de public.profiles. Duas
// validacoes para o mesmo campo divergem na primeira mudanca, e o resultado e
// um limite que vale por um caminho e nao pelo outro. Esta base ja aceitou uma
// divergencia dessas de propósito (a regra do Pro, que vive na RPC e em
// TypeScript); a segunda nao foi aceita.
//
// LIMITE CONHECIDO, herdado e NAO corrigido aqui: name, bio, area_interesse,
// nivel_atual e objetivo nao tem limite de tamanho. Nunca tiveram, nem em
// me.ts. Este modulo EXTRAI o que existe, sem mudar comportamento de nenhuma
// das duas rotas; apertar isso muda o que /api/me aceita hoje e e decisao
// propria. Medido em 2026-07-29: o maior name tem 43 caracteres e os demais
// campos estao todos nulos, entao apertar depois nao invalidaria nada.

/** Limites de tamanho por campo. Campo ausente daqui nao tem limite. */
export const PROFILE_TEXT_LIMITS: Record<string, number> = {
  headline: 140,
  city: 80,
  uf: 40,
  career_goal: 240,
};

export const PROFILE_URL_FIELDS = [
  "github_url",
  "linkedin_url",
  "website_url",
] as const;

export const PROFILE_URL_MAX = 300;

/**
 * Campos que o DONO DA CONTA edita em PATCH /api/me.
 *
 * Mora aqui, e nao em server/routes/me.ts, para que o teste que compara as duas
 * allowlists nao precise importar uma ROTA. Importar a rota arrastava env,
 * supabaseAdmin e o JWKS, e o teste passava com `.env` e quebrava sem ele com
 * "TypeError: Invalid URL" — a condicao exata do CI, pega pelo pre-commit.
 * Modulo compartilhado nao depende de servidor; o servidor e que consome.
 */
export const EDITABLE_FIELDS = [
  "name",
  "handle",
  "avatar_border",
  "avatar_icon",
  "avatar_bg",
  "bio",
  "area_interesse",
  "nivel_atual",
  "objetivo",
  "onboarding_completed",
  "onboarding_step",
  "preferences",
  "gender",
  "headline",
  "city",
  "uf",
  "career_goal",
  "github_url",
  "linkedin_url",
  "website_url",
  "full_name",
  "cpf",
] as const;

/**
 * Campos de perfil que o ADMIN pode editar (Fatia 5a).
 *
 * Precisa ser SUBCONJUNTO de EDITABLE_FIELDS de server/routes/me.ts: o admin
 * nao escreve em coluna que o dono da conta nao escreve. O teste
 * shared/profileFields.test.ts afirma o conjunto DIFERENCA exato, entao
 * acrescentar campo em me.ts obriga uma decisao consciente sobre este lado em
 * vez de deixar os dois calados.
 */
export const ADMIN_EDITABLE_PROFILE_FIELDS = [
  "name",
  "full_name",
  "gender",
  "bio",
  "area_interesse",
  "nivel_atual",
  "objetivo",
  "headline",
  "city",
  "uf",
  "career_goal",
  "github_url",
  "linkedin_url",
  "website_url",
] as const;

export type AdminEditableProfileField =
  (typeof ADMIN_EDITABLE_PROFILE_FIELDS)[number];

/**
 * Campos que o usuario edita e o admin NAO. Cada exclusao com o motivo, e o
 * conjunto e afirmado por teste: se me.ts ganhar um campo, o teste cai e alguem
 * decide de que lado ele fica.
 */
export const ADMIN_EXCLUDED_PROFILE_FIELDS: Record<string, string> = {
  // Dado sensivel: leitura ja e auditada (POST /users/:id/reveal-cpf) e
  // escrever CPF de outra pessoa nao e correcao de cadastro, e falsificacao de
  // identidade fiscal.
  cpf: "dado sensível; só leitura auditada",
  // UNIQUE em profiles: colisao precisa de tratamento proprio (mensagem, 409,
  // sugestao). Fatia dele.
  handle: "UNIQUE; colisão precisa de tratamento próprio",
  // Preferencia visual do dono da conta, nao dado de cadastro.
  avatar_border: "preferência do usuário, não cadastro",
  avatar_icon: "preferência do usuário, não cadastro",
  avatar_bg: "preferência do usuário, não cadastro",
  // Estado de fluxo, nao dado. Mexer aqui reencena onboarding alheio.
  onboarding_completed: "estado de fluxo, não cadastro",
  onboarding_step: "estado de fluxo, não cadastro",
  // Blob opaco: sem schema, sem como validar.
  preferences: "blob sem schema",
};

/** Valida tipo e tamanho. null = valor valido. Mesma semantica de me.ts. */
export function validateProfileTextValue(
  field: string,
  value: unknown,
): { code: string; message: string } | null {
  if (value === null) return null;
  if (typeof value !== "string") {
    return {
      code: "invalid_request",
      message: `Valor inválido para ${field}.`,
    };
  }
  const max = PROFILE_TEXT_LIMITS[field];
  if (max !== undefined && value.length > max) {
    return {
      code: "invalid_request",
      message: `O campo ${field} excede o tamanho máximo.`,
    };
  }
  return null;
}

/**
 * Valida URL de perfil. Vazio e permitido (limpar o campo); preenchido precisa
 * comecar com http:// ou https://. Mesma regra de me.ts, byte a byte.
 */
export function validateProfileUrlValue(
  field: string,
  value: unknown,
): { code: string; message: string } | null {
  if (value === null) return null;
  if (typeof value !== "string") {
    return {
      code: "invalid_request",
      message: `Valor inválido para ${field}.`,
    };
  }
  if (value.length > PROFILE_URL_MAX) {
    return {
      code: "invalid_request",
      message: `O campo ${field} excede o tamanho máximo.`,
    };
  }
  if (value.trim() !== "" && !/^https?:\/\/.+/.test(value.trim())) {
    return {
      code: "invalid_request",
      message: `O campo ${field} deve ser uma URL http ou https.`,
    };
  }
  return null;
}

export function isProfileUrlField(field: string): boolean {
  return (PROFILE_URL_FIELDS as readonly string[]).includes(field);
}
