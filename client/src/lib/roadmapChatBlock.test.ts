import { describe, expect, it } from "vitest";
import { IntakeChatApiError } from "@/services/aiRoadmapService";
import {
  BLOCK_COPY,
  blockFromError,
  exitsForBlock,
  isTransient,
  type ChatBlockKind,
} from "./roadmapChatBlock";

/**
 * CENARIO 5 do smoke test, na forma permanente.
 *
 * O INVARIANTE da fase 2: em nenhum estado alcancavel a pessoa fica sem caminho
 * adiante. O bug original era o inverso: todo erro caia na mesma tela com um
 * botao "Tentar de novo" que reenviava o MESMO corpo e recebia o MESMO erro.
 * Quem batia no teto de turnos, ou estourava a cota diaria no meio da conversa,
 * ficava preso ate o rascunho expirar em 24h.
 *
 * Estes testes rodam offline: nao chamam a API, nao gastam OpenAI e nao escrevem
 * nada. Por isso podem ser permanentes, e nao um script de smoke descartavel.
 */

const TODOS_OS_KINDS: ChatBlockKind[] = [
  "transient",
  "turn_limit",
  "quota",
  "payload",
  "pro",
  "invalid",
];

describe("blockFromError: cada codigo da API vira o bloqueio certo", () => {
  const casos: Array<[string, ChatBlockKind]> = [
    ["turn_limit", "turn_limit"],
    ["rate_limited", "quota"],
    ["payload_too_large", "payload"],
    ["pro_required", "pro"],
    ["invalid_request", "invalid"],
  ];

  for (const [code, kind] of casos) {
    it(`${code} vira ${kind}`, () => {
      const b = blockFromError(
        new IntakeChatApiError(code as never, "x"),
        "fb",
      );
      expect(b.kind).toBe(kind);
    });
  }

  it("erro desconhecido vira transient, com a mensagem de fallback", () => {
    const b = blockFromError(new Error("boom"), "tente de novo");
    expect(b).toEqual({ kind: "transient", message: "tente de novo" });
  });

  it("erro de rede (nao-Error) tambem vira transient", () => {
    expect(blockFromError(null, "fb").kind).toBe("transient");
    expect(blockFromError("string solta", "fb").kind).toBe("transient");
  });

  it("upstream_error (502) e transient: tentar de novo FAZ sentido nele", () => {
    // Falha da OpenAI e o unico caso legitimo de retry: o mesmo corpo pode
    // funcionar na proxima. Por isso ele nao esta na lista de kinds terminais.
    const b = blockFromError(
      new IntakeChatApiError("upstream_error", "IA fora do ar"),
      "fb",
    );
    expect(b.kind).toBe("transient");
  });
});

describe("INVARIANTE: sempre existe saida, em TODO kind de bloqueio", () => {
  for (const kind of TODOS_OS_KINDS) {
    it(`${kind}: recomecar sempre existe`, () => {
      const saidas = exitsForBlock({ kind }, false);
      expect(saidas.recomecar).toBe(true);
    });

    it(`${kind}: com canGenerate, a saida e gerar`, () => {
      const saidas = exitsForBlock({ kind }, true);
      expect(saidas.gerar).toBe(true);
    });

    it(`${kind}: sem canGenerate, a saida e o formulario`, () => {
      const saidas = exitsForBlock({ kind }, false);
      expect(saidas.formulario).toBe(true);
    });

    it(`${kind}: nunca fica com ZERO saidas`, () => {
      for (const canGenerate of [true, false]) {
        const s = exitsForBlock({ kind }, canGenerate);
        const quantas = [s.gerar, s.formulario, s.recomecar].filter(
          Boolean,
        ).length;
        expect(quantas).toBeGreaterThan(0);
      }
    });
  }

  it("gerar e formulario sao mutuamente exclusivos, e um dos dois sempre aparece", () => {
    for (const kind of TODOS_OS_KINDS) {
      for (const canGenerate of [true, false]) {
        const s = exitsForBlock({ kind }, canGenerate);
        expect(s.gerar).toBe(!s.formulario);
      }
    }
  });

  it("sem bloqueio nenhum tambem ha saida", () => {
    expect(exitsForBlock(null, false).recomecar).toBe(true);
  });
});

