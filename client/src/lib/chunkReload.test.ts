import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Visibilidade do caminho de chunk stale.
 *
 * `reportChunkReload` mandava so para o PostHog e para o console. O Sentry via
 * o desfecho (a pagina caindo no ErrorBoundary, BORANATECH-FRONT-G e -N) mas
 * nunca via a TENTATIVA: quantos reloads aconteceram, em qual chunk, e quantos
 * bateram no cooldown. Sem isso nao da para dizer se o problema e skew de
 * deploy ou falha de CDN, que foi exatamente a duvida que sobrou da triagem.
 *
 * Uma issue so (fingerprint fixo): o interesse e a SERIE no tempo, e um issue
 * por hash de chunk faria cada deploy criar issues novas e a curva sumir.
 */

const sentrySpy = vi.hoisted(() => ({ captureMessage: vi.fn() }));
vi.mock("@sentry/react", () => ({ captureMessage: sentrySpy.captureMessage }));

const posthogSpy = vi.hoisted(() => ({ capture: vi.fn() }));
vi.mock("posthog-js", () => ({ default: { capture: posthogSpy.capture } }));

import {
  chunkDaMensagem,
  importWithRetry,
  reportChunkReload,
  SENTRY_ORIGEM_CHUNK_IMPORT,
} from "./lazyWithRetry";
import { amostrarPorOrigem } from "./sentry";

describe("chunkDaMensagem", () => {
  it("extrai o arquivo do chunk da mensagem do Chrome", () => {
    expect(
      chunkDaMensagem(
        "Failed to fetch dynamically imported module: https://boranatech.com.br/assets/Cadastro-Z_ulgmR3.js",
      ),
    ).toBe("Cadastro-Z_ulgmR3.js");
  });

  it("extrai tambem de um preload de CSS", () => {
    expect(
      chunkDaMensagem(
        "Unable to preload CSS for /assets/OnboardingStories-BxVTpwNA.css",
      ),
    ).toBe("OnboardingStories-BxVTpwNA.css");
  });

  /**
   * CONTROLE NEGATIVO. O Safari nao poe URL nenhuma na mensagem
   * ("Importing a module script failed.", BORANATECH-FRONT-N). Um extrator que
   * devolvesse string vazia criaria uma tag vazia, que agrupa como se fosse
   * valor; um que lancasse derrubaria o reload, que e a unica coisa que ainda
   * podia salvar a navegacao. Tem que degradar para um valor EXPLICITO.
   */
  it("CONTROLE NEGATIVO: mensagem sem URL vira 'unknown', nao vazio e nao erro", () => {
    expect(chunkDaMensagem("Importing a module script failed.")).toBe(
      "unknown",
    );
    expect(chunkDaMensagem("")).toBe("unknown");
  });
});

