import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearDraft,
  draftKey,
  loadDraft,
  saveDraft,
} from "./roadmapIntakeDraft";

/**
 * Reidratacao do rascunho do chat de intake do Roadmap com IA.
 *
 * Por que isto tem teste proprio: o rascunho e o unico estado da fase 2 que
 * SOBREVIVE ao deploy. Todo o resto (bundle, backend) e substituido; o
 * localStorage de quem ficou preso com 12-13 turnos continua exatamente como
 * estava, escrito pelo bundle de 47e6a32. Se o client novo nao reidratar aquele
 * objeto, o deploy nao destrava ninguem, que e o proposito da fase.
 *
 * A semente (CHAT_KICKOFF) NAO aparece nos casos "formato antigo" abaixo porque
 * o client de 47e6a32 nunca a gravava: ela era prefixada so no envio
 * (`sendIntakeChatTurn([{seed}, ...history])`), e `setMessages` guardava apenas
 * o historico. Mesmo assim ha um caso com ela, porque um rascunho contaminado
 * nao pode quebrar nada, e o servidor a remove em qualquer posicao.
 */

const USER = "11111111-2222-3333-4444-555555555555";
const CHAT_KICKOFF = "Quero montar meu roadmap de estudos. Pode comecar.";

// Rascunho como o bundle de 47e6a32 o gravava: SEM o campo `restantes`.
function rascunhoAntigo(turnos: number): Record<string, unknown> {
  const messages: Array<{ role: string; content: string }> = [];
  for (let i = 0; i < turnos; i += 1) {
    messages.push({ role: "user", content: `resposta ${i}` });
    messages.push({ role: "assistant", content: `pergunta ${i}` });
  }
  return {
    savedAt: Date.now(),
    messages,
    intake: {
      goal: "primeira-vaga",
      hoursPerWeek: "5-10",
      deadline: null,
      stackFocus: null,
      startingPoint: null,
      motivation: null,
      constraints: null,
    },
    missing: ["deadline"],
    ready: false,
  };
}