describe("REGRESSAO: Retry inutil so no transient", () => {
  it("o teto de turnos NAO oferece tentar de novo", () => {
    // Este era O bug: reenviar as mesmas 12 mensagens dava o mesmo 400.
    expect(exitsForBlock({ kind: "turn_limit" }, false).tentarDeNovo).toBe(
      false,
    );
  });

  it("a cota estourada NAO oferece tentar de novo", () => {
    // Cenario 5 do smoke test: 429 no meio da conversa. Tentar de novo hoje
    // daria 429 de novo, ate a virada do dia.
    expect(exitsForBlock({ kind: "quota" }, false).tentarDeNovo).toBe(false);
  });

  for (const kind of ["payload", "pro", "invalid"] as ChatBlockKind[]) {
    it(`${kind} NAO oferece tentar de novo`, () => {
      expect(exitsForBlock({ kind }, false).tentarDeNovo).toBe(false);
    });
  }

  it("transient oferece, e e o unico", () => {
    expect(exitsForBlock({ kind: "transient" }, false).tentarDeNovo).toBe(true);
    const comRetry = TODOS_OS_KINDS.filter(
      (k) => exitsForBlock({ kind: k }, false).tentarDeNovo,
    );
    expect(comRetry).toEqual(["transient"]);
  });
});

describe("resposta REAL do servidor, capturada no smoke test", () => {
  // Corpo verbatim devolvido por POST /api/roadmaps-ia/intake/chat com 21
  // mensagens de usuario, contra o servidor da fase 2, em 2026-07-31. Nao e
  // objeto montado a mao: e o que o servidor mandou. `createError` ANINHA sob
  // `error`, e ler a forma errada foi o que fez o harness reportar "code=-"
  // para uma rejeicao que tinha acontecido.
  const CORPO_REAL_TURN_LIMIT = {
    error: {
      code: "turn_limit",
      message:
        "Chegamos ao limite desta conversa. Prefira preencher o formulario para gerar seu roadmap.",
    },
  };

  it("o corpo real vira bloqueio turn_limit e a pessoa tem saida", () => {
    // Mesmo caminho do client: readErrorBody desaninha, toIntakeChatError tipa.
    const erro = new IntakeChatApiError(
      CORPO_REAL_TURN_LIMIT.error.code as never,
      CORPO_REAL_TURN_LIMIT.error.message,
    );
    const bloqueio = blockFromError(erro, "fallback");
    expect(bloqueio.kind).toBe("turn_limit");

    const semIntake = exitsForBlock(bloqueio, false);
    expect(semIntake.formulario).toBe(true);
    expect(semIntake.recomecar).toBe(true);
    expect(semIntake.tentarDeNovo).toBe(false);

    const comIntake = exitsForBlock(bloqueio, true);
    expect(comIntake.gerar).toBe(true);
    expect(comIntake.recomecar).toBe(true);
  });
});

describe("copy de bloqueio", () => {
  it("todo kind terminal tem copy propria, e nenhuma e vazia", () => {
    const terminais = TODOS_OS_KINDS.filter((k) => k !== "transient");
    for (const k of terminais) {
      const texto = BLOCK_COPY[k as Exclude<ChatBlockKind, "transient">];
      expect(texto, `${k} sem copy`).toBeTruthy();
      expect(texto.trim().length).toBeGreaterThan(10);
    }
    // Afirma o TOTAL, nao so a pertinencia: kind novo sem copy derruba isto.
    expect(Object.keys(BLOCK_COPY).sort()).toEqual(terminais.sort());
  });

  it("a copy da cota diz que ela e separada da de gerar", () => {
    // Sem isso a pessoa acha que perdeu tambem a chance de gerar o roadmap.
    expect(BLOCK_COPY.quota).toContain("separado da cota de gerar");
  });

  it("isTransient distingue certo", () => {
    expect(isTransient({ kind: "transient" })).toBe(true);
    expect(isTransient({ kind: "quota" })).toBe(false);
    expect(isTransient(null)).toBe(false);
  });
});
