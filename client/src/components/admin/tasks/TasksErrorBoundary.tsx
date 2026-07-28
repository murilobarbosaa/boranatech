import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

// Boundary de render SO da aba Tarefas.
//
// POR QUE ELE EXISTE. O ErrorBoundary do App.tsx envolve a aplicacao inteira:
// um TypeError de render aqui troca a pagina INTEIRA do admin pela tela de erro
// dele, e Financeiro, SEO, Usuarios e o resto ficam inalcancaveis. O deep link
// piora o quadro, porque recarregar volta para `?section=tarefas` e quebra de
// novo, deixando o painel travado ate alguem editar a URL na mao. Contido aqui,
// o resto do admin segue utilizavel e a navegacao entre abas continua viva.
//
// POR QUE NAO REUSA O ErrorBoundary GLOBAL. Na `main` de hoje ele nao aceita
// props: nao da para passar escopo nem fallback de dominio, e ele NAO tem
// `componentDidCatch`, ou seja, engole o erro sem reportar. A branch
// `feat/telemetria-client` corrige exatamente isso (escopo, fallback e captura
// no Sentry) mas ainda nao esta na main. Quando estiver, este arquivo vira um
// wrapper fino em volta dele, e o fallback abaixo continua sendo o de dominio.
//
// NAO ENGOLE. `componentDidCatch` faz console.error com o erro e o stack de
// componentes, que era a lacuna do boundary global.

type Props = { children: ReactNode };
type State = { error: Error | null };

export class TasksErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      "[admin-tarefas] erro de render contido pelo boundary da aba:",
      error,
      info.componentStack,
    );
  }

  /** Remonta a secao sem recarregar: resolve erro transitorio sem custar o F5. */
  private reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-600" />
        <p className="font-display text-lg font-black text-rose-900">
          Não foi possível carregar este painel
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-rose-800">
          O erro foi registrado no console. As outras abas do admin continuam
          funcionando normalmente.
        </p>
        {/* Mensagem curta, sem stack: o stack vai para o console, e na tela ele
            e ruido que nao ajuda quem esta operando o painel. */}
        <p className="mt-3 font-mono text-xs text-rose-700">
          {this.state.error.message.slice(0, 200)}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={this.reset}
            className="rounded-full border-2 border-slate-900 bg-[#FFB800] px-4 py-2 text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a]"
          >
            Tentar de novo
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a]"
          >
            Recarregar a página
          </button>
        </div>
      </div>
    );
  }
}