function gravarCru(valor: unknown): void {
  window.localStorage.setItem(draftKey(USER), JSON.stringify(valor));
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("loadDraft: formato ANTERIOR a fase 2", () => {
  // 12 e 13 sao os tamanhos reais das conversas travadas em producao.
  for (const turnos of [12, 13]) {
    it(`reidrata um rascunho de ${turnos} turnos sem o campo restantes`, () => {
      gravarCru(rascunhoAntigo(turnos));
      const draft = loadDraft(USER);
      expect(draft).not.toBeNull();
      expect(draft!.messages).toHaveLength(turnos * 2);
      expect(draft!.messages.filter((m) => m.role === "user")).toHaveLength(
        turnos,
      );
      // Ausente no formato antigo: degrada para null, nao para undefined nem
      // para um numero inventado.
      expect(draft!.restantes).toBeNull();
      expect(draft!.ready).toBe(false);
      expect(draft!.intake?.goal).toBe("primeira-vaga");
    });
  }

  it("reidrata mesmo com a semente contaminando o historico", () => {
    const antigo = rascunhoAntigo(13);
    (antigo.messages as Array<unknown>).unshift({
      role: "user",
      content: CHAT_KICKOFF,
    });
    gravarCru(antigo);
    const draft = loadDraft(USER);
    expect(draft).not.toBeNull();
    // A semente sobrevive aqui de proposito: quem a remove e o servidor
    // (stripKickoff), em qualquer posicao. O client nao precisa saber dela.
    expect(draft!.messages[0].content).toBe(CHAT_KICKOFF);
  });
});

describe("loadDraft: descarte limpo do que nao reconhece", () => {
  it("descarta e LIMPA a chave quando o json nao e objeto", () => {
    gravarCru("uma string qualquer");
    expect(loadDraft(USER)).toBeNull();
    expect(window.localStorage.getItem(draftKey(USER))).toBeNull();
  });

  it("descarta e limpa quando falta savedAt", () => {
    gravarCru({ messages: [{ role: "user", content: "oi" }] });
    expect(loadDraft(USER)).toBeNull();
    expect(window.localStorage.getItem(draftKey(USER))).toBeNull();
  });

  it("descarta e limpa quando messages nao e array", () => {
    gravarCru({ savedAt: Date.now(), messages: "nao sou array" });
    expect(loadDraft(USER)).toBeNull();
    expect(window.localStorage.getItem(draftKey(USER))).toBeNull();
  });

  it("descarta e limpa um rascunho expirado (TTL de 24h)", () => {
    const velho = rascunhoAntigo(3);
    velho.savedAt = Date.now() - 25 * 60 * 60 * 1000;
    gravarCru(velho);
    expect(loadDraft(USER)).toBeNull();
    expect(window.localStorage.getItem(draftKey(USER))).toBeNull();
  });

  it("json corrompido nao explode, so devolve null", () => {
    window.localStorage.setItem(draftKey(USER), "{isto nao e json");
    expect(loadDraft(USER)).toBeNull();
  });

  it("nao ha rascunho: null sem tocar em nada", () => {
    expect(loadDraft(USER)).toBeNull();
  });
});

describe("loadDraft: item malformado e FILTRADO, nao derruba a conversa", () => {
  it("mantem as mensagens boas e descarta as tortas", () => {
    gravarCru({
      savedAt: Date.now(),
      messages: [
        { role: "user", content: "vale" },
        { role: "sistema", content: "role desconhecido" },
        { role: "assistant", content: "" },
        { role: "assistant" },
        "nem objeto e",
        null,
        { role: "assistant", content: "tambem vale" },
      ],
    });
    const draft = loadDraft(USER);
    expect(draft).not.toBeNull();
    expect(draft!.messages).toEqual([
      { role: "user", content: "vale" },
      { role: "assistant", content: "tambem vale" },
    ]);
  });

  it("descarta o rascunho quando NAO sobra mensagem nenhuma", () => {
    gravarCru({
      savedAt: Date.now(),
      messages: [{ role: "sistema", content: "x" }, null],
    });
    expect(loadDraft(USER)).toBeNull();
    expect(window.localStorage.getItem(draftKey(USER))).toBeNull();
  });

  it("intake que nao e objeto vira null em vez de lixo renderizavel", () => {
    gravarCru({
      savedAt: Date.now(),
      messages: [{ role: "user", content: "oi" }],
      intake: "corrompido",
      missing: ["goal", 42, null],
      ready: "sim",
    });
    const draft = loadDraft(USER);
    expect(draft!.intake).toBeNull();
    expect(draft!.missing).toEqual(["goal"]);
    // `ready` so e true quando e o booleano true; string truthy nao conta.
    expect(draft!.ready).toBe(false);
  });
});

describe("saveDraft / clearDraft", () => {
  it("grava e le de volta, carimbando savedAt", () => {
    saveDraft(USER, {
      messages: [{ role: "user", content: "oi" }],
      intake: null,
      missing: [],
      ready: false,
      restantes: 7,
    });
    const draft = loadDraft(USER);
    expect(draft!.restantes).toBe(7);
    expect(typeof draft!.savedAt).toBe("number");
  });

  it("clearDraft remove a chave", () => {
    saveDraft(USER, {
      messages: [{ role: "user", content: "oi" }],
      intake: null,
      missing: [],
      ready: false,
      restantes: null,
    });
    clearDraft(USER);
    expect(loadDraft(USER)).toBeNull();
  });

  it("a chave e por usuario: rascunho de um nao vaza para o outro", () => {
    saveDraft(USER, {
      messages: [{ role: "user", content: "meu" }],
      intake: null,
      missing: [],
      ready: false,
      restantes: null,
    });
    expect(loadDraft("outro-usuario")).toBeNull();
  });
});
