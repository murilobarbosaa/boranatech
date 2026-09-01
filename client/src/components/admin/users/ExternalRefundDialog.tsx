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

import type { TransactionItem } from "./types";
import { centavosDeTexto } from "./RefundDialog";
import { toastDeDevolucao, vaiRevogar } from "./refundAccessCopy";
import { fmtBrl, fmtDate } from "./userFormat";

// REGISTRO de uma devolução de boleto feita FORA da plataforma.
//
// A diferença de fundo para o RefundDialog: lá o passo 2 libera uma ação que o
// sistema vai EXECUTAR; aqui ele libera o registro de um fato que o sistema NÃO
// tem como verificar. Por isso a segunda etapa é uma afirmação explícita (uma
// caixa de confirmação), e não um botão: o que a tela pede não é "tem certeza?",
// é "você está declarando que devolveu". O texto diz isso com todas as letras,
// porque a auditoria vai guardar essa declaração como declaração.

const BOTAO =
  "rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase transition hover:bg-yellow-50 disabled:opacity-60";

const INPUT =
  "w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:bg-yellow-50 disabled:opacity-60";

export function ExternalRefundDialog({
  charge,
  ...resto
}: {
  userId: string;
  charge: TransactionItem | null;
  influencer?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  if (!charge) return null;
  return <ExternalRefundDialogInterno charge={charge} {...resto} />;
}

function ExternalRefundDialogInterno({
  userId,
  charge,
  influencer = false,
  open,
  onOpenChange,
  onDone,
}: {
  userId: string;
  charge: TransactionItem;
  influencer?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [passo, setPasso] = useState<1 | 2>(1);
  const teto = charge.refundable_cents;
  // PRÉ-PREENCHIDO com o total, e editável. Ao contrário do passo 2 do
  // RefundDialog (que nasce vazio para obrigar a leitura do número), aqui o
  // valor é um dado que o admin já conhece: ele acabou de fazer a transferência.
  const [valorTexto, setValorTexto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [declarado, setDeclarado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPasso(1);
    setValorTexto((teto / 100).toFixed(2).replace(".", ","));
    setMotivo("");
    setDeclarado(false);
    setErro(null);
    setEnviando(false);
  }, [open, teto]);

  const valorEscolhido = centavosDeTexto(valorTexto);
  const revogaraAcesso = vaiRevogar(valorEscolhido, teto);

  function avancar() {
    if (!motivo.trim()) {
      setErro("Informe o motivo da devolução.");
      return;
    }
    if (!valorEscolhido || valorEscolhido <= 0) {
      setErro("Informe um valor válido.");
      return;
    }
    if (valorEscolhido > teto) {
      setErro(`O máximo é ${fmtBrl(teto)}.`);
      return;
    }
    setErro(null);
    setDeclarado(false);
    setPasso(2);
  }

  async function registrar() {
    if (enviando || !declarado || !valorEscolhido) return;
    setEnviando(true);
    try {
      const json = await adminFetch(`/users/${userId}/external-refunds`, {
        method: "POST",
        body: JSON.stringify({
          charge_id: charge.stripe_charge_id,
          amount_cents: valorEscolhido,
          reason: motivo.trim(),
          // A declaração vai no corpo, e a ROTA a exige. Guarda só na tela seria
          // contornada pela primeira chamada direta.
          confirmed: true,
        }),
      });
      onOpenChange(false);
      onDone();

      if (json.data?.already_registered) {
        showActionToast({
          message: "Esta devolução já estava registrada. Nada foi duplicado.",
        });
        return;
      }

      // A frase muda conforme o caminho da liquidação, porque as consequências
      // são diferentes: no caso da Stripe o valor entra no extrato sozinho.
      const acaoFeita =
        json.data?.settlement === "stripe_dashboard"
          ? "Devolução registrada. Como já existe um reembolso na Stripe, o valor entra no extrato pelo sync."
          : "Devolução registrada. Ela existe só aqui: a Stripe não tem registro dela.";

      const { mensagem, erro: ehErro } = toastDeDevolucao({
        acaoFeita,
        acesso: json.data?.access,
        extratoSincronizado: json.data?.statement_synced !== false,
      });
      if (ehErro) showErrorToast(mensagem);
      else showActionToast({ message: mensagem });
    } catch (err) {
      showErrorToast(
        err instanceof Error
          ? err.message
          : "Não foi possível registrar a devolução.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        overlayClassName={LAYER_IN_DIALOG}
        className={`${LAYER_IN_DIALOG} max-h-[85dvh] w-[min(34rem,94vw)] max-w-none overflow-y-auto rounded-2xl border-2 border-slate-950 bg-white p-5 shadow-[6px_6px_0_var(--bnt-shadow)] sm:p-6`}
      >
        <AlertDialogTitle className="font-display text-2xl font-black text-slate-950">
          Registrar devolução de boleto
        </AlertDialogTitle>

        {passo === 1 ? (
          <>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm font-semibold text-slate-700">
                <p
                  data-testid="aviso-registro"
                  className="rounded-xl border-2 border-amber-500 bg-amber-50 p-3 font-bold text-amber-900"
                >
                  Boleto não tem devolução automática. Esta tela{" "}
                  <strong>não devolve dinheiro</strong>: ela registra na
                  plataforma uma devolução que você já fez por fora.
                </p>

                <div className="rounded-xl border-2 border-slate-900 bg-yellow-50 p-3">
                  <p className="font-display text-lg font-black text-slate-950">
                    {fmtBrl(charge.gross_cents)}
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    {fmtDate(charge.occurred_at)} · {charge.stripe_charge_id}
                  </p>
                  <p
                    data-testid="teto-registro"
                    className="mt-2 text-xs font-black uppercase tracking-wide text-slate-700"
                  >
                    Máximo a registrar: {fmtBrl(teto)}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="valor-devolucao"
                    className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
                  >
                    Valor devolvido (R$)
                  </label>
                  <input
                    id="valor-devolucao"
                    inputMode="decimal"
                    value={valorTexto}
                    onChange={(e) => {
                      setValorTexto(e.target.value);
                      setErro(null);
                    }}
                    className={INPUT}
                  />
                </div>

                <div>
                  <label
                    htmlFor="motivo-devolucao"
                    className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
                  >
                    Motivo (obrigatório)
                  </label>
                  <textarea
                    id="motivo-devolucao"
                    rows={2}
                    value={motivo}
                    onChange={(e) => {
                      setMotivo(e.target.value);
                      setErro(null);
                    }}
                    className={INPUT}
                  />
                </div>

                {erro ? (
                  <p className="text-xs font-black text-rose-700">{erro}</p>
                ) : null}
              </div>
            </AlertDialogDescription>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className={BOTAO}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={avancar}
                className="rounded-full border-2 border-slate-900 bg-yellow-300 px-4 py-1.5 text-xs font-black uppercase"
              >
                Continuar
              </button>
            </div>
          </>
        ) : (
          <>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm font-semibold text-slate-700">
                {revogaraAcesso ? (
                  <p
                    data-testid="aviso-acesso-registro"
                    className="rounded-xl border-2 border-rose-600 bg-rose-50 p-3 font-bold text-rose-900"
                  >
                    Isto zera o valor pago desta cobrança, então{" "}
                    <strong>o acesso Pro será removido na hora</strong>.
                    {influencer ? (
                      <>
                        {" "}
                        A pessoa tem concessão de <strong>influencer</strong> e
                        continuará Pro por ela: para tirar o acesso, revogue a
                        concessão também.
                      </>
                    ) : null}
                  </p>
                ) : (
                  <p
                    data-testid="aviso-acesso-registro"
                    className="rounded-xl border-2 border-slate-300 bg-slate-50 p-3"
                  >
                    Devolução parcial: <strong>o acesso Pro é mantido</strong>,
                    porque continua havendo valor pago.
                  </p>
                )}

                {/* CAIXA, não botão. O sistema não tem como verificar que a
                    devolução aconteceu, então o que ele grava é a palavra do
                    admin, e a tela precisa deixar claro que é isso que está
                    sendo registrado. */}
                <label
                  htmlFor="declara-devolucao"
                  className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-slate-900 bg-white p-3"
                >
                  <input
                    id="declara-devolucao"
                    type="checkbox"
                    checked={declarado}
                    onChange={(e) => setDeclarado(e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-rose-600"
                  />
                  <span className="text-sm font-bold text-slate-900">
                    Declaro que já devolvi {fmtBrl(valorEscolhido ?? 0)} a esta
                    pessoa por fora da plataforma. A plataforma não tem como
                    verificar isso e vai registrar esta declaração no histórico,
                    com o meu nome.
                  </span>
                </label>
              </div>
            </AlertDialogDescription>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasso(1)}
                disabled={enviando}
                className={BOTAO}
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => void registrar()}
                disabled={enviando || !declarado}
                className="rounded-full border-2 border-slate-900 bg-rose-300 px-4 py-1.5 text-xs font-black uppercase disabled:opacity-60"
              >
                {enviando ? "Registrando..." : "Registrar devolução"}
              </button>
            </div>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
