import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/adminApi";

// TODO(Ana): revisar a copy do painel de saude das integracoes (labels, estados,
// detalhes). Responde "sera que a env var esta setada?" sem adivinhacao.

type PosthogHealth =
  | { state: "not_configured"; missing: string[] }
  | { state: "error"; reason: string; httpStatus?: number }
  | { state: "ok"; hasData: boolean };

type IntegrationsHealth = {
  paymentProvider: string;
  posthog: PosthogHealth;
  stripe: {
    secretKey: boolean;
    webhookSecret: boolean;
    priceIds: {
      pro_monthly: boolean;
      pro_semiannual: boolean;
      pro_annual: boolean;
    };
  };
  asaas: { apiKey: boolean; webhookToken: boolean; env: string };
  redis: { configured: boolean; ok: boolean };
  resend: { apiKey: boolean };
};

type Tone = "ok" | "warn" | "error";

const TONE_CLASS: Record<Tone, string> = {
  ok: "border-emerald-600 bg-emerald-50 text-emerald-800",
  warn: "border-amber-500 bg-amber-50 text-amber-900",
  error: "border-rose-400 bg-rose-50 text-rose-800",
};

type IntegrationStatus = {
  name: string;
  tone: Tone;
  label: string;
  detail: string;
};

function posthogStatus(posthog: PosthogHealth): IntegrationStatus {
  if (posthog.state === "not_configured") {
    return {
      name: "PostHog",
      tone: "warn",
      label: "Não configurado",
      detail: `Faltando: ${posthog.missing.length ? posthog.missing.join(", ") : "credenciais"}`,
    };
  }
  if (posthog.state === "error") {
    return {
      name: "PostHog",
      tone: "error",
      label: "Erro",
      detail:
        (typeof posthog.httpStatus === "number"
          ? `HTTP ${posthog.httpStatus}. `
          : "") + posthog.reason,
    };
  }
  return {
    name: "PostHog",
    tone: "ok",
    label: "Conectado",
    detail: posthog.hasData
      ? "Com eventos no período."
      : "Sem eventos no período.",
  };
}

function stripeStatus(stripe: IntegrationsHealth["stripe"]): IntegrationStatus {
  const missing: string[] = [];
  if (!stripe.secretKey) missing.push("secret key");
  if (!stripe.webhookSecret) missing.push("webhook secret");
  if (!stripe.priceIds.pro_monthly) missing.push("price mensal");
  if (!stripe.priceIds.pro_semiannual) missing.push("price semestral");
  if (!stripe.priceIds.pro_annual) missing.push("price anual");

  if (missing.length === 0) {
    return {
      name: "Stripe",
      tone: "ok",
      label: "Configurado",
      detail: "Secret, webhook e price ids presentes.",
    };
  }
  return {
    name: "Stripe",
    tone: "warn",
    label: missing.length >= 5 ? "Não configurado" : "Parcial",
    detail: `Faltando: ${missing.join(", ")}`,
  };
}

function asaasStatus(asaas: IntegrationsHealth["asaas"]): IntegrationStatus {
  const configured = asaas.apiKey && asaas.webhookToken;
  return {
    name: "Asaas (legado)",
    tone: configured ? "ok" : "warn",
    label: configured ? "Configurado" : "Incompleto",
    detail: `Ambiente: ${asaas.env}. ${configured ? "Mantido para assinaturas existentes." : "Chave ou token ausente."}`,
  };
}

function redisStatus(redis: IntegrationsHealth["redis"]): IntegrationStatus {
  if (!redis.configured) {
    return {
      name: "Redis",
      tone: "warn",
      label: "Não configurado",
      detail: "REDIS_URL ausente.",
    };
  }
  return {
    name: "Redis",
    tone: redis.ok ? "ok" : "error",
    label: redis.ok ? "OK" : "Sem resposta",
    detail: redis.ok ? "Ping respondeu." : "Configurado, mas o ping falhou.",
  };
}

function resendStatus(resend: IntegrationsHealth["resend"]): IntegrationStatus {
  return {
    name: "Resend",
    tone: resend.apiKey ? "ok" : "warn",
    label: resend.apiKey ? "Configurado" : "Não configurado",
    detail: resend.apiKey ? "API key presente." : "RESEND_API_KEY ausente.",
  };
}

export function IntegrationsHealthPanel() {
  const [data, setData] = useState<IntegrationsHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const json: { data: IntegrationsHealth } = await adminFetch(
          "/integrations/health",
        );
        if (cancelled) return;
        setData(json.data);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar saúde das integrações.",
        );
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const statuses: IntegrationStatus[] = data
    ? [
        posthogStatus(data.posthog),
        stripeStatus(data.stripe),
        asaasStatus(data.asaas),
        redisStatus(data.redis),
        resendStatus(data.resend),
      ]
    : [];

  return (
    <article className="card-brutal rounded-3xl bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl font-black text-slate-950">
          Saúde das integrações
        </h2>
        {data ? (
          <span className="rounded-full border-2 border-slate-900 bg-violet-50 px-3 py-1 text-xs font-black uppercase text-violet-800">
            Provider de pagamento: {data.paymentProvider}
          </span>
        ) : null}
      </div>

      <div className="mt-5">
        {loading ? (
          <p className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-black text-slate-500">
            Carregando saúde das integrações...
          </p>
        ) : error ? (
          <p className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-black text-rose-700">
            {error}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {statuses.map((status) => (
              <div
                key={status.name}
                className={`rounded-2xl border-2 p-4 ${TONE_CLASS[status.tone]}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-lg font-black">
                    {status.name}
                  </p>
                  <span className="rounded-full border-2 border-slate-900 bg-white/70 px-2.5 py-0.5 text-xs font-black uppercase text-slate-900">
                    {status.label}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold opacity-90">
                  {status.detail}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
