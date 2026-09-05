import { describe, expect, it } from "vitest";

import { dictionaryTerms } from "../glossaryData";
import { roadmapsV2 } from "../roadmapV2/content";
import type { RoadmapNode } from "../roadmapV2/types";
import { PROJECT_ID_ALIASES } from "./aliases";
import { projetos } from "./catalog";

// Guard de acentuacao do catalogo. Existe por causa da leva de 204 entradas
// adicionadas em bloco sem diacritico ("Analise", "Relatorio", "Automacao"),
// que so foi notada meses depois porque nada media isso.
//
// COBRE TODOS OS CAMPOS DE TEXTO da entrada, nao so nome e objetivo. O motivo
// e medido: das 845 correcoes do lote que criou este guard, a maior parte caiu
// FORA de nome e objetivo (passosSimplificados, entregavel, sugestaoLinkedIn e
// requisitos[].verificacao), porque a leva errada entrou em todos os campos de
// uma vez. Um guard restrito ao titulo ficaria verde com uma leva nova entrando
// so pelos passos, que e exatamente a forma que o defeito ja teve uma vez. O
// texto de requisitos[] pesa ainda mais: ele vai dentro do prompt enviado a
// OpenAI na validacao de projeto.
//
// A lista abaixo e de formas que, EM PORTUGUES, so existem com acento. Cada
// palavra e uma afirmacao: "esta sequencia de letras nunca e uma palavra
// valida". Palavra cuja forma nua tambem e portugues correto NAO entra aqui,
// porque guard que da alarme falso e guard que alguem desliga.
//
// REMOVIDA da lista sugerida: `analise`. E o unico caso medido de homografo
// real neste catalogo: substantivo ("Análise de Funil") e imperativo do verbo
// analisar ("Analise o documento de requisitos"), e o imperativo e correto sem
// acento. Hoje sao 15 ocorrencias de verbo, todas em passosSimplificados, mas
// um objetivo escrito como instrucao ("Analise os dados de vendas") e
// plausivel e daria falso positivo. As demais 46 formas foram conferidas uma a
// uma e nenhuma tem leitura valida sem acento.
const SO_EXISTEM_COM_ACENTO = [
  "relatorio",
  "automacao",
  "servico",
  "servicos",
  "usuario",
  "usuarios",
  "formulario",
  "memoria",
  "classica",
  "classico",
  "dinamico",
  "basico",
  "basica",
  "codigo",
  "pagina",
  "estatico",
  "estatica",
  "grafico",
  "graficos",
  "logica",
  "metricas",
  "semantica",
  "traducao",
  "orquestracao",
  "replicacao",
  "automatico",
  "automatica",
  "padroes",
  "cardapio",
  "enderecos",
  "validacao",
  "configuracao",
  "aplicacao",
  "aplicacoes",
  "colecao",
  "notificacao",
  "notificacoes",
  "seguranca",
  "previsao",
  "visualizacao",
  "tecnica",
  "tecnicas",
  "nivel",
  "portfolio",
  "historico",
  "saude",
];

// Fronteira por classe de letra, nao \b: com \b, "seguranca" casaria dentro de
// "seguranca-x" e, pior, o \b do JavaScript trata acentuada como nao-palavra,
// entao "informação" daria fronteira no meio da palavra.
const LETRA = "A-Za-z\\u00C0-\\u024F\\u0300-\\u036F";
const PADRAO = new RegExp(
  `(?<![${LETRA}])(${SO_EXISTEM_COM_ACENTO.join("|")})(?![${LETRA}])`,
  "gi",
);

