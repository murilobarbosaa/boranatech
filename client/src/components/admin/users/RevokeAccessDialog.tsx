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

import type { TransactionsPayload, UserDetail } from "./types";
import { ehRecuperacaoDeEstadoMeioFeito } from "./refundAccessCopy";
import { fmtBrl, fmtDate, planLabelOf } from "./userFormat";

// REVOGAÇÃO AVULSA de acesso Pro.
//
// A coisa que esta tela existe para não deixar acontecer: alguém usar isto
// achando que devolve dinheiro. É a única diferença entre esta ação e o
// reembolso, e é a que se confunde. Por isso a afirmação de que NADA será
// devolvido não é ressalva no pé: ela é o rótulo da própria caixa de
// confirmação, e sem marcá-la o botão não libera.
//
// O destaque de RECUPERAÇÃO aparece só quando a pessoa já teve o dinheiro de
// volta e continuou Pro. Fora disso, revogar sem devolver é o uso normal, e
// avisar como se fosse anomalia treinaria o admin a ignorar o aviso.

const BOTAO =
  "rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase transition hover:bg-yellow-50 disabled:opacity-60";

export function RevokeAccessDialog({
  userId,
  detail,
  transactions,
  open,
  onOpenChange,
  onChanged,
}: {
  userId: string;
  detail: UserDetail;
  transactions: TransactionsPayload | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [declarado, setDeclarado] = useState(false);
  const [revogando, setRevogando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMotivo("");
    setDeclarado(false);
    setErro(null);
    setRevogando(false);
  }, [open]);

  // pro_source vem da rota de detalhe, calculado pela MESMA função que alimenta
  // a lista (resolveProSource). Não recalculamos aqui: duas montagens da mesma
  // regra divergem na primeira mudança. Mesmo critério do CancelSubscriptionDialog.
  const temInfluencer =
    detail.pro_source === "influencer" || detail.pro_source === "both";

  const recuperacao = ehRecuperacaoDeEstadoMeioFeito(transactions);

  async function confirmar() {
    if (revogando || !declarado) return;
    if (!motivo.trim()) {
      setErro("Informe o motivo da revogação.");
      return;
    }
    setRevogando(true);
    try {
      const json = await adminFetch(`/users/${userId}/subscription/revoke`, {
        method: "POST",
        body: JSON.stringify({ reason: motivo.trim() }),
      });
      onOpenChange(false);
      onChanged();

      if (json.data?.already_revoked) {
        showActionToast({
          message: "O acesso por assinatura já estava revogado.",
        });
        return;
      }

      // O aviso de influencer vira toast de ERRO: a ação terminou, mas a pessoa
      // continua Pro, e um toast de sucesso que some sozinho deixaria isso
      // passar como se o acesso tivesse caído.
      if (json.data?.still_pro_via_influencer) {
        showErrorToast(
          "Assinatura revogada, mas a pessoa CONTINUA Pro pela concessão de influencer. Para tirar o acesso, revogue a concessão também.",
        );
        return;
      }
      showActionToast({ message: "Acesso Pro removido na hora." });
    } catch (err) {
      showErrorToast(
        err instanceof Error
          ? err.message
          : "Não foi possível revogar o acesso.",
      );
    } finally {
      setRevogando(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        overlayClassName={LAYER_IN_DIALOG}
        className={`${LAYER_IN_DIALOG} max-h-[85dvh] w-[min(34rem,94vw)] max-w-none overflow-y-auto rounded-2xl border-2 border-slate-950 bg-white p-5 shadow-[6px_6px_0_#0f172a] sm:p-6`}
      >
        <AlertDialogTitle className="font-display text-2xl font-black text-slate-950">
          Encerrar Pro agora?
        </AlertDialogTitle>

        <AlertDialogDescription asChild>
          <div className="space-y-3 text-sm font-semibold text-slate-700">
            <div className="grid gap-2 rounded-xl border-2 border-slate-900 bg-yellow-50 p-3 sm:grid-cols-2">
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Plano
                </span>
                {planLabelOf(detail.subscription?.plan_code)}
              </span>
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Valor pago (total)
                </span>
                {fmtBrl(detail.paid_total_cents)}
              </span>
              <span className="sm:col-span-2">
                <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Acesso iria até
                </span>
                {fmtDate(detail.subscription?.current_period_end)}
              </span>
            </div>

            <p>
              O acesso cai <strong>imediatamente</strong>, não no fim do
              período. A assinatura é cancelada no provedor e não renova.
            </p>

            {/* SÓ no estado meio-feito. É a recuperação acontecendo, e nomear
                isso é o que diferencia "estou consertando" de "estou tirando o
                acesso de alguém que pagou". */}
            {recuperacao ? (
              <p
                data-testid="aviso-recuperacao"
                className="rounded-xl border-2 border-amber-500 bg-amber-50 p-3 font-bold text-amber-900"
              >
                Esta pessoa já teve <strong>todo o valor devolvido</strong> e
                continuou com o acesso. É o estado que esta ação existe para
                consertar.
              </p>
            ) : null}

            {temInfluencer ? (
              <p
                data-testid="aviso-influencer"
                className="rounded-xl border-2 border-violet-700 bg-violet-50 p-3 font-bold text-violet-900"
              >
                Esta conta também tem acesso de influencer. Revogar a assinatura{" "}
                <strong>não remove o Pro</strong>: para isso, revogue a
                concessão de influencer.
              </p>
            ) : null}

            <div>
              <label
                htmlFor="motivo-revogacao"
                className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
              >
                Motivo (obrigatório)
              </label>
              <textarea
                id="motivo-revogacao"
                rows={2}
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  setErro(null);
                }}
                placeholder="Ex: reembolso saiu e o acesso ficou"
                className="w-full rounded-xl border-2 border-slate-900 bg-white p-2 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />
              {erro ? (
                <p className="mt-1 text-xs font-black text-rose-700">{erro}</p>
              ) : null}
            </div>

            {/* A AFIRMAÇÃO É A CONFIRMAÇÃO. Pôr isto como texto solto acima do
                botão faria dele mais uma linha para pular; sendo o rótulo da
                caixa que destrava a ação, ele tem de ser lido para prosseguir. */}
            <label
              htmlFor="declara-sem-devolucao"
              className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-rose-600 bg-rose-50 p-3"
            >
              <input
                id="declara-sem-devolucao"
                type="checkbox"
                checked={declarado}
                onChange={(e) => setDeclarado(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-rose-600"
              />
              <span className="text-sm font-bold text-rose-900">
                Entendo que <strong>nenhum valor será devolvido</strong>. Esta
                ação só remove o acesso; para devolver dinheiro, use Reembolsar
                no extrato de compras.
              </span>
            </label>
          </div>
        </AlertDialogDescription>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={revogando}
            className={BOTAO}
          >
            Manter acesso
          </button>
          <button
            type="button"
            onClick={() => void confirmar()}
            data-testid="confirmar-revogacao"
            disabled={revogando || !declarado}
            className="rounded-full border-2 border-slate-900 bg-rose-500 px-4 py-1.5 text-xs font-black uppercase text-white disabled:opacity-60"
          >
            {revogando ? "Removendo..." : "Encerrar Pro agora"}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
