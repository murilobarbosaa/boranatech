import { Barcode, CreditCard, QrCode } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CheckoutPaymentMethod } from "@/services/subscriptionService";
import {
  allowedPaymentMethods,
  type PaymentMethodId,
} from "@shared/paymentMethods";
import type { PlanId } from "@shared/planPricing";

// Escolha do metodo de pagamento. Reusa a primitiva Dialog de components/ui
// (igual ao ProUpsellModal). captureCheckoutStarted dispara no onSelect
// (confirmacao), nunca ao abrir: quem abre e fecha nao iniciou checkout.
//
// QUAIS OPCOES APARECEM vem de `allowedPaymentMethods` (shared/paymentMethods.ts),
// o mesmo ponto que a rota consulta. Antes o componente listava os meios em duro e
// quem decidia era um `if (selectedPlan === "pro_monthly")` na pagina: um meio
// novo aparecia para todo plano ate alguem lembrar de proibir. Agora um meio que
// o plano nao declara simplesmente nao e renderizado.

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (method: CheckoutPaymentMethod) => void;
  /** Plano em foco. Decide quais meios existem neste dialog. */
  planId: PlanId;
}

// Apresentacao de cada meio. O mapa cobre a uniao FECHADA de
// `PaymentMethodId`, entao um meio novo no ponto unico obriga uma entrada aqui e
// o `tsc` cobra; nao ha fallback silencioso que renderizaria um botao sem rotulo.
const METHOD_UI: Record<
  PaymentMethodId,
  { icon: typeof CreditCard; title: string; note: string }
> = {
  card: {
    icon: CreditCard,
    title: "Cartão de crédito",
    note: "Renovação automática.",
  },
  boleto: {
    icon: Barcode,
    title: "Boleto",
    note: "Vence em 3 dias. Você renova manualmente quando chegar perto do vencimento.",
  },
  // O prazo NAO pode herdar a promessa do boleto: Pix cai em segundos, e o
  // "vence em 2 dias" aqui e a validade do QR Code, nao o tempo de compensacao.
  // A nota do Pix varia por plano: ver `PIX_NOTE_BY_PLAN`.
  pix: {
    icon: QrCode,
    title: "Pix",
    note: "Cai na hora. O código vence em 2 dias e você renova manualmente.",
  },
};

// Copy do Pix por plano. Mapa FECHADO sobre `PlanId`: um plano novo obriga uma
// entrada aqui e o `tsc` cobra. No mensal a renovacao e todo mes, e a frase
// diz isso antes de a pessoa escolher; nos outros vale a nota geral acima.
// TODO(Ana)
const PIX_NOTE_BY_PLAN: Record<PlanId, string> = {
  pro_monthly:
    "Cai na hora. Renovação manual todo mês; avisamos por e-mail antes de vencer.",
  pro_semiannual: METHOD_UI.pix.note,
  pro_annual: METHOD_UI.pix.note,
};

export default function PaymentMethodDialog({
  open,
  onOpenChange,
  onSelect,
  planId,
}: PaymentMethodDialogProps) {
  const options = allowedPaymentMethods(planId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_var(--bnt-shadow)] sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black text-slate-950">
            Como você quer pagar?
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-3">
          {options.map((method) => {
            const option = METHOD_UI[method];
            const Icon = option.icon;
            const note =
              method === "pix" ? PIX_NOTE_BY_PLAN[planId] : option.note;
            return (
              <button
                key={method}
                type="button"
                onClick={() => onSelect(method)}
                className="bnt-pressable flex w-full items-center gap-3 rounded-2xl border-2 border-slate-950 bg-white p-4 text-left shadow-[3px_3px_0_var(--bnt-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--bnt-shadow)]"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-[var(--brand-yellow)]">
                  <Icon className="h-5 w-5 text-slate-950" strokeWidth={2.5} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display font-black text-slate-950">
                    {option.title}
                  </span>
                  <span className="block text-sm font-medium text-slate-600">
                    {note}
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
