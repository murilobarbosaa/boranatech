import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * O PRAZO DE BANCO E MESMO UM PRAZO, e so isso?
 *
 * Sao quatro afirmacoes, e a terceira e a que separa este mecanismo de um
 * cancelamento:
 *
 *   1. estoura no prazo, com o call site NOMEADO no erro;
 *   2. trabalho que chega antes do prazo vence, e o timer nao fica pendurado;
 *   3. o trabalho perdedor CONTINUA em voo e pode aterrissar depois, e uma
 *      falha tardia dele nao vira `unhandledRejection`;
 *   4. sem prazo declarado, nao existe prazo nenhum (o opt-in das outras oito
 *      ferramentas de IA).
 *
 * Relogio falso em toda parte: nenhum teste daqui espera tempo de verdade.
 */

import {
  CALL_SITES_BANCO_ANALISE,
  comPrazoDeBanco,
  PRAZO_BANCO_ANALISE_MS,
  PrazoDeBancoEstourado,
} from "./prazos";

/** Promessa que nunca se resolve sozinha, como um banco que travou. */
function travada<T>(): Promise<T> {
  return new Promise<T>(() => undefined);
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("a parcela e contrato, nao preferencia", () => {
  it("PRAZO_BANCO_ANALISE_MS vale 5000ms", () => {
    // MESMO CONTRATO DE `EXPECTED_TABLE_COUNT`: mudar este numero e ato
    // deliberado, feito no commit que explica por que, e nao um arredondamento
    // de passagem. Ele e parcela da conta do pior caso do servidor, entao mexer
    // nele sem mexer na conta e como o defeito que este lote fecha nasceu.
    //
    // E o mutante que `scripts/mutateLinkedinThresholds.mjs` dispara contra este
    // sitio morre AQUI: sem uma assercao do valor concreto, trocar 5000 por 50
    // passaria verde em todos os outros testes deste arquivo, porque eles usam a
    // propria constante para avancar o relogio.
    expect(PRAZO_BANCO_ANALISE_MS).toBe(5_000);
  });
});

describe("estouro", () => {
  it("rejeita exatamente no prazo, nomeando o call site", async () => {
    vi.useFakeTimers();
    const p = comPrazoDeBanco(travada<string>(), "persistencia", 5_000);
    const observado = p.catch((err: unknown) => err);

    // Um milissegundo ANTES do prazo ainda nao ha veredito. Sem esta metade, um
    // prazo de 1ms passaria no teste igualzinho.
    await vi.advanceTimersByTimeAsync(4_999);
    let resolvido = false;
    void observado.then(() => {
      resolvido = true;
    });
    await Promise.resolve();
    expect(resolvido).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    const err = await observado;
    expect(err).toBeInstanceOf(PrazoDeBancoEstourado);
    const prazo = err as PrazoDeBancoEstourado;
    expect(prazo.callSite).toBe("persistencia");
    expect(prazo.prazoMs).toBe(5_000);
    // O call site vai na MENSAGEM, nao so num campo: quem le o log do servidor
    // precisa saber qual dos cinco round-trips estourou sem abrir o objeto.
    expect(prazo.message).toContain("persistencia");
  });

  it("todo call site declarado produz um erro que se identifica", async () => {
    vi.useFakeTimers();
    for (const site of CALL_SITES_BANCO_ANALISE) {
      const observado = comPrazoDeBanco(
        travada<string>(),
        site,
        PRAZO_BANCO_ANALISE_MS,
      ).catch((err: unknown) => err);
      await vi.advanceTimersByTimeAsync(PRAZO_BANCO_ANALISE_MS);
      const err = (await observado) as PrazoDeBancoEstourado;
      expect(err.callSite).toBe(site);
      expect(err.message).toContain(site);
    }
  });
});

describe("trabalho que chega a tempo", () => {
  it("vence a corrida e nao deixa timer pendurado", async () => {
    vi.useFakeTimers();
    const valor = await comPrazoDeBanco(
      Promise.resolve("linha-gravada"),
      "log_grava_uso",
      5_000,
    );
    expect(valor).toBe("linha-gravada");
    // O `finally` limpa o timer. Sem ele, um processo que chama isto milhares de
    // vezes por dia carrega milhares de timers vivos ate estourarem sozinhos.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("erro do proprio banco continua chegando como erro do banco", async () => {
    vi.useFakeTimers();
    const err = await comPrazoDeBanco(
      Promise.reject(new Error("relation nao existe")),
      "persistencia",
      5_000,
    ).catch((e: unknown) => e);
    // O prazo nao pode mascarar a falha real: quem trata precisa distinguir
    // "o banco recusou" de "paramos de esperar".
    expect(err).not.toBeInstanceOf(PrazoDeBancoEstourado);
    expect((err as Error).message).toBe("relation nao existe");
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("o perdedor da corrida continua vivo", () => {
  it("o trabalho aterrissa depois do prazo, e falhar tarde nao derruba nada", async () => {
    vi.useFakeTimers();
    const naoTratada = vi.fn();
    process.on("unhandledRejection", naoTratada);

    let falhar: (e: Error) => void = () => undefined;
    const emVoo = new Promise<string>((_resolve, reject) => {
      falhar = reject;
    });

    const observado = comPrazoDeBanco(emVoo, "log_grava_uso", 5_000).catch(
      (e: unknown) => e,
    );
    await vi.advanceTimersByTimeAsync(5_000);
    expect(await observado).toBeInstanceOf(PrazoDeBancoEstourado);

    // Agora o trabalho perdido falha, MUITO depois de ninguem mais esperar por
    // ele. Este e o caso que derrubaria o processo em Node sem o `catch` do
    // perdedor dentro de `comPrazoDeBanco`.
    falhar(new Error("o banco respondeu erro, tarde"));
    // `unhandledRejection` so e emitido num tique de macrotarefa REAL: com
    // relogio falso o `setImmediate` nunca dispara e o teste ficaria verde sem
    // ter observado nada.
    vi.useRealTimers();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(naoTratada).not.toHaveBeenCalled();
    process.off("unhandledRejection", naoTratada);
  });
});

describe("sem prazo declarado", () => {
  it("nao ha prazo nenhum, nem timer: e o caminho das outras ferramentas", async () => {
    vi.useFakeTimers();
    let resolvido = false;
    void comPrazoDeBanco(travada<string>(), "reserva_atomica", undefined).then(
      () => {
        resolvido = true;
      },
      () => {
        resolvido = true;
      },
    );

    // Uma hora de relogio falso, quarenta vezes o maior prazo do caminho da
    // analise. Nada acontece, que e exatamente a promessa do opt-in.
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(resolvido).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("devolve o valor do trabalho sem intermediar nada", async () => {
    await expect(
      comPrazoDeBanco(Promise.resolve(42), "reserva_degradada", undefined),
    ).resolves.toBe(42);
  });
});
