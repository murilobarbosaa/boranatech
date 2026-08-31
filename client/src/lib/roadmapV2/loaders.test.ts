import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Dedup do prefetch de trilha.
 *
 * O defeito: `import()` rejeitado NAO e memoizado pelo runtime, ao contrario do
 * resolvido. Com `onMouseEnter` e `onFocus` em dois sitios da listagem, cada
 * passada do ponteiro sobre um card quebrado refazia a tentativa inteira e
 * emitia mais um `chunk_import_failed`, inflando a faceta por slug no Sentry.
 *
 * O QUE ESTES TESTES AFIRMAM, e o que nao afirmam: eles contam TENTATIVAS
 * (chamadas a `importWithRetry`). A ligacao "uma tentativa definitivamente
 * falha emite exatamente um evento" e do proprio `importWithRetry`, e esta
 * travada em `client/src/lib/chunkReload.test.ts` ("falha DEFINITIVA reporta com
 * o slug da trilha e RELANCA"). Contar tentativa aqui e reafirmar o evento la
 * seria duplicar a assercao no lugar errado.
 */

const retrySpy = vi.hoisted(() => ({ importWithRetry: vi.fn() }));
vi.mock("@/lib/lazyWithRetry", () => ({
  importWithRetry: retrySpy.importWithRetry,
}));

import { prefetchRoadmap, roadmapLoaders } from "./loaders";

/** Deixa as promessas ja resolvidas/rejeitadas assentarem, sem timer real. */
async function assentar() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

const T0 = new Date("2026-08-29T12:00:00Z").getTime();

beforeEach(() => {
  retrySpy.importWithRetry.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(T0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("prefetchRoadmap com chunk falhando", () => {
  it("tres toques seguidos no mesmo card disparam UMA tentativa", async () => {
    retrySpy.importWithRetry.mockRejectedValue(new Error("chunk 404"));

    prefetchRoadmap("frontend");
    await assentar();
    prefetchRoadmap("frontend");
    prefetchRoadmap("frontend");
    await assentar();

    expect(retrySpy.importWithRetry).toHaveBeenCalledTimes(1);
  });

  it("dois toques ANTES da primeira assentar tambem dao uma so (em voo)", async () => {
    // Sem a guarda de "em voo", hover e focus disparando no mesmo gesto
    // renderiam dois downloads do mesmo chunk.
    let rejeitar: (e: Error) => void = () => {};
    retrySpy.importWithRetry.mockReturnValue(
      new Promise((_, rej) => {
        rejeitar = rej;
      }),
    );

    prefetchRoadmap("backend");
    prefetchRoadmap("backend");
    expect(retrySpy.importWithRetry).toHaveBeenCalledTimes(1);

    rejeitar(new Error("chunk 404"));
    await assentar();
  });

  it("passada a janela, uma tentativa nova acontece", async () => {
    retrySpy.importWithRetry.mockRejectedValue(new Error("chunk 404"));

    prefetchRoadmap("dados");
    await assentar();
    expect(retrySpy.importWithRetry).toHaveBeenCalledTimes(1);

    // Dentro da janela: silencio.
    vi.setSystemTime(new Date(T0 + 29_000));
    prefetchRoadmap("dados");
    await assentar();
    expect(retrySpy.importWithRetry).toHaveBeenCalledTimes(1);

    // Fora da janela: especula de novo.
    vi.setSystemTime(new Date(T0 + 31_000));
    prefetchRoadmap("dados");
    await assentar();
    expect(retrySpy.importWithRetry).toHaveBeenCalledTimes(2);
  });

  it("a janela e POR SLUG: card vizinho nao fica mudo junto", async () => {
    retrySpy.importWithRetry.mockRejectedValue(new Error("chunk 404"));

    prefetchRoadmap("uxui");
    await assentar();
    prefetchRoadmap("cloud");
    await assentar();

    expect(retrySpy.importWithRetry).toHaveBeenCalledTimes(2);
  });

  it("O CLIQUE REAL nao passa pela janela: tenta de novo na hora", async () => {
    // A assercao que separa especulacao de pedido explicito. `RoadmapsV2.tsx`
    // chama `roadmapLoaders[slug]()` direto, e e esse caminho que precisa
    // continuar tentando enquanto o prefetch se cala.
    retrySpy.importWithRetry.mockRejectedValue(new Error("chunk 404"));

    prefetchRoadmap("qa");
    await assentar();
    expect(retrySpy.importWithRetry).toHaveBeenCalledTimes(1);

    // Prefetch silenciado...
    prefetchRoadmap("qa");
    await assentar();
    expect(retrySpy.importWithRetry).toHaveBeenCalledTimes(1);

    // ...e o clique, no mesmo instante, nao.
    await expect(roadmapLoaders["qa"]()).rejects.toThrow("chunk 404");
    expect(retrySpy.importWithRetry).toHaveBeenCalledTimes(2);
  });
});

describe("CONTROLE NEGATIVO: chunk que carrega", () => {
  it("sucesso nao instala janela nenhuma", async () => {
    // A janela e so para falha. Depois de resolver, o runtime memoiza o modulo e
    // uma chamada nova e de fato barata, que era o que o comentario antigo
    // afirmava para os dois casos.
    retrySpy.importWithRetry.mockResolvedValue({ slug: "mobile" });

    prefetchRoadmap("mobile");
    await assentar();
    prefetchRoadmap("mobile");
    await assentar();

    expect(retrySpy.importWithRetry).toHaveBeenCalledTimes(2);
  });

  it("slug que nao existe no mapa nao chama nada", async () => {
    prefetchRoadmap("trilha-que-nao-existe");
    await assentar();
    expect(retrySpy.importWithRetry).not.toHaveBeenCalled();
  });
});
