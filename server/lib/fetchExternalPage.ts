import dns from "node:dns/promises";
import net from "node:net";

import { fetchWithTimeout, isUpstreamTimeoutError } from "./http";

/**
 * Fetch de pagina EXTERNA com URL arbitraria (ex.: anuncio de vaga colado pelo
 * usuario) e extracao de texto. Diferente dos outros fetches de saida do server
 * (todos com destino fixo), aqui o destino vem do usuario, entao o helper e
 * fail-closed em tudo:
 *  - so https; hostname resolvido via DNS ANTES do fetch e bloqueado se
 *    QUALQUER endereco cair em faixa privada/reservada (anti-SSRF);
 *  - redirect manual com no maximo 3 saltos, revalidando esquema e DNS a cada
 *    salto (um Location nao pode escapar do guard);
 *  - corpo lido em chunks com cap de 2MB DURANTE a leitura (nao le tudo pra
 *    checar depois, ao contrario do precedente de avatarUpload);
 *  - so text/html ou text/plain; texto util minimo de 300 chars e corte final
 *    em 15_000 chars.
 * Sem dependencia nova: extracao de texto via regex/string nativos (v1).
 */

export type JobFetchErrorCode =
  | "invalid_url"
  | "blocked_host"
  | "timeout"
  | "http_error"
  | "bad_content_type"
  | "too_large"
  | "too_little_text";

export class JobFetchError extends Error {
  readonly code: JobFetchErrorCode;

  constructor(code: JobFetchErrorCode, message: string) {
    super(message);
    this.name = "JobFetchError";
    this.code = code;
  }
}

const FETCH_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_TEXT_CHARS = 15_000;
const MIN_TEXT_CHARS = 300;

function ipv4Parts(addr: string): number[] | null {
  const parts = addr.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  return nums.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)
    ? nums
    : null;
}

function isPrivateIpv4(addr: string): boolean {
  const parts = ipv4Parts(addr);
  // Nao parseou como IPv4 valido: bloqueia (fail-closed).
  if (!parts) return true;
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10/8
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64/10 (CGNAT)
  if (a === 127) return true; // 127/8
  if (a === 169 && b === 254) return true; // 169.254/16 (link-local)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
  if (a === 192 && b === 168) return true; // 192.168/16
  return false;
}

function isPrivateIpv6(addr: string): boolean {
  const lower = addr.toLowerCase();
  // Nao especificado e loopback.
  if (lower === "::" || lower === "::1" || lower === "0:0:0:0:0:0:0:1") {
    return true;
  }
  // IPv4 mapeado (::ffff:a.b.c.d): decide pela parte IPv4.
  const mapped = lower.match(/:ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  const firstGroupRaw = lower.startsWith("::") ? "0" : lower.split(":")[0];
  const firstGroup = Number.parseInt(firstGroupRaw, 16);
  // Primeiro grupo ilegivel: bloqueia (fail-closed).
  if (!Number.isInteger(firstGroup)) return true;
  if (firstGroup >= 0xfc00 && firstGroup <= 0xfdff) return true; // fc00::/7 (ULA)
  if (firstGroup >= 0xfe80 && firstGroup <= 0xfebf) return true; // fe80::/10 (link-local)
  return false;
}

function isBlockedAddress(addr: string): boolean {
  const version = net.isIP(addr);
  if (version === 4) return isPrivateIpv4(addr);
  if (version === 6) return isPrivateIpv6(addr);
  // Nao e IP reconhecivel: bloqueia (fail-closed).
  return true;
}

// URL.hostname devolve IPv6 literal entre colchetes; o dns/net esperam sem.
function stripBrackets(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, "");
}

async function assertHostAllowed(hostnameRaw: string): Promise<void> {
  const hostname = stripBrackets(hostnameRaw.toLowerCase());

  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new JobFetchError("blocked_host", "Host bloqueado.");
  }

  // Hostname ja e um IP literal: decide direto, sem DNS.
  if (net.isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      throw new JobFetchError("blocked_host", "Host bloqueado.");
    }
    return;
  }

  let addresses: Array<{ address: string }>;
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    // DNS que nao resolve nao permite validar destino: bloqueia (fail-closed).
    throw new JobFetchError(
      "blocked_host",
      "Nao foi possivel resolver o host da URL.",
    );
  }

  if (!addresses.length) {
    throw new JobFetchError("blocked_host", "Host sem endereco resolvido.");
  }

  for (const entry of addresses) {
    if (isBlockedAddress(entry.address)) {
      throw new JobFetchError("blocked_host", "Host bloqueado.");
    }
  }
}

function parseHttpsUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new JobFetchError("invalid_url", "URL invalida.");
  }
  if (parsed.protocol !== "https:") {
    throw new JobFetchError("invalid_url", "So URLs https sao aceitas.");
  }
  return parsed;
}

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_m, dec: string) => {
      const code = Number.parseInt(dec, 10);
      return Number.isInteger(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : " ";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isInteger(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : " ";
    })
    .replace(/&amp;/gi, "&");
}

function extractText(raw: string, isPlainText: boolean): string {
  if (isPlainText) {
    return raw.replace(/\s+/g, " ").trim();
  }
  let text = raw;
  text = text.replace(/<script\b[\s\S]*?<\/script\s*>/gi, " ");
  text = text.replace(/<style\b[\s\S]*?<\/style\s*>/gi, " ");
  text = text.replace(/<noscript\b[\s\S]*?<\/noscript\s*>/gi, " ");
  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  text = text.replace(/<[^>]+>/g, " ");
  text = decodeBasicEntities(text);
  return text.replace(/\s+/g, " ").trim();
}

async function fetchWithManualRedirects(
  initialUrl: URL,
): Promise<globalThis.Response> {
  let url = initialUrl;
  let redirects = 0;

  for (;;) {
    await assertHostAllowed(url.hostname);

    let response: globalThis.Response;
    try {
      response = await fetchWithTimeout(
        url.toString(),
        {
          redirect: "manual",
          headers: {
            accept: "text/html, text/plain;q=0.9",
            "user-agent": "BoraNaTechBot/1.0 (+https://boranatech.com.br)",
          },
        },
        { service: "job-page", timeoutMs: FETCH_TIMEOUT_MS },
      );
    } catch (err) {
      if (isUpstreamTimeoutError(err)) {
        throw new JobFetchError("timeout", "A pagina demorou pra responder.");
      }
      throw new JobFetchError("http_error", "Falha ao buscar a pagina.");
    }

    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel().catch(() => undefined);
      if (redirects >= MAX_REDIRECTS) {
        throw new JobFetchError("http_error", "Redirecionamentos demais.");
      }
      const location = response.headers.get("location");
      if (!location) {
        throw new JobFetchError("http_error", "Redirect sem destino.");
      }
      let next: URL;
      try {
        next = new URL(location, url);
      } catch {
        throw new JobFetchError("invalid_url", "Redirect com URL invalida.");
      }
      if (next.protocol !== "https:") {
        throw new JobFetchError(
          "invalid_url",
          "Redirect saiu de https, bloqueado.",
        );
      }
      url = next;
      redirects += 1;
      continue;
    }

    return response;
  }
}

async function readBodyCapped(response: globalThis.Response): Promise<string> {
  const body = response.body;
  if (!body) {
    throw new JobFetchError("http_error", "Resposta sem corpo.");
  }

  const reader = body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;

  for (;;) {
    let step: Awaited<ReturnType<typeof reader.read>>;
    try {
      step = await reader.read();
    } catch (err) {
      // Abort do timer do fetchWithTimeout durante a leitura do corpo.
      if (err instanceof Error && err.name === "AbortError") {
        throw new JobFetchError("timeout", "A pagina demorou pra responder.");
      }
      throw new JobFetchError("http_error", "Falha ao ler a pagina.");
    }

    if (step.done) break;
    if (!step.value) continue;

    total += step.value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new JobFetchError("too_large", "A pagina passa de 2MB.");
    }
    chunks.push(Buffer.from(step.value));
  }

  return Buffer.concat(chunks).toString("utf8");
}

export async function fetchExternalPageText(rawUrl: string): Promise<string> {
  const url = parseHttpsUrl(rawUrl);
  const response = await fetchWithManualRedirects(url);

  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new JobFetchError(
      "http_error",
      `A pagina respondeu ${response.status}.`,
    );
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const isPlainText = contentType.includes("text/plain");
  if (!contentType.includes("text/html") && !isPlainText) {
    await response.body?.cancel().catch(() => undefined);
    throw new JobFetchError(
      "bad_content_type",
      "A URL nao aponta pra uma pagina de texto.",
    );
  }

  const raw = await readBodyCapped(response);
  const text = extractText(raw, isPlainText);

  if (text.length < MIN_TEXT_CHARS) {
    throw new JobFetchError(
      "too_little_text",
      "A pagina tem pouco texto util pra analisar.",
    );
  }

  return text.slice(0, MAX_TEXT_CHARS);
}
