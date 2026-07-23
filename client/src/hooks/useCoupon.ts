import { useEffect, useRef, useState } from "react";

import { apiUrl } from "@/lib/api";

export const COUPON_STORAGE_KEY = "bora-na-tech:coupon";

// Mesmo padrao de code dos afiliados (server/lib/coupons.ts). Validar local
// evita bater na API (e gastar throttle) com formato obviamente invalido.
const COUPON_CODE_PATTERN = /^[A-Z0-9]{3,32}$/;

export type StoredCoupon = {
  code: string;
  discount_percent: number;
  applicable_plans: string[] | null;
  expires: number;
};

export type CouponStatus = "idle" | "validating" | "valid" | "invalid";

export function clearStoredCoupon() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(COUPON_STORAGE_KEY);
}

function readStoredCoupon(): StoredCoupon | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(COUPON_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as StoredCoupon;
    if (!parsed.code || parsed.expires <= Date.now()) {
      window.localStorage.removeItem(COUPON_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function storeCoupon(coupon: StoredCoupon) {
  try {
    window.localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
  } catch {
    // localStorage indisponivel: o cupom vale so nesta pagina.
  }
}

// Valida o code na API. null = cupom invalido (404 generico ou resposta
// torta); lanca em erro de REDE, para o caller decidir (digitado: trata como
// invalido; restaurado do storage: mantem, o server revalida no checkout).
async function fetchCoupon(code: string): Promise<StoredCoupon | null> {
  const res = await fetch(apiUrl(`/api/coupons/${encodeURIComponent(code)}`));
  if (!res.ok) return null;
  const json = (await res.json()) as {
    code?: string;
    discount_percent?: number;
    applicable_plans?: string[] | null;
  };
  if (!json.code || typeof json.discount_percent !== "number") return null;
  return {
    code: json.code,
    discount_percent: json.discount_percent,
    applicable_plans: Array.isArray(json.applicable_plans)
      ? json.applicable_plans
      : null,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
}

// Cupom de desconto de marketing (tabela coupons), SEPARADO do afiliado
// (useAffiliate, ?ref=/?cupom=). Espelha o padrao do useAffiliate: valida na
// API, persiste em localStorage com TTL de 7 dias e restaura ao montar. Captura
// ?promo=CODIGO na URL (aplicado automaticamente); um cupom restaurado do
// storage e revalidado na API para nao prometer preco que o checkout (que
// revalida tudo no server) nao vai dar.
export function useCoupon() {
  const [coupon, setCoupon] = useState<StoredCoupon | null>(() =>
    readStoredCoupon(),
  );
  const [status, setStatus] = useState<CouponStatus>(() =>
    readStoredCoupon() ? "valid" : "idle",
  );
  // Serial da requisicao em voo: um applyCoupon/removeCoupon posterior invalida
  // o resultado do anterior (last-write-wins sem race).
  const requestSeq = useRef(0);

  async function applyCoupon(rawCode: string): Promise<boolean> {
    const code = rawCode.trim().toUpperCase();
    const seq = ++requestSeq.current;

    if (!COUPON_CODE_PATTERN.test(code)) {
      setStatus("invalid");
      return false;
    }

    setStatus("validating");
    let next: StoredCoupon | null;
    try {
      next = await fetchCoupon(code);
    } catch {
      next = null;
    }
    if (seq !== requestSeq.current) return false;

    if (!next) {
      setStatus("invalid");
      return false;
    }

    storeCoupon(next);
    setCoupon(next);
    setStatus("valid");
    return true;
  }

  function removeCoupon() {
    requestSeq.current += 1;
    clearStoredCoupon();
    setCoupon(null);
    setStatus("idle");
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const promo = params.get("promo")?.trim().toUpperCase();

    // ?promo= na URL ganha do storage (link de campanha e intencao explicita).
    if (promo) {
      void applyCoupon(promo);
      return;
    }

    // Revalida o cupom restaurado: pausado/expirado/esgotado desde a ultima
    // visita e descartado aqui, antes de prometer desconto nos precos.
    const stored = readStoredCoupon();
    if (!stored) return;

    const seq = ++requestSeq.current;
    void fetchCoupon(stored.code)
      .then((next) => {
        if (seq !== requestSeq.current) return;
        if (!next) {
          clearStoredCoupon();
          setCoupon(null);
          setStatus("idle");
          return;
        }
        storeCoupon(next);
        setCoupon(next);
        setStatus("valid");
      })
      .catch(() => {
        // Rede fora: mantem o cupom restaurado (o checkout revalida no server).
      });
    // Roda uma unica vez no mount, igual ao useAffiliate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { coupon, status, applyCoupon, removeCoupon };
}