// Todo campo de texto da entrada, com o rotulo que vai na mensagem de falha.
// Enumerado a partir do tipo ProjetoCatalogo: campo de texto novo precisa ser
// acrescentado aqui no mesmo commit, senao o guard mede uma superficie menor
// sem avisar. Os campos que NAO entram sao os que nao sao texto de leitura:
// id, areaSlug, subareaSlug, nivel, pro e requisitos[].id.
function camposDeTexto(
  p: (typeof projetos)[number],
): Array<{ rotulo: string; texto: string }> {
  const campos = [
    { rotulo: "nome", texto: p.nome },
    { rotulo: "objetivo", texto: p.objetivo },
    { rotulo: "entregavel", texto: p.entregavel },
    { rotulo: "comoPublicar", texto: p.comoPublicar },
    { rotulo: "sugestaoLinkedIn", texto: p.sugestaoLinkedIn },
    { rotulo: "proximoProjeto", texto: p.proximoProjeto },
  ];
  p.ferramentas.forEach((f, i) =>
    campos.push({ rotulo: `ferramentas[${i}]`, texto: f }),
  );
  p.passosSimplificados.forEach((s, i) =>
    campos.push({ rotulo: `passosSimplificados[${i}]`, texto: s }),
  );
  (p.requisitos ?? []).forEach((r, i) => {
    campos.push({ rotulo: `requisitos[${i}].descricao`, texto: r.descricao });
    campos.push({
      rotulo: `requisitos[${i}].verificacao`,
      texto: r.verificacao,
    });
  });
  return campos;
}

describe("catalogo de projetos: acentuacao", () => {
  it("nenhum campo de texto usa forma sem acento que so existe com acento", () => {
    const achados: string[] = [];
    for (const p of projetos)
      for (const { rotulo, texto } of camposDeTexto(p)) {
        // exec em laco, nao matchAll: o tsconfig da aplicacao nao declara
        // `target`, entao cai em ES5 e iterar o RegExpStringIterator nao
        // compila (TS2802). Mesmo motivo do Array.from em projectAreaGroup.
        PADRAO.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = PADRAO.exec(texto)) !== null)
          achados.push(
            `${p.id}.${rotulo}: "${m[1]}" em ${JSON.stringify(texto)}`,
          );
      }
    expect(
      achados,
      `formas sem acento encontradas (${achados.length}):\n${achados.join("\n")}`,
    ).toEqual([]);
  });

  it("todo proximoProjetoId aponta pra id vivo, nao alias, e nao pra si mesmo", () => {
    // O campo e opcional: nem todo projeto tem sucessor mapeado ainda, e a UI
    // cai no texto livre de proximoProjeto quando ele falta. O que NAO pode e
    // apontar pra id que nao existe: o link levaria ao banner de projeto nao
    // encontrado, que e pior que nao ter link.
    const VIVOS = new Set(projetos.map((p) => p.id));
    const ruins: string[] = [];
    for (const p of projetos) {
      const alvo = p.proximoProjetoId;
      if (alvo === undefined) continue;
      if (alvo in PROJECT_ID_ALIASES)
        ruins.push(`${p.id}: aponta pro alias ${alvo}`);
      else if (!VIVOS.has(alvo))
        ruins.push(`${p.id}: aponta pro id inexistente ${alvo}`);
      else if (alvo === p.id) ruins.push(`${p.id}: aponta pra si mesmo`);
    }
    expect(
      ruins,
      `proximoProjetoId invalidos (${ruins.length}):\n${ruins.join("\n")}`,
    ).toEqual([]);
  });

  it("a lista do guard nao tem entrada morta nem duplicada", () => {
    // Duplicata na lista e ruido puro; o teste afirma o tamanho do conjunto,
    // que e o mesmo contrato do EXPECTED_TABLE_COUNT das migrations.
    expect(new Set(SO_EXISTEM_COM_ACENTO).size).toBe(
      SO_EXISTEM_COM_ACENTO.length,
    );
    expect(SO_EXISTEM_COM_ACENTO.length).toBe(46);
    for (const w of SO_EXISTEM_COM_ACENTO)
      expect(w, `${w} deveria estar sem acento na lista`).toBe(
        w.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
      );
  });
});

// ===== Guards do schema v2 =====
//
// Uma entrada e v2 quando tem `briefing`. A partir dai o conjunto inteiro e
// obrigatorio: meia missao na tela e pior que a v1 completa. Todo guard aqui
// lista os OFENSORES POR ID, nunca so um total, porque "esperava 1, recebeu 2"
// obriga quem quebrou a refazer a medicao a mao.
//
// Atualizado no mesmo commit que adiciona ou remove entradas v2, mesmo
// contrato dos EXPECTED_* das migrations: alterar este numero e ato
// deliberado, nao efeito colateral.
const EXPECTED_V2_COUNT = 0;

