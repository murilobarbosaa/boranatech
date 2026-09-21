import { useEffect, useState } from "react";

import { AdminApiError, contentFetch } from "@/lib/adminApi";
import { apiUrl } from "@/lib/api";

export const AFFILIATE_STORAGE_KEY = "bora-na-tech:affiliate";

export type StoredAffiliate = {
  code: string;
  discount_percent: number;
  expires: number;
};

// Mesmo padrao do servidor (server/routes/affiliates.ts, CODE_PATTERN) e do
// campo de cupom: formato obviamente invalido nem vai a API.
const AFFILIATE_CODE_PATTERN = /^[A-Z0-9]{3,32}$/;

const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

// VARIAS INSTANCIAS DO HOOK vivem ao mesmo tempo (o AffiliateTracker do App,
// o Checkout e o Cadastro), cada uma com o proprio useState. Quando o codigo
// entra por um lugar que nao e a URL (o campo de cupom do checkout, lote 11b),
// as outras instancias precisam saber, senao o banner do checkout nao acorda.
// O aviso e um conjunto de ouvintes do modulo: gravar no localStorage e
// notificar, e cada instancia rele o storage.
const ouvintes = new Set<() => void>();

function notificar() {
  ouvintes.forEach((ouvinte) => ouvinte());
}

export function clearStoredAffiliate() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AFFILIATE_STORAGE_KEY);
  notificar();
}

