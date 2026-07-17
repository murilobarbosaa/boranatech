import type { NotificationType } from "@/services/notificationsService";

// Fonte única de rótulo + classe de badge por tipo de notificação. Usada pelo
// admin (NotificationsManager) e pelo detalhe do usuário (NotificationDetail),
// pra tag e cores não divergirem entre as duas telas. As classes trazem a
// própria cor de borda (border-*), então quem consome só acrescenta a espessura
// (border-2) e o formato.
export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  { label: string; badge: string }
> = {
  announcement: {
    label: "Anúncio",
    badge: "border-sky-800 bg-sky-100 text-sky-800",
  },
  coupon: {
    label: "Cupom",
    badge: "border-amber-700 bg-amber-100 text-amber-800",
  },
  optin: {
    label: "Opt-in",
    badge: "border-violet-800 bg-violet-100 text-violet-800",
  },
  system: {
    label: "Sistema",
    badge: "border-slate-600 bg-slate-100 text-slate-700",
  },
};
