import { Barcode, CreditCard } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CheckoutPaymentMethod } from "@/services/subscriptionService";

// Escolha do metodo de pagamento nos planos anual/semestral (o mensal e cartao-only,
// nao abre este dialog). Reusa a primitiva Dialog de components/ui (igual ao
// ProUpsellModal). captureCheckoutStarted dispara no onSelect (confirmacao), nunca
// ao abrir: quem abre e fecha nao iniciou checkout.

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (method: CheckoutPaymentMethod) => void;
}

const OPTIONS: Array<{
  method: CheckoutPaymentMethod;
  icon: typeof CreditCard;
  title: string;
  note: string;
}> = [
  {
    method: "card",
    icon: CreditCard,
    title: "Cartão de crédito",
    note: "Renovação automática.",
  },
  {
    method: "boleto",
    icon: Barcode,
    title: "Boleto",
    note: "Vence em 3 dias. Você renova manualmente quando chegar perto do vencimento.",
  },
];

export default function PaymentMethodDialog({
  open,
  onOpenChange,
  onSelect,
}: PaymentMethodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a] sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black text-slate-950">
            Como você quer pagar?
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-3">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.method}
                type="button"
                onClick={() => onSelect(option.method)}
                className="bnt-pressable flex w-full items-center gap-3 rounded-2xl border-2 border-slate-950 bg-white p-4 text-left shadow-[3px_3px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0f172a]"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-[#FFB800]">
                  <Icon className="h-5 w-5 text-slate-950" strokeWidth={2.5} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display font-black text-slate-950">
                    {option.title}
                  </span>
                  <span className="block text-sm font-medium text-slate-600">
                    {option.note}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