function readStoredAffiliate(): StoredAffiliate | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(AFFILIATE_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as StoredAffiliate;
    if (!parsed.code || parsed.expires <= Date.now()) {
      window.localStorage.removeItem(AFFILIATE_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function storeAffiliate(affiliate: StoredAffiliate) {
  try {
    window.localStorage.setItem(
      AFFILIATE_STORAGE_KEY,
      JSON.stringify(affiliate),
    );
  } catch {
    // localStorage indisponivel: o codigo vale so nesta pagina.
  }
  notificar();
}

/**
 * Valida um codigo de afiliado na API publica. `null` e codigo invalido ou
 * inativo (a rota responde `valid: false` sem distinguir, de proposito); erro
 * de REDE lanca, para quem chama decidir.
 */
async function fetchAffiliate(code: string): Promise<StoredAffiliate | null> {
  const res = await fetch(
    apiUrl(`/api/affiliates/${encodeURIComponent(code)}`),
  );
  const json = (await res.json()) as {
    valid?: boolean;
    code?: string;
    discount_percent?: number;
  };
  if (!json.valid || !json.code) return null;
  return {
    code: json.code,
    discount_percent: Number(json.discount_percent || 0),
    expires: Date.now() + SETE_DIAS_MS,
  };
}

/**
 * Registra o clique no link do afiliado. Fire-and-forget: o caminho vai na
 * query string, e nao num corpo JSON, porque POST entre origens com
 * Content-Type JSON dispara preflight de CORS, e o simples continua simples.
 * O servidor grava o caminho no evento de clique.
 */
function registrarClique(code: string): Promise<unknown> {
  return fetch(
    apiUrl(
      `/api/affiliates/${encodeURIComponent(code)}/click?path=${encodeURIComponent(window.location.pathname)}`,
    ),
    { method: "POST" },
  );
}

// UMA CAPTURA POR PAGINA, UM CLIQUE POR SESSAO (lote 11g). Ate aqui a captura
// de `?ref=`/`?cupom=` vivia no efeito de CADA instancia do hook, e o hook vive
// em tres lugares (AffiliateTracker, Checkout, Cadastro): o mesmo clique era
// registrado ate tres vezes, e cada recarga registrava de novo. E por isso que
// o contador `affiliates.clicks` anterior a este lote pode estar INFLADO; a
// serie diaria (`creator_events`, desde 14/09/2026) e a fonte confiavel dali
// em diante, e o historico nao e reescrito. Agora a captura e uma funcao do
// modulo com a promessa MEMORIZADA por codigo (as tres instancias esperam a
// mesma), e o clique tem uma trava por codigo em `sessionStorage`: recarregar
// a mesma URL na mesma sessao valida e grava de novo, mas nao conta; codigo
// diferente conta. O digitado no checkout (`applyAffiliateCode`) continua sem
// clique.

const CHAVE_DE_CLIQUE = "bnt:affiliate-click:";

function jaRegistrouNaSessao(code: string): boolean {
  try {
    return window.sessionStorage.getItem(CHAVE_DE_CLIQUE + code) === "1";
  } catch {
    return false;
  }
}

function marcarRegistrado(code: string) {
  try {
    window.sessionStorage.setItem(CHAVE_DE_CLIQUE + code, "1");
  } catch {
    // sessionStorage indisponivel: o clique e registrado nesta carga, e so.
  }
}

/** O codigo de `?ref=` ou `?cupom=` da URL atual, normalizado, ou null. */
function codigoDaUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const rawCode = params.get("ref") || params.get("cupom");
  const code = rawCode?.trim().toUpperCase();
  return code && AFFILIATE_CODE_PATTERN.test(code) ? code : null;
}

let capturaEmVoo: {
  code: string;
  promessa: Promise<StoredAffiliate | null>;
} | null = null;

/**
 * Captura o codigo da URL uma vez por pagina: valida, grava, e registra o
 * clique se esta sessao ainda nao o registrou para este codigo. Chamadas
 * seguintes com o mesmo codigo recebem a MESMA promessa. Sem codigo na URL,
 * devolve o que esta no storage.
 */
function capturarDaUrl(): Promise<StoredAffiliate | null> {
  const code = codigoDaUrl();
  if (!code) return Promise.resolve(readStoredAffiliate());
  if (capturaEmVoo && capturaEmVoo.code === code) return capturaEmVoo.promessa;
  const promessa = fetchAffiliate(code)
    .then((next) => {
      if (!next) return readStoredAffiliate();
      storeAffiliate(next);
      if (!jaRegistrouNaSessao(next.code)) {
        marcarRegistrado(next.code);
        void registrarClique(next.code).catch(() => {
          // Clique perdido por rede nao e motivo para registrar duas vezes na
          // proxima carga: a trava fica.
        });
      }
      return next;
    })
    .catch(() => readStoredAffiliate());
  capturaEmVoo = { code, promessa };
  return promessa;
}

/** So para testes: esquece a captura memorizada, como uma carga nova faria. */
export function resetarCapturaDeAfiliado() {
  capturaEmVoo = null;
  reporteEmVoo = null;
}

// CADASTRO PELO LINK (lote 11i). No primeiro acesso AUTENTICADO de uma conta,
// se ha um codigo de afiliado guardado no navegador, o client avisa o servidor
// (`POST /api/affiliates/signup`) e ele decide se aquilo e um cadastro que
// conta: conta nova, codigo ativo, nao o proprio dono, um por conta. O client
// so evita chamar toda hora: a flag por codigo em localStorage e gravada em
// qualquer resposta que decidiu (2xx, 403, 409), e NAO e gravada em erro de
// rede ou 5xx, para tentar de novo no proximo acesso. Vale para cadastro por
// e-mail com confirmacao (a sessao so existe depois de confirmar) e Google.
const CHAVE_DE_CADASTRO = "bnt:affiliate-signup-reported:";

function cadastroJaReportado(code: string): boolean {
  try {
    return window.localStorage.getItem(CHAVE_DE_CADASTRO + code) === "1";
  } catch {
    return false;
  }
}

function marcarCadastroReportado(code: string) {
  try {
    window.localStorage.setItem(CHAVE_DE_CADASTRO + code, "1");
  } catch {
    // localStorage indisponivel: o servidor segura a duplicata pelo indice.
  }
}

let reporteEmVoo: { code: string; promessa: Promise<void> } | null = null;

/**
 * Reporta o cadastro da conta logada ao codigo guardado, uma vez por codigo
 * e por navegador. Chamadas concorrentes (varias instancias) esperam a mesma
 * promessa. Sem codigo guardado, ou com a flag, nao faz nada.
 */
export function reportarCadastro(): Promise<void> {
  const guardado = readStoredAffiliate();
  if (!guardado || cadastroJaReportado(guardado.code)) return Promise.resolve();
  if (reporteEmVoo && reporteEmVoo.code === guardado.code) {
    return reporteEmVoo.promessa;
  }
  const code = guardado.code;
  const promessa = contentFetch("/affiliates/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  })
    .then(() => {
      marcarCadastroReportado(code);
    })
    .catch((err: unknown) => {
      // 403 (dono do codigo), 409 (conta antiga) e 404 (codigo invalido) sao
      // decisoes: nao insistir. Rede e 5xx nao gravam a flag.
      if (
        err instanceof AdminApiError &&
        (err.status === 403 || err.status === 404 || err.status === 409)
      ) {
        marcarCadastroReportado(code);
      }
    })
    .finally(() => {
      if (reporteEmVoo && reporteEmVoo.code === code) reporteEmVoo = null;
    });
  reporteEmVoo = { code, promessa };
  return promessa;
}

/**
 * Aplica um codigo de afiliado DIGITADO (lote 11b): o mesmo caminho da URL
 * (valida, grava com TTL de 7 dias, acorda todas as instancias do hook),
 * SEM registrar clique, porque nao houve clique em link nenhum. Devolve o
 * afiliado gravado, ou `null` se o codigo nao vale; erro de rede vira `null`
 * tambem, porque para quem digitou as duas coisas sao "nao aplicou".
 */
export async function applyAffiliateCode(
  rawCode: string,
): Promise<StoredAffiliate | null> {
  const code = rawCode.trim().toUpperCase();
  if (!AFFILIATE_CODE_PATTERN.test(code)) return null;
  let affiliate: StoredAffiliate | null;
  try {
    affiliate = await fetchAffiliate(code);
  } catch {
    return null;
  }
  if (!affiliate) return null;
  storeAffiliate(affiliate);
  return affiliate;
}

export function useAffiliate() {
  const [affiliate, setAffiliate] = useState<StoredAffiliate | null>(() =>
    readStoredAffiliate(),
  );

  // Ouve o modulo: qualquer instancia (ou o campo de cupom) que grave ou
  // apague o afiliado faz esta reler o storage.
  useEffect(() => {
    const ouvinte = () => setAffiliate(readStoredAffiliate());
    ouvintes.add(ouvinte);
    return () => {
      ouvintes.delete(ouvinte);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    // A captura e do modulo (uma por pagina); a instancia so espera por ela.
    void capturarDaUrl().then((next) => {
      if (!cancelled) setAffiliate(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function clearAffiliate() {
    clearStoredAffiliate();
    setAffiliate(null);
  }

  return {
    affiliateCode: affiliate?.code || null,
    discountPercent: affiliate?.discount_percent || 0,
    clearAffiliate,
  };
}
