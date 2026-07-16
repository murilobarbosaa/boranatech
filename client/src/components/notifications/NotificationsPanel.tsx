import { useEffect, useState } from "react";
import { Link } from "wouter";
import { BellOff, CheckCheck, Clock, RefreshCw, Tag } from "lucide-react";

import CopyButton from "@/components/shared/CopyButton";
import { useNotifications } from "@/contexts/NotificationsContext";
import type { NotificationItem } from "@/services/notificationsService";

// Painel de notificações compartilhado entre o Popover (desktop) e o Sheet
// (mobile), ancorados pelo NotificationBell. Sem opção de deletar: histórico
// do usuário é permanente; o que sai do feed é decisão do admin (archive).

const BODY_CLAMP_THRESHOLD = 140;

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "há 1 mês" : `há ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? "há 1 ano" : `há ${years} anos`;
}

// > 48h: dias (sem urgência). 1h-48h: horas e minutos. < 1h: MM:SS por
// segundo, senso de urgência.
function formatCountdown(msLeft: number): string {
  const totalSec = Math.max(0, Math.floor(msLeft / 1000));
  if (totalSec > 48 * 3600) {
    const days = Math.floor(totalSec / (24 * 3600));
    return `Termina em ${days} ${days === 1 ? "dia" : "dias"}`;
  }
  if (totalSec >= 3600) {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `Termina em ${h}h ${m}min`;
  }
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `Termina em ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Resolve o destino do CTA: caminho interno (ou URL do próprio site) navega
// via wouter; externo abre em nova aba.
function ctaTarget(url: string): { internal: boolean; href: string } {
  if (url.startsWith("/")) return { internal: true, href: url };
  try {
    const parsed = new URL(url);
    if (parsed.origin === window.location.origin) {
      return {
        internal: true,
        href: `${parsed.pathname}${parsed.search}${parsed.hash}`,
      };
    }
    return { internal: false, href: url };
  } catch {
    return { internal: false, href: url };
  }
}

