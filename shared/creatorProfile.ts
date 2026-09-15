import { isValidCnpj, isValidCpf, onlyDigits } from "./fiscalIdentity";
import { validateEmailForSending } from "./emailValidation";

// REGRAS DO PERFIL DE CREATOR (lote 08): o @ das redes, os seguidores
// declarados e a chave Pix de comissao. Fonte UNICA para o server, que valida e
// grava, e para o client, que mostra o mesmo erro antes de enviar. Vive em
// shared/ pelo mesmo motivo de fiscalIdentity.ts: duas copias da regra divergem
// na primeira mudanca.
//
// A CHAVE PIX INTEIRA NUNCA SAI DO SERVIDOR fora da revelacao auditada do
// admin. Quem mostra a chave mostra `mascararChavePix`; por isso a mascara
// mora aqui, junto da regra que normaliza, e cada tipo tem a sua.
//
// SEGUIDORES SAO DECLARADOS pelo creator: sem API das redes e sem OAuth. O
// numero vale o que a pessoa disse, na data em que disse, e o server grava essa
// data a cada seguidor informado.

export const REDES_DE_CREATOR = ["instagram", "tiktok"] as const;
export type RedeDeCreator = (typeof REDES_DE_CREATOR)[number];

export const TIPOS_DE_CHAVE_PIX = [
  "cpf",
  "cnpj",
  "email",
  "telefone",
  "aleatoria",
] as const;
export type TipoDeChavePix = (typeof TIPOS_DE_CHAVE_PIX)[number];

export function isTipoDeChavePix(valor: unknown): valor is TipoDeChavePix {
  return (
    typeof valor === "string" &&
    (TIPOS_DE_CHAVE_PIX as readonly string[]).includes(valor)
  );
}

/** Teto de seguidores aceito. Acima disso e erro de digitacao, nao perfil. */
export const SEGUIDORES_MAX = 100_000_000;

export type Resultado<T, C extends string> =
  | { ok: true; valor: T }
  | { ok: false; code: C };

/** A chave como o client a ve: tipo, mascara e quando mudou. */
export type CreatorPixMascarada = {
  tipo: TipoDeChavePix;
  mascarada: string;
  updated_at: string;
};

/** Resposta de GET e PUT /api/creator/profile, e o bloco do painel admin. */
export type CreatorPerfilDados = {
  instagram_handle: string | null;
  tiktok_handle: string | null;
  instagram_followers: number | null;
  tiktok_followers: number | null;
  followers_updated_at: string | null;
  visible_to_creators: boolean;
  pix: CreatorPixMascarada | null;
};

// Cada rede com a propria forma de @. O Instagram aceita ate 30 caracteres; o
// TikTok de 2 a 24. Os dois so letras, digitos, ponto e sublinhado, e o @ fica
// guardado sem o arroba e em minusculas, que e como as duas redes o resolvem.
const HANDLE_RE: Record<RedeDeCreator, RegExp> = {
  instagram: /^[a-z0-9._]{1,30}$/,
  tiktok: /^[a-z0-9._]{2,24}$/,
};

// Prefixo de URL que a pessoa cola no lugar do @. Com e sem protocolo, com e
// sem www. No TikTok o @ faz parte do caminho.
const PREFIXO_DE_URL: Record<RedeDeCreator, RegExp> = {
  instagram: /^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i,
  tiktok: /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@/i,
};

export type CodigoDeHandle =
  | "invalid_instagram_handle"
  | "invalid_tiktok_handle";

/**
 * @ da rede, normalizado: sem espacos, sem prefixo de URL, sem barra final, sem
 * o arroba inicial, em minusculas. Vazio (ou ausente) e `null`, que e "nao
 * informado", e nao erro.
 */
export function normalizarHandle(
  rede: RedeDeCreator,
  valor: unknown,
): Resultado<string | null, CodigoDeHandle> {
  const code: CodigoDeHandle = `invalid_${rede}_handle`;
  if (valor === null || valor === undefined) return { ok: true, valor: null };
  if (typeof valor !== "string") return { ok: false, code };
  let handle = valor.trim();
  if (handle === "") return { ok: true, valor: null };
  handle = handle.replace(PREFIXO_DE_URL[rede], "");
  handle = handle.replace(/\/+$/, "");
  handle = handle.replace(/^@/, "");
  handle = handle.toLowerCase();
  if (!HANDLE_RE[rede].test(handle)) return { ok: false, code };
  return { ok: true, valor: handle };
}

export type CodigoDeSeguidores =
  | "invalid_instagram_followers"
  | "invalid_tiktok_followers";

/**
 * Seguidores declarados: inteiro de 0 a `SEGUIDORES_MAX`, ou `null`. Texto e
 * recusado mesmo que pareca numero: o client manda numero, e aceitar "1.200"
 * aqui obrigaria a adivinhar se o ponto e milhar ou decimal.
 */
