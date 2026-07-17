import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

import NotificationsPanel from "@/components/notifications/NotificationsPanel";
import {
  NotificationDetailDialog,
  NotificationDetailSheet,
} from "@/components/notifications/NotificationDetail";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useNotifications } from "@/contexts/NotificationsContext";
import type { NotificationItem } from "@/services/notificationsService";

// Sino de notificações do Header, sempre o mesmo botão redondo de 36px.
// Desktop: Popover ancorado no botão. Mobile: o sino vive na barra ao lado do
// hambúrguer e abre um Sheet quase em tela cheia; onOpen fecha o drawer de
// navegação se estiver aberto (evita dois overlays empilhados).
// Visual espelha os vizinhos do header (botão Sair / avatar): h-9 w-9 como o
// UserAvatar sm, sombra dura 2px que cresce pra 3px no hover, press via
// bnt-pressable.

function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-slate-900 bg-red-600 px-1 text-[10px] font-black leading-none text-white shadow-[1px_1px_0_#0f172a]"
      >
        {count >= 99 ? "99+" : count}
      </span>
      <span aria-live="polite" className="sr-only">
        {count === 1
          ? "1 notificação não lida"
          : `${count >= 99 ? "99 ou mais" : count} notificações não lidas`}
      </span>
    </>
  );
}

// Toca o "ring" UMA vez a cada incremento de arrivalSignal (chegada genuína
// vinda do servidor, detectada no NotificationsContext). Reagir ao SINAL e não
// ao unreadCount é o que impede o sino de balançar em quedas (ler/marcar todas),
// rollbacks e oscilações de UI. Como o sinal vive no provider (montado uma vez),
// ele sobrevive à remontagem do sino a cada navegação. No mount o ref é semeado
// com o sinal atual, então remontar não reemite um sinal antigo (baseline).
// prefers-reduced-motion desativa via CSS (.animate-bell-ring no index.css).
// Duração do keyframe bellRing (index.css) + folga pra classe não sair antes do
// fim da animação. Manter em sincronia com `animation: bellRing 1080ms` no CSS.
const BELL_RING_ANIMATION_MS = 1080;
const BELL_RING_TIMEOUT_MS = BELL_RING_ANIMATION_MS + 100;

export function useBellRing(arrivalSignal: number): boolean {
  const prevSignalRef = useRef(arrivalSignal);
  const [ringing, setRinging] = useState(false);

  useEffect(() => {
    if (arrivalSignal === prevSignalRef.current) return;
    prevSignalRef.current = arrivalSignal;
    setRinging(true);
    const timer = setTimeout(() => setRinging(false), BELL_RING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [arrivalSignal]);

  return ringing;
}

export default function NotificationBell({
  variant,
  onOpen,
}: {
  variant: "desktop" | "mobile";
  onOpen?: () => void;
}) {
  const { unreadCount, refresh, arrivalSignal } = useNotifications();
  const [open, setOpen] = useState(false);
  // Notificação aberta em detalhe (null = lista). Vive aqui porque no desktop o
  // detalhe é um Dialog irmão do Popover (que fecha ao abrir o detalhe).
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const ringing = useBellRing(arrivalSignal);

  // Desktop e mobile são instâncias distintas do sino, ambas sempre montadas (o
  // Header só troca display via 2xl:hidden/2xl:flex). O conteúdo do Sheet/Dialog
  // é portalado pro body, então esconder o container NÃO fecha um detalhe aberto:
  // ao cruzar o 2xl, a instância escondida deixaria um overlay órfão na tela.
  // Fecha painel+detalhe quando esta instância deixa de ser a visível. 1536px =
  // 2xl do Tailwind, em sincronia com os 2xl:hidden/2xl:flex do Header.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1536px)");
    function closeIfInactive() {
      const active = variant === "desktop" ? mql.matches : !mql.matches;
      if (!active) {
        setOpen(false);
        setSelected(null);
      }
    }
    mql.addEventListener("change", closeIfInactive);
    return () => mql.removeEventListener("change", closeIfInactive);
  }, [variant]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      onOpen?.();
      void refresh({ silent: true });
    } else {
      // Fechar o painel volta à lista: reabrir não cai direto num detalhe velho.
      setSelected(null);
    }
  }

  const triggerClass =
    "bnt-pressable relative inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-white text-slate-900 shadow-[2px_2px_0_#0f172a] hover:shadow-[3px_3px_0_#0f172a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 data-[state=open]:translate-y-[1px] data-[state=open]:bg-amber-100 data-[state=open]:shadow-[1px_1px_0_#0f172a]";
  const bellIconClass = `h-5 w-5 ${ringing ? "animate-bell-ring" : ""}`;

  if (variant === "mobile") {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger className={triggerClass} aria-label="Notificações">
          <Bell className={bellIconClass} strokeWidth={2.5} />
          <UnreadBadge count={unreadCount} />
        </SheetTrigger>
        {/* [&>button]:hidden esconde o SheetPrimitive.Close default do ui/sheet
            (o único <button> filho direto do SheetContent). ui/ é gerado e não
            deve ser editado; o X visível é o nosso SheetClose no header do
            painel/detalhe. Não remova este seletor sem prover outro X. */}
        <SheetContent
          side="right"
          aria-describedby={undefined}
          className="z-[1005] w-full gap-0 border-l-2 border-slate-900 bg-white p-0 sm:max-w-md [&>button]:hidden"
        >
          <SheetTitle className="sr-only">Notificações</SheetTitle>
          {/* Detalhe é camada absolute sobre a lista, que fica montada por baixo
              (scroll preservado ao voltar). */}
          <div className="relative flex min-h-0 flex-1 flex-col">
            <NotificationsPanel
              variant="sheet"
              onClose={() => setOpen(false)}
              onSelect={setSelected}
            />
            {selected ? (
              <div className="absolute inset-0 z-10 bg-white">
                <NotificationDetailSheet
                  item={selected}
                  onBack={() => setSelected(null)}
                  onClose={() => setOpen(false)}
                />
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger className={triggerClass} aria-label="Notificações">
          <Bell className={bellIconClass} strokeWidth={2.5} />
          <UnreadBadge count={unreadCount} />
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={10}
          className="max-h-[70vh] w-[400px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border-2 border-slate-900 bg-white p-0 shadow-[5px_5px_0_#0f172a]"
        >
          <NotificationsPanel
            onClose={() => setOpen(false)}
            onSelect={(item) => {
              // Fecha o popover e abre o modal (o modal é irmão, fora do popover).
              setOpen(false);
              setSelected(item);
            }}
          />
        </PopoverContent>
      </Popover>
      <NotificationDetailDialog
        item={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
