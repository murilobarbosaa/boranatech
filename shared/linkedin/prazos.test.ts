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

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CALL_SITES_BANCO_ANALISE,
  comPrazoDeBanco,
  FOLGA_CLIENT_MS,
  IA_BACKOFF_MS,
  IA_BACKOFF_PADRAO_MS,
  IA_BACKOFF_TOTAL_MS,
  IA_MAX_TENTATIVAS,
  PIOR_CASO_BANCO_MS,
  PIOR_CASO_IA_MS,
  PIOR_CASO_SERVIDOR_MS,
  PRAZO_BANCO_ANALISE_MS,
  PRAZO_IA_POR_TENTATIVA_MS,
  PrazoDeBancoEstourado,
  ROUND_TRIPS_BANCO_DEGRADADO,
  ROUND_TRIPS_BANCO_NORMAL,
  TETO_CLIENT_MS,
} from "./prazos";

const RAIZ = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

/** Promessa que nunca se resolve sozinha, como um banco que travou. */
function travada<T>(): Promise<T> {
  return new Promise<T>(() => undefined);
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/**
 * FOLGA MINIMA CONTRATADA entre o pior caso do servidor e o aborto do client.
 *
 * Escrita aqui, e nao importada de `prazos.ts`, de proposito: um minimo que le a
 * si mesmo do arquivo que ele deveria vigiar nao vigia nada. Baixar a folga
 * abaixo disto tem de quebrar a suite.
 */
const FOLGA_CLIENT_MINIMA_MS = 15_000;

describe("a INVARIANTE do teto do client", () => {
  it("o teto do client e ESTRITAMENTE maior que o pior caso do servidor", () => {
    // A afirmacao inteira deste lote em uma linha. Ela era FALSA antes:
    // 120.000 contra 150.400, margem negativa de 30,4s.
    expect(TETO_CLIENT_MS).toBeGreaterThan(PIOR_CASO_SERVIDOR_MS);
  });

  it("a folga nomeada respeita o minimo contratado", () => {
    expect(FOLGA_CLIENT_MS).toBeGreaterThanOrEqual(FOLGA_CLIENT_MINIMA_MS);
    // E a folga e MESMO a diferenca, nao um numero decorativo ao lado dela.
    expect(TETO_CLIENT_MS - PIOR_CASO_SERVIDOR_MS).toBe(FOLGA_CLIENT_MS);
  });

  it("o pior caso soma TODAS as parcelas, e nenhuma esta desligada", () => {
    // Cada igualdade abaixo mata um mutante que zere ou desligue uma parcela.
    expect(PIOR_CASO_IA_MS).toBe(
      PRAZO_IA_POR_TENTATIVA_MS * IA_MAX_TENTATIVAS + IA_BACKOFF_TOTAL_MS,
    );
    expect(PIOR_CASO_BANCO_MS).toBe(
      PRAZO_BANCO_ANALISE_MS * ROUND_TRIPS_BANCO_DEGRADADO,
    );
    expect(PIOR_CASO_SERVIDOR_MS).toBe(PIOR_CASO_IA_MS + PIOR_CASO_BANCO_MS);
    // Nenhuma parcela pode ser zero: parcela zerada e parcela desligada, e a
    // soma continuaria com cara de conta certa.
    for (const parcela of [PIOR_CASO_IA_MS, PIOR_CASO_BANCO_MS]) {
      expect(parcela).toBeGreaterThan(0);
    }
  });

  it("o caminho DEGRADADO e o que entra na conta, nao o normal", () => {
    // O erro que produziu o defeito foi dimensionar pelo caminho feliz. Se
    // alguem trocar a parcela pelo normal, a conta encolhe 5s e este teste cai.
    expect(ROUND_TRIPS_BANCO_DEGRADADO).toBeGreaterThan(
      ROUND_TRIPS_BANCO_NORMAL,
    );
    expect(PIOR_CASO_BANCO_MS).not.toBe(
      PRAZO_BANCO_ANALISE_MS * ROUND_TRIPS_BANCO_NORMAL,
    );
  });

  it("a contagem de round-trips VEM da lista de call sites", () => {
    // Contagem escrita a mao desatualiza no primeiro round-trip novo; derivada
    // da lista que o TypeScript obriga a crescer, nao tem como.
    expect(ROUND_TRIPS_BANCO_DEGRADADO).toBe(CALL_SITES_BANCO_ANALISE.length);
    expect(new Set(CALL_SITES_BANCO_ANALISE).size).toBe(
      CALL_SITES_BANCO_ANALISE.length,
    );
  });
});

describe("o backoff efetivo, nao o declarado", () => {
  it("soma so os backoffs que o laco realmente aplica", () => {
    // Com o teto em 2 o laco dorme UMA vez, no indice 0. O segundo elemento do
    // array e inalcancavel, e somar o array inteiro inflaria o pior caso em
    // 800ms de espera que nunca acontece.
    expect(IA_BACKOFF_TOTAL_MS).toBe(400);
    expect(IA_BACKOFF_TOTAL_MS).toBeLessThan(
      IA_BACKOFF_MS.reduce((soma, ms) => soma + ms, 0),
    );
  });

  it("o padrao espelha o `??` do laco, para um teto maior que o array", () => {
    expect(IA_BACKOFF_PADRAO_MS).toBe(800);
  });
});

describe("o client NAO escreve teto proprio", () => {
  it("linkedinClient importa TETO_CLIENT_MS e nao tem literal de milissegundos", () => {
    const fonte = readFileSync(
      path.join(RAIZ, "client/src/lib/linkedinClient.ts"),
      "utf8",
    );
    expect(fonte).toContain("TETO_CLIENT_MS");
    expect(fonte).toContain('from "@shared/linkedin/prazos"');
    // O literal antigo, pelo nome. Ele voltar e o defeito voltar.
    expect(fonte).not.toContain("ANALYZE_TIMEOUT_MS");
    // E QUALQUER numero grande em `setTimeout`, nao so aquele: a proibicao e de
    // escrever teto local, nao de escrever aquele teto local especifico.
    const setTimeouts = Array.from(
      fonte.matchAll(/setTimeout\([\s\S]{0,120}?\)/g),
      (m) => m[0],
    );
    expect(setTimeouts.length).toBeGreaterThan(0);
    for (const chamada of setTimeouts) {
      expect(chamada).not.toMatch(/\d[\d_]{3,}/);
    }
  });
});

describe("as parcelas sao contrato, nao preferencia", () => {
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

  it("as demais parcelas e a conta fechada valem o que foi medido", () => {
    expect(PRAZO_IA_POR_TENTATIVA_MS).toBe(45_000);
    expect(IA_MAX_TENTATIVAS).toBe(2);
    expect(FOLGA_CLIENT_MS).toBe(15_000);
    // A CONTA FECHADA, escrita por extenso uma vez so, aqui. Qualquer mutante
    // numa parcela muda estes dois numeros e morre nesta linha, inclusive os que
    // a derivacao sozinha nao pegaria (ela acompanha a parcela mutada).
    expect(PIOR_CASO_SERVIDOR_MS).toBe(115_400);
    expect(TETO_CLIENT_MS).toBe(130_400);
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
