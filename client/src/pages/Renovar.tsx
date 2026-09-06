import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { AlertTriangle, Check, Clock, RefreshCw } from "lucide-react";

import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import PixCheckoutModal from "@/components/pro/PixCheckoutModal";
import {
  createRenewalCheckout,
  getRenewalPreview,
  getRenewalStatus,
  RenewalError,
  type RenewalCheckoutResult,
  type RenewalPreview,
} from "@/services/renewalService";

// Pagina PUBLICA de renovacao manual (/renovar?t=<token>), sem auth: o token e
// a autenticacao (o assinante vem do e-mail, provavelmente deslogado). NAO usa
// useAuth/useSubscription para dados; tudo vem do token via renewalService.
// Estados: loading, ready, error(slug). Trata os slugs no GET (preview) E no
// POST (gerar cobranca). Data skeleton de CertificadoPublico, visual de
// CheckoutSucesso.
//
// DOIS MEIOS desde o lote 2b.2: boleto redireciona para a Stripe, como sempre;
// Pix abre o MESMO modal de QR do checkout, com o QR que a rota devolve e um
// polling por token (GET /renew/status), porque nao ha sessao aqui.

type View =
  | { kind: "loading" }
  | { kind: "ready"; preview: RenewalPreview }
  | { kind: "error"; code: string };

type ErrorContent = {
  icon: ReactNode;
  title: string;
  body: string;
  action?: { label: string; href: string };
};

// Copy fixa por slug (fornecida na task). invalid_token, subscription_unavailable,
// not_manual_renewal e a ausencia de token compartilham a copy generica (GENERIC),
// que mostra o `code` recebido: sem ele, "nao conseguimos processar" nao diz a
// quem le o suporte qual foi a recusa.
const GENERIC_ERROR: ErrorContent = {
  icon: <AlertTriangle className="h-6 w-6 text-slate-700" />,
  title: "Não conseguimos processar este link",
  body: "Escolha seu plano para renovar.",
  action: { label: "Ver planos", href: "/planos" },
};

const ERROR_CONTENT: Record<string, ErrorContent> = {
  boleto_pending: {
    icon: <Clock className="h-6 w-6 text-slate-700" />,
    title: "Você já tem um boleto aguardando pagamento",
    body: "Ele foi enviado para o seu e-mail e vence em 3 dias. Se não encontrar, verifique o spam.",
  },
  already_renewed: {
    icon: <Check className="h-6 w-6 text-slate-700" strokeWidth={3} />,
    title: "Sua assinatura já foi renovada",
    body: "Não é preciso fazer nada.",
    action: { label: "Ir para o perfil", href: "/perfil" },
  },
  expired_token: {
    icon: <AlertTriangle className="h-6 w-6 text-slate-700" />,
    title: "Este link expirou",
    body: "Escolha seu plano para renovar.",
    action: { label: "Ver planos", href: "/planos" },
  },
};

function errorContentFor(code: string): ErrorContent {
  return ERROR_CONTENT[code] ?? GENERIC_ERROR;
}

// TODO(Ana)
const PIX_NOTE =
  "Assim que o Pix cair, seu acesso volta em instantes. Você recebe um e-mail de confirmação.";

function formatDueDate(iso: string | null): string {
  if (!iso) return "em breve";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "em breve";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Casca do card, comum aos estados (borda/sombra flat + fundo branco). Local ao
// arquivo, nao e componente reutilizavel novo (mesmo padrao do CertificadoPublico).
function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[16px] border-[3px] border-slate-950 bg-white p-8 text-center shadow-[6px_6px_0_var(--bnt-shadow)]">
      {children}
    </div>
  );
}

function IconPill({ children }: { children: ReactNode }) {
  return (
    <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-950 bg-[var(--brand-yellow)] shadow-[4px_4px_0_var(--bnt-shadow)]">
      {children}
    </span>
  );
}

const BUTTON_CLASS =
  "mt-8 inline-flex items-center justify-center rounded-full border-2 border-slate-950 bg-[var(--brand-yellow)] px-6 py-3 font-black text-ink-on-accent shadow-[4px_4px_0_var(--bnt-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--bnt-shadow)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_var(--bnt-shadow)]";

