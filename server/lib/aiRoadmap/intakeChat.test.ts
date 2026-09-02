import { describe, expect, it, vi } from "vitest";

// intakeChat importa `../env` transitivamente (openaiApiKey). No CI nao existe
// arquivo .env, entao o mock e obrigatorio: regra do CLAUDE.md, "Teste que le
// env.* precisa mockar ./env".
vi.mock("../env", async (importActual) => {
  const real = await importActual<typeof import("../env")>();
  return {
    ...real,
    env: { ...real.env, openaiApiKey: "sk-de-teste-nao-usada" },
  };
});

import {
  caminhosDoSchema,
  CHAT_KICKOFF,
  COMPRESS_KEEP_TAIL,
  compressHistory,
  CONVERSAS_COMPLETAS_POR_DIA,
  COTA_DIARIA_MINIMA,
  MAX_BODY_CHARS,
  MAX_USER_MESSAGES,
  POUSO_SUAVE_RESTANTES,
  PROMPT_HISTORY_MAX_CHARS,
  ROTEIRO_ETAPAS,
  ROTEIRO_PIOR_CASO,
  ROTEIRO_REPERGUNTAS_POR_ETAPA,
  ROTEIRO_TURNOS_DE_CONFIRMACAO,
  validateIntakeChatBody,
  type IntakeChatMessage,
} from "./intakeChat";
import { ROADMAP_INTAKE_CHAT_DEFAULT_DAILY_LIMIT } from "../../../shared/aiRoadmap";

/**
 * O defeito que estes testes travam: o teto de mensagens era MENOR que o
 * roteiro que o proprio prompt manda o modelo seguir (12 contra 15), e uma das
 * 12 vagas ainda era gasta pela semente que o client prefixava a cada turno.
 * Resultado: a conversa morria antes do resumo, o input travava e nao havia
 * botao de gerar. Seis conversas em producao pararam em exatamente 12 turnos, e
 * nenhuma em 11.
 */

function conversa(respostasDoUsuario: number): IntakeChatMessage[] {
  const msgs: IntakeChatMessage[] = [];
  for (let i = 0; i < respostasDoUsuario; i += 1) {
    msgs.push({ role: "assistant", content: `pergunta ${i}` });
    msgs.push({ role: "user", content: `resposta ${i}` });
  }
  return msgs;
}

describe("validateIntakeChatBody: teto de mensagens do usuario", () => {
  it("aceita exatamente o teto", () => {
    const r = validateIntakeChatBody({ messages: conversa(MAX_USER_MESSAGES) });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.userCount).toBe(MAX_USER_MESSAGES);
      expect(r.restantes).toBe(0);
    }
  });

  it("rejeita uma acima do teto", () => {
    const r = validateIntakeChatBody({
      messages: conversa(MAX_USER_MESSAGES + 1),
    });
    expect(r).toEqual({ ok: false, error: "turn_limit" });
  });

  it("devolve o orcamento restante decrescendo a cada resposta", () => {
    for (const dadas of [0, 1, 7, MAX_USER_MESSAGES - 1]) {
      const r = validateIntakeChatBody({ messages: conversa(dadas) });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.restantes).toBe(MAX_USER_MESSAGES - dadas);
    }
  });
});

