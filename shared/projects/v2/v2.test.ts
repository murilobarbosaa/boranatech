import { describe, expect, it } from "vitest";

import { dictionaryTerms } from "../../glossaryData";
import { roadmapsV2 } from "../../roadmapV2/content";
import type { RoadmapNode } from "../../roadmapV2/types";
import { PROJECT_ID_ALIASES } from "../aliases";
import { projetos } from "../catalog";
import { PROJETOS_V2 } from "./all";
import {
  PROJETOS_V2_IDS,
  isProjetoV2,
  loadProjetoV2,
  loaderIds,
} from "./index";

// ===== Guards do schema v2 =====
//
// Um detalhe v2 e o conjunto completo: meia missao na tela e pior que a v1
// inteira. Todo guard aqui lista os OFENSORES POR ID, nunca so um total,
// porque "esperava 1, recebeu 2" obriga quem quebrou a refazer a medicao a
// mao.
//
// Atualizado no mesmo commit que adiciona ou remove um modulo v2, mesmo
// contrato dos EXPECTED_* das migrations: alterar este numero e ato
// deliberado, nao efeito colateral. Ele amarra QUATRO lugares (o modulo,
// PROJETOS_V2_IDS, `loaders` e all.ts), e os guards 10 a 13 conferem os
// quatro entre si.
const EXPECTED_V2_COUNT = 1;

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
const CATALOGO_POR_ID = new Map(projetos.map((p) => [p.id, p]));

const VERIF_SO_DEPLOY = ["deploy_responde", "readme_tem_link_deploy"];
const VERIF_SO_REPO = ["repo_publico", "readme_existe", "min_commits_5"];

