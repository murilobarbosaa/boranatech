import { useEffect, useId, useState } from "react";
import { Trash2 } from "lucide-react";

/**
 * Modal de exclusao de conta, com CONFIRMACAO DIGITADA.
 *
 * Extraido de `pages/Perfil.tsx`, onde vivia inline, para o mesmo diretorio dos
 * irmaos (`SignOutConfirmModal`, `CancelSubscriptionModal`,
 * `ResetQuizConfirmModal`). O motivo nao e organizacao: e que a regra do gate
 * precisa de teste, e testar o gate de dentro da pagina exigiria montar 2200
 * linhas com AuthContext, SubscriptionContext, supabase e wouter em volta.
 *
 * COMPORTAMENTO PRESERVADO na extracao: o clique no fundo fecha (exceto durante
 * o loading), o clique no cartao nao propaga, e NAO ha atalho de Escape. O
 * irmao `SignOutConfirmModal` tem Escape e este nunca teve; acrescentar aqui
 * seria mudar comportamento numa mudanca que existe para AUMENTAR o atrito, na
 * direcao contraria.
 */

/**
 * A palavra que libera o botao.
 *
 * Comparacao EXATA, sensivel a maiusculas, com `trim` so nas pontas. Nao e
 * `toUpperCase()` nem `localeCompare`: o atrito E o recurso. Quem digita
 * "excluir" em minusculas nao provou intencao a mais do que quem clicou sem ler,
 * que e exatamente o caso que este campo existe para separar. O `trim` cobre o
 * espaco que o teclado do celular acrescenta sozinho depois de uma palavra, que
 * e acidente de entrada e nao falta de intencao.
 */
export const PALAVRA_DE_CONFIRMACAO = "EXCLUIR";

/** Regra do gate, exportada para o teste afirmar a REGRA, nao a renderizacao. */
export function confirmacaoDigitadaValida(digitado: string): boolean {
  return digitado.trim() === PALAVRA_DE_CONFIRMACAO;
}

interface DeleteAccountConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
  /** Mostra o aviso de assinatura, e decide a copy entre cartao e boleto. */
  hasRealSubscription: boolean;
  isBoletoSubscription: boolean;
}

