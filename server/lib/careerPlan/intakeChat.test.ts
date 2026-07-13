import { describe, expect, it } from "vitest";

import { toOpenAIStrictSchema } from "../openaiStrictSchema";
import {
  IntakeChatTurnSchema,
  INTAKE_CHAT_SYSTEM_PROMPT,
  MAX_BODY_CHARS,
  MAX_USER_MESSAGES,
  validateIntakeChatBody,
  type IntakeChatTurn,
} from "./intakeChat";

// Turno minimo valido: o chat ja sabe a area (ia), resto em aberto, ready false.
function validTurn(): IntakeChatTurn {
  return {
    reply: "Vi que voce vem de backend, o alvo ainda e IA?",
    intake: {
      goal: null,
      area: "ia",
      level: null,
      hoursPerWeek: null,
      horizonMonths: null,
      budget: null,
    },
    missing: ["goal", "level", "hoursPerWeek", "horizonMonths", "budget"],
    ready: false,
  };
}

describe("schema strict do turno de intake", () => {
  it("mantem additionalProperties false e todos os campos em required", () => {
    const schema = toOpenAIStrictSchema(IntakeChatTurnSchema) as {
      additionalProperties?: boolean;
      required?: string[];
      properties: Record<
        string,
        {
          type?: unknown;
          required?: string[];
          additionalProperties?: boolean;
        }
      >;
    };

    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toEqual(
      expect.arrayContaining(["reply", "intake", "missing", "ready"]),
    );

    const intake = schema.properties.intake;
    expect(intake.additionalProperties).toBe(false);
    expect(intake.required).toEqual(
      expect.arrayContaining([
        "goal",
        "area",
        "level",
        "hoursPerWeek",
        "horizonMonths",
        "budget",
      ]),
    );

    expect(schema.properties.missing.type).toBe("array");
  });
});

describe("parse de turno", () => {
  it("aceita um turno valido", () => {
    expect(IntakeChatTurnSchema.safeParse(validTurn()).success).toBe(true);
  });

  it("aceita ready true com todos os campos preenchidos", () => {
    const turn: IntakeChatTurn = {
      reply: "Fechado, seu intake esta completo.",
      intake: {
        goal: "virar dev de IA",
        area: "ia",
        level: "iniciante",
        hoursPerWeek: 10,
        horizonMonths: 12,
        budget: "ate_500",
      },
      missing: [],
      ready: true,
    };
    expect(IntakeChatTurnSchema.safeParse(turn).success).toBe(true);
  });

  it("reprova reply vazio", () => {
    const turn = { ...validTurn(), reply: "" };
    expect(IntakeChatTurnSchema.safeParse(turn).success).toBe(false);
  });

  it("reprova reply acima de 600 caracteres", () => {
    const turn = { ...validTurn(), reply: "a".repeat(601) };
    expect(IntakeChatTurnSchema.safeParse(turn).success).toBe(false);
  });

  it("reprova area fora dos slugs da plataforma", () => {
    const turn = validTurn();
    const invalid = {
      ...turn,
      intake: { ...turn.intake, area: "banana" },
    };
    expect(IntakeChatTurnSchema.safeParse(invalid).success).toBe(false);
  });

  it("reprova budget fora dos niveis validos", () => {
    const turn = validTurn();
    const invalid = {
      ...turn,
      intake: { ...turn.intake, budget: "500" },
    };
    expect(IntakeChatTurnSchema.safeParse(invalid).success).toBe(false);
  });

  it("reprova missing com um campo que nao existe no intake", () => {
    const turn = { ...validTurn(), missing: ["banana"] };
    expect(IntakeChatTurnSchema.safeParse(turn).success).toBe(false);
  });
});

describe("validacao do corpo (caps)", () => {
  it("aceita um corpo minimo valido", () => {
    const result = validateIntakeChatBody({
      messages: [{ role: "user", content: "quero um plano de carreira" }],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.messages).toHaveLength(1);
    }
  });

  it("reprova corpo sem mensagens", () => {
    expect(validateIntakeChatBody({}).ok).toBe(false);
    expect(validateIntakeChatBody({ messages: [] }).ok).toBe(false);
  });

  it("reprova quando todas as mensagens sao vazias/invalidas", () => {
    const result = validateIntakeChatBody({
      messages: [
        { role: "user", content: "   " },
        { role: "bot", content: "oi" },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_request");
  });

  it("reprova quando a soma de chars estoura o teto", () => {
    const result = validateIntakeChatBody({
      messages: [{ role: "user", content: "a".repeat(MAX_BODY_CHARS + 1) }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("payload_too_large");
  });

  it("reprova quando passa do teto de mensagens de usuario", () => {
    const messages = Array.from(
      { length: MAX_USER_MESSAGES + 1 },
      (_, i) => ({ role: "user" as const, content: `msg ${i}` }),
    );
    const result = validateIntakeChatBody({ messages });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("turn_limit");
  });

  it("mensagens do assistente nao contam para o teto de turnos", () => {
    const messages = [
      ...Array.from({ length: MAX_USER_MESSAGES }, (_, i) => ({
        role: "user" as const,
        content: `pergunta ${i}`,
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        role: "assistant" as const,
        content: `resposta ${i}`,
      })),
    ];
    expect(validateIntakeChatBody({ messages }).ok).toBe(true);
  });
});

describe("regras chave no system prompt", () => {
  it("proibe perguntar o que o contexto ja responde", () => {
    expect(INTAKE_CHAT_SYSTEM_PROMPT).toContain(
      "Nunca pergunte o que o contexto já responde",
    );
  });

  it("so libera ready depois da confirmacao do resumo", () => {
    expect(INTAKE_CHAT_SYSTEM_PROMPT).toContain("confirmar o resumo");
    expect(INTAKE_CHAT_SYSTEM_PROMPT).toContain("ready");
  });

  it("proibe citar preco, valor ou moeda", () => {
    expect(INTAKE_CHAT_SYSTEM_PROMPT).toContain(
      "Nunca cite preço, valor ou moeda",
    );
  });
});
