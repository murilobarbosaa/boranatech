import { lazy, type FunctionComponent } from "react";
import * as Sentry from "@sentry/react";
import posthog from "posthog-js";

// Skew de deploy: apos um novo deploy o index.html em memoria aponta para
// hashes de chunk que nao existem mais. O import dinamico falha com
// "Failed to fetch dynamically imported module". Este helper tenta de novo uma
// vez e, se persistir, recarrega a pagina (com guarda anti-loop) para buscar o
// index.html novo. Um reload resolve porque o HTML passa a apontar para os
// hashes atuais.

/**
 * Tag `origem` lida por `amostrarPorOrigem` (lib/sentry.ts) para NAO amostrar
 * este evento. Mesmo papel de `SENTRY_ORIGEM_AUTH` em authTelemetry.ts, e o
 * literal e repetido la pelo mesmo motivo que o de auth: `sentry.ts` nao importa
 * de ninguem. Os dois lados estao presos por teste (sentry.test.ts).
 */
export const SENTRY_ORIGEM_CHUNK_RELOAD = "chunk-reload";

/**
 * Tag `origem` do import de MODULO DE DADO que falhou depois do retry.
 *
 * DISTINTA de `chunk-reload` pelo mesmo motivo que `preload-event` e distinta:
 * as tres pertencem a familia do chunk stale, mas contam coisas diferentes, e
 * com a mesma tag "quantos reloads aconteceram" sairia inflado por eventos em
 * que reload nenhum aconteceu. Separadas, a razao entre elas vira dado.
 *
 * O literal e repetido em `sentry.ts` pelo mesmo motivo dos outros tres (aquele
 * arquivo nao importa de ninguem), e os dois lados estao presos por teste.
 */
export const SENTRY_ORIGEM_CHUNK_IMPORT = "chunk-import";

const RELOAD_KEY = "bnt:chunk-reload";
const RELOAD_COOLDOWN_MS = 10_000;
const RETRY_DELAY_MS = 300;

/**
 * Arquivo do chunk citado na mensagem do erro de import.
 *
 * Existe para a tag do Sentry poder responder "e sempre o mesmo chunk ou e
 * qualquer um?", que separa asset especifico quebrado de skew de deploy.
 *
 * Cada engine escreve a falha de um jeito, e uma delas nao cita URL nenhuma
 * ("Importing a module script failed.", Safari). Nesse caso devolve `"unknown"`
 * EXPLICITO: string vazia viraria uma tag que agrupa como se fosse valor, e
 * lancar aqui derrubaria o reload, que e a unica coisa que ainda pode salvar a
 * navegacao. Mesma familia do `faixaUiOf`: degradar para valor neutro em dado
 * de APRESENTACAO, nunca em dado que e a informacao.
 */