function CountdownBadge({
  expiresAt,
  onExpire,
}: {
  expiresAt: string;
  onExpire: () => void;
}) {
  const [msLeft, setMsLeft] = useState(
    () => new Date(expiresAt).getTime() - Date.now(),
  );

  // Tique de 1s só enquanto o badge existe (painel aberto). O interval morre
  // com o unmount, então fechar o painel para a contagem.
  useEffect(() => {
    const interval = setInterval(() => {
      const left = new Date(expiresAt).getTime() - Date.now();
      setMsLeft(left);
      if (left <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (msLeft <= 0) return null;

  const urgent = msLeft < 3600 * 1000;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
        urgent
          ? "border-red-700 bg-red-50 text-red-700"
          : "border-slate-900 bg-amber-100 text-slate-900"
      }`}
    >
      <Clock className="h-3 w-3" />
      {formatCountdown(msLeft)}
    </span>
  );
}

function CouponBlock({
  item,
  expired,
}: {
  item: NotificationItem;
  expired: boolean;
}) {
  if (!item.coupon_code) return null;
  return (
    <div
      className={`mt-2 flex flex-wrap items-center gap-2 rounded-xl border-2 border-dashed p-2 ${
        expired
          ? "border-slate-300 bg-slate-50"
          : "border-slate-900 bg-amber-50"
      }`}
    >
      <span
        className={`inline-flex items-center gap-1.5 rounded-md bg-slate-950 px-2.5 py-1 font-mono text-sm font-bold tracking-widest text-white ${
          expired ? "line-through opacity-60" : ""
        }`}
      >
        <Tag className="h-3.5 w-3.5" />
        {item.coupon_code}
      </span>
      {item.discount_percent ? (
        <span className="text-xs font-black text-slate-900">
          {item.discount_percent}% de desconto
        </span>
      ) : null}
      {!expired ? (
        <CopyButton text={item.coupon_code} className="ml-auto px-3 py-1.5" />
      ) : null}
    </div>
  );
}

function NotificationCard({
  item,
  onClose,
}: {
  item: NotificationItem;
  onClose?: () => void;
}) {
  const { markAsRead } = useNotifications();
  const [expanded, setExpanded] = useState(false);
  const [locallyExpired, setLocallyExpired] = useState(false);

  const expired = item.is_expired || locallyExpired;
  const unread = !item.read_at;
  const clampable = item.body.length > BODY_CLAMP_THRESHOLD;
  const hasActiveCountdown =
    !expired &&
    item.expires_at !== null &&
    new Date(item.expires_at).getTime() > Date.now();

  function handleInteract() {
    if (unread) void markAsRead(item.id);
    if (clampable) setExpanded((prev) => !prev);
  }

  const cta = item.cta_url && !expired ? ctaTarget(item.cta_url) : null;
  const ctaLabel = item.cta_label || "Ver mais";

  return (
    <article
      className={`border-b border-slate-200 px-4 py-3 transition-colors last:border-b-0 ${
        expired ? "opacity-60" : ""
      } ${unread ? "bg-sky-50" : "bg-white"}`}
    >
      <button
        type="button"
        onClick={handleInteract}
        className="block w-full rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        <div className="flex items-start gap-2">
          {unread ? (
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500"
              aria-hidden="true"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-slate-950">
                {item.title}
              </h3>
              {expired ? (
                <span className="inline-flex rounded-full border border-slate-400 bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Expirado
                </span>
              ) : null}
              {hasActiveCountdown && item.expires_at ? (
                <CountdownBadge
                  expiresAt={item.expires_at}
                  onExpire={() => setLocallyExpired(true)}
                />
              ) : null}
            </div>
            <p
              className={`mt-1 text-sm text-slate-600 ${
                clampable && !expanded ? "line-clamp-2" : ""
              }`}
            >
              {item.body}
            </p>
            {clampable ? (
              <span className="mt-0.5 inline-block text-xs font-bold text-violet-800">
                {expanded ? "Ver menos" : "Ver mais"}
              </span>
            ) : null}
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {relativeTime(item.published_at)}
            </p>
          </div>
        </div>
      </button>

      {item.type === "coupon" ? (
        <CouponBlock item={item} expired={expired} />
      ) : null}

      {cta ? (
        <div className="mt-2">
          {cta.internal ? (
            <Link
              href={cta.href}
              onClick={() => {
                if (unread) void markAsRead(item.id);
                onClose?.();
              }}
              className="inline-flex items-center rounded-full border-2 border-slate-900 bg-[#FFB800] px-3 py-1.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a]"
            >
              {ctaLabel}
            </Link>
          ) : (
            <a
              href={cta.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (unread) void markAsRead(item.id);
              }}
              className="inline-flex items-center rounded-full border-2 border-slate-900 bg-[#FFB800] px-3 py-1.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a]"
            >
              {ctaLabel}
            </a>
          )}
        </div>
      ) : null}
    </article>
  );
}

export default function NotificationsPanel({
  onClose,
}: {
  onClose?: () => void;
}) {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasError,
    hasMore,
    refresh,
    loadMore,
    markAllAsRead,
  } = useNotifications();
  const [loadingMore, setLoadingMore] = useState(false);

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      await loadMore();
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="flex h-full max-h-[inherit] flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b-2 border-slate-900 bg-[#faf8f4] px-4 py-3">
        <h2 className="font-display text-base font-black text-slate-950">
          Notificações
        </h2>
        <button
          type="button"
          onClick={() => void markAllAsRead()}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Marcar todas como lidas
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-3 p-4">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : hasError && notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <p className="text-sm font-bold text-slate-600">
              Não foi possível carregar as notificações.
            </p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <BellOff className="h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="text-sm font-bold text-slate-600">
              Nada por aqui ainda.
            </p>
            <p className="text-xs text-slate-400">
              Avisos, novidades e cupons vão aparecer aqui.
            </p>
          </div>
        ) : (
          <>
            {notifications.map((item) => (
              <NotificationCard key={item.id} item={item} onClose={onClose} />
            ))}
            {hasMore ? (
              <div className="border-t border-slate-200 p-3 text-center">
                <button
                  type="button"
                  onClick={() => void handleLoadMore()}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a] disabled:opacity-50"
                >
                  {loadingMore ? "Carregando..." : "Carregar mais"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