export function normalizarSeguidores(
  rede: RedeDeCreator,
  valor: unknown,
): Resultado<number | null, CodigoDeSeguidores> {
  const code: CodigoDeSeguidores = `invalid_${rede}_followers`;
  if (valor === null || valor === undefined) return { ok: true, valor: null };
  if (
    typeof valor !== "number" ||
    !Number.isInteger(valor) ||
    valor < 0 ||
    valor > SEGUIDORES_MAX
  ) {
    return { ok: false, code };
  }
  return { ok: true, valor };
}

export type CodigoDeChavePix =
  | "invalid_pix_type"
  | "invalid_pix_cpf"
  | "invalid_pix_cnpj"
  | "invalid_pix_email"
  | "invalid_pix_telefone"
  | "invalid_pix_aleatoria";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Telefone nacional (DDD mais numero, 10 ou 11 digitos) a partir do que foi
 * digitado, com ou sem +55. A distincao e pelo TAMANHO, e nao por "comeca com
 * 55": 55 e DDD valido (Rio Grande do Sul), e "55 99123-4567" sem codigo de
 * pais tem 11 digitos, enquanto qualquer numero com +55 tem 12 ou 13.
 */
function telefoneNacional(valor: string): string | null {
  const digitos = onlyDigits(valor);
  const nacional =
    (digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")
      ? digitos.slice(2)
      : digitos;
  if (nacional.length !== 10 && nacional.length !== 11) return null;
  // DDD sem zero em nenhum dos dois digitos; celular (11 digitos) comeca com 9.
  if (!/^[1-9]{2}/.test(nacional)) return null;
  if (nacional.length === 11 && nacional[2] !== "9") return null;
  return nacional;
}

/**
 * Chave Pix normalizada para gravar. CPF e CNPJ so digitos e com digito
 * verificador; e-mail em minusculas e entregavel; telefone como +55 mais DDD e
 * numero; aleatoria como UUID em minusculas. Fora disso, erro com um codigo por
 * tipo, que e o que o client mostra embaixo do campo.
 */
export function normalizarChavePix(
  tipo: unknown,
  valor: unknown,
): Resultado<{ tipo: TipoDeChavePix; valor: string }, CodigoDeChavePix> {
  if (!isTipoDeChavePix(tipo)) return { ok: false, code: "invalid_pix_type" };
  const code: CodigoDeChavePix = `invalid_pix_${tipo}`;
  if (typeof valor !== "string") return { ok: false, code };

  switch (tipo) {
    case "cpf": {
      const digitos = onlyDigits(valor);
      if (digitos.length !== 11 || !isValidCpf(digitos)) {
        return { ok: false, code };
      }
      return { ok: true, valor: { tipo, valor: digitos } };
    }
    case "cnpj": {
      const digitos = onlyDigits(valor);
      if (digitos.length !== 14 || !isValidCnpj(digitos)) {
        return { ok: false, code };
      }
      return { ok: true, valor: { tipo, valor: digitos } };
    }
    case "email": {
      const email = valor.trim().toLowerCase();
      if (!validateEmailForSending(email).ok) return { ok: false, code };
      return { ok: true, valor: { tipo, valor: email } };
    }
    case "telefone": {
      const nacional = telefoneNacional(valor);
      if (!nacional) return { ok: false, code };
      return { ok: true, valor: { tipo, valor: `+55${nacional}` } };
    }
    case "aleatoria": {
      const chave = valor.trim().toLowerCase();
      if (!UUID_RE.test(chave)) return { ok: false, code };
      return { ok: true, valor: { tipo, valor: chave } };
    }
  }
}

/**
 * Mascara de uma chave JA NORMALIZADA (a que esta gravada). Mostra o bastante
 * para a pessoa reconhecer a propria chave e nada que a reconstrua: o terceiro
 * bloco do CPF, o bloco da filial do CNPJ, as duas primeiras letras e o
 * dominio do e-mail, o DDD e os quatro ultimos digitos do telefone, e os oito
 * primeiros caracteres da aleatoria.
 */
export function mascararChavePix(tipo: TipoDeChavePix, valor: string): string {
  switch (tipo) {
    case "cpf":
      return `***.***.${valor.slice(6, 9)}-**`;
    case "cnpj":
      return `**.***.***/${valor.slice(8, 12)}-**`;
    case "email": {
      const arroba = valor.lastIndexOf("@");
      return `${valor.slice(0, Math.min(2, arroba))}***${valor.slice(arroba)}`;
    }
    case "telefone": {
      const nacional = valor.replace(/^\+55/, "");
      return `+55 (${nacional.slice(0, 2)}) *****-${nacional.slice(-4)}`;
    }
    case "aleatoria":
      return `${valor.slice(0, 8)}-****-...`;
  }
}
