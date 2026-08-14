import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Guarda de skew de deploy do Vite: OBSERVADOR PURO.
 *
 * Este arquivo carrega DUAS licoes, e a segunda nasceu de a primeira ter sido
 * consertada errado.
 *
 * 1. O NOME DO EVENTO. Ate 2026-08-13 o registro morava solto em `main.tsx` e
 *    escutava `"vite:preloaderror"`, tudo minusculo, enquanto o Vite despacha
 *    `"vite:preloadError"` com E maiusculo (config.js:23422). Nome de evento DOM
 *    e case-sensitive: o listener nunca disparou e a guarda era codigo morto.
 *
 * 2. O `preventDefault` NAO PODE VOLTAR. Ao ativar a guarda, a rodada 1 ligou
 *    junto um `event.preventDefault()` incondicional, e ele nao apenas impede o
 *    relance: ele converte a REJEICAO em RESOLUCAO COM `undefined`. O Vite chama
 *    o handler dentro de um `.catch` encadeado:
 *
 *      config.js:23433  return baseModule().catch(handlePreloadError);
 *      config.js:23425  if (!e$1.defaultPrevented) throw err$2;
 *
 *    Cancelado o evento, `handlePreloadError` retorna normalmente, o `.catch`
 *    resolve com `undefined`, e quem recebe esse `undefined` e o `React.lazy`,
 *    que le `_result.default` dele. Sentry BORANATECH-FRONT-P e -Q
 *    (`lazyInitializer`), 7 eventos em 3 releases, todos pareados no MESMO
 *    SEGUNDO com um `chunk_reload` de `cooldown=false`.
 *
 *    Pior: com a promise resolvendo, o `try/catch` do `lazyWithRetry` nunca
 *    roda, entao o retry de 300ms, a guarda anti-loop e o caminho de
 *    ErrorBoundary ficam todos desligados. A guarda desligava o mecanismo que
 *    ja funcionava.
 *
 * Dai o desenho atual: a guarda OBSERVA e reporta, e nao decide nada. Quem
 * recupera e o `lazyWithRetry`, dono unico do reload. Os dois testes de
 * propagacao abaixo existem para que restaurar o `preventDefault` fique
 * vermelho, e nao para descrever o que o codigo faz hoje.
 */

const sentrySpy = vi.hoisted(() => ({ captureMessage: vi.fn() }));
vi.mock("@sentry/react", () => ({ captureMessage: sentrySpy.captureMessage }));

const posthogSpy = vi.hoisted(() => ({ capture: vi.fn() }));
vi.mock("posthog-js", () => ({ default: { capture: posthogSpy.capture } }));

import {
  registerPreloadErrorGuard,
  SENTRY_ORIGEM_PRELOAD_EVENT,
} from "./preloadErrorGuard";

/** Alvo limpo por teste: `window` global vazaria listener entre os casos. */
function guardaSobreAlvoLimpo() {
  const alvo = new EventTarget();
  const observar = vi.fn();
  registerPreloadErrorGuard(alvo, observar);
  return { alvo, observar };
}

/**
 * O mecanismo do Vite, copiado campo a campo de config.js:23421-23426. Os testes
 * de propagacao rodam contra ISTO, e nao contra uma descricao dele: e a unica
 * forma de o teste falhar quando o comportamento real mudar.
 */
function handlePreloadErrorComoNoVite(alvo: EventTarget, err: unknown): void {
  const e = new Event("vite:preloadError", { cancelable: true });
  (e as Event & { payload?: unknown }).payload = err;
  alvo.dispatchEvent(e);
  if (!e.defaultPrevented) throw err;
}

