import { cn } from "@/lib/utils";
import * as Sentry from "@sentry/react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";

/**
 * Boundary de render, com captura.
 *
 * POR QUE `componentDidCatch` EXISTE AQUI. Até 2026-07-28 esta classe tinha só
 * `getDerivedStateFromError`, que troca o render e não recebe o erro para
 * efeito colateral nenhum. Resultado: `TypeError` de render não virava 500 no
 * servidor, não ia para o Sentry, e não aparecia em lugar nenhum. Quando a
 * renomeação `skillsSugeridas` derrubou o resultado do Analisador de LinkedIn,
 * a ÚNICA razão de alguém ter sabido foi a análise ter sido persistida antes do
 * render. É a mesma classe do `error.message` descartado, uma camada acima.
 *
 * SEM DSN NÃO QUEBRA. `Sentry.captureException` sem `init` é no-op por
 * construção (é o estado de todo build local e de qualquer build sem
 * `VITE_SENTRY_DSN`), e `ErrorBoundary.semDsn.test.tsx` prova isso rodando o
 * `@sentry/react` de verdade, sem inicializar.
 */

interface Props {
  children: ReactNode;
  /**
   * Nome do escopo, vira tag no Sentry. Serve para separar "o app inteiro caiu"
   * de "só o resultado da análise caiu", que têm gravidades diferentes.
   */
  escopo?: string;
  /**
   * Fallback de domínio. Recebe o id do evento (para a pessoa citar no suporte)
   * e um `reset` que limpa o estado de erro e tenta renderizar de novo.
   * Ausente = a tela cheia padrão.
   */
  fallback?: (info: { eventId: string | null; reset: () => void }) => ReactNode;
}

interface State {
  hasError: boolean;
  eventId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, eventId: null };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const eventId = Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
      // `origem` é lida pelo `beforeSend` em `lib/sentry.ts` para NÃO amostrar
      // tela quebrada. Ver o comentário do ERROR_SAMPLE_RATE lá.
      tags: { origem: "error-boundary", escopo: this.props.escopo ?? "app" },
    });
    this.setState({ eventId: eventId ?? null });
  }

  reset = () => {
    this.setState({ hasError: false, eventId: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback({
        eventId: this.state.eventId,
        reset: this.reset,
      });
    }

    // Tela cheia padrão. NUNCA mostra stack: o stack vai para o Sentry, e para
    // quem está do outro lado ele é ruído assustador que não ajuda em nada.
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--brand-cream)] p-8">
        <div className="flex w-full max-w-lg flex-col items-center rounded-2xl border-2 border-slate-950 bg-white p-8 shadow-[5px_5px_0_var(--bnt-shadow)]">
          <AlertTriangle size={40} className="mb-5 shrink-0 text-amber-500" />

          <h2 className="mb-2 text-center font-display text-xl font-black text-slate-950">
            Algo quebrou nesta tela
          </h2>
          <p className="mb-6 text-center text-sm font-medium text-slate-600">
            Não foi você. O erro já foi registrado do nosso lado e a gente vai
            olhar. Recarregar costuma resolver.
          </p>

          {this.state.eventId ? <CodigoDoErro id={this.state.eventId} /> : null}

          <button
            type="button"
            onClick={() => window.location.reload()}
            className={cn(
              "bnt-pressable flex items-center gap-2 rounded-xl px-4 py-2",
              "border-2 border-slate-950 bg-[var(--brand-yellow)] font-black text-ink-on-accent",
              "shadow-[3px_3px_0_var(--bnt-shadow)]",
            )}
          >
            <RotateCcw size={16} />
            Recarregar a página
          </button>
        </div>
      </div>
    );
  }
}

/**
 * Identificador curto para a pessoa citar no suporte. É o `event_id` do Sentry,
 * então ele casa com o evento lá dentro. `select-all` para um clique selecionar
 * o código inteiro, que é o que alguém faz antes de colar num e-mail.
 */
export function CodigoDoErro({ id }: { id: string }) {
  return (
    <p className="mb-6 text-center text-xs font-medium text-slate-500">
      Se for falar com a gente, cite este código:{" "}
      <code className="select-all rounded bg-slate-100 px-1.5 py-0.5 font-mono font-bold text-slate-700">
        {id.slice(0, 8)}
      </code>
    </p>
  );
}

export default ErrorBoundary;