export function DeleteAccountConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  hasRealSubscription,
  isBoletoSubscription,
}: DeleteAccountConfirmModalProps) {
  const [digitado, setDigitado] = useState("");
  const inputId = useId();
  const apoioId = useId();

  // Zera A CADA ABERTURA. O componente nao desmonta quando fecha (ele devolve
  // `null` mais abaixo), entao sem isto o campo continuaria preenchido de uma
  // tentativa anterior e a segunda abertura ja nasceria com o botao liberado,
  // que e o oposto do que o campo existe para fazer.
  useEffect(() => {
    if (isOpen) setDigitado("");
  }, [isOpen]);

  if (!isOpen) return null;

  const liberado = confirmacaoDigitadaValida(digitado);
  const bloqueado = !liberado || Boolean(isLoading);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border-2 border-[var(--bnt-ink)] bg-white p-6 shadow-[4px_4px_0_var(--bnt-shadow)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-rose-700 bg-rose-100">
          <Trash2 className="h-5 w-5 text-rose-700" strokeWidth={2.5} />
        </div>
        <h2
          id="delete-modal-title"
          className="font-display text-2xl font-black text-rose-800"
        >
          Excluir conta
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Esta ação é permanente e irreversível. Todos os seus dados, favoritos
          e histórico de estudos serão apagados.
        </p>
        {/* AVISO DE ASSINATURA, e ele só existe porque o comportamento mudou.
            Até 2026-08-14 excluir a conta NÃO cancelava nada na Stripe: a
            cobrança continuava viva contra alguém que não existia mais no
            produto. Agora cancela, e a pessoa precisa saber disso ANTES, porque
            não há como desfazer.

            Boleto tem copy própria: não há assinatura recorrente para cancelar
            (a chave é uma sessão `cs_...`), o que morre é o período já pago.
            Dizer "cancelará a assinatura" ali seria descrever uma ação que não
            acontece.

            SOBRE REEMBOLSO, a copy NÃO decide nada. A versão anterior afirmava
            "sem reembolso do período restante", categórico, e isso é uma
            promessa ao contrário: a empresa avalia caso a caso, e uma negativa
            fechada na tela fica frágil diante do direito de arrependimento do
            CDC numa compra online recente. O que estas frases afirmam é só o que
            o sistema de fato faz (o acesso termina na hora e o período pago não
            volta sozinho) e para onde ir com o resto, que é uma conversa
            humana. */}
        {hasRealSubscription ? (
          <p
            data-testid="excluir-conta-aviso-assinatura"
            className="mt-3 rounded-2xl border-2 border-rose-300 bg-rose-50 p-3 text-sm font-bold text-rose-900"
          >
            {/* TODO(Ana): revisar a copy. */}
            {isBoletoSubscription
              ? "Excluir a conta encerra seu acesso Pro imediatamente. O período que você já pagou não é devolvido automaticamente. Se a compra foi recente, fale com a gente antes pelo oi@boranatech.com.br."
              : "Excluir a conta cancela sua assinatura na hora e o acesso Pro termina imediatamente. O período que você já pagou não é devolvido automaticamente. Se você assinou há pouco tempo, fale com a gente antes pelo oi@boranatech.com.br."}
          </p>
        ) : null}

        {/* CONFIRMACAO DIGITADA. `label` de verdade com `htmlFor`, nao
            placeholder: placeholder some quando a pessoa comeca a digitar, e
            leitor de tela nao o trata como nome do campo. */}
        <div className="mt-5">
          {/* TODO(Ana): revisar a copy. */}
          <label
            htmlFor={inputId}
            className="block text-sm font-bold text-slate-800"
          >
            Para confirmar, digite {PALAVRA_DE_CONFIRMACAO}
          </label>
          <input
            id={inputId}
            type="text"
            value={digitado}
            onChange={(event) => setDigitado(event.target.value)}
            onKeyDown={(event) => {
              // Enter NAO confirma. O campo nao esta dentro de um `form`, entao
              // hoje Enter ja seria inerte; o handler explicito existe para que
              // envolver isto num `form` amanha nao reintroduza o atalho de uma
              // tecla para a acao irreversivel.
              if (event.key === "Enter") event.preventDefault();
            }}
            disabled={isLoading}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-describedby={apoioId}
            className="mt-2 w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-2.5 font-mono text-sm font-bold text-slate-900 outline-none transition-colors focus:border-rose-500 disabled:opacity-60"
          />
          {/* APOIO SEMPRE PRESENTE, nao so quando erra. O botao cinza sozinho
              nao diz o que falta, e quem usa leitor de tela nem ve a cor; este
              texto e o `aria-describedby` do input e do botao. */}
          <p id={apoioId} className="mt-2 text-xs font-semibold text-slate-500">
            {/* TODO(Ana): revisar a copy. */}
            {liberado
              ? "Pronto. O botão abaixo está liberado."
              : `Digite ${PALAVRA_DE_CONFIRMACAO} para liberar o botão.`}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-full border-2 border-[var(--bnt-ink)] bg-white px-5 py-3 font-display font-black text-slate-700 shadow-[3px_3px_0_var(--bnt-shadow)] disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            // O rotulo do botao muda para "Excluindo..." durante a acao, entao
            // consultar por nome acessivel encontraria o botao em um estado e
            // nao no outro. O testid e estavel nos dois.
            data-testid="excluir-conta-confirmar"
            onClick={() => void onConfirm()}
            disabled={bloqueado}
            // `aria-disabled` junto do `disabled` de propósito: o `disabled`
            // impede o clique, e o `aria-disabled` mais o `aria-describedby`
            // fazem o leitor de tela dizer POR QUE, em vez de anunciar um botão
            // mudo e inalcançável.
            aria-disabled={bloqueado}
            aria-describedby={apoioId}
            className="flex-1 rounded-full border-2 border-rose-900 bg-rose-100 px-5 py-3 font-display font-black text-rose-800 shadow-[3px_3px_0_#7f1d1d] disabled:opacity-60"
          >
            {isLoading ? "Excluindo..." : "Confirmar exclusão"}
          </button>
        </div>
      </div>
    </div>
  );
}
