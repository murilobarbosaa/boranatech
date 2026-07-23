import { lazy, type FunctionComponent } from "react";
import posthog from "posthog-js";

// Skew de deploy: apos um novo deploy o index.html em memoria aponta para
// hashes de chunk que nao existem mais. O import dinamico falha com
// "Failed to fetch dynamically imported module". Este helper tenta de novo uma
// vez e, se persistir, recarrega a pagina (com guarda anti-loop) para buscar o
// index.html novo. Um reload resolve porque o HTML passa a apontar para os
// hashes atuais.

const RELOAD_KEY = "bnt:chunk-reload";
const RELOAD_COOLDOWN_MS = 10_000;
const RETRY_DELAY_MS = 300;

// Telemetria (PostHog + console) antes de recarregar: registra o erro de import
// que causou o reload e se o cooldown foi atingido. Sync + best-effort, ja que o
// reload logo em seguida pode cortar o envio em voo do posthog.
function reportChunkReload(importError: unknown, cooldownHit: boolean): void {
  const message =
    importError instanceof Error
      ? importError.message
      : String(importError ?? "unknown");
  console.error("[lazyWithRetry] stale chunk reload", { message, cooldownHit });
  try {
    posthog.capture("chunk_reload", { message, cooldownHit });
  } catch {
    // posthog pode nao estar pronto; nunca bloquear o reload.
  }
}

// Guarda anti-loop. Retorna true se disparou o reload (o caller deve parar de
// tentar e segurar o estado ate a navegacao efetivar). Retorna false se ja
// recarregou ha menos de RELOAD_COOLDOWN_MS: nesse caso o caller deve propagar
// o erro para o ErrorBoundary em vez de recarregar num loop infinito.
export function reloadOnceForStaleChunk(importError?: unknown): boolean {
  let cooldownHit = false;
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_KEY) ?? "0");
    const now = Date.now();
    if (Number.isFinite(last) && now - last < RELOAD_COOLDOWN_MS) {
      cooldownHit = true;
    } else {
      window.sessionStorage.setItem(RELOAD_KEY, String(now));
    }
  } catch {
    // sessionStorage indisponivel: recarrega mesmo assim, e melhor que travar.
  }
  reportChunkReload(importError, cooldownHit);
  if (cooldownHit) return false;
  window.location.reload();
  return true;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

// Tipagem: o bound FunctionComponent<never> (nao ComponentType<unknown>) aceita
// por contravariancia tanto paginas sem props quanto paginas com props
// obrigatorias (ex: Auth recebe `mode`); com <unknown> o tsc rejeitaria estas
// ultimas. O retorno e o proprio T (nao LazyExoticComponent<T>): o componente
// lazy e renderavel em JSX com exatamente os props de T, entao devolver T
// preserva a checagem estrita de props nos call sites. A ponte para o `lazy`
// (cuja assinatura do React usa o tipo amplo de props) reaproveita
// Parameters<typeof lazy> e conversao via unknown, sem tipo solto escrito aqui.
export function lazyWithRetry<T extends FunctionComponent<never>>(
  factory: () => Promise<{ default: T }>,
): T {
  const load = async (): Promise<{ default: T }> => {
    try {
      return await factory();
    } catch {
      await delay(RETRY_DELAY_MS);
      try {
        return await factory();
      } catch (error) {
        // Segunda falha: provavel skew de deploy. Recarrega uma vez; se ja
        // recarregou ha pouco, propaga o erro para o ErrorBoundary.
        if (reloadOnceForStaleChunk(error)) {
          // Reload em andamento: devolve uma Promise pendente para o React
          // manter o Suspense ate a navegacao efetivar, sem estourar o erro.
          return new Promise<{ default: T }>(() => {});
        }
        throw error;
      }
    }
  };

  const loader = load as unknown as Parameters<typeof lazy>[0];
  return lazy(loader) as unknown as T;
}
