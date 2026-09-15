import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { showActionToast, showErrorToast } from "@/lib/notify";
import {
  CheckoutError,
  cancelPendingPixCharge,
} from "@/services/subscriptionService";

export type CancelamentoPixResultado = "canceled" | "already_paid" | "gone";

/**
 * Textos que mudam por superficie. Todos opcionais: ausentes, o dialog e o do
 * Perfil e do modal Pix, palavra por palavra. O checkout os troca porque la o
 * cancelamento e so o meio: o que a pessoa quer e o Pix novo.
 */
export type CancelPendingPixCopy = {
  pergunta?: string;
  aviso?: string;
  confirmar?: string;
  sucesso?: string;
};

/**
 * CONFIRMACAO DO CANCELAMENTO DA COBRANCA PIX PENDENTE.
 *
 * Uma so para as duas superficies (bloco pendente do Perfil e modal Pix do
 * checkout): a chamada e a traducao dos desfechos moram aqui, e o chamador so
 * decide o que acontece DEPOIS, em `onResolved`.
 *
 * FALHA NAO CHAMA `onResolved`: a cobranca continua viva no Asaas e a linha
 * continua pendente, entao a tela tambem nao muda. So o toast avisa.
 */
export default function CancelPendingPixDialog({
  open,
  onClose,
  onResolved,
  copy,
  goneEhSucesso,
}: {
  open: boolean;
  onClose: () => void;
  onResolved: (resultado: CancelamentoPixResultado) => void;
  copy?: CancelPendingPixCopy;
  /**
   * `gone` (a cobranca ja nao estava pendente) e SUCESSO nesta superficie, e o
   * toast de erro nao sai. E o caso do checkout: a pessoa pediu um Pix novo, e
   * a cobranca anterior ter sumido antes e exatamente o que ela queria; o Pix
   * novo aparece em seguida e ja e o aviso. No Perfil e no modal ninguem pediu
   * nada, entao o aviso continua, porque ali a cobranca sumir e novidade.
   */
  goneEhSucesso?: boolean;
}) {
  const [cancelando, setCancelando] = useState(false);

  async function confirmar() {
    if (cancelando) return;
    setCancelando(true);
    try {
      await cancelPendingPixCharge();
      // TODO(Ana): copy do sucesso do cancelamento da cobranca Pix.
      showActionToast({
        message:
          copy?.sucesso ??
          "Cobrança cancelada. Você já pode escolher outro plano.",
      });
      onResolved("canceled");
    } catch (err) {
      const code = err instanceof CheckoutError ? err.code : "";
      if (code === "pagamento_ja_recebido") {
        // TODO(Ana): copy do Pix que ja estava pago na hora de cancelar.
        showActionToast({
          message: "Esse Pix já foi pago. Seu acesso Pro está sendo liberado.",
        });
        onResolved("already_paid");
      } else if (code === "sem_cobranca_pendente") {
        if (!goneEhSucesso) {
          // TODO(Ana): copy da cobranca que ja nao estava pendente.
          showErrorToast("Essa cobrança não está mais pendente.");
        }
        onResolved("gone");
      } else {
        // TODO(Ana): copy da falha ao cancelar a cobranca Pix.
        showErrorToast(
          "Não foi possível cancelar agora. Tente de novo em instantes.",
        );
      }
    } finally {
      setCancelando(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(aberto) => {
        if (!aberto && !cancelando) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="gap-0 rounded-3xl border-2 border-[var(--bnt-ink)] bg-white p-0 shadow-[4px_4px_0_var(--bnt-shadow)] sm:max-w-md"
      >
        {/* TODO(Ana): titulo do dialog de cancelar a cobranca Pix. */}
        <DialogTitle className="sr-only">Cancelar cobrança Pix</DialogTitle>
        <button
          type="button"
          onClick={onClose}
          disabled={cancelando}
          aria-label="Fechar"
          className="absolute right-4 top-4 rounded-full border-2 border-[var(--bnt-ink)] bg-white p-1.5 text-[var(--bnt-ink)] shadow-[2px_2px_0_var(--bnt-shadow)] transition-colors duration-200 hover:border-rose-600 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
        >
          <X className="h-4 w-4" strokeWidth={3} />
        </button>

        <div className="p-6 md:p-8">
          <div className="flex items-start gap-3 pr-8">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-[var(--bnt-ink)] bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <div>
              <h2 className="font-display text-2xl font-black text-[var(--bnt-ink)]">
                {/* TODO(Ana): pergunta do dialog de cancelar a cobranca Pix. */}
                {copy?.pergunta ?? "Cancelar esta cobrança?"}
              </h2>
              {/* TODO(Ana): aviso de que o QR atual deixa de valer. */}
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {copy?.aviso ??
                  "O código Pix atual deixa de valer. Depois disso, você pode escolher outro plano."}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={cancelando}
              className="bnt-pressable inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-full border-2 border-[var(--bnt-ink)] bg-white px-5 py-3 font-display font-black text-slate-600 shadow-[3px_3px_0_var(--bnt-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:text-[var(--bnt-ink)] hover:shadow-[5px_5px_0_var(--bnt-shadow)] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_var(--bnt-shadow)]"
            >
              {/* TODO(Ana): rotulo do botao de desistir do cancelamento. */}
              Voltar
            </button>
            <button
              type="button"
              onClick={() => void confirmar()}
              disabled={cancelando}
              className="bnt-pressable inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-full border-2 border-slate-950 bg-red-600 px-5 py-3 font-display font-black text-white shadow-[3px_3px_0_var(--bnt-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-[5px_5px_0_var(--bnt-shadow)] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_var(--bnt-shadow)]"
            >
              {/* TODO(Ana): rotulos do botao de confirmar o cancelamento. */}
              {cancelando
                ? "Cancelando..."
                : (copy?.confirmar ?? "Cancelar cobrança")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
