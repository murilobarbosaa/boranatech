import { useEffect, useState } from "react";

import { apiUrl } from "@/lib/api";

export const AFFILIATE_STORAGE_KEY = "bora-na-tech:affiliate";

type StoredAffiliate = {
  code: string;
  discount_percent: number;
  expires: number;
};

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

export function useAffiliate() {
  const [affiliate, setAffiliate] = useState<StoredAffiliate | null>(() =>
    readStoredAffiliate(),
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawCode = params.get("ref") || params.get("cupom");
    const code = rawCode?.trim().toUpperCase();

    if (!code) {
      setAffiliate(readStoredAffiliate());
      return;
    }

    let cancelled = false;

    fetch(apiUrl(`/api/affiliates/${encodeURIComponent(code)}`))
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json.valid) return;

        const nextAffiliate = {
          code: json.code,
          discount_percent: Number(json.discount_percent || 0),
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        };
        window.localStorage.setItem(
          AFFILIATE_STORAGE_KEY,
          JSON.stringify(nextAffiliate),
        );
        setAffiliate(nextAffiliate);
        return fetch(
          apiUrl(`/api/affiliates/${encodeURIComponent(json.code)}/click`),
          { method: "POST" },
        );
      })
      .catch(() => {
        setAffiliate(readStoredAffiliate());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function clearAffiliate() {
    window.localStorage.removeItem(AFFILIATE_STORAGE_KEY);
    setAffiliate(null);
  }

  return {
    affiliateCode: affiliate?.code || null,
    discountPercent: affiliate?.discount_percent || 0,
    clearAffiliate,
  };
}