export function chunkDaMensagem(message: string): string {
  const achado = message.match(/[^\s/"']+\.(?:mjs|js|css)\b/);
  return achado ? achado[0] : "unknown";
}

// Telemetria antes de recarregar: registra o erro de import que causou o reload
// e se o cooldown foi atingido. Sync + best-effort, ja que o reload logo em
// seguida pode cortar o envio em voo.
//
// TRES destinos, e nenhum substitui o outro. Console serve em dev e em build sem
// DSN; PostHog agrega; o Sentry entrou porque ele so via o DESFECHO deste
// caminho (a pagina caindo no ErrorBoundary, BORANATECH-FRONT-G e -N) e nunca a
// TENTATIVA. Sem a tentativa nao da para dizer se o reload resolveu na maioria
// das vezes, nem em qual chunk isso acontece.
//
// `fingerprint` fixo de proposito: o interesse e a serie no tempo. Um issue por
// hash de chunk faria cada deploy criar issues novas e a curva desapareceria.
export function reportChunkReload(
  importError: unknown,
  cooldownHit: boolean,
): void {
  const message =
    importError instanceof Error
      ? importError.message
      : String(importError ?? "unknown");
  const chunk = chunkDaMensagem(message);
  console.error("[lazyWithRetry] stale chunk reload", {
    message,
    chunk,
    cooldownHit,
  });
  try {
    posthog.capture("chunk_reload", { message, chunk, cooldownHit });
  } catch {
    // posthog pode nao estar pronto; nunca bloquear o reload.
  }
  try {
    Sentry.captureMessage("chunk_reload", {
      level: "warning",
      tags: {
        origem: SENTRY_ORIGEM_CHUNK_RELOAD,
        chunk,
        // String, nao boolean: tag do Sentry so agrega texto. `true` aqui e o
        // caso que termina no ErrorBoundary, e e o que se quer contar.
        cooldown: String(cooldownHit),
      },
      fingerprint: ["chunk-reload"],
      extra: { message },
    });
  } catch {
    // Sentry sem DSN e no-op; e ele nunca pode bloquear o reload.
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

/**
 * NUCLEO compartilhado: tenta, espera, tenta de novo. So isso.
 *
 * Nao decide recuperacao e nao reporta nada, de proposito. A decisao do que
 * fazer na segunda falha e a unica coisa que difere entre os dois consumidores,
 * e ela e incompativel entre eles: `lazyWithRetry` recarrega a pagina e devolve
 * uma promise pendente para o Suspense segurar, o que so faz sentido sob React;
 * `importWithRetry` carrega DADO, para quem ja tem estado de erro na tela, e
 * uma promise que nunca resolve ali travaria a pagina em spinner para sempre.
 *
 * O erro propagado e o da SEGUNDA tentativa, igual ao que o `lazyWithRetry`
 * sempre propagou: o da primeira e descartado porque, se a segunda funcionou,
 * ele nao aconteceu para o usuario.
 */
async function tentarComRetry<T>(factory: () => Promise<T>): Promise<T> {
  try {
    return await factory();
  } catch {
    await delay(RETRY_DELAY_MS);
    return factory();
  }
}

/**
 * Reporte da falha DEFINITIVA de um import de modulo de dado.
 *
 * Espelha `reportChunkReload` (mesmos tres destinos, mesmo nivel, fingerprint
 * fixo pelo mesmo motivo: o interesse e a serie no tempo). O que muda e o
 * sujeito: aqui nao houve reload nenhum, houve um dado que a pagina nao
 * conseguiu carregar depois de duas tentativas.
 *
 * `chunk` e o identificador de dominio (o slug da trilha), nao o nome do
 * arquivo: o arquivo tem hash que muda a cada deploy, e a pergunta util e "e
 * sempre a mesma trilha ou e qualquer uma?". O arquivo, quando a engine cita,
 * vai junto em `arquivo`.
 */
export function reportChunkImportFailure(
  importError: unknown,
  chunk: string,
): void {
  const message =
    importError instanceof Error
      ? importError.message
      : String(importError ?? "unknown");
  const arquivo = chunkDaMensagem(message);
  console.error("[importWithRetry] import falhou", { message, chunk, arquivo });
  try {
    posthog.capture("chunk_import_failed", { message, chunk, arquivo });
  } catch {
    // Telemetria nunca pode mudar o desfecho do import.
  }
  try {
    Sentry.captureMessage("chunk_import_failed", {
      level: "warning",
      tags: { origem: SENTRY_ORIGEM_CHUNK_IMPORT, chunk, arquivo },
      fingerprint: ["chunk-import-failed"],
      extra: { message },
    });
  } catch {
    // Sentry sem DSN e no-op, e nunca pode lancar aqui.
  }
}

/**
 * Import dinamico de MODULO COMUM (dado, nao componente) com retry e telemetria.
 *
 * Existe porque os imports por slug de trilha (`lib/roadmapV2/loaders.ts`) eram
 * a maior superficie de chunk dinamico SEM nenhuma defesa: sem retry, sem
 * telemetria, e um deploy no meio da navegacao virava tela de erro sem rastro de
 * qual trilha falhou.
 *
 * NAO recarrega a pagina, e isso e decisao e nao omissao. Quem consome ja tem
 * estado de erro proprio com retry manual (`RoadmapsV2.tsx`, `loadFailed` e
 * `loadAttempt`), e um `location.reload()` disparado por prefetch de hover
 * recarregaria a pagina de quem so passou o mouse por cima de um card.
 */
export async function importWithRetry<T>(
  factory: () => Promise<T>,
  chunk: string,
): Promise<T> {
  try {
    return await tentarComRetry(factory);
  } catch (error) {
    reportChunkImportFailure(error, chunk);
    throw error;
  }
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
      // Mesma sequencia de sempre (tenta, espera RETRY_DELAY_MS, tenta de
      // novo), agora no nucleo compartilhado com `importWithRetry`.
      return await tentarComRetry(factory);
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
  };

  const loader = load as unknown as Parameters<typeof lazy>[0];
  return lazy(loader) as unknown as T;
}
