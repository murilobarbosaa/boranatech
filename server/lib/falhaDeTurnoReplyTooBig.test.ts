import { describe, expect, it } from "vitest";

import {
  caminhosDoSchema,
  diagnosticoDeTurnoReprovado,
  IntakeChatTurnSchema,
} from "./aiRoadmap/intakeChat";
import { classificarFalhaDeTurno } from "./falhaDeTurno";

/**
 * BUG-73: `roadmap-intake-chat` com `schema_mismatch:reply`, 7 falhas em 30
 * dias, um usuario 4 vezes em 80 segundos em 24/08.
 *
 * O codigo gravado dizia QUE campo o modelo errou e nao COMO. `reply` pode
 * falhar por estourar os 600, por vir vazio ou por nao ser string, e as tres
 * pedem correcoes diferentes. Este arquivo percorre a cadeia inteira com um
 * `ZodError` REAL, do proprio `IntakeChatTurnSchema`, e nao com issues montados
 * a mao: issue montado a mao prova o meu entendimento do Zod, nao o Zod.
 *
 * As expectativas sao escritas a mao (`reply:too_big`, `601`,
 * `schema_mismatch:reply:too_big`), nunca derivadas de chamar as funcoes sob
 * teste.
 */

// 601 caracteres: um a mais que o teto de 600 de `reply`.
const REPLY_LONGO = "a".repeat(601);

// Fala da pessoa que NAO pode aparecer em nenhum registro.
const FALA = "meu chefe me humilha e eu quero sair";

function turnoValido() {
  return {
    reply: "E qual stack voce quer focar?",
    intake: {
      goal: "transicao" as const,
      hoursPerWeek: "5-10" as const,
      deadline: "6m" as const,
      stackFocus: "node",
      startingPoint: null,
      motivation: null,
      constraints: null,
    },
    missing: [],
    ready: false,
  };
}

describe("BUG-73: reply reprovado diz COMO falhou, sem vazar a fala", () => {
  it("ZodError real de too_big vira reply:too_big com 601 no diagnostico", () => {
    const parsed = { ...turnoValido(), reply: REPLY_LONGO };
    const validation = IntakeChatTurnSchema.safeParse(parsed);

    // Pre-condicao: o cenario e mesmo um too_big em reply, e so isso.
    expect(validation.success).toBe(false);
    if (validation.success) throw new Error("cenario invalido");
    expect(validation.error.issues).toHaveLength(1);
    expect(validation.error.issues[0].code).toBe("too_big");

    const diagnostico = diagnosticoDeTurnoReprovado(
      parsed,
      validation.error.issues,
    );

    expect(diagnostico.campos).toBe("reply:too_big");
    expect(diagnostico.replyChars).toBe(601);
    expect(REPLY_LONGO.length).toBe(601);
  });

  it("o comprimento NAO entra no codigo gravado no banco", () => {
    const parsed = { ...turnoValido(), reply: REPLY_LONGO };
    const validation = IntakeChatTurnSchema.safeParse(parsed);
    if (validation.success) throw new Error("cenario invalido");

    const { campos } = diagnosticoDeTurnoReprovado(
      parsed,
      validation.error.issues,
    );
    const mensagem = `Resposta da IA nao bateu com o schema: campos [${campos}]`;

    // Isto e o que `ai_usage_logs` recebe. Comprimento aqui faria 601, 612 e 634
    // virarem tres codigos distintos, matando a agregacao por tipo de falha.
    expect(classificarFalhaDeTurno(mensagem)).toBe(
      "schema_mismatch:reply:too_big",
    );
    expect(classificarFalhaDeTurno(mensagem)).not.toContain("601");
  });

  it("reply vazio e reply nao-string se distinguem do too_big", () => {
    const vazio = IntakeChatTurnSchema.safeParse({
      ...turnoValido(),
      reply: "",
    });
    if (vazio.success) throw new Error("cenario invalido");
    expect(caminhosDoSchema(vazio.error.issues)).toBe("reply:too_small");

    const naoString = IntakeChatTurnSchema.safeParse({
      ...turnoValido(),
      reply: 42,
    });
    if (naoString.success) throw new Error("cenario invalido");
    expect(caminhosDoSchema(naoString.error.issues)).toBe("reply:invalid_type");

    // Os tres casos caiam todos em `schema_mismatch:reply` antes deste lote.
    expect(caminhosDoSchema(vazio.error.issues)).not.toBe(
      caminhosDoSchema(naoString.error.issues),
    );
  });

  it("a fala da pessoa nao entra no diagnostico nem no codigo", () => {
    // `intake.goal` fora do enum e onde o Zod carrega o valor recebido.
    const parsed = {
      ...turnoValido(),
      reply: FALA,
      intake: { ...turnoValido().intake, goal: FALA },
    };
    const validation = IntakeChatTurnSchema.safeParse(parsed);
    if (validation.success) throw new Error("cenario invalido");

    const { campos, replyChars } = diagnosticoDeTurnoReprovado(
      parsed,
      validation.error.issues,
    );

    expect(campos).toBe("intake.goal:invalid_value");
    expect(campos).not.toContain(FALA);
    expect(campos).not.toContain("humilha");

    // O comprimento e um numero, nunca o texto.
    // 36: meu(3) chefe(5) me(2) humilha(7) e(1) eu(2) quero(5) sair(4) = 29,
    // mais 7 espacos.
    expect(replyChars).toBe(36);
    expect(FALA.length).toBe(36);

    const mensagem = `Resposta da IA nao bateu com o schema: campos [${campos}]`;
    expect(classificarFalhaDeTurno(mensagem)).toBe(
      "schema_mismatch:intake.goal:invalid_value",
    );
    expect(classificarFalhaDeTurno(mensagem)).not.toContain("humilha");
  });

  it("replyChars e null quando reply nao veio como string", () => {
    expect(diagnosticoDeTurnoReprovado({ reply: 42 }, []).replyChars).toBe(
      null,
    );
    expect(diagnosticoDeTurnoReprovado({}, []).replyChars).toBe(null);
    expect(diagnosticoDeTurnoReprovado(null, []).replyChars).toBe(null);
    expect(diagnosticoDeTurnoReprovado("texto", []).replyChars).toBe(null);
  });

  it("classificarFalhaDeTurno preserva os outros codigos", () => {
    expect(classificarFalhaDeTurno("deu upstream_timeout")).toBe("timeout");
    expect(classificarFalhaDeTurno("OpenAI respondeu 429 ...")).toBe(
      "openai_429",
    );
    expect(
      classificarFalhaDeTurno("Resposta da IA nao veio em JSON valido: x"),
    ).toBe("invalid_json");
    expect(classificarFalhaDeTurno("A IA nao retornou conteudo.")).toBe(
      "no_content",
    );
    expect(classificarFalhaDeTurno("qualquer outra coisa")).toBe(
      "upstream_error",
    );
  });
});
