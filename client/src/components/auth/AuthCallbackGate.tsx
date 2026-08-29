import { useState, type ReactNode } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  callbackMessageForCode,
  NAO_CONFIRMADO,
} from "./authCallbackMessages";

// Aviso explícito de retorno de OAuth não-conclusivo (itens 1.2 e 1.3).
//
// Existe porque o comportamento anterior era o oposto de um aviso: o timer de
// segurança zerava a sessão e o app caía para "não autenticado", então os guards de
// rota redirecionavam para o login e a pessoa via uma tela de login sem nenhuma
// explicação. Indistinguível de "minha conta sumiu".
//
// Fica ACIMA do ConsentGate na árvore: não dá para perguntar sobre consentimento de
// uma sessão que não conseguimos confirmar.
//
// Só intercepta quando há issue, e `callbackIssue` só é setado com sessão ausente,
// então este componente nunca aparece para quem está logado.
export default function AuthCallbackGate({
  children,
}: {
  children: ReactNode;
}) {
  const { callbackIssue, callbackSlow, loading, retryCallback } = useAuth();
  const [retrying, setRetrying] = useState(false);

  // Item 1.8. Mensagem de progresso, NÃO de erro: sem ação, sem mudar o fluxo, só
  // sinalizando que a página está viva. O que havia aqui durante a espera era um
  // spinner mudo (RequireAuth), e spinner mudo por 20s faz a pessoa recarregar por
  // volta dos 10s, o que mata o timer antes do desfecho e apaga a telemetria.
  //
  // Condicionado a `loading` também, e não só a `callbackSlow`: garante que a
  // mensagem desapareça no instante em que o desfecho chega, mesmo que alguma
  // ordem de atualização de estado deixe a flag para trás.
  if (!callbackIssue && callbackSlow && loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#faf8f4] p-4">
        <span
          aria-hidden
          className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-300 border-t-slate-900"
        />
        {/* TODO(Ana): copy da mensagem de progresso do login social. */}
        <p role="status" className="text-sm font-bold text-slate-700">
          Confirmando seu login, só um instante...
        </p>
      </div>
    );
  }

  if (!callbackIssue) return <>{children}</>;

  const mensagem =
    callbackIssue.kind === "unconfirmed"
      ? NAO_CONFIRMADO
      : callbackMessageForCode(callbackIssue.code);

  async function handleRetry() {
    setRetrying(true);
    try {
      await retryCallback();
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf8f4] p-4">
      <div
        role="alert"
        className="w-full max-w-md rounded-2xl border-2 border-slate-950 bg-white p-6 text-center shadow-[6px_6px_0_var(--bnt-shadow)]"
      >
        <h2 className="font-display text-xl font-black text-slate-950">
          {mensagem.titulo}
        </h2>
        <p className="mt-2 text-sm text-slate-700">{mensagem.texto}</p>

        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="btn-brutal-accent mt-6 inline-flex w-full justify-center rounded-full px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {/* TODO(Ana): rótulo do botão de tentar novamente no aviso de callback. */}
          {retrying ? "Verificando..." : "Tentar novamente"}
        </button>

        {/* Segunda saída, e ela é necessária: se a troca PKCE realmente falhou, o
            `code` da URL já foi consumido ou perdeu o verifier, e reconsultar a
            sessão nunca vai achar nada. O caminho honesto é recomeçar o login.
            Link comum (navegação de página inteira) de propósito: limpa a URL de
            callback, que é o que precisa sair daqui. */}
        <a
          href="/login"
          className="mt-3 block w-full text-center text-sm font-bold text-slate-600 hover:text-slate-900 hover:underline"
        >
          {/* TODO(Ana): rótulo do caminho de recomeçar o login. */}
          Fazer login novamente
        </a>
      </div>
    </div>
  );
}
