import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

import ErrorBoundary, { CodigoDoErro } from "@/components/ErrorBoundary";

// Boundary de render SO da aba Tarefas.
//
// POR QUE ELE EXISTE. O ErrorBoundary do App.tsx envolve a aplicacao inteira: um
// TypeError de render aqui trocaria a pagina INTEIRA do admin pela tela cheia de
// erro dele, e Financeiro, SEO, Usuarios e o resto ficariam inalcancaveis. O deep
// link piora o quadro, porque recarregar volta para `?section=tarefas` e quebra
// de novo, deixando o painel travado ate alguem editar a URL na mao. Contido
// aqui, o resto do admin segue utilizavel e a navegacao entre abas continua viva.
//
// E um wrapper fino em volta do ErrorBoundary do projeto, e nao um boundary
// proprio: aquele ja faz `componentDidCatch` com captura no Sentry (tag
// `escopo`), entao o erro nao e engolido e ainda chega ao painel de erros. Um
// boundary local so com console.error reportaria menos.

export function TasksErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary escopo="admin-tarefas" fallback={PainelIndisponivel}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Fallback de dominio, no dialeto do admin. NUNCA mostra stack: ele vai para o
 * Sentry e para o console, e na tela e so ruido para quem opera o painel.
 *
 * `reset` remonta a secao sem recarregar, o que resolve erro transitorio (uma
 * resposta estranha da API, por exemplo) sem custar o F5 e sem perder a aba.
 */
function PainelIndisponivel({
  eventId,
  reset,
}: {
  eventId: string | null;
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-8 text-center">
      <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-600" />
      <p className="font-display text-lg font-black text-rose-900">
        Não foi possível carregar este painel
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-rose-800">
        O erro já foi registrado. As outras abas do admin continuam funcionando.
      </p>
      {eventId ? <CodigoDoErro id={eventId} /> : null}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-full border-2 border-slate-900 bg-[#FFB800] px-4 py-2 text-sm font-black text-slate-950 shadow-[2px_2px_0_var(--bnt-shadow)]"
        >
          Tentar de novo
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)]"
        >
          Recarregar a página
        </button>
      </div>
    </div>
  );
}
