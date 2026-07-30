import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/adminApi";
import { showActionToast, showErrorToast } from "@/lib/notify";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LAYER_IN_DIALOG } from "@/components/admin/tasks/taskLayers";

import type { UserDetail } from "./types";
import { fmtBrl, fmtDate, fmtText } from "./userFormat";

// Confirmação do cancelamento de assinatura. Ação destrutiva: mesmo padrão de
// AlertDialog que o TaskModal usa para exclusão.
//
// O cancelamento NÃO é imediato (é cancel_at_period_end), então o diálogo tem
// de mostrar até quando o acesso continua valendo — senão o admin acha que
// cortou na hora e responde errado a quem perguntar.

const BOTAO =
  "rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase transition hover:bg-yellow-50 disabled:opacity-60";

export function CancelSubscriptionDialog({
  userId,
  detail,
  open,
  onOpenChange,
  onChanged,
}: {
  userId: string;
  detail: UserDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMotivo("");
    setErro(null);
    setCancelando(false);
  }, [open]);

  // pro_source vem da rota de detalhe, calculado pela MESMA função que alimenta
  // a lista (resolveProSource). Não recalculamos aqui: duas montagens da mesma
  // regra divergem na primeira mudança.
  const temInfluencer =
    detail.pro_source === "influencer" || detail.pro_source === "both";

  async function confirmar() {
    if (cancelando) return;
    if (!motivo.trim()) {
      setErro("Informe o motivo do cancelamento.");
      return;
    }
    setCancelando(true);
    try {
      await adminFetch(`/users/${userId}/subscription/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: motivo.trim() }),
      });
      onOpenChange(false);
      onChanged();
      showActionToast({ message: "Cancelamento agendado." });
    } catch (err) {
      showErrorToast(
        err instanceof Error ? err.message : "Não foi possível cancelar.",
      );
    } finally {
      setCancelando(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        overlayClassName={LAYER_IN_DIALOG}
        className={`${LAYER_IN_DIALOG} max-h-[85dvh] w-[min(34rem,94vw)] max-w-none overflow-y-auto rounded-2xl border-2 border-slate-950 bg-white p-5 shadow-[6px_6px_0_#0f172a] sm:p-6`}
      >
        <AlertDialogTitle className="font-display text-2xl font-black text-slate-950">
          Cancelar assinatura?
        </AlertDialogTitle>

        <AlertDialogDescription asChild>
          <div className="space-y-3 text-sm font-semibold text-slate-700">
            <div className="grid gap-2 rounded-xl border-2 border-slate-900 bg-yellow-50 p-3 sm:grid-cols-2">
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Plano
                </span>
                {fmtText(detail.subscription?.plan_code)}
              </span>
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Pago até agora
                </span>
                {fmtBrl(detail.paid_total_cents)}
              </span>
              <span className="sm:col-span-2">
                <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Acesso Pro continua até
                </span>
                {fmtDate(detail.subscription?.current_period_end)}
              </span>
            </div>

            <p>
              O cancelamento <strong>não é imediato</strong>: a renovação é
              desligada e o acesso segue até a data acima.
            </p>

            {/* Sem este aviso o admin cancela, vê a pessoa continuar Pro e não
                entende. A concessão de influencer é um ramo independente de
                is_user_pro. */}
            {temInfluencer ? (
              <p
                data-testid="aviso-influencer"
                className="rounded-xl border-2 border-violet-700 bg-violet-50 p-3 font-bold text-violet-900"
              >
                Esta conta também tem acesso de influencer. Cancelar a
                assinatura <strong>não remove o Pro</strong>: para isso, revogue
                a concessão de influencer.
              </p>
            ) : null}

            <div>
              <label
                htmlFor="motivo-cancelamento"
                className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
              >
                Motivo (obrigatório)
              </label>
              <textarea
                id="motivo-cancelamento"
                rows={2}
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  setErro(null);
                }}
                placeholder="Ex: pedido por e-mail em 30/07"
                className="w-full rounded-xl border-2 border-slate-900 bg-white p-2 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />
              {erro ? (
                <p className="mt-1 text-xs font-black text-rose-700">{erro}</p>
              ) : null}
            </div>
          </div>
        </AlertDialogDescription>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={cancelando}
            className={BOTAO}
          >
            Manter assinatura
          </button>
          <button
            type="button"
            onClick={() => void confirmar()}
            disabled={cancelando}
            className="rounded-full border-2 border-slate-900 bg-rose-300 px-4 py-1.5 text-xs font-black uppercase disabled:opacity-60"
          >
            {cancelando ? "Cancelando..." : "Cancelar assinatura"}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
