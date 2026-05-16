export type SubscriptionStatusVariant = "success" | "warning" | "danger" | "neutral";

export interface SubscriptionStatusInfo {
  label: string;
  variant: SubscriptionStatusVariant;
}

export function getStatusLabel(status: string | null | undefined): SubscriptionStatusInfo {
  switch (status) {
    case "active":
      return { label: "Ativo", variant: "success" };
    case "trialing":
    case "trial":
      return { label: "Período de teste", variant: "success" };
    case "past_due":
      return { label: "Pagamento atrasado", variant: "danger" };
    case "canceled":
      return { label: "Cancelado", variant: "warning" };
    case "expired":
      return { label: "Expirado", variant: "neutral" };
    case "pending":
      return { label: "Aguardando pagamento", variant: "warning" };
    case "free":
      return { label: "Plano Gratuito", variant: "neutral" };
    default:
      return { label: "Indefinido", variant: "neutral" };
  }
}

export function getCancellationLabel(
  cancelAtPeriodEnd: boolean,
  currentPeriodEnd?: string | null,
): string | null {
  if (!cancelAtPeriodEnd || !currentPeriodEnd) return null;

  const date = new Date(currentPeriodEnd);
  if (Number.isNaN(date.getTime())) return null;

  const formatted = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return `Cancelamento agendado para ${formatted}`;
}