describe("validateIntakeChatBody: a semente NAO conta no orcamento", () => {
  // O bundle antigo da Vercel continua prefixando a semente depois do deploy
  // (aba aberta nao recarrega sozinha). Se ela contasse, esses clientes teriam
  // um turno a menos que os novos, em silencio.
  it("remove a semente prefixada pelo cliente antigo", () => {
    const antigo = [
      { role: "user" as const, content: CHAT_KICKOFF },
      ...conversa(3),
    ];
    const r = validateIntakeChatBody({ messages: antigo });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.userCount).toBe(3);
      expect(r.messages.some((m) => m.content === CHAT_KICKOFF)).toBe(false);
    }
  });

  it("cliente antigo no teto e aceito, nao rejeitado por causa da semente", () => {
    const noTeto = [
      { role: "user" as const, content: CHAT_KICKOFF },
      ...conversa(MAX_USER_MESSAGES),
    ];
    expect(validateIntakeChatBody({ messages: noTeto }).ok).toBe(true);
  });

  it("remove a semente em QUALQUER posicao, nao so na primeira", () => {
    const espalhada = [
      ...conversa(2),
      { role: "user" as const, content: CHAT_KICKOFF },
      ...conversa(2),
    ];
    const r = validateIntakeChatBody({ messages: espalhada });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.userCount).toBe(4);
  });

  it("historico VAZIO e valido: e o turno de abertura", () => {
    const r = validateIntakeChatBody({ messages: [] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.userCount).toBe(0);
      expect(r.restantes).toBe(MAX_USER_MESSAGES);
    }
  });

  // JANELA DE DEPLOY, o outro sentido. O bundle novo abre a conversa com
  // historico vazio; se a Vercel subir antes do Railway, esse corpo bate no
  // backend ANTIGO, que rejeitava vazio com invalid_request. O client tem um
  // retry unico que reenvia so a semente (ver runTurn em RoadmapIA.tsx), e este
  // teste trava o lado do servidor NOVO: aquele mesmo corpo de compatibilidade
  // precisa continuar valendo, e a semente nao pode entrar no orcamento.
  it("o corpo do retry de compatibilidade (so a semente) abre a conversa sem gastar turno", () => {
    const r = validateIntakeChatBody({
      messages: [{ role: "user" as const, content: CHAT_KICKOFF }],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.messages).toHaveLength(0);
      expect(r.userCount).toBe(0);
      expect(r.restantes).toBe(MAX_USER_MESSAGES);
    }
  });
});

describe("validateIntakeChatBody: desbloqueio de quem ficou preso", () => {
  // As pessoas travadas em producao tem rascunho de 12 e 13 mensagens de
  // usuario no localStorage. Se o servidor novo continuasse rejeitando, o
  // deploy nao consertaria nada para elas.
  for (const presas of [12, 13]) {
    it(`aceita um rascunho legado com ${presas} mensagens do usuario`, () => {
      const r = validateIntakeChatBody({ messages: conversa(presas) });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.restantes).toBe(MAX_USER_MESSAGES - presas);
    });

    it(`aceita ${presas} mensagens vindas do bundle antigo (com semente)`, () => {
      const r = validateIntakeChatBody({
        messages: [
          { role: "user" as const, content: CHAT_KICKOFF },
          ...conversa(presas),
        ],
      });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.userCount).toBe(presas);
    });
  }
});

describe("validateIntakeChatBody: corpo invalido e teto de abuso", () => {
  it("rejeita quando messages nao e array", () => {
    expect(validateIntakeChatBody({ messages: "oi" })).toEqual({
      ok: false,
      error: "invalid_request",
    });
    expect(validateIntakeChatBody({})).toEqual({
      ok: false,
      error: "invalid_request",
    });
  });

  it("descarta itens malformados sem derrubar o turno", () => {
    const r = validateIntakeChatBody({
      messages: [
        { role: "user", content: "vale" },
        { role: "system", content: "papel invalido" },
        { role: "user", content: "   " },
        null,
        { role: "assistant", content: 42 },
      ],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.messages).toEqual([{ role: "user", content: "vale" }]);
    }
  });

  it("so rejeita por tamanho no teto de ABUSO, nao no de prompt", () => {
    // Uma mensagem acima do teto de compressao mas abaixo do de abuso passa: o
    // historico e comprimido na montagem do prompt, nao rejeitado.
    const grande = [
      {
        role: "user" as const,
        content: "x".repeat(PROMPT_HISTORY_MAX_CHARS + 1),
      },
    ];
    expect(validateIntakeChatBody({ messages: grande }).ok).toBe(true);

    const absurdo = [
      { role: "user" as const, content: "x".repeat(MAX_BODY_CHARS + 1) },
    ];
    expect(validateIntakeChatBody({ messages: absurdo })).toEqual({
      ok: false,
      error: "payload_too_large",
    });
  });
});

