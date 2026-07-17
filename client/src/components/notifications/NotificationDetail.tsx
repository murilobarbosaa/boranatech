import { useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, ExternalLink, X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SheetClose } from "@/components/ui/sheet";
import {
  CountdownBadge,
  CouponBlock,
  ctaTarget,
} from "@/components/notifications/NotificationsPanel";
import { NOTIFICATION_TYPE_META } from "@/lib/notificationTypeMeta";
import type {
  NotificationItem,
  NotificationType,
} from "@/services/notificationsService";

// Vista de detalhe de UMA notificação. Mesmo conteúdo (NotificationDetailBody)
// em dois containers: Dialog centralizado no desktop, camada fullscreen dentro
// do próprio Sheet no mobile. Ambos com header em grid de 3 colunas (lateral |
// título centralizado | X) sobre faixa amber, corpo e sombra dura no vocabulário
// da casa (ProUpsellModal/AuthModal). Reaproveita CouponBlock/CountdownBadge/
// ctaTarget do painel e o mapa de tipos do admin. Marcar-como-lida acontece no
// clique do item (NotificationsPanel), que é o que abre esta vista.

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

// Tag do tipo: mesmo mapa de cores do admin (NotificationsManager), com a borda
// dura da casa (border-2). A cor da borda já vem no badge do mapa.
function TypeTag({
  type,
  className = "",
}: {
  type: NotificationType;
  className?: string;
}) {
  const meta = NOTIFICATION_TYPE_META[type];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border-2 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${meta.badge} ${className}`}
    >
      {meta.label}
    </span>
  );
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

// Corpo compartilhado: (tag do tipo só no mobile, onde o header tem a seta em
// vez da tag), corpo integral (whitespace-pre-wrap, sem clamp, largura de
// leitura), status (expirado/countdown), cupom, CTA e, por último, o horário à
// direita. Ordem pedida: corpo -> cupom/countdown -> CTA -> horário. onNavigate
// fecha o container quando o CTA interno navega.
function NotificationDetailBody({
  item,
  onNavigate,
  showTypeTag = false,
}: {
  item: NotificationItem;
  onNavigate: () => void;
  showTypeTag?: boolean;
}) {
  const [locallyExpired, setLocallyExpired] = useState(false);

  const expired = item.is_expired || locallyExpired;
  const hasActiveCountdown =
    !expired &&
    item.expires_at !== null &&
    new Date(item.expires_at).getTime() > Date.now();
  const showCta = Boolean(item.cta_url) && !expired;

  return (
    <div>
      {showTypeTag ? (
        <div className="mb-3">
          <TypeTag type={item.type} />
        </div>
      ) : null}

      <p className="max-w-prose whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
        {item.body}
      </p>

      {expired || hasActiveCountdown ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
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

      {item.type === "coupon" ? (
        <CouponBlock item={item} expired={expired} />
      ) : null}

      {showCta ? (
        <div className="mt-5">
          <DetailCta item={item} onNavigate={onNavigate} />
        </div>
      ) : null}

      <p className="mt-6 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
        {fullDateTime(item.published_at)}
      </p>
    </div>
  );
}

// Desktop: modal centralizado (padrão dos modais da casa: border-2 slate-950 +
// sombra dura + amber no header). Header em grid [tag | título centrado | X];
// grid-cols-[1fr_auto_1fr] mantém o título opticamente centrado no eixo do modal
// (colunas 1 e 3 são 1fr equivalentes). O badge leva justify-self-start: sem ele
// o item de grid herda justify-self:stretch e estica pra coluna toda (bug
// original); shrink-0 não resolve, pois é inerte em item de grid. O X leva
// justify-self-end. X próprio (default do DialogContent desligado). Fechar não
// reabre o popover.
export function NotificationDetailDialog({
  item,
  onClose,
}: {
  item: NotificationItem | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[80vh] w-full max-w-[560px] flex-col gap-0 overflow-hidden rounded-2xl border-2 border-slate-950 bg-white p-0 shadow-[6px_6px_0_#0f172a] sm:max-w-[560px]"
      >
        {item ? (
          <>
            <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b-2 border-slate-900 bg-amber-50 px-3 py-2.5">
              <TypeTag type={item.type} className="justify-self-start" />
              <DialogTitle className="line-clamp-2 min-w-0 px-1 text-center font-display text-base font-black leading-tight text-slate-950">
                {item.title}
              </DialogTitle>
              <DialogClose
                aria-label="Fechar"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center justify-self-end rounded-full text-slate-900 transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </DialogClose>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <DialogDescription className="sr-only">
                Detalhe da notificação.
              </DialogDescription>
              <NotificationDetailBody item={item} onNavigate={onClose} />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// Mobile: camada fullscreen renderizada DENTRO do Sheet já aberto (sem segundo
// overlay). Header em grid [seta-voltar | título centrado | X]: as duas laterais
// são botões de 44px (equivalentes), então o título fica centrado. A tag do tipo
// vai pro topo do corpo (o slot da esquerda é a seta). onBack volta pra lista
// (montada por baixo, scroll preservado); onClose fecha o Sheet inteiro.
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
      <div className="grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-1 border-b-2 border-slate-900 bg-amber-50 px-2 py-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar para a lista"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-900 transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
        </button>
        <h2 className="line-clamp-2 min-w-0 px-1 text-center font-display text-base font-black leading-tight text-slate-950">
          {item.title || "Notificação"}
        </h2>
        <SheetClose
          aria-label="Fechar notificações"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center justify-self-end rounded-full text-slate-900 transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          <X className="h-5 w-5" strokeWidth={2.5} />
        </SheetClose>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <NotificationDetailBody item={item} onNavigate={onClose} showTypeTag />
      </div>
    </div>
  );
}
