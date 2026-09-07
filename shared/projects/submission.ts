import { detectGithubTarget } from "../github/detect";
import type { ProjetoTipoEntrega } from "./v2/types";

// Entrega de projeto (lote 04): o que a pessoa manda ao terminar.
//
// A validacao vive aqui, compartilhada, porque o formulario do client e a rota
// do server precisam concordar sobre o que e uma entrega valida. Regra
// duplicada nos dois lados divergiria no primeiro campo novo.

export type SubmissionRetro = { maisDificil?: string };

export type SubmissionInput = {
  deployUrl?: string;
  repoUrl?: string;
  artifactUrl?: string;
  retro?: SubmissionRetro;
  isPublic?: boolean;
};

export type ParseSubmissionResult =
  | {
      ok: true;
      value: Required<Pick<SubmissionInput, "isPublic">> & SubmissionInput;
    }
  | { ok: false; reason: string };

const MAX_URL = 500;
const MAX_RETRO = 500;

/** Campos de link exigidos por tipo de entrega. */
export const CAMPOS_POR_TIPO: Record<
  ProjetoTipoEntrega,
  Array<"deployUrl" | "repoUrl" | "artifactUrl">
> = {
  repo_deploy: ["deployUrl", "repoUrl"],
  repo: ["repoUrl"],
  figma: ["artifactUrl"],
  notebook: ["artifactUrl"],
  documento: ["artifactUrl"],
  dashboard: ["artifactUrl"],
};

const ROTULO: Record<"deployUrl" | "repoUrl" | "artifactUrl", string> = {
  deployUrl: "link do site no ar",
  repoUrl: "link do repositorio",
  artifactUrl: "link do arquivo",
};

function validarUrl(
  bruto: unknown,
  rotulo: string,
): { ok: true; value: string } | { ok: false; reason: string } {
  if (typeof bruto !== "string" || bruto.trim() === "")
    return { ok: false, reason: `Informe o ${rotulo}.` };
  const valor = bruto.trim();
  if (valor.length > MAX_URL)
    return { ok: false, reason: `O ${rotulo} passa de ${MAX_URL} caracteres.` };
  let url: URL;
  try {
    url = new URL(valor);
  } catch {
    return { ok: false, reason: `O ${rotulo} nao e uma URL valida.` };
  }
  if (url.protocol !== "https:")
    return { ok: false, reason: `O ${rotulo} precisa comecar com https.` };
  // Credencial na URL (https://user:senha@host) nunca entra: vira dado
  // guardado no banco e vazado em qualquer log ou tela que mostre o link.
  if (url.username !== "" || url.password !== "")
    return { ok: false, reason: `O ${rotulo} nao pode ter usuario e senha.` };
  return { ok: true, value: valor };
}

/**
 * Valida a entrega contra o tipo de entrega do modulo v2.
 *
 * Fail closed: campo exigido que falta e erro, e nao "grava sem ele". Uma
 * entrega pela metade e pior que nenhuma, porque o estado da pagina passa a
 * dizer "entregue" sobre algo que ninguem consegue abrir.
 */
export function parseSubmissionInput(
  input: unknown,
  tipoEntrega: ProjetoTipoEntrega,
): ParseSubmissionResult {
  if (input === null || typeof input !== "object" || Array.isArray(input))
    return { ok: false, reason: "Corpo da entrega invalido." };
  const bruto = input as Record<string, unknown>;

  const exigidos = CAMPOS_POR_TIPO[tipoEntrega];
  if (!exigidos)
    return {
      ok: false,
      reason: `Tipo de entrega desconhecido: ${tipoEntrega}.`,
    };

  const value: SubmissionInput & { isPublic: boolean } = { isPublic: false };

  for (const campo of exigidos) {
    const r = validarUrl(bruto[campo], ROTULO[campo]);
    if (!r.ok) return r;
    value[campo] = r.value;
  }

  if (value.repoUrl && !parseRepoOuNulo(value.repoUrl))
    return {
      ok: false,
      reason:
        "O link do repositorio precisa ser github.com/usuario/repositorio.",
    };

  if (bruto.retro !== undefined) {
    if (
      bruto.retro === null ||
      typeof bruto.retro !== "object" ||
      Array.isArray(bruto.retro)
    )
      return { ok: false, reason: "retro deve ser um objeto." };
    const maisDificil = (bruto.retro as Record<string, unknown>).maisDificil;
    if (maisDificil !== undefined) {
      if (typeof maisDificil !== "string")
        return { ok: false, reason: "retro.maisDificil deve ser texto." };
      if (maisDificil.length > MAX_RETRO)
        return {
          ok: false,
          reason: `A resposta passa de ${MAX_RETRO} caracteres.`,
        };
      value.retro = { maisDificil: maisDificil.trim() };
    }
  }

  if (bruto.isPublic !== undefined) {
    if (typeof bruto.isPublic !== "boolean")
      return { ok: false, reason: "isPublic deve ser booleano." };
    value.isPublic = bruto.isPublic;
  }

  return { ok: true, value };
}

function parseRepoOuNulo(url: string): { owner: string; repo: string } | null {
  const alvo = detectGithubTarget(url);
  return alvo.kind === "repo" ? { owner: alvo.owner, repo: alvo.repo } : null;
}

// Sem 0, O, 1 e I: o codigo e lido em voz alta e digitado a mao.
const ALFABETO = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Codigo publico da entrega, no formato BNT-XXXX-XXXX.
 *
 * `random` entra por parametro para o teste poder fixar a saida sem mockar o
 * modulo inteiro.
 */
export function gerarPublicCode(random: () => number = Math.random): string {
  const bloco = () =>
    Array.from(
      { length: 4 },
      () => ALFABETO[Math.floor(random() * ALFABETO.length)],
    ).join("");
  return `BNT-${bloco()}-${bloco()}`;
}
