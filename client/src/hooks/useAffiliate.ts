import { useEffect, useState } from "react";

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
    const params = new URLSearchParams(window.location.search);
    const rawCode = params.get("ref") || params.get("cupom");
    const code = rawCode?.trim().toUpperCase();

    if (!code) {
      setAffiliate(readStoredAffiliate());
      return;
    }

    let cancelled = false;

    // Pela URL houve clique em link: valida, grava, e registra o clique.
    fetchAffiliate(code)
      .then((next) => {
        if (cancelled || !next) return;
        storeAffiliate(next);
        setAffiliate(next);
        return registrarClique(next.code);
      })
      .catch(() => {
        setAffiliate(readStoredAffiliate());
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