describe("projetos v2", () => {
  it("1. o numero de detalhes v2 e exatamente EXPECTED_V2_COUNT", () => {
    expect(
      PROJETOS_V2.map((d) => d.id).sort(),
      `detalhes v2 encontrados (${PROJETOS_V2.length}, esperado ${EXPECTED_V2_COUNT})`,
    ).toHaveLength(EXPECTED_V2_COUNT);
  });

  it("2. todo detalhe v2 esta completo e dentro dos limites", () => {
    const ruins: string[] = [];
    for (const d of PROJETOS_V2) {
      if (!d.tipoEntrega) ruins.push(`${d.id}: sem tipoEntrega`);

      const reqs = d.requisitos ?? [];
      if (reqs.length < 6 || reqs.length > 12)
        ruins.push(`${d.id}: ${reqs.length} requisitos (esperado 6 a 12)`);
      if (new Set(reqs.map((r) => r.id)).size !== reqs.length)
        ruins.push(`${d.id}: ids de requisito repetidos`);

      const etapas = d.etapas ?? [];
      if (etapas.length < 3 || etapas.length > 5)
        ruins.push(`${d.id}: ${etapas.length} etapas (esperado 3 a 5)`);
      if (new Set(etapas.map((e) => e.id)).size !== etapas.length)
        ruins.push(`${d.id}: ids de etapa repetidos`);

      const aprende = d.briefing?.aprende ?? [];
      if (aprende.length < 3 || aprende.length > 5)
        ruins.push(
          `${d.id}: ${aprende.length} itens em aprende (esperado 3 a 5)`,
        );

      const t = d.briefing?.tempoEstimado;
      if (t && !(t.horas[0] < t.horas[1]))
        ruins.push(
          `${d.id}: horas ${t.horas[0]} a ${t.horas[1]} nao e crescente`,
        );
      if (t?.semanas && !(t.semanas[0] < t.semanas[1]))
        ruins.push(
          `${d.id}: semanas ${t.semanas[0]} a ${t.semanas[1]} nao e crescente`,
        );
    }
    expect(
      ruins,
      `detalhes v2 incompletos (${ruins.length}):\n${ruins.join("\n")}`,
    ).toEqual([]);
  });

  it("3. ajuda.video e sempre video real, nunca busca do YouTube", () => {
    const ruins: string[] = [];
    for (const d of PROJETOS_V2) {
      const url = d.ajuda?.video?.url;
      if (url === undefined) continue;
      if (url.includes("results?search_query"))
        ruins.push(`${d.id}: e busca do YouTube, nao video`);
      else if (
        !url.includes("youtube.com/watch?v=") &&
        !url.includes("youtu.be/")
      )
        ruins.push(`${d.id}: url nao e de video do YouTube (${url})`);
    }
    expect(
      ruins,
      `videos invalidos (${ruins.length}):\n${ruins.join("\n")}`,
    ).toEqual([]);
  });

  it("4. kit[] tem url https ou nota nao vazia", () => {
    const ruins: string[] = [];
    for (const d of PROJETOS_V2)
      (d.kit ?? []).forEach((item, i) => {
        if (item.url === undefined) {
          if (!item.nota || item.nota.trim() === "")
            ruins.push(
              `${d.id}.kit[${i}] (${item.titulo}): sem url e sem nota`,
            );
        } else if (!item.url.startsWith("https://"))
          ruins.push(
            `${d.id}.kit[${i}]: url nao comeca com https:// (${item.url})`,
          );
      });
    expect(
      ruins,
      `itens de kit invalidos (${ruins.length}):\n${ruins.join("\n")}`,
    ).toEqual([]);
  });

  it("5. briefing.preRequisitos[].href e caminho interno", () => {
    const ruins: string[] = [];
    for (const d of PROJETOS_V2)
      d.briefing.preRequisitos.forEach((pr, i) => {
        if (!pr.href.startsWith("/"))
          ruins.push(`${d.id}.preRequisitos[${i}] (${pr.rotulo}): ${pr.href}`);
      });
    expect(
      ruins,
      `hrefs invalidos (${ruins.length}):\n${ruins.join("\n")}`,
    ).toEqual([]);
  });

  it("6. ajuda.trilha aponta pra trilha e nos que existem", () => {
    const ruins: string[] = [];
    for (const d of PROJETOS_V2) {
      const t = d.ajuda?.trilha;
      if (!t) continue;
      const nos = NOS_POR_TRILHA.get(t.slug);
      if (!nos) {
        ruins.push(`${d.id}: trilha "${t.slug}" nao existe`);
        continue;
      }
      for (const id of t.nodeIds)
        if (!nos.has(id))
          ruins.push(`${d.id}: no "${id}" nao existe na trilha ${t.slug}`);
    }
    expect(
      ruins,
      `vinculos de trilha invalidos (${ruins.length}):\n${ruins.join("\n")}`,
    ).toEqual([]);
  });

  it("7. ajuda.termos[] existem no dicionario, com casamento exato", () => {
    const ruins: string[] = [];
    for (const d of PROJETOS_V2)
      for (const termo of d.ajuda?.termos ?? [])
        if (!TERMOS_DO_DICIONARIO.has(termo))
          ruins.push(`${d.id}: termo "${termo}" nao esta em dictionaryTerms`);
    expect(
      ruins,
      `termos invalidos (${ruins.length}):\n${ruins.join("\n")}`,
    ).toEqual([]);
  });

  it("8. verificacaoAutomatica combina com o tipoEntrega e nao repete", () => {
    const ruins: string[] = [];
    for (const d of PROJETOS_V2) {
      const v = d.verificacaoAutomatica;
      if (!v) continue;
      if (new Set(v).size !== v.length)
        ruins.push(`${d.id}: verificacao duplicada`);
      const tipo = d.tipoEntrega;
      const ehRepo = tipo === "repo_deploy" || tipo === "repo";
      for (const item of v) {
        if (VERIF_SO_DEPLOY.includes(item) && tipo !== "repo_deploy")
          ruins.push(
            `${d.id}: "${item}" exige tipoEntrega repo_deploy (tem ${tipo})`,
          );
        else if (
          (VERIF_SO_REPO.includes(item) ||
            item.startsWith("arquivo:") ||
            item.startsWith("pasta:")) &&
          !ehRepo
        )
          ruins.push(
            `${d.id}: "${item}" exige tipoEntrega repo ou repo_deploy (tem ${tipo})`,
          );
        else if (item === "artefato_responde" && ehRepo)
          ruins.push(`${d.id}: "artefato_responde" nao vale pra ${tipo}`);
      }
    }
    expect(
      ruins,
      `verificacoes incoerentes (${ruins.length}):\n${ruins.join("\n")}`,
    ).toEqual([]);
  });

  it("9. id pro no catalogo tem requisitos nos DOIS lados", () => {
    // O detalhe v2 nao pode tirar nada da validacao por leitor de GitHub, que
    // le `requisitos` do CATALOGO (server/routes/projectValidations.ts).
    const ruins: string[] = [];
    for (const d of PROJETOS_V2) {
      const noCatalogo = CATALOGO_POR_ID.get(d.id);
      if (noCatalogo?.pro !== true) continue;
      if (!(d.requisitos?.length ?? 0))
        ruins.push(`${d.id}: pro sem requisitos no detalhe v2`);
      if (!(noCatalogo.requisitos?.length ?? 0))
        ruins.push(`${d.id}: pro sem requisitos no catalogo`);
    }
    expect(
      ruins,
      `projetos pro incompletos (${ruins.length}): ${ruins.join(", ")}`,
    ).toEqual([]);
  });

  it("10. PROJETOS_V2_IDS tem exatamente EXPECTED_V2_COUNT ids", () => {
    expect(PROJETOS_V2_IDS).toHaveLength(EXPECTED_V2_COUNT);
    expect(new Set(PROJETOS_V2_IDS).size).toBe(PROJETOS_V2_IDS.length);
  });

  it("11. all.ts e o indice descrevem o mesmo conjunto, e os ids sao do catalogo", () => {
    const doAll = PROJETOS_V2.map((d) => d.id).sort();
    const doIndice = Array.from(PROJETOS_V2_IDS).sort();
    expect(doAll, "all.ts diverge de PROJETOS_V2_IDS").toEqual(doIndice);

    const ruins: string[] = [];
    for (const id of doIndice) {
      if (!CATALOGO_POR_ID.has(id)) ruins.push(`${id}: nao existe no catalogo`);
      if (id in PROJECT_ID_ALIASES) ruins.push(`${id}: e alias de id fundido`);
    }
    expect(
      ruins,
      `ids v2 invalidos (${ruins.length}): ${ruins.join(", ")}`,
    ).toEqual([]);
  });

  it("12. os loaders cobrem exatamente PROJETOS_V2_IDS e carregam o id certo", async () => {
    expect(loaderIds().sort(), "loaders diverge de PROJETOS_V2_IDS").toEqual(
      Array.from(PROJETOS_V2_IDS).sort(),
    );
    for (const id of PROJETOS_V2_IDS) {
      const d = await loadProjetoV2(id);
      expect(d, `loadProjetoV2("${id}") devolveu null`).not.toBeNull();
      expect(d?.id, `o modulo de ${id} declara outro id`).toBe(id);
    }
    expect(await loadProjetoV2("nao-existe")).toBeNull();
  });

  it("13. isProjetoV2 acerta nos tres casos", () => {
    for (const id of PROJETOS_V2_IDS) expect(isProjetoV2(id)).toBe(true);
    // um id v1 qualquer do catalogo
    const v1 = projetos.find((p) => !isProjetoV2(p.id));
    expect(v1, "o catalogo nao tem nenhum projeto v1").toBeDefined();
    expect(isProjetoV2(v1!.id)).toBe(false);
    // e um alias de id fundido
    expect(isProjetoV2("portfolio-pessoal-html-css")).toBe(false);
  });
});
