import { useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, ExternalLink, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SheetClose } from "@/components/ui/sheet";
import {
  CountdownBadge,
  CouponBlock,
  ctaTarget,
} from "@/components/notifications/NotificationsPanel";
import type {
  NotificationItem,
  NotificationType,
} from "@/services/notificationsService";

// Vista de detalhe de UMA notificação. Mesmo conteúdo (NotificationDetailBody)
// em dois containers: Dialog centralizado no desktop, camada fullscreen dentro
// do próprio Sheet no mobile. Reaproveita CouponBlock/CountdownBadge/ctaTarget
// do painel (CopyButton já entra via CouponBlock). Marcar-como-lida acontece no
// clique do item (NotificationsPanel), que é o que abre esta vista.

const TYPE_LABELS: Partial<Record<NotificationType, string>> = {
  coupon: "Cupom",
  optin: "Novidade",
  system: "Sistema",
};

// Data/hora completa de envio (ex.: "16 de julho de 2026, 14:30").
function fullDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// CTA em destaque, estilo brutalist da casa (maior que o pill da lista, de
// propósito: aqui é o botão principal). Não reusa o CTA compacto do card.
function DetailCta({
  item,
  onNavigate,
}: {
  item: NotificationItem;
  onNavigate: () => void;
}) {
  const target = ctaTarget(item.cta_url ?? "");
  const label = item.cta_label || "Ver mais";
  const className =
    "bnt-pressable inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-[#FFB800] px-5 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]";

  if (target.internal) {
    return (
      <Link href={target.href} onClick={onNavigate} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <a
      href={target.href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {label}
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

// Corpo compartilhado: badges (tipo/expirado/countdown), data completa, corpo
// integral (whitespace-pre-wrap, sem clamp) e cupom + CTA. onNavigate fecha o
// container quando o CTA interno navega. O título fica no header de cada
// container (DialogTitle no desktop, header do sheet no mobile).
function NotificationDetailBody({
  item,
  onNavigate,
}: {
  item: NotificationItem;
  onNavigate: () => void;
}) {
  const [locallyExpired, setLocallyExpired] = useState(false);

  const expired = item.is_expired || locallyExpired;
  const typeLabel = TYPE_LABELS[item.type];
  const hasActiveCountdown =
    !expired &&
    item.expires_at !== null &&
    new Date(item.expires_at).getTime() > Date.now();
  const showCta = Boolean(item.cta_url) && !expired;

  return (
    <div>
      {typeLabel || expired || hasActiveCountdown ? (
        <div className="flex flex-wrap items-center gap-2">
          {typeLabel ? (
            <span className="inline-flex items-center rounded-full border border-slate-900 bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-900">
              {typeLabel}
            </span>
          ) : null}
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
      ) : null}

      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {fullDateTime(item.published_at)}
      </p>

      <p className="mt-4 max-w-prose whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
        {item.body}
      </p>

      {item.type === "coupon" ? (
        <CouponBlock item={item} expired={expired} />
      ) : null}

      {showCta ? (
        <div className="mt-5">
          <DetailCta item={item} onNavigate={onNavigate} />
        </div>
      ) : null}
    </div>
  );
}

// Desktop: modal centralizado (padrão dos modais da casa), scroll interno se o
// corpo for longo. Fechar não reabre o popover (quem controla é o
// NotificationBell). item === null mantém o dialog fechado.
export function NotificationDetailDialog({
  item,
  onClose,
}: {
  item: NotificationItem | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-[560px] overflow-y-auto border-2 border-slate-950 bg-white">
        {item ? (
          <>
            <DialogHeader>
              <DialogTitle className="pr-6 font-display text-xl font-black text-slate-950">
                {item.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Detalhe da notificação.
              </DialogDescription>
            </DialogHeader>
            <NotificationDetailBody item={item} onNavigate={onClose} />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// Mobile: camada fullscreen renderizada DENTRO do Sheet já aberto (sem segundo
// overlay). Header troca pra seta-voltar (esquerda) + título + X de fechar
// (direita). onBack volta pra lista (que segue montada, scroll preservado);
// onClose fecha o Sheet inteiro.
export function NotificationDetailSheet({
  item,
  onBack,
  onClose,
}: {
  item: NotificationItem;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b-2 border-slate-900 bg-[#faf8f4] px-2 py-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar para a lista"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
        </button>
        <h2 className="min-w-0 flex-1 truncate font-display text-base font-black text-slate-950">
          {item.title || "Notificação"}
        </h2>
        <SheetClose
          aria-label="Fechar notificações"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          <X className="h-5 w-5" strokeWidth={2.5} />
        </SheetClose>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <NotificationDetailBody item={item} onNavigate={onClose} />
      </div>
    </div>
  );
}
