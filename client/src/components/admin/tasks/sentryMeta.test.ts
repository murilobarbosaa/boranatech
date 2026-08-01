import { describe, expect, it } from "vitest";

import {
  acaoDeArquivar,
  arquivamentoMetaOf,
  autorDoCard,
  origemMetaOf,
} from "./sentryMeta";
import { activityLineOf } from "./taskActivityMeta";
import type { TaskActivity } from "./types";

// Resolvers do feed. Todos com fallback neutro: o bundle no navegador pode ser
// mais antigo que o backend, e um valor novo em acesso direto derruba a aba.

describe("origem do card", () => {
  it("sentry vira o selo e o autor 'Sentry'", () => {
    expect(origemMetaOf("sentry")).toEqual({ selo: "Sentry", autor: "Sentry" });
  });

  it("human nao desenha selo nem sequestra o autor", () => {
    expect(origemMetaOf("human").selo).toBe("");
    expect(origemMetaOf("human").autor).toBe("");
  });

  it("valor DESCONHECIDO cai no neutro e nao mente 'Sentry'", () => {
    // O controle do resolver. Um source novo so autoriza a afirmar que ninguem
    // digitou aquilo; dizer "Sentry" seria inventar procedencia.
    expect(origemMetaOf("robo_que_nao_existe")).toEqual({
      selo: "Automático",
      autor: "Automático",
    });
    expect(origemMetaOf("")).toEqual({
      selo: "Automático",
      autor: "Automático",
    });
  });
});

describe("invariante 7: autor do card", () => {
  it("created_by nulo com source sentry mostra 'Sentry', nunca 'Alguém'", () => {
    expect(autorDoCard({ source: "sentry", created_by: null }, null)).toBe(
      "Sentry",
    );
  });

  it("card humano usa o nome resolvido", () => {
    expect(autorDoCard({ source: "human", created_by: "u1" }, "Ana")).toBe(
      "Ana",
    );
  });

  it("card humano sem nome resolvido degrada, e SO ele", () => {
    // "Alguém" continua existindo para o caso humano-sem-perfil. O que nao pode
    // e o card do sync cair aqui.
    expect(autorDoCard({ source: "human", created_by: "u1" }, null)).toBe(
      "Alguém",
    );
  });
});

describe("silenciado x podado: futuros diferentes", () => {
  it("arquivado por HUMANO chama-se silenciado e diz que nao volta", () => {
    const meta = arquivamentoMetaOf("human");
    expect(meta.rotulo).toBe("Silenciado");
    expect(meta.descricao).toContain("não volta");
    expect(meta.acaoDesfazer).toBe("Dessilenciar");
  });

  it("arquivado pelo JOB diz que volta na proxima recorrencia", () => {
    const meta = arquivamentoMetaOf("sentry_sync");
    expect(meta.rotulo).not.toBe("Silenciado");
    expect(meta.descricao).toContain("Volta sozinho");
    expect(meta.acaoDesfazer).toBe("Desarquivar");
  });

  it("os dois rotulos sao DIFERENTES", () => {
    // A asserção que carrega o motivo: mostrar os dois como "arquivado" faria a
    // pessoa achar que silenciar e so limpar a tela.
    expect(arquivamentoMetaOf("human").rotulo).not.toBe(
      arquivamentoMetaOf("sentry_sync").rotulo,
    );
  });

  it("valor desconhecido ou ausente cai no neutro", () => {
    expect(arquivamentoMetaOf(null).rotulo).toBe("Arquivado");
    expect(arquivamentoMetaOf("procedencia_nova").rotulo).toBe("Arquivado");
  });
});

describe("a acao de arquivar muda de nome na etapa fixada", () => {
  it("na etapa fixada chama-se Silenciar e explica antes do clique", () => {
    const acao = acaoDeArquivar(true);
    expect(acao.rotulo).toBe("Silenciar");
    expect(acao.explicacao).toContain("não volta");
  });

  it("fora dela continua sendo Arquivar, sem explicacao", () => {
    // Card triado nao e alcancado pelo job, entao "silenciar" nao descreveria
    // nada e seria promessa falsa.
    expect(acaoDeArquivar(false)).toEqual({
      rotulo: "Arquivar",
      explicacao: "",
    });
  });
});

// ---------------------------------------------------------------------------

function atividade(
  action: string,
  payload: Record<string, unknown>,
): TaskActivity {
  return {
    id: "a1",
    task_id: "t1",
    actor_id: null,
    action: action as TaskActivity["action"],
    payload,
    created_at: "2026-07-31T00:00:00Z",
  };
}

describe("histórico do sync", () => {
  it("criado pelo sync cita a issue, nao a etapa", () => {
    const linha = activityLineOf(
      atividade("created", { ator: "sentry", short_id: "NODE-EXPRESS-1" }),
    );
    expect(linha.text).toContain("NODE-EXPRESS-1");
  });

  it("reabertura carrega o MOTIVO, nao so o que aconteceu", () => {
    // "reabriu a tarefa" nao ajuda ninguem as 3 da manha.
    const linha = activityLineOf(
      atividade("reopened", {
        ator: "sentry",
        motivo: "evento novo em 2026-08-12 depois da conclusao",
      }),
    );
    expect(linha.text).toContain("2026-08-12");
  });

  it("ressurreicao diz por que voltou", () => {
    const linha = activityLineOf(
      atividade("unarchived", {
        ator: "sentry",
        motivo: "novo evento apos arquivamento",
      }),
    );
    expect(linha.text).toContain("novo evento apos arquivamento");
  });

  it("linha humana SEM motivo continua igual, sem parenteses vazio", () => {
    const linha = activityLineOf(atividade("unarchived", {}));
    expect(linha.text).toBe("desarquivou a tarefa");
  });

  it("ACAO DESCONHECIDA ainda cai no fallback neutro", () => {
    // O mecanismo existe desde a fase anterior do modulo e agora recebe valores
    // de verdade. Se ele quebrar, a aba inteira cai com "Cannot read properties
    // of undefined", que e exatamente o bug que o CLAUDE.md registra.
    const linha = activityLineOf(atividade("ressuscitou_de_um_jeito_novo", {}));
    expect(linha.kind).toBe("other");
    expect(linha.text).toBe("registrou uma alteração");
  });

  it("acao desconhecida COM payload do sync tambem nao lanca", () => {
    const linha = activityLineOf(
      atividade("acao_do_futuro", { ator: "sentry", motivo: "qualquer" }),
    );
    expect(linha.text).toBeTruthy();
  });
});
