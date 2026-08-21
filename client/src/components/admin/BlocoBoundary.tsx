import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

import ErrorBoundary, { CodigoDoErro } from "@/components/ErrorBoundary";

// Boundary de UM BLOCO do admin.
//
// POR QUE ELE EXISTE. O `ErrorBoundary` do `App.tsx` envolve a aplicação
// inteira, e o admin não tinha nenhum boundary entre ele e os blocos (o único
// aninhado era o da aba Tarefas). Consequência medida na varredura de
// 2026-08-01: as ONZE leituras soltas encontradas na Visão derrubavam a PÁGINA
// INTEIRA, nenhuma derrubava só o bloco. Um campo ausente num payload apagava o
// painel e o F5 reproduzia.
//
// Com o boundary, o mesmo erro vira um cartão dizendo qual bloco quebrou, e os
// vizinhos continuam. Isso vale mais que os onze consertos: eles fecham as
// portas que eu encontrei, este fecha a classe.
//
// É UM WRAPPER FINO sobre o `ErrorBoundary` do projeto, e não um boundary
// próprio: aquele já faz `componentDidCatch` com `Sentry.captureException`
// (tag `escopo`) e devolve o `eventId`. Boundary local com `console.error`
// reportaria menos e o erro não chegaria ao painel de erros.
//
// NÃO É O `TasksErrorBoundary`, e não dá para reusá-lo direto: o fallback dele é
// de ABA (`p-8` centralizado, "as outras abas continuam funcionando"), do
// tamanho de um painel inteiro. Um bloco precisa de um cartão do tamanho do
// bloco e da frase certa sobre o que sobreviveu. O que os dois REUSAM é a mesma
// base, que é onde mora a parte que importa: captura, `eventId` e `reset`.

export function BlocoBoundary({
  nome,
  compacto = false,
  children,
}: {
  /** Nome do bloco, como aparece na tela e como vai para o Sentry. */
  nome: string;
  /**
   * Fallback de uma linha, para bloco que também é de uma linha. Um cartão de
   * 8rem no lugar de uma frase de 1rem chamaria mais atenção quebrado do que
   * inteiro, e empurraria a página para baixo justamente quando algo falhou.
   */
  compacto?: boolean;
  children: ReactNode;
}) {
  return (
    <ErrorBoundary
      escopo={`admin-bloco:${nome}`}
      fallback={({ eventId, reset }) =>
        compacto ? (
          <p
            data-testid="bloco-quebrado"
            data-bloco={nome}
            className="flex flex-wrap items-center gap-2 text-xs font-bold text-rose-800"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {nome}: não foi possível exibir.
            <button
              type="button"
              onClick={reset}
              className="underline underline-offset-2"
            >
              Tentar de novo
            </button>
          </p>
        ) : (
          <div
            data-testid="bloco-quebrado"
            data-bloco={nome}
            className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-5 text-center"
          >
            <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-rose-600" />
            <p className="font-display text-base font-black text-rose-900">
              {nome}
            </p>
            {/* O NOME DO BLOCO É O CONTEÚDO: sem ele, a pessoa vê um cartão
                vermelho e não sabe o que perdeu nem o que ainda pode confiar. */}
            <p className="mx-auto mt-1 max-w-sm text-xs font-semibold text-rose-800">
              Este bloco não pôde ser exibido. O erro já foi registrado, e o
              resto da página continua valendo.
            </p>
            {eventId ? (
              <div className="mt-3">
                <CodigoDoErro id={eventId} />
              </div>
            ) : null}
            <button
              type="button"
              onClick={reset}
              className="bnt-pressable rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a]"
            >
              Tentar de novo
            </button>
          </div>
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
}