describe("compressHistory", () => {
  it("nao mexe no historico quando ele cabe", () => {
    const h = conversa(5);
    expect(compressHistory(h)).toBe(h);
  });

  it("corta os mais ANTIGOS e preserva a cauda", () => {
    const h: IntakeChatMessage[] = [];
    for (let i = 0; i < 60; i += 1) {
      h.push({
        role: i % 2 === 0 ? "assistant" : "user",
        content: "y".repeat(900),
      });
    }
    const out = compressHistory(h);
    const tamanho = out.reduce((acc, m) => acc + m.content.length, 0);
    expect(tamanho).toBeLessThanOrEqual(PROMPT_HISTORY_MAX_CHARS + 400);
    // A cauda sobrevive inteira: e nela que vivem o resumo e a confirmacao.
    expect(out.slice(-COMPRESS_KEEP_TAIL)).toEqual(
      h.slice(-COMPRESS_KEEP_TAIL),
    );
    // E o modelo e avisado de que houve corte, para nao repetir etapas.
    expect(out[0].content).toContain("omitidos");
  });
});

describe("INVARIANTE: o teto cabe o pior caso do roteiro", () => {
  // Este e o teste que impede a regressao de origem. Se alguem acrescentar uma
  // etapa ao roteiro do prompt e atualizar ROTEIRO_ETAPAS, ele cai e obriga a
  // subir o teto junto, em vez de a conversa voltar a morrer no meio.
  it("o pior caso derivado do roteiro e o esperado", () => {
    expect(ROTEIRO_PIOR_CASO).toBe(
      ROTEIRO_ETAPAS * (1 + ROTEIRO_REPERGUNTAS_POR_ETAPA) +
        ROTEIRO_TURNOS_DE_CONFIRMACAO,
    );
  });

  it("MAX_USER_MESSAGES cabe o pior caso", () => {
    expect(MAX_USER_MESSAGES).toBeGreaterThanOrEqual(ROTEIRO_PIOR_CASO);
  });

  it("o pouso suave comeca antes do fim, com folga para o resumo", () => {
    expect(POUSO_SUAVE_RESTANTES).toBeGreaterThanOrEqual(2);
    expect(POUSO_SUAVE_RESTANTES).toBeLessThan(MAX_USER_MESSAGES);
  });
});

describe("INVARIANTE: o orcamento de turnos cabe na cota diaria", () => {
  // Subir MAX_USER_MESSAGES sem olhar a cota apenas MUDA a porta em que a
  // pessoa trava: em vez de "limite da conversa", ela bate em "limite diario",
  // no meio da mesma conversa.
  it("turnos por conversa x conversas por dia <= cota dedicada", () => {
    expect(COTA_DIARIA_MINIMA).toBe(
      MAX_USER_MESSAGES * CONVERSAS_COMPLETAS_POR_DIA,
    );
    expect(COTA_DIARIA_MINIMA).toBeLessThanOrEqual(
      ROADMAP_INTAKE_CHAT_DEFAULT_DAILY_LIMIT,
    );
  });

  it("a cota permite pelo menos duas conversas completas", () => {
    expect(CONVERSAS_COMPLETAS_POR_DIA).toBeGreaterThanOrEqual(2);
  });
});