export default function Renovar() {
  // ?t= lido via URLSearchParams (wouter nao captura query string). Uma vez: o
  // token nao muda durante a vida da pagina.
  const [token] = useState(
    () => new URLSearchParams(window.location.search).get("t") ?? "",
  );
  const [view, setView] = useState<View>(() =>
    token ? { kind: "loading" } : { kind: "error", code: "invalid_token" },
  );
  const [submitting, setSubmitting] = useState(false);
  // Cobranca Pix aberta no modal. `null` = modal fechado.
  const [pix, setPix] = useState<RenewalCheckoutResult | null>(null);

  useEffect(() => {
    if (!token) return; // sem token: erro ja setado, nao chama a API.
    let cancelled = false;
    setView({ kind: "loading" });
    getRenewalPreview(token)
      .then((preview) => {
        if (!cancelled) setView({ kind: "ready", preview });
      })
      .catch((err) => {
        if (cancelled) return;
        const code = err instanceof RenewalError ? err.code : "unknown";
        setView({ kind: "error", code });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleGenerate() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await createRenewalCheckout(token);
      if (result.flow === "native_pix" && result.pixQrCode) {
        setPix(result);
        setSubmitting(false);
        return;
      }
      if (!result.checkoutUrl) throw new RenewalError("unknown");
      // Sai do SPA para a Stripe. So redireciona com a URL em maos.
      window.location.href = result.checkoutUrl;
    } catch (err) {
      const code = err instanceof RenewalError ? err.code : "unknown";
      setView({ kind: "error", code });
      setSubmitting(false);
    }
  }

  // Polling por token: `paid` quando a linha nova foi ativada. `expired_qr`
  // nao encerra o polling; o relogio do modal e quem diz "expirou".
  const checkPaid = useCallback(async () => {
    const r = await getRenewalStatus(token);
    return r.status === "active"
      ? { paid: true, periodEnd: r.periodEnd }
      : { paid: false };
  }, [token]);

  const ehPix = view.kind === "ready" && view.preview.paymentMethod === "pix";

  return (
    <Layout>
      <SEO
        title="Renovar assinatura · Bora na Tech? Pro"
        url="/renovar"
        noindex
      />
      <section className="bg-[var(--brand-cream)] [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        <div className="mx-auto max-w-[560px] px-5 pb-20 pt-12">
          {view.kind === "loading" ? (
            <Card>
              <div className="flex justify-center py-6">
                <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-300 border-t-slate-900" />
              </div>
            </Card>
          ) : view.kind === "ready" ? (
            <Card>
              <IconPill>
                <RefreshCw
                  className="h-7 w-7 text-slate-950"
                  strokeWidth={2.5}
                />
              </IconPill>
              <h1 className="mt-6 font-display text-3xl font-black text-slate-950">
                Renovar Pro {view.preview.planLabel}
              </h1>
              <p className="mt-2 font-display text-2xl font-black text-slate-950">
                {view.preview.priceLabel}
              </p>
              <p className="mx-auto mt-4 max-w-md text-sm font-semibold leading-relaxed text-slate-600">
                Sua assinatura vence em {formatDueDate(view.preview.periodEnd)}.
                Ao renovar, o novo período começa quando o atual termina, você
                não perde nenhum dia.
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={submitting}
                className={BUTTON_CLASS}
              >
                {submitting
                  ? "Gerando..."
                  : ehPix
                    ? "Pagar com Pix"
                    : "Gerar boleto"}
              </button>
            </Card>
          ) : (
            (() => {
              const content = errorContentFor(view.code);
              return (
                <Card>
                  <IconPill>{content.icon}</IconPill>
                  <h1 className="mt-6 font-display text-2xl font-black text-slate-950">
                    {content.title}
                  </h1>
                  <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-600">
                    {content.body}
                  </p>
                  {content === GENERIC_ERROR ? (
                    <p className="mt-2 font-mono text-[11px] text-slate-400">
                      código: {view.code}
                    </p>
                  ) : null}
                  {content.action ? (
                    <Link href={content.action.href} className={BUTTON_CLASS}>
                      {content.action.label}
                    </Link>
                  ) : null}
                </Card>
              );
            })()
          )}
        </div>
      </section>
      <PixCheckoutModal
        open={pix !== null}
        qr={pix?.pixQrCode ?? null}
        amountCents={pix?.amountCents}
        dueDate={pix?.dueDate}
        invoiceUrl={pix?.checkoutUrl ?? null}
        checkPaid={checkPaid}
        copy={{
          note: PIX_NOTE,
          // TODO(Ana)
          confirmedTitle: "Renovado!",
          confirmedBody: (periodEnd) =>
            `Renovado. Seu Pro vai até ${formatDueDate(periodEnd)}.`,
          confirmedAction: "Ir para o perfil",
          confirmedHref: "/perfil",
          expiredAction: "Gerar novo Pix",
        }}
        onDismiss={() => setPix(null)}
        onConfirmedContinue={() => setPix(null)}
        // QR expirado: fecha e pede outro. Se o Asaas ainda considerar a
        // cobranca valida, a rota devolve o MESMO QR (reused) em vez de 409.
        onExpiredRestart={() => {
          setPix(null);
          void handleGenerate();
        }}
      />
    </Layout>
  );
}