describe("reportChunkReload", () => {
  beforeEach(() => {
    sentrySpy.captureMessage.mockReset();
    posthogSpy.capture.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("captura no Sentry com origem, chunk e fingerprint fixo", () => {
    reportChunkReload(
      new Error(
        "Failed to fetch dynamically imported module: https://boranatech.com.br/assets/Cadastro-Z_ulgmR3.js",
      ),
      false,
    );

    expect(sentrySpy.captureMessage).toHaveBeenCalledTimes(1);
    const [mensagem, opts] = sentrySpy.captureMessage.mock.calls[0];
    expect(mensagem).toContain("chunk_reload");
    expect(opts.level).toBe("warning");
    expect(opts.tags).toMatchObject({
      origem: "chunk-reload",
      chunk: "Cadastro-Z_ulgmR3.js",
      cooldown: "false",
    });
    expect(opts.fingerprint).toEqual(["chunk-reload"]);
  });

  it("marca o caso de cooldown, que e o que termina no ErrorBoundary", () => {
    reportChunkReload(new Error("Importing a module script failed."), true);

    const [, opts] = sentrySpy.captureMessage.mock.calls[0];
    expect(opts.tags).toMatchObject({ chunk: "unknown", cooldown: "true" });
  });

  // O destino antigo nao pode ter sido trocado pelo novo: PostHog e agregacao,
  // Sentry e a serie de erro. Os dois continuam recebendo.
  it("CONTROLE NEGATIVO: o envio ao PostHog continua acontecendo", () => {
    reportChunkReload(new Error("qualquer coisa"), false);

    expect(posthogSpy.capture).toHaveBeenCalledTimes(1);
    expect(posthogSpy.capture.mock.calls[0][0]).toBe("chunk_reload");
  });
});

/**
 * `importWithRetry`: a mesma mecanica para modulo de DADO.
 *
 * Os imports por slug de trilha (`lib/roadmapV2/loaders.ts`) eram a maior
 * superficie de chunk dinamico sem defesa nenhuma. O que muda em relacao ao
 * `lazyWithRetry` e o desfecho da segunda falha, e e ele que precisa estar
 * travado: aqui NAO ha reload, o erro e reportado e RELANCADO, porque a pagina
 * que consome ja tem estado de erro com retry manual e porque o prefetch de
 * hover passa por este mesmo caminho.
 */
describe("importWithRetry", () => {
  beforeEach(() => {
    sentrySpy.captureMessage.mockReset();
    posthogSpy.capture.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("sucesso de primeira nao tenta de novo e nao reporta nada", async () => {
    const factory = vi.fn(async () => "conteudo");

    await expect(importWithRetry(factory, "frontend")).resolves.toBe(
      "conteudo",
    );

    expect(factory).toHaveBeenCalledTimes(1);
    expect(sentrySpy.captureMessage).not.toHaveBeenCalled();
    expect(posthogSpy.capture).not.toHaveBeenCalled();
  });

  it("falha na primeira e RECUPERA na segunda, em silencio", async () => {
    // Silencio aqui e o comportamento certo: para quem estava na tela, nao
    // aconteceu nada. Reportar produziria uma serie inflada de "falhas" que
    // ninguem sentiu, e a serie perderia o sentido.
    const factory = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("Importing a module script failed."))
      .mockResolvedValueOnce("conteudo");

    await expect(importWithRetry(factory, "backend")).resolves.toBe("conteudo");

    expect(factory).toHaveBeenCalledTimes(2);
    expect(sentrySpy.captureMessage).not.toHaveBeenCalled();
  });

  it("falha DEFINITIVA reporta com o slug da trilha e RELANCA", async () => {
    const erro = new Error(
      "Failed to fetch dynamically imported module: https://boranatech.com.br/assets/dados-A1b2C3d4.js",
    );
    const factory = vi.fn<() => Promise<string>>().mockRejectedValue(erro);

    // RELANCA, e este assert e metade do ponto: engolir o erro deixaria a
    // pagina em spinner para sempre, porque quem consome espera a rejeicao
    // para acender o proprio estado de falha.
    await expect(importWithRetry(factory, "dados")).rejects.toBe(erro);

    expect(factory).toHaveBeenCalledTimes(2);
    expect(sentrySpy.captureMessage).toHaveBeenCalledTimes(1);
    const [mensagem, opts] = sentrySpy.captureMessage.mock.calls[0];
    expect(mensagem).toBe("chunk_import_failed");
    expect(opts.level).toBe("warning");
    expect(opts.tags).toMatchObject({
      origem: "chunk-import",
      // O SLUG, que e estavel entre deploys.
      chunk: "dados",
      // E o arquivo com hash junto, quando a engine cita.
      arquivo: "dados-A1b2C3d4.js",
    });
    expect(opts.fingerprint).toEqual(["chunk-import-failed"]);
    expect(posthogSpy.capture.mock.calls[0][0]).toBe("chunk_import_failed");
  });

  it("mensagem sem URL (Safari) mantem o slug e degrada so o arquivo", async () => {
    const factory = vi
      .fn<() => Promise<string>>()
      .mockRejectedValue(new Error("Importing a module script failed."));

    await expect(importWithRetry(factory, "uxui")).rejects.toThrow();

    const [, opts] = sentrySpy.captureMessage.mock.calls[0];
    expect(opts.tags).toMatchObject({ chunk: "uxui", arquivo: "unknown" });
  });

  /**
   * Os DOIS LADOS do literal, presos. `sentry.ts` nao importa de ninguem, entao
   * a string vive duplicada; sem este teste, renomear a constante aqui deixaria
   * a serie ser amostrada a 25% sem nada acusar, e a razao contra
   * `chunk-reload` sairia errada por um fator de 4.
   */
  it("a origem declarada aqui e a mesma que o sentry.ts nao amostra", () => {
    const evento = { tags: { origem: SENTRY_ORIGEM_CHUNK_IMPORT } };
    expect(amostrarPorOrigem(evento, undefined, () => 1)).toBe(evento);
  });
});
