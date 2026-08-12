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
// Os limites valem para as DUAS rotas. Apertar aqui muda o que /api/me aceita
// para todo usuario, entao qualquer teto novo precisa ser calibrado contra o
// dado existente antes de entrar.

/**
 * Limites de tamanho por campo. Campo ausente daqui nao tem limite.
 *
 * Os quatro primeiros sao os originais. Os cinco seguintes (name, bio,
 * area_interesse, nivel_atual, objetivo) foram acrescentados em 2026-07-30:
 * nunca tiveram limite nenhum, em nenhuma das duas rotas. Tetos GENEROSOS,
 * calibrados para nao invalidar nada existente (medido: maior `name` = 43
 * caracteres; os outros quatro estao 100% nulos em producao). Vale tambem para
 * PATCH /api/me, ou seja, para todo usuario.
 */
export const PROFILE_TEXT_LIMITS: Record<string, number> = {
  headline: 140,
  city: 80,
  uf: 40,
  career_goal: 240,
  name: 120,
  bio: 2000,
  area_interesse: 120,
  nivel_atual: 120,
  objetivo: 500,
  // handle e UNIQUE em profiles e nao e editavel pelo admin, mas o limite vale
  // para /api/me. 60 e generoso para um slug de perfil.
  handle: 60,
  // Campos fiscais (Fase 2 da NFS-e). Os limites aqui sao a checagem de TIPO e
  // de tamanho; a validacao de CONTEUDO (digito verificador, UF da lista
  // fechada, CEP) vive em shared/fiscalIdentity.ts e roda em me.ts. Ambas
  // valem: esta impede blob no corpo, aquela impede dado que a prefeitura
  // rejeitaria.
  razao_social: 200,
  endereco_cep: 20,
  endereco_logradouro: 200,
  endereco_numero: 20,
  endereco_complemento: 120,
  endereco_bairro: 120,
  endereco_cidade: 120,
  // 2 caracteres: a lista de UF e fechada e isValidUf recusa qualquer coisa
  // fora dela. NAO confundir com `uf` (limite 40), que e o campo livre do
  // perfil publico e existe desde antes.
  endereco_uf: 2,
  // Codigo IBGE tem 7 digitos; 10 da folga sem virar campo livre.
  endereco_codigo_municipio: 10,
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
  // Identidade fiscal (Fase 2 da NFS-e). Todos escritos pelo DONO da conta, via
  // a FiscalDataModal ou a secao de dados fiscais do perfil.
  "cnpj",
  "razao_social",
  "fiscal_documento_preferencia",
  "endereco_cep",
  "endereco_logradouro",
  "endereco_numero",
  "endereco_complemento",
  "endereco_bairro",
  "endereco_cidade",
  "endereco_uf",
  "endereco_codigo_municipio",
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
  // Os doze campos fiscais abaixo saem da MESMA regra do cpf, e a regra e uma
  // so: o conjunto deles compoe a identidade que vai impressa numa NOTA FISCAL.
  // Corrigir o bairro de outra pessoa nao parece grave isolado, mas o endereco
  // do tomador e parte do documento, e um admin alterando qualquer peca dele
  // altera o que foi declarado ao municipio. Quem corrige e o titular; o admin,
  // se precisar, pede. Nao ha caso de suporte que exija escrever isto.
  cnpj: "dado sensível; identidade fiscal, só o titular escreve",
  razao_social: "compõe a nota fiscal; só o titular escreve",
  fiscal_documento_preferencia: "decide o documento da nota; só o titular",
  endereco_cep: "endereço do tomador na nota fiscal; só o titular",
  endereco_logradouro: "endereço do tomador na nota fiscal; só o titular",
  endereco_numero: "endereço do tomador na nota fiscal; só o titular",
  endereco_complemento: "endereço do tomador na nota fiscal; só o titular",
  endereco_bairro: "endereço do tomador na nota fiscal; só o titular",
  endereco_cidade: "endereço do tomador na nota fiscal; só o titular",
  endereco_uf: "endereço do tomador na nota fiscal; só o titular",
  endereco_codigo_municipio: "derivado do CEP; só o titular",
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
