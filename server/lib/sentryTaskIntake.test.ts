import { beforeEach, describe, expect, it, vi } from "vitest";

// Duplo do supabase-js que REGISTRA toda mutacao. A lista `mutacoes` e o
// instrumento central desta suite: e ela que prova que o dry-run nao escreve, e
// que o sync nunca toca description/notes.
//
// As respostas de leitura sao uma FILA POR TABELA, consumida na ordem em que o
// job consulta. Fila e nao mapa porque `admin_tasks` e lido tres vezes na mesma
// run com propositos diferentes (quem ja existe, qual a proxima posicao, quais
// cards manter), e um mapa devolveria a mesma coisa nas tres.
const supa = vi.hoisted(() => {
  const mutacoes: Array<{ tabela: string; op: string; dados: unknown }> = [];
  // Leituras COM OS FILTROS aplicados. A primeira versao deste duplo tratava
  // `.is()`/`.eq()` como pass-through e nao registrava nada, e o resultado foi um
  // falso-verde do proprio harness: eu acrescentei `.is("archived_at", null)` na
  // varredura de manutencao de proposito, para ver o teste da ressurreicao ficar
  // vermelho, e ele passou. O duplo devolvia o card arquivado da fila
  // independentemente do filtro, entao o teste nao podia enxergar a armadilha que
  // existia para pegar. Guardar o filtro e o que torna a asserção possivel.
  const leituras: Array<{ tabela: string; filtros: string[] }> = [];
  const filas: Record<string, Array<{ data: unknown; error: unknown }>> = {};
  const respostaCriacao: { data: unknown } = { data: [{ id: "task-novo" }] };

  function from(tabela: string) {
    let op = "select";
    const filtros: string[] = [];
    const chain: Record<string, unknown> = {};
    for (const m of ["select", "order", "limit"]) {
      chain[m] = () => chain;
    }
    for (const m of ["eq", "is", "not", "in"]) {
      chain[m] = (...args: unknown[]) => {
        filtros.push(`${m}(${args.map((a) => JSON.stringify(a)).join(",")})`);
        return chain;
      };
    }
    for (const m of ["upsert", "update", "insert"]) {
      chain[m] = (dados: unknown) => {
        op = m;
        mutacoes.push({ tabela, op: m, dados });
        return chain;
      };
    }
    chain.then = (resolve: (v: unknown) => unknown) => {
      if (op !== "select") {
        return Promise.resolve(respostaCriacao).then(resolve);
      }
      leituras.push({ tabela, filtros: [...filtros] });
      const fila = filas[tabela] ?? [];
      const proxima = fila.shift() ?? { data: [], error: null };
      return Promise.resolve(proxima).then(resolve);
    };
    return chain;
  }

  return {
    from,
    mutacoes,
    leituras,
    filas,
    respostaCriacao,
    reset() {
      mutacoes.length = 0;
      leituras.length = 0;
      for (const k of Object.keys(filas)) delete filas[k];
      respostaCriacao.data = [{ id: "task-novo" }];
    },
    enfileirar(tabela: string, data: unknown) {
      (filas[tabela] ??= []).push({ data, error: null });
    },
  };
});

vi.mock("./supabaseAdmin", () => ({ supabaseAdmin: { from: supa.from } }));

const sentry = vi.hoisted(() => ({
  listSentryIssues: vi.fn(),
  getIssuesByNumericIds: vi.fn(),
  getIssueLatestEvent: vi.fn(),
  updateIssueStatus: vi.fn(),
}));

vi.mock("./sentryApi", () => sentry);

const avisos = vi.hoisted(() => ({
  sendSentryTasksSummaryEmail: vi.fn().mockResolvedValue(undefined),
  createTargetedNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./email", () => ({
  sendSentryTasksSummaryEmail: avisos.sendSentryTasksSummaryEmail,
}));
vi.mock("./targetedNotifications", () => ({
  createTargetedNotification: avisos.createTargetedNotification,
}));
vi.mock("./env", () => ({ env: { bugNotifyNewEmail: "dev@exemplo.com" } }));

import { syncSentryTasks } from "./sentryTaskIntake";

