import { useState } from "react";
import { Bell } from "lucide-react";

import NotificationsPanel from "@/components/notifications/NotificationsPanel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useNotifications } from "@/contexts/NotificationsContext";

// Sino de notificações do Header. Desktop: Popover ancorado no botão.
// Mobile: entrada no drawer que abre um Sheet quase em tela cheia (o drawer
// fecha antes via onOpen, senão os dois overlays brigam).

function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-slate-950 bg-red-600 px-1 text-[10px] font-black leading-none text-white"
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

export default function NotificationBell({
  variant,
  onOpen,
}: {
  variant: "desktop" | "mobile";
  onOpen?: () => void;
}) {
  const { unreadCount, refresh } = useNotifications();
  const [open, setOpen] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      onOpen?.();
      void refresh({ silent: true });
    }
  }

  if (variant === "mobile") {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger
          className="relative mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
          Notificações
          <UnreadBadge count={unreadCount} />
        </SheetTrigger>
        <SheetContent
          side="right"
          aria-describedby={undefined}
          className="z-[1005] w-full gap-0 border-l-2 border-slate-900 bg-white p-0 sm:max-w-md"
        >
          <SheetTitle className="sr-only">Notificações</SheetTitle>
          <NotificationsPanel onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className="relative inline-flex items-center justify-center rounded-full border-2 border-slate-900 bg-white p-2 text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        aria-label="Notificações"
      >
        <Bell className="h-4 w-4" />
        <UnreadBadge count={unreadCount} />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="max-h-[70vh] w-[400px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border-2 border-slate-900 bg-white p-0 shadow-[5px_5px_0_#0f172a]"
      >
        <NotificationsPanel onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
