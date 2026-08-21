import { GENDER_VALUES } from "../../shared/gender";
import {
  ADMIN_EDITABLE_PROFILE_FIELDS,
  isProfileUrlField,
  validateProfileTextValue,
  validateProfileUrlValue,
} from "../../shared/profileFields";

// Monta o UPDATE de perfil feito pelo admin: allowlist, validacao e diff.
//
// Puro de propósito (sem Supabase, sem Express): a decisao de o que grava, o
// que recusa e o que nem toca no banco e o coracao da rota, e e testavel sem
// nada em volta.

const GENDER_SET = new Set<string>(GENDER_VALUES);

const CAMPOS_PERMITIDOS = new Set<string>(ADMIN_EDITABLE_PROFILE_FIELDS);

export type ProfileValues = Record<string, unknown>;

export type PatchError = { code: string; message: string; field?: string };

export type PatchResult =
  | {
      ok: true;
      /** So os campos que REALMENTE mudam. Vazio = nao ha o que gravar. */
      changes: Record<string, string | null>;
      hasChanges: boolean;
      /** Valor anterior dos campos que mudam, para o audit. */
      before: Record<string, unknown>;
      /** Valor novo dos mesmos campos. */
      after: Record<string, string | null>;
    }
  | { ok: false; error: PatchError };

/**
 * Normaliza para comparacao E para gravacao: string vazia vira null.
 *
 * O formulario devolve "" para campo nao preenchido e o banco guarda null. Sem
 * isto, abrir o modal e salvar sem tocar em nada gravaria todos os campos
 * vazios e uma auditoria inteira sobre nada.
 */
function normalizar(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function buildProfilePatch(
  atual: ProfileValues,
  body: Record<string, unknown>,
): PatchResult {
  // ALLOWLIST por conjunto fixo, NUNCA iterando as chaves recebidas nem
  // fazendo spread do body: um campo novo no corpo tem que ser recusado, nao
  // aceito por descuido.
  for (const chave of Object.keys(body)) {
    if (!CAMPOS_PERMITIDOS.has(chave)) {
      // Recusa EXPLICITA em vez de descarte silencioso: descartar calado faria
      // a UI receber 200 sem ter salvo, e o proximo a mexer no formulario
      // procuraria o bug no lugar errado.
      return {
        ok: false,
        error: {
          code: "invalid_field",
          message: `O campo ${chave} não pode ser editado por aqui.`,
          field: chave,
        },
      };
    }
  }

  const changes: Record<string, string | null> = {};
  const before: Record<string, unknown> = {};
  const after: Record<string, string | null> = {};

  for (const campo of ADMIN_EDITABLE_PROFILE_FIELDS) {
    if (!(campo in body)) continue;
    const bruto = body[campo];

    if (campo === "gender") {
      if (
        bruto !== null &&
        (typeof bruto !== "string" || !GENDER_SET.has(bruto))
      ) {
        return {
          ok: false,
          error: {
            code: "invalid_gender",
            message: "Valor inválido para gender.",
            field: "gender",
          },
        };
      }
    } else {
      const erro = isProfileUrlField(campo)
        ? validateProfileUrlValue(campo, bruto)
        : validateProfileTextValue(campo, bruto);
      if (erro) return { ok: false, error: { ...erro, field: campo } };
    }

    const novo = normalizar(bruto);
    const antigo = normalizar(atual[campo]);
    if (novo === antigo) continue;

    changes[campo] = novo;
    before[campo] = atual[campo] ?? null;
    after[campo] = novo;
  }

  return {
    ok: true,
    changes,
    hasChanges: Object.keys(changes).length > 0,
    before,
    after,
  };
}