const ISSUE = {
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

/** Semeia o caminho feliz: 1 quadro ligado, 1 etapa de intake, 1 issue nova. */
function semearQuadroLigado(opts: { cards?: unknown[] } = {}) {
  // Fase 0 do job: varredura de pushes pendentes. Vazia por padrao, porque a
  // maioria dos testes nao e sobre retry e uma pendencia perdida contaminaria a
  // contagem de chamadas ao Sentry.
  supa.enfileirar("admin_tasks", []);
  supa.enfileirar("admin_task_boards", [{ id: "board-1", key: "BUG" }]);
  supa.enfileirar("admin_task_columns", [{ id: "col-sentry" }]); // etapa de intake
  supa.enfileirar("admin_task_labels", [{ id: "lbl-back", name: "Backend" }]);
  supa.enfileirar("admin_tasks", []); // existentes
  supa.enfileirar("admin_tasks", []); // proxima posicao
  supa.enfileirar("admin_tasks", opts.cards ?? []); // manutencao
  supa.enfileirar("admin_task_columns", [{ id: "col-backlog" }]); // etapa inicial
}

beforeEach(() => {
  supa.reset();
  vi.clearAllMocks();
  sentry.listSentryIssues.mockResolvedValue({
    state: "ok",
    issues: [ISSUE],
    nextCursor: null,
    prevCursor: null,
  });
  sentry.getIssuesByNumericIds.mockResolvedValue({ state: "ok", issues: [] });
  sentry.getIssueLatestEvent.mockResolvedValue({
    state: "ok",
    detail: {
      environment: "production",
      release: "abc123",
      url: "https://x",
      stack: null,
    },
  });
});

describe("8. dry-run nao escreve NADA", () => {
  it("percorre tudo, decide tudo, e nao emite uma unica mutacao", () => {
    semearQuadroLigado();
    return syncSentryTasks({ dryRun: true }).then((rel) => {
      // Decidiu de verdade: o relatorio nao esta vazio.
      expect(rel.criados).toHaveLength(1);
      expect(rel.criados[0].shortId).toBe("NODE-EXPRESS-1");
      // E nao escreveu nada. Controle sobre a CAMADA DE ESCRITA inteira, nao
      // sobre uma funcao especifica: qualquer upsert/update/insert em qualquer
      // tabela apareceria aqui.
      expect(supa.mutacoes).toHaveLength(0);
    });
  });

  it("dry-run nao manda email nem notificacao", () => {
    semearQuadroLigado();
    return syncSentryTasks({ dryRun: true }).then(() => {
      expect(avisos.sendSentryTasksSummaryEmail).not.toHaveBeenCalled();
      expect(avisos.createTargetedNotification).not.toHaveBeenCalled();
    });
  });

  it("CONTROLE: a MESMA semente sem dry-run escreve", () => {
    // Sem isto, "zero mutacoes" seria compativel com "o job nem rodou".
    semearQuadroLigado();
    return syncSentryTasks({ dryRun: false }).then(() => {
      expect(supa.mutacoes.length).toBeGreaterThan(0);
      expect(supa.mutacoes.some((m) => m.tabela === "admin_tasks")).toBe(true);
    });
  });
});

describe("2. o sync nunca escreve em description nem em notes", () => {
  it("nenhuma mutacao carrega esses campos", async () => {
    semearQuadroLigado({
      cards: [
        {
          id: "t1",
          number: 4,
          title: "antigo",
          column_id: "col-sentry",
          completed_at: null,
          archived_at: null,
          archived_source: null,
          sentry_numeric_id: "999",
          sentry_issue_id: "NODE-EXPRESS-1",
          sentry_data: null,
        },
      ],
    });
    sentry.getIssuesByNumericIds.mockResolvedValue({
      state: "ok",
      issues: [ISSUE],
    });

    await syncSentryTasks({ dryRun: false });

    expect(supa.mutacoes.length).toBeGreaterThan(0);
    for (const m of supa.mutacoes) {
      const chaves = Object.keys((m.dados ?? {}) as Record<string, unknown>);
      // Invariante 2: esses dois campos sao do humano. Sync que os sobrescreve
      // e perda de trabalho silenciosa.
      expect(chaves).not.toContain("description");
      expect(chaves).not.toContain("notes");
    }
  });
});

describe("4. as DECISOES do job nunca escrevem no Sentry", () => {
  // A fronteira da EMENDA 1, e ela precisa da formulacao exata.
  //
  // O invariante NAO e "o job nunca chama updateIssueStatus": desde a Fase 5.5 o
  // job tem uma fase de RETRY, que reenvia um alvo que uma transicao humana ja
  // gravou. Isso e ENTREGA de decisao alheia, nao decisao.
  //
  // O invariante E: reabertura, ressurreicao e poda nao empurram nada. Sao as
  // tres decisoes que o job toma sozinho, e nenhuma delas pode virar escrita no
  // Sentry. Este teste roda uma manutencao que DECIDE (reabre um card) e exige
  // zero chamadas, com a fila de pendencias vazia para o retry nao contaminar a
  // medicao.
  it("uma run que REABRE um card nao empurra nada", async () => {
    semearQuadroLigado({
      cards: [
        {
          id: "t1",
          number: 4,
          title: "concluido",
          column_id: "col-feito",
          completed_at: "2026-07-01T00:00:00.000Z",
          archived_at: null,
          archived_source: null,
          sentry_numeric_id: "999",
          sentry_issue_id: "NODE-EXPRESS-1",
          sentry_data: null,
        },
      ],
    });
    sentry.getIssuesByNumericIds.mockResolvedValue({
      state: "ok",
      issues: [ISSUE],
    });

    const rel = await syncSentryTasks({ dryRun: false });

    // A run fez trabalho de verdade (reabriu um card), entao o "nao chamou" nao
    // e por inercia.
    expect(rel.reabertos).toHaveLength(1);
    // Invariante 6 emendado: o push de resolucao por transicao HUMANA fica; o
    // job escrevendo por conta propria, nao.
    expect(sentry.updateIssueStatus).not.toHaveBeenCalled();
  });
});

describe("5. autoria de sistema", () => {
  it("card criado pelo sync tem created_by nulo e source 'sentry'", async () => {
    semearQuadroLigado();
    await syncSentryTasks({ dryRun: false });

    const criacao = supa.mutacoes.find(
      (m) => m.tabela === "admin_tasks" && m.op === "upsert",
    );
    expect(criacao).toBeDefined();
    const dados = criacao!.dados as Record<string, unknown>;
    expect(dados.created_by).toBeNull();
    expect(dados.source).toBe("sentry");
    expect(dados.type).toBe("bug");
    expect(dados.column_id).toBe("col-sentry");
  });

  it("o log de atividade tem actor_id nulo e ator 'sentry'", async () => {
    semearQuadroLigado();
    await syncSentryTasks({ dryRun: false });

    const log = supa.mutacoes.find((m) => m.tabela === "admin_task_activity");
    expect(log).toBeDefined();
    const dados = log!.dados as Record<string, unknown>;
    expect(dados.actor_id).toBeNull();
    expect((dados.payload as Record<string, unknown>).ator).toBe("sentry");
  });
});

describe("7. run repetida sem mudanca no Sentry e no-op", () => {
  it("issue que ja virou card nao gera criacao nova nem custa requisicao", async () => {
    supa.enfileirar("admin_tasks", []); // fase 0: nenhum push pendente
    supa.enfileirar("admin_task_boards", [{ id: "board-1", key: "BUG" }]);
    supa.enfileirar("admin_task_columns", [{ id: "col-sentry" }]);
    supa.enfileirar("admin_task_labels", [{ id: "lbl-back", name: "Backend" }]);
    // Ja temos a issue.
    supa.enfileirar("admin_tasks", [{ sentry_numeric_id: "999" }]);
    supa.enfileirar("admin_tasks", []); // posicao
    supa.enfileirar("admin_tasks", []); // manutencao vazia
    supa.enfileirar("admin_task_columns", [{ id: "col-backlog" }]);

    const rel = await syncSentryTasks({ dryRun: false });

    expect(rel.criados).toHaveLength(0);
    // E nao gastou a requisicao de detalhe: ela e por issue NOVA, nunca por
    // issue ja vista. Sem isto o custo cresceria com o estoque, nao com a
    // novidade.
    expect(sentry.getIssueLatestEvent).not.toHaveBeenCalled();
    expect(
      supa.mutacoes.filter((m) => m.op === "upsert" || m.op === "insert"),
    ).toHaveLength(0);
  });
});

describe("configuracao por flag, nunca por sigla", () => {
  it("nenhum quadro ligado: inerte, com estado proprio", async () => {
    supa.enfileirar("admin_tasks", []); // fase 0
    supa.enfileirar("admin_task_boards", []);
    const rel = await syncSentryTasks({ dryRun: false });
    expect(rel.estado).toBe("sem_quadro_ligado");
    expect(supa.mutacoes).toHaveLength(0);
    expect(sentry.listSentryIssues).not.toHaveBeenCalled();
  });

  it("quadro ligado SEM etapa de intake aborta, e nao escolhe uma", async () => {
    supa.enfileirar("admin_tasks", []); // fase 0
    supa.enfileirar("admin_task_boards", [{ id: "board-1", key: "BUG" }]);
    supa.enfileirar("admin_task_columns", []); // nenhuma etapa de intake
    const rel = await syncSentryTasks({ dryRun: false });
    expect(rel.estado).toBe("sem_etapa_de_intake");
    expect(supa.mutacoes).toHaveLength(0);
  });
});

describe("fail-safe 3: falha de leitura nao toca em card nenhum", () => {
  it("listagem em rate limit aborta a ingestao e registra o motivo", async () => {
    semearQuadroLigado();
    sentry.listSentryIssues.mockResolvedValue({
      state: "rate_limited",
      retryAfterSeconds: 30,
    });
    const rel = await syncSentryTasks({ dryRun: false });
    expect(rel.criados).toHaveLength(0);
    expect(rel.ingestaoAbortada).toContain("rate_limited");
  });

  it("lote de estado com erro aborta a manutencao SEM arquivar ninguem", async () => {
    // O caso perigoso: se falha de leitura virasse "esta quieto", a run
    // degradada arquivaria a fila inteira.
    semearQuadroLigado({
      cards: [
        {
          id: "t1",
          number: 4,
          title: "nunca triado",
          column_id: "col-sentry",
          completed_at: null,
          archived_at: null,
          archived_source: null,
          sentry_numeric_id: "999",
          sentry_issue_id: "NODE-EXPRESS-1",
          sentry_data: null,
        },
      ],
    });
    sentry.getIssuesByNumericIds.mockResolvedValue({
      state: "error",
      reason: "500 do Sentry",
    });

    const rel = await syncSentryTasks({ dryRun: false });
    expect(rel.podados).toHaveLength(0);
    expect(rel.manutencaoAbortada).toContain("500 do Sentry");
    expect(
      supa.mutacoes.filter(
        (m) =>
          m.op === "update" &&
          (m.dados as Record<string, unknown>).archived_at !== undefined,
      ),
    ).toHaveLength(0);
  });
});

describe("6. a varredura de manutencao INCLUI arquivados", () => {
  // A armadilha que falha PASSANDO. Se a consulta da manutencao ganhar um
  // `.is("archived_at", null)` (o reflexo natural em todo o resto do modulo), a
  // ressurreicao para de acontecer: nenhum teste de decisao fica vermelho,
  // porque a decisao continua certa; simplesmente nunca chega card arquivado
  // nela. Este teste roda o job INTEIRO e exige a ressurreicao no fim.
  const arquivadoPeloJob = {
    id: "t-arq",
    number: 9,
    title: "erro que voltou",
    column_id: "col-sentry",
    completed_at: null,
    archived_at: "2026-06-01T00:00:00.000Z",
    archived_source: "sentry_sync",
    sentry_numeric_id: "999",
    sentry_issue_id: "NODE-EXPRESS-1",
    sentry_data: null,
  };

  it("a CONSULTA da manutencao nao filtra archived_at", async () => {
    // Asserção sobre a consulta, e nao sobre o resultado. E ela que fica
    // vermelha no dia em que alguem "limpar" a varredura acrescentando o filtro
    // padrao do modulo. O teste de comportamento abaixo nao consegue pegar isso
    // sozinho, porque um duplo de banco devolve o que a fila mandar.
    semearQuadroLigado({ cards: [arquivadoPeloJob] });
    sentry.getIssuesByNumericIds.mockResolvedValue({
      state: "ok",
      issues: [ISSUE],
    });

    await syncSentryTasks({ dryRun: false });

    // Ancora no `not(sentry_numeric_id, is, null)`, que e EXCLUSIVO da
    // varredura. A primeira versao procurava so por "sentry_numeric_id" e casava
    // com a consulta de INGESTAO (que usa `.in(...)` nos mesmos ids e vem
    // antes), entao afirmava sobre a consulta errada e passava com a armadilha
    // instalada. Duas asserções abaixo, e a de unicidade e o que impede o
    // seletor de voltar a ficar ambiguo em silencio.
    // Ancora no PAR (eq board_id + not sentry_numeric_id), exclusivo da
    // varredura de manutencao. Ancorar so no `not(sentry_numeric_id)` passou a
    // casar tambem com a varredura de RETRY que a Fase 5.5 acrescentou, e foi a
    // asserção de unicidade abaixo que acusou a ambiguidade.
    const varreduras = supa.leituras.filter(
      (l) =>
        l.tabela === "admin_tasks" &&
        l.filtros.some((f) => f.startsWith('eq("board_id"')) &&
        l.filtros.some(
          (f) => f.startsWith("not(") && f.includes("sentry_numeric_id"),
        ),
    );
    expect(varreduras).toHaveLength(1);
    expect(varreduras[0].filtros.some((f) => f.includes("archived_at"))).toBe(
      false,
    );
  });

  it("card arquivado pelo job com evento novo e desarquivado de volta", async () => {
    semearQuadroLigado({ cards: [arquivadoPeloJob] });
    sentry.getIssuesByNumericIds.mockResolvedValue({
      state: "ok",
      issues: [ISSUE],
    });

    const rel = await syncSentryTasks({ dryRun: false });

    expect(rel.ressuscitados).toHaveLength(1);
    const patch = supa.mutacoes.find(
      (m) =>
        m.op === "update" &&
        (m.dados as Record<string, unknown>).archived_at === null,
    );
    expect(patch).toBeDefined();
    const dados = patch!.dados as Record<string, unknown>;
    // Volta para a ETAPA FIXADA, nao para a is_start: este card nunca foi
    // triado, entao continua sendo exatamente o que a etapa fixada significa.
    expect(dados.column_id).toBe("col-sentry");
    expect(dados.archived_source).toBeNull();
  });

  it("CONTROLE: arquivado por humano passa pela mesma varredura e NAO volta", async () => {
    // Prova que o card arquivado CHEGA na decisao (a varredura o inclui) e que
    // quem o segura e a regra de silenciamento, nao a consulta.
    semearQuadroLigado({
      cards: [{ ...arquivadoPeloJob, archived_source: "human" }],
    });
    sentry.getIssuesByNumericIds.mockResolvedValue({
      state: "ok",
      issues: [ISSUE],
    });

    const rel = await syncSentryTasks({ dryRun: false });

    expect(rel.ressuscitados).toHaveLength(0);
    expect(rel.decisoes.some((d) => d.motivo.includes("silenciado"))).toBe(
      true,
    );
  });
});

describe("teto de criacao: nunca truncar em silencio", () => {
  it("o que passou do teto vai NOMEADO para o relatorio", async () => {
    const muitas = Array.from({ length: 30 }, (_, i) => ({
      ...ISSUE,
      id: `id-${i}`,
      shortId: `NODE-EXPRESS-${i}`,
    }));
    sentry.listSentryIssues.mockResolvedValue({
      state: "ok",
      issues: muitas,
      nextCursor: null,
      prevCursor: null,
    });
    semearQuadroLigado();

    const rel = await syncSentryTasks({ dryRun: true });
    expect(rel.criados).toHaveLength(25);
    expect(rel.foraDoTeto).toHaveLength(5);
    // Nomeado, nao contado: "5 ficaram de fora" sem dizer quais leria como
    // cobertura completa para quem so olha a lista de criados.
    expect(rel.foraDoTeto[0].shortId).toBe("NODE-EXPRESS-25");
  });
});

describe("etiqueta desconhecida", () => {
  it("card nasce SEM etiqueta e o slug vai para o relatorio", async () => {
    sentry.listSentryIssues.mockResolvedValue({
      state: "ok",
      issues: [{ ...ISSUE, projectSlug: "projeto-novo" }],
      nextCursor: null,
      prevCursor: null,
    });
    semearQuadroLigado();

    const rel = await syncSentryTasks({ dryRun: false });
    expect(rel.semEtiqueta).toEqual([
      { shortId: "NODE-EXPRESS-1", slug: "projeto-novo" },
    ]);
    expect(
      supa.mutacoes.filter((m) => m.tabela === "admin_task_label_links"),
    ).toHaveLength(0);
  });
});
