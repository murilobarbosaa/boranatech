import { describe, expect, it, vi } from "vitest";

import {
  decidirManutencao,
  detalheIncompleto,
  etiquetaParaProjeto,
  montarSentryData,
  type CardParaManutencao,
} from "./sentryTaskDecisions";
import type { SentryIssue } from "./sentryApi";

// Decisoes puras do sync. Aqui moram as regras que, se erradas, movem card de
// alguem: reabertura, ressurreicao, poda e silenciamento.

const ETAPA_FIXADA = "col-sentry";
const ETAPA_QUALQUER = "col-em-progresso";
const AGORA = "2026-07-31T12:00:00.000Z";

function card(over: Partial<CardParaManutencao> = {}): CardParaManutencao {
  return {
    id: "t1",
    number: 7,
    title: "erro qualquer",
    sentry_numeric_id: "999",
    column_id: ETAPA_FIXADA,
    completed_at: null,
    archived_at: null,
    archived_source: null,
    ...over,
  };
}

const base = {
  etapaFixadaId: ETAPA_FIXADA,
  agoraIso: AGORA,
  lastSeenPersistido: null,
};

describe("invariante 1: o sync cria, o humano tria", () => {
  it("nao toca em card que saiu da etapa fixada, nem com evento novo", () => {
    const d = decidirManutencao({
      ...base,
      card: card({ column_id: ETAPA_QUALQUER }),
      lastSeen: AGORA,
      statusNoSentry: "unresolved",
    });
    expect(d.tipo).toBe("nada");
    expect(d.motivo).toContain("triado por humano");
  });

  it("nao poda card triado, mesmo em silencio ha meses", () => {
    // O silencio so autoriza a poda de quem NUNCA foi triado. Card que alguem
    // moveu para "A fazer" e uma decisao humana, e sumir com ele seria desfazer
    // essa decisao pelas costas.
    const d = decidirManutencao({
      ...base,
      card: card({ column_id: ETAPA_QUALQUER }),
      lastSeen: "2026-01-01T00:00:00.000Z",
      statusNoSentry: "unresolved",
    });
    expect(d.tipo).toBe("nada");
  });

  it("nao poda card triado nem quando o Sentry o marcou resolvido", () => {
    const d = decidirManutencao({
      ...base,
      card: card({ column_id: ETAPA_QUALQUER }),
      lastSeen: AGORA,
      statusNoSentry: "resolved",
    });
    expect(d.tipo).toBe("nada");
  });
});

describe("reabertura", () => {
  it("card concluido com evento POSTERIOR a conclusao reabre", () => {
    const d = decidirManutencao({
      ...base,
      card: card({
        column_id: ETAPA_QUALQUER,
        completed_at: "2026-07-20T00:00:00.000Z",
      }),
      lastSeen: "2026-07-30T00:00:00.000Z",
      statusNoSentry: "unresolved",
    });
    expect(d.tipo).toBe("reabrir");
  });

  it("evento ANTERIOR a conclusao nao reabre", () => {
    const d = decidirManutencao({
      ...base,
      card: card({
        column_id: ETAPA_QUALQUER,
        completed_at: "2026-07-30T00:00:00.000Z",
      }),
      lastSeen: "2026-07-20T00:00:00.000Z",
      statusNoSentry: "unresolved",
    });
    expect(d.tipo).toBe("nada");
  });
});

describe("ressurreicao e silenciamento", () => {
  it("card arquivado PELO JOB com evento novo ressuscita", () => {
    const d = decidirManutencao({
      ...base,
      card: card({
        archived_at: "2026-06-01T00:00:00.000Z",
        archived_source: "sentry_sync",
      }),
      lastSeen: "2026-07-30T00:00:00.000Z",
      statusNoSentry: "unresolved",
    });
    expect(d.tipo).toBe("ressuscitar");
  });

  it("card arquivado POR HUMANO nao ressuscita NUNCA", () => {
    // Este e o silenciamento. Se ele nao sobreviver a recorrencia, nao existe
    // forma de calar um erro conhecido: o card volta toda vez e a unica saida
    // seria conferir a fila de novo a cada recorrencia, para sempre.
    const d = decidirManutencao({
      ...base,
      card: card({
        archived_at: "2026-06-01T00:00:00.000Z",
        archived_source: "human",
      }),
      lastSeen: "2026-07-30T00:00:00.000Z",
      statusNoSentry: "unresolved",
    });
    expect(d.tipo).toBe("nada");
    expect(d.motivo).toContain("silenciado");
  });

  it("archived_source nulo tambem nao ressuscita (nao foi o job)", () => {
    // Estado que so existiria se o trigger tivesse sido desligado. Na duvida,
    // NAO agir: ressuscitar por engano devolve para a fila algo que alguem tirou.
    const d = decidirManutencao({
      ...base,
      card: card({
        archived_at: "2026-06-01T00:00:00.000Z",
        archived_source: null,
      }),
      lastSeen: "2026-07-30T00:00:00.000Z",
      statusNoSentry: "unresolved",
    });
    expect(d.tipo).toBe("nada");
  });
});

