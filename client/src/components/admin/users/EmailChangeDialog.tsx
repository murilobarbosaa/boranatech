import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/adminApi";
import { showActionToast, showErrorToast } from "@/lib/notify";
import { validateEmailForSending } from "@shared/emailValidation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LAYER_IN_DIALOG } from "@/components/admin/tasks/taskLayers";

// Troca de e-mail em DOIS passos. O primeiro coleta e confere; o segundo lista
// os efeitos concretos antes de executar.
//
// A confirmacao digitada existe para pegar erro de digitacao, nao para criar
// fricção: colar nos dois campos e aceitável. O endereco atual esta errado
// justamente porque alguem digitou errado uma vez.

const INPUT =
  "w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:bg-yellow-50 disabled:opacity-60";

const BOTAO =
  "rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase transition hover:bg-yellow-50 disabled:opacity-60";

type UsoDoEmail = { table: string; label: string; count: number | null };

export function EmailChangeDialog({
  userId,
  emailAtual,
  open,
  onOpenChange,
  onChanged,
}: {
  userId: string;
  emailAtual: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [passo, setPasso] = useState<1 | 2>(1);
  const [novo, setNovo] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [trocando, setTrocando] = useState(false);
  const [uso, setUso] = useState<UsoDoEmail[] | null>(null);

  // Reset ao abrir: o dialogo nao guarda rascunho entre aberturas.
  useEffect(() => {
    if (!open) return;
    setPasso(1);
    setNovo("");
    setConfirmacao("");
    setErro(null);
    setTrocando(false);
  }, [open]);

  // O que existe hoje ligado ao endereco atual. Buscado na abertura para o
  // passo 2 ja ter o numero; falha vira lista vazia, sem derrubar a troca (o
  // preview e informativo, nao pre-requisito).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    adminFetch(`/users/${userId}/email-usage`)
      .then((json) => {
        if (!cancelled) setUso(json.data?.usage ?? []);
      })
      .catch(() => {
        if (!cancelled) setUso([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  function avancar() {
    const a = novo.trim().toLowerCase();
    const b = confirmacao.trim().toLowerCase();

    // Mesma fonte de validacao do cadastro e da waitlist
    // (shared/emailValidation.ts): sintaxe, tamanho e dominios/TLDs reservados.
    const check = validateEmailForSending(a);
    if (!check.ok) {
      setErro(
        check.reason === "reserved"
          ? "Este domínio de e-mail não pode ser usado."
          : "E-mail inválido.",
      );
      return;
    }
    if (a !== b) {
      setErro("Os dois e-mails não são iguais.");
      return;
    }
    if (a === (emailAtual ?? "").trim().toLowerCase()) {
      setErro("Este já é o e-mail da conta.");
      return;
    }
    setErro(null);
    setPasso(2);
  }

  async function trocar() {
    if (trocando) return;
    setTrocando(true);
    try {
      await adminFetch(`/users/${userId}/email`, {
        method: "POST",
        body: JSON.stringify({ email: novo.trim().toLowerCase() }),
      });
      onOpenChange(false);
      onChanged();
      showActionToast({ message: "E-mail trocado. O login já é o novo." });
    } catch (err) {
      // A rota traduz a colisao em mensagem legivel; aqui so repassamos.
      showErrorToast(
        err instanceof Error
          ? err.message
          : "Não foi possível trocar o e-mail.",
      );
    } finally {
      setTrocando(false);
    }
  }

  const comLinhas = (uso ?? []).filter((u) => (u.count ?? 0) > 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        overlayClassName={LAYER_IN_DIALOG}
        className={`${LAYER_IN_DIALOG} max-h-[85dvh] w-[min(34rem,94vw)] max-w-none overflow-y-auto rounded-2xl border-2 border-slate-950 bg-white p-5 shadow-[6px_6px_0_#0f172a] sm:p-6`}
      >
        <AlertDialogTitle className="font-display text-2xl font-black text-slate-950">
          Trocar e-mail
        </AlertDialogTitle>

        {passo === 1 ? (
          <>
            <AlertDialogDescription className="text-sm font-semibold text-slate-600">
              E-mail atual: {emailAtual || "sem e-mail"}
            </AlertDialogDescription>

            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="novo-email"
                  className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
                >
                  Novo e-mail
                </label>
                <input
                  id="novo-email"
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  value={novo}
                  onChange={(e) => {
                    setNovo(e.target.value);
                    setErro(null);
                  }}
                  className={INPUT}
                />
              </div>
              <div>
                <label
                  htmlFor="confirma-email"
                  className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
                >
                  Confirme o novo e-mail
                </label>
                <input
                  id="confirma-email"
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  value={confirmacao}
                  onChange={(e) => {
                    setConfirmacao(e.target.value);
                    setErro(null);
                  }}
                  className={INPUT}
                />
              </div>
              {erro ? (
                <p className="text-xs font-black text-rose-700">{erro}</p>
              ) : null}
            </div>

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
                <p className="rounded-xl border-2 border-slate-900 bg-yellow-50 p-3 font-bold">
                  {emailAtual || "sem e-mail"} → {novo.trim().toLowerCase()}
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    O login passa a ser o novo endereço, imediatamente e sem
                    e-mail de confirmação.
                  </li>
                  <li>A senha não muda.</li>
                  <li>
                    Os recibos da Stripe passam a ir para o novo endereço.
                  </li>
                  <li>
                    As listas de e-mail{" "}
                    <strong>continuam com o endereço antigo</strong>; nada nelas
                    é migrado automaticamente.
                  </li>
                </ul>

                {comLinhas.length ? (
                  <div className="rounded-xl border-2 border-amber-500 bg-amber-50 p-3">
                    <p className="text-[11px] font-black uppercase tracking-wide text-amber-800">
                      Ainda ligado ao endereço antigo
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {comLinhas.map((linha) => (
                        <li
                          key={linha.table}
                          className="text-xs font-bold text-amber-900"
                        >
                          {linha.label}: {linha.count}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </AlertDialogDescription>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasso(1)}
                disabled={trocando}
                className={BOTAO}
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => void trocar()}
                disabled={trocando}
                className="rounded-full border-2 border-slate-900 bg-rose-300 px-4 py-1.5 text-xs font-black uppercase disabled:opacity-60"
              >
                {trocando ? "Trocando..." : "Trocar agora"}
              </button>
            </div>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