describe("caminhosDoSchema: diagnostico sem vazamento", () => {
  // Fala da pessoa, do tipo que o Zod embute em `received` num erro de enum.
  const FALA = "quero sair do meu emprego porque meu chefe me humilha";

  // As cinco expectativas abaixo foram REESCRITAS A MAO no lote do BUG-73, que
  // acrescentou o `code` do Zod ao lado do caminho. O formato antigo era
  // `intake.goal,reply`; o novo e `intake.goal:invalid_value,reply:too_big`. As
  // asserções de nao-vazamento continuam identicas, que e o que este describe
  // existe para travar.

  it("devolve os caminhos dos campos que falharam, com o code", () => {
    const issues = [
      {
        code: "invalid_value",
        path: ["intake", "goal"],
        message: "Invalid enum value",
        received: FALA,
      },
      {
        code: "invalid_type",
        path: ["reply"],
        message: "Expected string",
        received: 42,
      },
    ];
    expect(caminhosDoSchema(issues)).toBe(
      "intake.goal:invalid_value,reply:invalid_type",
    );
  });

  it("NAO vaza o valor recebido, nem a mensagem do Zod", () => {
    // Este e o teste que importa: erro de enum e onde o Zod inclui `received`.
    const issues = [
      {
        code: "invalid_enum_value",
        path: ["intake", "goal"],
        message: `Invalid enum value. Received '${FALA}'`,
        received: FALA,
        options: ["primeira-vaga", "transicao"],
      },
    ];
    const saida = caminhosDoSchema(issues);
    expect(saida).toBe("intake.goal:invalid_enum_value");
    expect(saida).not.toContain(FALA);
    expect(saida).not.toContain("humilha");
    expect(saida).not.toContain("Invalid enum");
    expect(saida).not.toContain("primeira-vaga");
  });

  it("indice de array e posicao, nao conteudo", () => {
    const issues = [
      {
        code: "invalid_type",
        path: ["messages", 3, "content"],
        received: FALA,
      },
    ];
    expect(caminhosDoSchema(issues)).toBe("messages.3.content:invalid_type");
  });

  it("deduplica, ordena e limita a 10", () => {
    const issues = [
      { code: "too_big", path: ["b"] },
      { code: "too_big", path: ["a"] },
      { code: "too_big", path: ["b"] },
      ...Array.from({ length: 15 }, (_, i) => ({
        code: "too_big",
        path: [`z${i}`],
      })),
    ];
    const saida = caminhosDoSchema(issues);
    expect(saida.split(",")).toHaveLength(10);
    expect(saida.startsWith("a:too_big,b:too_big,")).toBe(true);
  });

  it("mesmo caminho com codes diferentes nao deduplica", () => {
    // O balde unico `schema_mismatch:reply` do BUG-73 e exatamente o que este
    // caso impede de voltar: dois modos de falha do mesmo campo, dois registros.
    const issues = [
      { code: "too_big", path: ["reply"] },
      { code: "too_small", path: ["reply"] },
    ];
    expect(caminhosDoSchema(issues)).toBe("reply:too_big,reply:too_small");
  });

  it("issue sem path nao explode nem vaza", () => {
    expect(caminhosDoSchema([{ code: "custom", received: FALA }])).toBe(
      "(desconhecido):custom",
    );
    expect(caminhosDoSchema([{ code: "custom", path: [] }])).toBe(
      "(raiz):custom",
    );
    expect(caminhosDoSchema([null, undefined])).toBe(
      "(desconhecido):(sem-codigo)",
    );
  });

  it("code fora da forma de um code do Zod vira (sem-codigo)", () => {
    // A cerca existe porque este valor chega ate `ai_usage_logs`: sem ela,
    // texto livre num `code` viraria texto livre no banco. E `(sem-codigo)` em
    // vez do caminho pelado de proposito, porque o caminho pelado e
    // indistinguivel do formato antigo, e diagnostico degradado que parece certo
    // e pior que um ruidoso.
    expect(caminhosDoSchema([{ code: FALA, path: ["reply"] }])).toBe(
      "reply:(sem-codigo)",
    );
    expect(caminhosDoSchema([{ code: 42, path: ["reply"] }])).toBe(
      "reply:(sem-codigo)",
    );
    expect(caminhosDoSchema([{ path: ["reply"] }])).toBe("reply:(sem-codigo)");
    expect(caminhosDoSchema([{ code: FALA, path: ["reply"] }])).not.toContain(
      "humilha",
    );
  });
});