describe("poda", () => {
  it("nunca triado e em silencio ha mais de 21 dias e podado", () => {
    const d = decidirManutencao({
      ...base,
      card: card(),
      lastSeen: "2026-07-01T12:00:00.000Z", // 30 dias
      statusNoSentry: "unresolved",
    });
    expect(d.tipo).toBe("podar");
    expect(d.motivo).toContain("30 dias");
  });

  it("21 dias exatos NAO poda: o limite e estrito", () => {
    const d = decidirManutencao({
      ...base,
      card: card(),
      lastSeen: "2026-07-10T12:00:00.000Z", // exatamente 21
      statusNoSentry: "unresolved",
    });
    expect(d.tipo).toBe("nada");
  });

  it("nunca triado e resolvido no Sentry e podado, mesmo recente", () => {
    const d = decidirManutencao({
      ...base,
      card: card(),
      lastSeen: AGORA,
      statusNoSentry: "resolved",
    });
    expect(d.tipo).toBe("podar");
  });
});

describe("os tres fail-safes", () => {
  it("1. completed_at nulo nunca reabre", () => {
    const d = decidirManutencao({
      ...base,
      card: card({ column_id: ETAPA_QUALQUER, completed_at: null }),
      lastSeen: AGORA,
      statusNoSentry: "unresolved",
    });
    expect(d.tipo).toBe("nada");
  });

  it("1. archived_at nulo nunca ressuscita", () => {
    const d = decidirManutencao({
      ...base,
      card: card({ archived_at: null, archived_source: "sentry_sync" }),
      lastSeen: AGORA,
      statusNoSentry: "unresolved",
    });
    expect(d.tipo).not.toBe("ressuscitar");
  });

  it("2. issue ausente do lote conta como SEM evento, nunca como recorrencia", () => {
    // Ausencia nao e evidencia. Se ela contasse como evento novo, uma falha de
    // leitura parcial reabriria cards em massa.
    const concluido = decidirManutencao({
      ...base,
      card: card({
        column_id: ETAPA_QUALQUER,
        completed_at: "2026-01-01T00:00:00.000Z",
      }),
      lastSeen: undefined,
      statusNoSentry: undefined,
    });
    expect(concluido.tipo).toBe("nada");

    const arquivado = decidirManutencao({
      ...base,
      card: card({
        archived_at: "2026-01-01T00:00:00.000Z",
        archived_source: "sentry_sync",
      }),
      lastSeen: undefined,
      statusNoSentry: undefined,
    });
    expect(arquivado.tipo).toBe("nada");
  });

  it("2. sem NENHUM lastSeen (nem fresco nem guardado) nao poda", () => {
    // Sem base nao ha medida. Arquivar aqui seria ler ausencia de dado como
    // "esta quieto", que e a confusao do contarLinhas devolvendo -1.
    const d = decidirManutencao({
      ...base,
      card: card(),
      lastSeen: undefined,
      lastSeenPersistido: null,
      statusNoSentry: undefined,
    });
    expect(d.tipo).toBe("nada");
    expect(d.motivo).toContain("sem lastSeen");
  });
});

describe("silencio medido pelo lastSeen PERSISTIDO", () => {
  // Correcao de desenho de 2026-07-31. Medido: o filtro por id sem statsPeriod
  // devolve issue de 9 dias, mas nao da para PROVAR que a janela e ilimitada.
  // Se ela for menor que 21 dias, toda issue elegivel a poda estaria fora do
  // lote e a poda nunca dispararia, em silencio. Medir pelo que ja sabemos
  // remove a dependencia dessa incognita.
  it("issue ausente do lote AINDA poda, se o que guardamos ja passou de 21 dias", () => {
    const d = decidirManutencao({
      ...base,
      card: card(),
      lastSeen: undefined,
      lastSeenPersistido: "2026-06-20T12:00:00.000Z", // 41 dias
      statusNoSentry: undefined,
    });
    expect(d.tipo).toBe("podar");
    expect(d.motivo).toContain("41 dias");
  });

  it("o persistido NAO serve de sinal de recorrencia: nao reabre", () => {
    // A assimetria e o ponto. Silencio pode ser medido pelo que guardamos;
    // recorrencia exige evidencia FRESCA. Sem isso um card concluido reabriria
    // em toda run, para sempre, porque o valor guardado nao muda sozinho.
    const d = decidirManutencao({
      ...base,
      card: card({
        column_id: ETAPA_QUALQUER,
        completed_at: "2026-07-01T00:00:00.000Z",
      }),
      lastSeen: undefined,
      lastSeenPersistido: "2026-07-30T00:00:00.000Z",
      statusNoSentry: undefined,
    });
    expect(d.tipo).toBe("nada");
  });

  it("o persistido tambem nao ressuscita card arquivado", () => {
    const d = decidirManutencao({
      ...base,
      card: card({
        archived_at: "2026-06-01T00:00:00.000Z",
        archived_source: "sentry_sync",
      }),
      lastSeen: undefined,
      lastSeenPersistido: "2026-07-30T00:00:00.000Z",
      statusNoSentry: undefined,
    });
    expect(d.tipo).toBe("nada");
  });

  it("o fresco tem precedencia sobre o guardado", () => {
    const d = decidirManutencao({
      ...base,
      card: card(),
      lastSeen: AGORA,
      lastSeenPersistido: "2026-01-01T00:00:00.000Z",
      statusNoSentry: "unresolved",
    });
    expect(d.tipo).toBe("nada");
    expect(d.motivo).toContain("0 dias");
  });
});