beforeEach(() => {
  sentrySpy.captureMessage.mockClear();
  posthogSpy.capture.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("registerPreloadErrorGuard", () => {
  it("reage a 'vite:preloadError' e NAO cancela o evento", () => {
    const { alvo, observar } = guardaSobreAlvoLimpo();
    // Construido com a MESMA caixa e o MESMO `cancelable` do config.js:23422.
    const evento = new Event("vite:preloadError", { cancelable: true });

    const naoCancelado = alvo.dispatchEvent(evento);

    expect(observar).toHaveBeenCalledTimes(1);
    // `defaultPrevented` e exatamente o que o Vite le antes de decidir relancar.
    // FALSE aqui e o conserto inteiro: e o que deixa o erro voltar a fluir.
    expect(evento.defaultPrevented).toBe(false);
    expect(naoCancelado).toBe(true);
  });

  /**
   * O Vite anexa o erro original ao evento antes de despachar:
   *   config.js:23423  e$1.payload = err$2;
   * Sem repassar, o relatorio registra a mensagem como "unknown" e some o chunk.
   */
  it("entrega o payload do evento ao observador, em vez de perder o erro", () => {
    const { alvo, observar } = guardaSobreAlvoLimpo();
    const original = new Error(
      "Unable to preload CSS for /assets/X-abc123.css",
    );
    const evento = new Event("vite:preloadError", { cancelable: true });
    (evento as Event & { payload?: unknown }).payload = original;

    alvo.dispatchEvent(evento);

    expect(observar).toHaveBeenCalledWith(original);
  });

  it("CONTROLE NEGATIVO: nao reage a 'vite:preloaderror', a caixa errada do bug", () => {
    const { alvo, observar } = guardaSobreAlvoLimpo();
    const evento = new Event("vite:preloaderror", { cancelable: true });

    alvo.dispatchEvent(evento);

    expect(observar).not.toHaveBeenCalled();
    expect(evento.defaultPrevented).toBe(false);
  });
});

/**
 * O teste que faltava desde o comeco. A guarda foi escrita, consertada e testada
 * tres vezes sem que ninguem exercitasse o `.catch` encadeado em que ela roda, e
 * era exatamente ali que estava o defeito.
 */
describe("propagacao pelo catch encadeado do Vite", () => {
  it("a rejeicao PROPAGA ate quem chamou o import", async () => {
    const { alvo, observar } = guardaSobreAlvoLimpo();
    const erro = new Error(
      "Failed to fetch dynamically imported module: /assets/Areas-DLR8NtyP.js",
    );

    const promise = Promise.reject(erro).catch((e) =>
      handlePreloadErrorComoNoVite(alvo, e),
    );

    await expect(promise).rejects.toBe(erro);
    // Observou (a telemetria continua), sem interferir no desfecho.
    expect(observar).toHaveBeenCalledWith(erro);
  });

  /**
   * CONTROLE NEGATIVO CENTRAL: a prova do BUG-59/60.
   *
   * Reproduz o comportamento ANTIGO (um listener que cancela) na mesma cadeia, e
   * mostra o que ele produzia: a promise RESOLVE, e resolve com `undefined`.
   * Esse `undefined` e o que o `React.lazy` le como `_result.default`.
   *
   * Sem este caso, um `preventDefault` restaurado passaria em todos os outros
   * testes deste arquivo, porque nenhum deles olha o desfecho da promise.
   */
  it("CONTROLE NEGATIVO: cancelar o evento faz a cadeia RESOLVER com undefined", async () => {
    const alvoQueCancela = new EventTarget();
    alvoQueCancela.addEventListener("vite:preloadError", (e) =>
      e.preventDefault(),
    );
    const erro = new Error(
      "Failed to fetch dynamically imported module: /x.js",
    );

    const resultado = await Promise.reject(erro).catch((e) =>
      handlePreloadErrorComoNoVite(alvoQueCancela, e),
    );

    expect(resultado).toBeUndefined();
  });
});

describe("observador padrao (reporte, nunca reload)", () => {
  it("emite o evento com origem propria, distinta do chunk_reload", () => {
    const alvo = new EventTarget();
    registerPreloadErrorGuard(alvo);
    const evento = new Event("vite:preloadError", { cancelable: true });
    (evento as Event & { payload?: unknown }).payload = new Error(
      "Failed to fetch dynamically imported module: https://x/assets/Areas-DLR8NtyP.js",
    );

    alvo.dispatchEvent(evento);

    expect(sentrySpy.captureMessage).toHaveBeenCalledTimes(1);
    const [mensagem, opts] = sentrySpy.captureMessage.mock.calls[0];
    expect(mensagem).toBe("vite_preload_error");
    expect(opts.level).toBe("warning");
    expect(opts.tags.origem).toBe(SENTRY_ORIGEM_PRELOAD_EVENT);
    expect(opts.tags.chunk).toBe("Areas-DLR8NtyP.js");
    expect(opts.fingerprint).toEqual(["vite-preload-error"]);
  });

  /**
   * CONTROLE NEGATIVO: o observador padrao NAO pode recarregar.
   *
   * O reload e inseparavel de `reportChunkReload` dentro de
   * `reloadOnceForStaleChunk` (lazyWithRetry.ts:108-111): se a guarda tivesse
   * chamado o caminho de reload, sairia um evento `chunk_reload` com
   * `origem: "chunk-reload"` junto. A ausencia dele e a prova de que o reload
   * ficou com um dono so, e que os dois mecanismos nao competem mais.
   */
  it("CONTROLE NEGATIVO: nao dispara o caminho de reload do lazyWithRetry", () => {
    const alvo = new EventTarget();
    registerPreloadErrorGuard(alvo);

    alvo.dispatchEvent(new Event("vite:preloadError", { cancelable: true }));

    const mensagens = sentrySpy.captureMessage.mock.calls.map((c) => c[0]);
    expect(mensagens).not.toContain("chunk_reload");
    const origens = sentrySpy.captureMessage.mock.calls.map(
      (c) => c[1].tags.origem,
    );
    expect(origens).not.toContain("chunk-reload");
  });

  it("payload ausente vira 'unknown', sem lancar dentro do listener", () => {
    const alvo = new EventTarget();
    registerPreloadErrorGuard(alvo);

    alvo.dispatchEvent(new Event("vite:preloadError", { cancelable: true }));

    expect(sentrySpy.captureMessage.mock.calls[0][1].tags.chunk).toBe(
      "unknown",
    );
  });
});
