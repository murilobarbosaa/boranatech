// Cliente HTTP da Focus NFe, compartilhado pelos adapters municipal (/v2/nfse) e
// nacional (/v2/nfsen).
//
// Ele NAO conhece nota fiscal: sabe autenticar, montar URL, aplicar timeout e
// CLASSIFICAR a falha. Essa ultima parte e a que justifica o arquivo existir: a
// diferenca entre "tenta de novo" e "para de tentar" e uma decisao de
// transporte (o que o HTTP disse), nao de negocio, e escreve-la uma vez por
// adapter seria escrever duas vezes a mesma regra.
//
// Contrato conferido em https://doc.focusnfe.com.br/reference/ambiente e
// https://doc.focusnfe.com.br/reference/emitir_nfse (2026-08-04):
//   - Basic Auth com o TOKEN como usuario e senha VAZIA;
//   - homologacao: https://homologacao.focusnfe.com.br
//   - producao:    https://api.focusnfe.com.br
//   - prefixo /v2 em ambos.

import { env } from "../lib/env";

const TIMEOUT_MS = 20_000;

const BASE_URLS: Record<"homologacao" | "producao", string> = {
  homologacao: "https://homologacao.focusnfe.com.br",
  producao: "https://api.focusnfe.com.br",
};

export function focusBaseUrl(): string {
  return BASE_URLS[env.nfseFocusEnv];
}

/**
 * Resolve um caminho devolvido pela Focus contra a base do ambiente.
 *
 * A API devolve os documentos como CAMINHO RELATIVO ao host dela
 * (`/arquivos_development/.../nota.xml`), nao como URL absoluta. Concatenar sem
 * pensar produziria uma URL invalida no dia em que ela passar a devolver
 * absoluta, entao o caso absoluto e detectado e devolvido intacto.
 */
export function resolveFocusUrl(
  caminho: string | null | undefined,
): string | undefined {
  const valor = (caminho ?? "").trim();
  if (!valor) return undefined;
  if (/^https?:\/\//i.test(valor)) return valor;
  return `${focusBaseUrl()}${valor.startsWith("/") ? "" : "/"}${valor}`;
}

/** Resposta bruta, ja com o corpo lido. */
export type FocusResponse = {
  status: number;
  /** Corpo JSON, ou null quando a resposta nao era JSON. */
  body: Record<string, unknown> | null;
  /** Texto cru, para a mensagem de erro quando o corpo nao e JSON. */
  raw: string;
};

/**
 * Falha de TRANSPORTE (rede, timeout, 5xx), ja classificada como retentavel.
 *
 * Existe como classe propria para o adapter distinguir, num `catch`, "a Focus
 * respondeu que o dado esta errado" de "nao consegui falar com a Focus". As
 * duas viram `failed` para o usuario, mas so a segunda merece as 12 tentativas.
 */
export class FocusTransportError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "FocusTransportError";
    this.code = code;
  }
}

/**
 * Observador OPT-IN das chamadas a Focus, para o script de homologacao.
 *
 * Existe porque a pergunta da homologacao e "o que exatamente foi enviado e o
 * que exatamente voltou", e reconstruir isso do lado de fora seria imprimir uma
 * SUPOSICAO do payload em vez do payload. `null` por padrao: em producao nao ha
 * observador, nao ha custo e nao ha log de corpo de requisicao fiscal.
 *
 * NAO recebe o header Authorization de proposito: o token nao passa por aqui,
 * entao nao ha como um observador vaza-lo em log.
 */
export type FocusObserver = (evento: {
  method: string;
  path: string;
  requestBody: unknown;
  status: number;
  responseBody: unknown;
  raw: string;
}) => void;

let focusObserver: FocusObserver | null = null;

export function setFocusObserver(fn: FocusObserver | null): void {
  focusObserver = fn;
}

function authHeader(): string {
  // Basic com token como usuario e senha vazia: o ":" no fim NAO e enfeite, e o
  // separador usuario:senha exigido pelo esquema.
  return `Basic ${Buffer.from(`${env.nfseFocusToken}:`).toString("base64")}`;
}

export async function focusRequest(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown,
): Promise<FocusResponse> {
  const url = `${focusBaseUrl()}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: authHeader(),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    // Rede, DNS, timeout: nada chegou na Focus, entao repetir e legitimo e nao
    // corre risco de duplicar (a idempotencia por `ref` cobre o caso em que
    // chegou e a resposta se perdeu).
    throw new FocusTransportError(
      "focus_unreachable",
      `Falha de comunicacao com a Focus (${method} ${path}): ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  const raw = await response.text();
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    parsed = null;
  }

  // ANTES do 5xx: um 500 tambem precisa aparecer no observador da homologacao,
  // e ele nao chegaria se a notificacao viesse depois do throw.
  if (focusObserver) {
    try {
      focusObserver({
        method,
        path,
        requestBody: body,
        status: response.status,
        responseBody: parsed,
        raw,
      });
    } catch (observerErr) {
      // Observador quebrado nao pode derrubar emissao fiscal.
      console.warn("[focus] observador falhou:", observerErr);
    }
  }

  // 5xx e 429 sao do lado deles: retentavel. Levantados aqui, e nao devolvidos,
  // para que nenhum adapter esqueca de checar e trate um 500 como se fosse
  // resposta de negocio.
  if (response.status >= 500 || response.status === 429) {
    throw new FocusTransportError(
      "focus_unavailable",
      `Focus indisponivel (HTTP ${response.status} em ${method} ${path}): ${raw.slice(0, 300)}`,
    );
  }

  return { status: response.status, body: parsed, raw };
}

/**
 * Baixa um documento (PDF/XML) da Focus.
 *
 * Usa a MESMA autenticacao das chamadas de API: os caminhos devolvidos apontam
 * para o host autenticado, e um GET sem o header volta HTML de login em vez do
 * arquivo, que seria salvo no storage como se fosse a nota.
 */
export async function focusDownload(url: string): Promise<Buffer> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: authHeader() },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new FocusTransportError(
      "focus_download_unreachable",
      `Falha ao baixar documento (${url}): ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
  if (!response.ok) {
    throw new FocusTransportError(
      "focus_download_failed",
      `Download do documento falhou (HTTP ${response.status} em ${url}).`,
    );
  }
  return Buffer.from(await response.arrayBuffer());
}