describe("etiqueta de area", () => {
  it("mapeia os dois projetos reais", () => {
    expect(etiquetaParaProjeto("boranatech-front")).toEqual({
      tipo: "ok",
      nome: "Frontend",
    });
    expect(etiquetaParaProjeto("node-express")).toEqual({
      tipo: "ok",
      nome: "Backend",
    });
  });

  it("slug desconhecido NAO chuta: devolve desconhecido nomeando o slug", () => {
    // Nenhuma etiqueta e melhor que a errada. Projeto novo entra sozinho na
    // listagem (project=-1) e tem que cair aqui.
    const r = etiquetaParaProjeto("projeto-que-nasceu-ontem");
    expect(r.tipo).toBe("desconhecido");
    if (r.tipo === "desconhecido")
      expect(r.slug).toBe("projeto-que-nasceu-ontem");
  });

  it("slug vazio tambem e desconhecido, e nao vira etiqueta", () => {
    expect(etiquetaParaProjeto("").tipo).toBe("desconhecido");
  });
});

describe("bloco sentry_data: ausencia nao pode parecer falha", () => {
  const issue: SentryIssue = {
    id: "999",
    shortId: "NODE-EXPRESS-1",
    projectSlug: "node-express",
    title: "boom",
    culprit: "server/x.ts",
    level: "error",
    status: "unresolved",
    count: 3,
    userCount: 1,
    firstSeen: "2026-07-01T00:00:00.000Z",
    lastSeen: "2026-07-30T00:00:00.000Z",
    permalink: "https://sentry.io/x",
  };

  it("coleta completa com release ausente marca completo=true", () => {
    // "A issue nao tem release" e um FATO sobre a issue.
    const b = montarSentryData({
      issue,
      detalhe: {
        environment: "production",
        release: null,
        url: null,
        stack: null,
      },
      falha: null,
      agoraIso: AGORA,
    });
    expect(b.coleta.completo).toBe(true);
    expect(b.coleta.motivo).toBeNull();
    expect(b.detalhe?.release).toBeNull();
  });

  it("coleta falha marca completo=false e guarda o motivo", () => {
    // "Nao consegui ler o release" e um fato sobre NOS. Os dois produzem release
    // vazio na tela, e sem esta distincao seriam indistinguiveis para sempre.
    const b = montarSentryData({
      issue,
      detalhe: null,
      falha: "rate_limited",
      agoraIso: AGORA,
    });
    expect(b.coleta.completo).toBe(false);
    expect(b.coleta.motivo).toBe("rate_limited");
    expect(b.detalhe).toBeNull();
  });

  it("detalheIncompleto reconhece o que precisa de recoleta", () => {
    const incompleto = montarSentryData({
      issue,
      detalhe: null,
      falha: "error: 500",
      agoraIso: AGORA,
    });
    const completo = montarSentryData({
      issue,
      detalhe: { environment: null, release: null, url: null, stack: null },
      falha: null,
      agoraIso: AGORA,
    });
    expect(detalheIncompleto(incompleto)).toBe(true);
    expect(detalheIncompleto(completo)).toBe(false);
  });

  it("bloco torto ou ausente nao derruba a leitura", () => {
    // Card migrado, card antigo, jsonb escrito a mao no SQL editor.
    expect(detalheIncompleto(null)).toBe(false);
    expect(detalheIncompleto({})).toBe(false);
    expect(detalheIncompleto({ coleta: "texto" })).toBe(false);
    expect(detalheIncompleto("nada disso")).toBe(false);
  });

  it("o bloco NUNCA carrega description nem notes", () => {
    // Invariante 2 no formato do dado: se um dia alguem acrescentar esses campos
    // ao bloco, este teste avisa antes de o sync comecar a escrever neles.
    const b = montarSentryData({
      issue,
      detalhe: null,
      falha: null,
      agoraIso: AGORA,
    });
    const chaves = JSON.stringify(b);
    expect(chaves).not.toContain("description");
    expect(chaves).not.toContain("notes");
  });
});
