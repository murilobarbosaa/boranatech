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
import { fmtBrl, fmtDate } from "./userFormat";

// Emissão de reembolso, em dois passos. É a ÚNICA ação sem desfazer da aba, e
// o desenho reflete isso: o passo 2 exige que o admin DIGITE o valor, para
// forçar leitura em vez de confirmação automática.

const BOTAO =
  "rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase transition hover:bg-yellow-50 disabled:opacity-60";

const INPUT =
  "w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:bg-yellow-50 disabled:opacity-60";

/** "12,34" ou "12.34" -> 1234. null quando não dá para ler. */
export function centavosDeTexto(valor: string): number | null {
  const limpo = valor.replace(/[^\d.,]/g, "").replace(",", ".");
  if (!limpo) return null;
  const n = Number(limpo);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function RefundDialog({
  charge,
  ...resto
}: {
  userId: string;
  charge: TransactionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  // Sem cobrança escolhida não há diálogo. Separar em dois componentes evita
  // hook condicional e deixa o corpo sem `charge!` espalhado.
  if (!charge) return null;
  return <RefundDialogInterno charge={charge} {...resto} />;
}

function RefundDialogInterno({
  userId,
  charge,
  open,
  onOpenChange,
  onDone,
}: {
  userId: string;
  charge: TransactionItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [passo, setPasso] = useState<1 | 2>(1);
  const [total, setTotal] = useState(true);
  const [valorTexto, setValorTexto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [emitindo, setEmitindo] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPasso(1);
    setTotal(true);
    setValorTexto("");
    setMotivo("");
    setConfirmacao("");
    setErro(null);
    setEmitindo(false);
  }, [open]);

  const teto = charge.refundable_cents;
  const valorEscolhido = total ? teto : centavosDeTexto(valorTexto);
  const tetoMenorQueBruto = teto < charge.gross_cents;

  function avancar() {
    if (!motivo.trim()) {
      setErro("Informe o motivo do reembolso.");
      return;
    }
    if (!valorEscolhido || valorEscolhido <= 0) {
      setErro("Informe um valor válido.");
      return;
    }
    if (valorEscolhido > teto) {
      setErro(`O máximo reembolsável é ${fmtBrl(teto)}.`);
      return;
    }
    setErro(null);
    setConfirmacao("");
    setPasso(2);
  }

  // O valor digitado no passo 2 tem de bater com o escolhido. O campo nasce
  // VAZIO de propósito: pré-preencher e pedir "confirmação" seria só mais um
  // clique, e o objetivo é obrigar a ler o número.
  const confirmacaoOk =
    valorEscolhido !== null && centavosDeTexto(confirmacao) === valorEscolhido;

  async function emitir() {
    if (emitindo || !confirmacaoOk || !valorEscolhido) return;
    setEmitindo(true);
    try {
      const json = await adminFetch(`/users/${userId}/refunds`, {
        method: "POST",
        body: JSON.stringify({
          charge_id: charge.stripe_charge_id,
          amount_cents: valorEscolhido,
          reason: motivo.trim(),
        }),
      });
      onOpenChange(false);
      onDone();
      // Se o extrato não pôde ser atualizado, o reembolso AINDA aconteceu. A
      // mensagem diz as duas coisas, nunca só a segunda.
      showActionToast({
        message:
          json.data?.statement_synced === false
            ? "Reembolso emitido. O extrato pode levar alguns minutos para atualizar."
            : "Reembolso emitido.",
      });
    } catch (err) {
      showErrorToast(
        err instanceof Error
          ? err.message
          : "Não foi possível emitir o reembolso.",
      );
    } finally {
      setEmitindo(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        overlayClassName={LAYER_IN_DIALOG}
        className={`${LAYER_IN_DIALOG} max-h-[85dvh] w-[min(34rem,94vw)] max-w-none overflow-y-auto rounded-2xl border-2 border-slate-950 bg-white p-5 shadow-[6px_6px_0_#0f172a] sm:p-6`}
      >
        <AlertDialogTitle className="font-display text-2xl font-black text-slate-950">
          Reembolsar cobrança
        </AlertDialogTitle>

        {passo === 1 ? (
          <>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm font-semibold text-slate-700">
                <div className="rounded-xl border-2 border-slate-900 bg-yellow-50 p-3">
                  <p className="font-display text-lg font-black text-slate-950">
                    {fmtBrl(charge.gross_cents)}
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    {fmtDate(charge.occurred_at)} · {charge.stripe_charge_id}
                  </p>
                  <p
                    data-testid="teto-reembolso"
                    className="mt-2 text-xs font-black uppercase tracking-wide text-slate-700"
                  >
                    Disponível para reembolso: {fmtBrl(teto)}
                  </p>
                  {/* Teto menor que o bruto tem sempre uma causa concreta; dizer
                      qual evita o admin achar que o sistema errou. */}
                  {tetoMenorQueBruto ? (
                    <p
                      data-testid="explicacao-teto"
                      className="mt-1 text-xs font-semibold text-amber-800"
                    >
                      {charge.disputed_cents > 0
                        ? `Menor que o valor da cobrança porque ${fmtBrl(charge.disputed_cents)} saíram em chargeback.`
                        : `Menor que o valor da cobrança porque ${fmtBrl(charge.refunded_cents)} já foram reembolsados.`}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTotal(true)}
                    className={`${BOTAO} ${total ? "bg-yellow-300" : ""}`}
                  >
                    Total
                  </button>
                  <button
                    type="button"
                    onClick={() => setTotal(false)}
                    className={`${BOTAO} ${!total ? "bg-yellow-300" : ""}`}
                  >
                    Parcial
                  </button>
                </div>

                {!total ? (
                  <div>
                    <label
                      htmlFor="valor-reembolso"
                      className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
                    >
                      Valor (R$)
                    </label>
                    <input
                      id="valor-reembolso"
                      inputMode="decimal"
                      value={valorTexto}
                      onChange={(e) => {
                        setValorTexto(e.target.value);
                        setErro(null);
                      }}
                      className={INPUT}
                    />
                  </div>
                ) : null}

                <div>
                  <label
                    htmlFor="motivo-reembolso"
                    className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
                  >
                    Motivo (obrigatório)
                  </label>
                  <textarea
                    id="motivo-reembolso"
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
                <p
                  data-testid="aviso-irreversivel"
                  className="rounded-xl border-2 border-rose-600 bg-rose-50 p-3 font-bold text-rose-900"
                >
                  Reembolso de {fmtBrl(valorEscolhido ?? 0)}. Esta ação é
                  irreversível: o dinheiro sai e não volta por aqui.
                </p>
                <p
                  data-testid="aviso-assinatura"
                  className="rounded-xl border-2 border-slate-300 bg-slate-50 p-3"
                >
                  A assinatura <strong>não será cancelada</strong>. Se for para
                  encerrar o acesso também, use “Cancelar Pro” depois.
                </p>

                <div>
                  <label
                    htmlFor="confirma-valor"
                    className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
                  >
                    Digite o valor para liberar
                  </label>
                  <input
                    id="confirma-valor"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0,00"
                    value={confirmacao}
                    onChange={(e) => setConfirmacao(e.target.value)}
                    className={INPUT}
                  />
                </div>
              </div>
            </AlertDialogDescription>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasso(1)}
                disabled={emitindo}
                className={BOTAO}
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => void emitir()}
                disabled={emitindo || !confirmacaoOk}
                className="rounded-full border-2 border-slate-900 bg-rose-300 px-4 py-1.5 text-xs font-black uppercase disabled:opacity-60"
              >
                {emitindo ? "Reembolsando..." : "Reembolsar agora"}
              </button>
            </div>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