const V2 = projetos.filter((p) => p.briefing !== undefined);

// Percorre nos e filhos. Reimplementado aqui de proposito: os helpers
// equivalentes vivem em scripts/generateRoadmapMeta.mts, que nao os exporta e
// que executa (top-level await, escreve arquivos) se for importado.
function todosOsNos(nodes: RoadmapNode[]): RoadmapNode[] {
  return nodes.flatMap((n) => [
    n,
    ...(n.children ? todosOsNos(n.children) : []),
  ]);
}

const NOS_POR_TRILHA = new Map<string, Set<string>>(
  roadmapsV2.map((r) => [
    r.slug,
    new Set(r.sections.flatMap((s) => todosOsNos(s.children)).map((n) => n.id)),
  ]),
);
const TERMOS_DO_DICIONARIO = new Set(dictionaryTerms.map((t) => t.term));

const VERIF_SO_DEPLOY = ["deploy_responde", "readme_tem_link_deploy"];
const VERIF_SO_REPO = ["repo_publico", "readme_existe", "min_commits_5"];

describe("catalogo de projetos: v2", () => {
  it("1. o numero de entradas v2 e exatamente EXPECTED_V2_COUNT", () => {
    expect(
      V2.map((p) => p.id).sort(),
      `entradas v2 encontradas (${V2.length}, esperado ${EXPECTED_V2_COUNT})`,
    ).toHaveLength(EXPECTED_V2_COUNT);
  });

  it("2. toda entrada v2 tem o conjunto completo e dentro dos limites", () => {
    const ruins: string[] = [];
    for (const p of V2) {
      if (!p.tipoEntrega) ruins.push(`${p.id}: sem tipoEntrega`);

      const reqs = p.requisitos ?? [];
      if (reqs.length < 6 || reqs.length > 12)
        ruins.push(`${p.id}: ${reqs.length} requisitos (esperado 6 a 12)`);
      if (new Set(reqs.map((r) => r.id)).size !== reqs.length)
        ruins.push(`${p.id}: ids de requisito repetidos`);

      const etapas = p.etapas ?? [];
      if (etapas.length < 3 || etapas.length > 5)
        ruins.push(`${p.id}: ${etapas.length} etapas (esperado 3 a 5)`);
      if (new Set(etapas.map((e) => e.id)).size !== etapas.length)
        ruins.push(`${p.id}: ids de etapa repetidos`);

      const aprende = p.briefing?.aprende ?? [];
      if (aprende.length < 3 || aprende.length > 5)
        ruins.push(
          `${p.id}: ${aprende.length} itens em aprende (esperado 3 a 5)`,
        );

      const t = p.briefing?.tempoEstimado;
      if (t && !(t.horas[0] < t.horas[1]))
        ruins.push(
          `${p.id}: horas ${t.horas[0]} a ${t.horas[1]} nao e crescente`,
        );
      if (t?.semanas && !(t.semanas[0] < t.semanas[1]))
        ruins.push(
          `${p.id}: semanas ${t.semanas[0]} a ${t.semanas[1]} nao e crescente`,
        );
    }
    expect(
      ruins,
      `entradas v2 incompletas (${ruins.length}):\n${ruins.join("\n")}`,
    ).toEqual([]);
  });

  it("3. ajuda.video e sempre video real, nunca busca do YouTube", () => {
    const ruins: string[] = [];
    for (const p of projetos) {
      const url = p.ajuda?.video?.url;
      if (url === undefined) continue;
      if (url.includes("results?search_query"))
        ruins.push(`${p.id}: e busca do YouTube, nao video`);
      else if (
        !url.includes("youtube.com/watch?v=") &&
        !url.includes("youtu.be/")
      )
        ruins.push(`${p.id}: url nao e de video do YouTube (${url})`);
    }
    expect(
      ruins,
      `videos invalidos (${ruins.length}):\n${ruins.join("\n")}`,
    ).toEqual([]);
  });

  it("4. kit[] tem url https ou nota nao vazia", () => {
    const ruins: string[] = [];
    for (const p of projetos)
      (p.kit ?? []).forEach((item, i) => {
        if (item.url === undefined) {
          if (!item.nota || item.nota.trim() === "")
            ruins.push(
              `${p.id}.kit[${i}] (${item.titulo}): sem url e sem nota`,
            );
        } else if (!item.url.startsWith("https://"))
          ruins.push(
            `${p.id}.kit[${i}]: url nao comeca com https:// (${item.url})`,
          );
      });
    expect(
      ruins,
      `itens de kit invalidos (${ruins.length}):\n${ruins.join("\n")}`,
    ).toEqual([]);
  });

  it("5. briefing.preRequisitos[].href e caminho interno", () => {
    const ruins: string[] = [];
    for (const p of projetos)
      (p.briefing?.preRequisitos ?? []).forEach((pr, i) => {
        if (!pr.href.startsWith("/"))
          ruins.push(`${p.id}.preRequisitos[${i}] (${pr.rotulo}): ${pr.href}`);
      });
    expect(
      ruins,
      `hrefs invalidos (${ruins.length}):\n${ruins.join("\n")}`,
    ).toEqual([]);
  });

  it("6. ajuda.trilha aponta pra trilha e nos que existem", () => {
    const ruins: string[] = [];
    for (const p of projetos) {
      const t = p.ajuda?.trilha;
      if (!t) continue;
      const nos = NOS_POR_TRILHA.get(t.slug);
      if (!nos) {
        ruins.push(`${p.id}: trilha "${t.slug}" nao existe`);
        continue;
      }
      for (const id of t.nodeIds)
        if (!nos.has(id))
          ruins.push(`${p.id}: no "${id}" nao existe na trilha ${t.slug}`);
    }
    expect(
      ruins,
      `vinculos de trilha invalidos (${ruins.length}):\n${ruins.join("\n")}`,
    ).toEqual([]);
  });

  it("7. ajuda.termos[] existem no dicionario, com casamento exato", () => {
    const ruins: string[] = [];
    for (const p of projetos)
      for (const termo of p.ajuda?.termos ?? [])
        if (!TERMOS_DO_DICIONARIO.has(termo))
          ruins.push(`${p.id}: termo "${termo}" nao esta em dictionaryTerms`);
    expect(
      ruins,
      `termos invalidos (${ruins.length}):\n${ruins.join("\n")}`,
    ).toEqual([]);
  });

  it("8. verificacaoAutomatica combina com o tipoEntrega e nao repete", () => {
    const ruins: string[] = [];
    for (const p of projetos) {
      const v = p.verificacaoAutomatica;
      if (!v) continue;
      if (new Set(v).size !== v.length)
        ruins.push(`${p.id}: verificacao duplicada`);
      const tipo = p.tipoEntrega;
      const ehRepo = tipo === "repo_deploy" || tipo === "repo";
      for (const item of v) {
        if (VERIF_SO_DEPLOY.includes(item) && tipo !== "repo_deploy")
          ruins.push(
            `${p.id}: "${item}" exige tipoEntrega repo_deploy (tem ${tipo})`,
          );
        else if (
          (VERIF_SO_REPO.includes(item) ||
            item.startsWith("arquivo:") ||
            item.startsWith("pasta:")) &&
          !ehRepo
        )
          ruins.push(
            `${p.id}: "${item}" exige tipoEntrega repo ou repo_deploy (tem ${tipo})`,
          );
        else if (item === "artefato_responde" && ehRepo)
          ruins.push(`${p.id}: "artefato_responde" nao vale pra ${tipo}`);
      }
    }
    expect(
      ruins,
      `verificacoes incoerentes (${ruins.length}):\n${ruins.join("\n")}`,
    ).toEqual([]);
  });

  it("9. entrada v2 com pro: true continua tendo requisitos", () => {
    const ruins = V2.filter(
      (p) => p.pro === true && !(p.requisitos?.length ?? 0),
    ).map((p) => p.id);
    expect(
      ruins,
      `projetos pro v2 sem requisitos (${ruins.length}): ${ruins.join(", ")}`,
    ).toEqual([]);
  });
});
