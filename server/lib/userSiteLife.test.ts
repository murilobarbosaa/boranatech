import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * VIDA NO SITE do usuario no modal do admin.
 *
 * O teste que nao pode faltar aqui e o ANTI-LEAK. A tabela `certificates`
 * carrega `holder_cpf` (not null) e `holder_name`, e a funcao vizinha
 * `getCertificateByCode` le os dois: o campo esta a uma letra de distancia do
 * que esta rota le. Um `select("*")` escrito por distracao, hoje ou daqui a
 * seis meses, colocaria CPF num payload de admin sem nada acusar, porque a tela
 * simplesmente nao mostraria e o resto continuaria funcionando.
 *
 * Por isso a varredura e RECURSIVA sobre o payload inteiro, e nao uma checagem
 * de campo por nome: o vazamento que importa e o que ninguem previu, e afirmar
 * "certificados[0].holder_cpf e undefined" so pegaria o caminho ja imaginado.
 */

const supaSpy = vi.hoisted(() => ({
  certificados: [] as unknown[],
  colunasPedidas: [] as string[],
  erroCertificados: null as unknown,
}));

const poolSpy = vi.hoisted(() => ({
  roadmaps: { ok: true, data: [] } as unknown,
  courses: { ok: true, data: [] } as unknown,
  badges: { ok: true, data: [] } as unknown,
}));

vi.mock("./supabaseAdmin", () => {
  function builder() {
    const q: Record<string, unknown> = {};
    // GRAVA as colunas pedidas: e assim que o teste da mutacao sabe que o
    // select mudou, alem de ver o valor aparecer no payload.
    q.select = (cols: string) => {
      supaSpy.colunasPedidas.push(cols);
      return q;
    };
    q.eq = () => q;
    q.order = () =>
      Promise.resolve(
        supaSpy.erroCertificados
          ? { data: null, error: supaSpy.erroCertificados }
          : { data: supaSpy.certificados, error: null },
      );
    q.is = () => q;
    return q;
  }
  return { supabaseAdmin: { from: () => builder() } };
});

vi.mock("./userContext/pool", () => ({
  fetchUserLearningSources: async () => ({
    roadmaps: poolSpy.roadmaps,
    courses: poolSpy.courses,
    badges: poolSpy.badges,
  }),
}));

import { LIMITE_POR_LISTA, montarVidaNoSite } from "./userSiteLife";

const UID = "11111111-1111-4111-8111-111111111111";

/** Linha de certificado COMO ELA E no banco, com os campos sensiveis. */
function certificado(over: Record<string, unknown> = {}) {
  return {
    code: "BNT-2026-ABC123",
    roadmap_title: "Front-end",
    issued_at: "2026-08-01T12:00:00Z",
    // OS MARCADORES. Se qualquer um destes aparecer no payload, a varredura
    // recursiva acha, nao importa por qual caminho ele tenha entrado.
    holder_cpf: "MARCADOR_CPF_12345678901",
    holder_name: "MARCADOR_NOME_Rafael Lima",
    syllabus: { modulos: ["MARCADOR_SYLLABUS"] },
    score: 987654,
    cert_score: 876543,
    ...over,
  };
}

/** Achata o payload inteiro em texto, chaves e valores, para varrer. */
function tudoQueSaiu(valor: unknown): string {
  return JSON.stringify(valor);
}

beforeEach(() => {
  supaSpy.certificados = [];
  supaSpy.colunasPedidas = [];
  supaSpy.erroCertificados = null;
  poolSpy.roadmaps = { ok: true, data: [] };
  poolSpy.courses = { ok: true, data: [] };
  poolSpy.badges = { ok: true, data: [] };
});

describe("ANTI-LEAK: nada sensível do certificado sai", () => {
  it("o payload NÃO contém CPF, nome, syllabus nem notas", async () => {
    supaSpy.certificados = [certificado(), certificado({ code: "BNT-2" })];

    const payload = await montarVidaNoSite(UID);
    const texto = tudoQueSaiu(payload);

    for (const marcador of [
      "MARCADOR_CPF_12345678901",
      "MARCADOR_NOME_Rafael Lima",
      "MARCADOR_SYLLABUS",
      "987654",
      "876543",
    ]) {
      expect(texto).not.toContain(marcador);
    }
    // E as chaves cruas também não vazaram junto.
    for (const chave of [
      "holder_cpf",
      "holder_name",
      "syllabus",
      "cert_score",
    ]) {
      expect(texto).not.toContain(chave);
    }
  });

  it("o SELECT é explícito e mínimo, nunca '*'", async () => {
    // Segunda trava, do outro lado: o teste acima olha o que SAIU, este olha o
    // que foi PEDIDO. Um `select("*")` que por acaso não vazasse hoje (porque o
    // mapeamento descarta) ainda seria a porta aberta para o próximo campo.
    supaSpy.certificados = [certificado()];

    await montarVidaNoSite(UID);

    const dosCertificados = supaSpy.colunasPedidas.join(" ");
    expect(dosCertificados).not.toContain("*");
    expect(dosCertificados).not.toContain("holder_cpf");
    expect(dosCertificados).toContain("code");
    expect(dosCertificados).toContain("roadmap_title");
    expect(dosCertificados).toContain("issued_at");
  });

  it("o que DEVE sair, sai: código, título e data", async () => {
    // CONTROLE POSITIVO. Sem ele, um módulo que devolvesse listas vazias
    // passaria em todos os testes anti-leak acima.
    supaSpy.certificados = [certificado()];

    const payload = await montarVidaNoSite(UID);
    expect(payload.certificados).toEqual({
      itens: [
        {
          codigo: "BNT-2026-ABC123",
          titulo: "Front-end",
          emitidoEm: "2026-08-01T12:00:00Z",
        },
      ],
      mais: 0,
    });
  });
});

describe("estado por fonte", () => {
  it("fonte caída vira indisponível SEM derrubar as outras", async () => {
    poolSpy.badges = { ok: false };
    supaSpy.erroCertificados = new Error("timeout");
    poolSpy.roadmaps = {
      ok: true,
      data: [
        {
          roadmapId: "r1",
          title: "Dados",
          completedSteps: 3,
          totalSteps: 10,
          lastActivityAt: "2026-08-02T12:00:00Z",
        },
      ],
    };

    const payload = await montarVidaNoSite(UID);

    expect(payload.badges).toEqual({ indisponivel: true });
    expect(payload.certificados).toEqual({ indisponivel: true });
    // As que responderam continuam inteiras.
    expect(payload.roadmaps).toEqual({
      itens: [
        {
          roadmapId: "r1",
          titulo: "Dados",
          passosConcluidos: 3,
          passosTotais: 10,
          ultimaAtividadeEm: "2026-08-02T12:00:00Z",
        },
      ],
      mais: 0,
    });
    expect(payload.trilhas).toEqual({ itens: [], mais: 0 });
  });

  it("lista VAZIA e fonte INDISPONÍVEL são estados diferentes", async () => {
    // O ponto do desenho. Se a fonte caída virasse lista vazia, a tela diria
    // "não há nada" sobre uma pessoa que pode ter tudo.
    poolSpy.badges = { ok: true, data: [] };
    const comVazio = await montarVidaNoSite(UID);
    expect(comVazio.badges).toEqual({ itens: [], mais: 0 });

    poolSpy.badges = { ok: false };
    const comQueda = await montarVidaNoSite(UID);
    expect(comQueda.badges).toEqual({ indisponivel: true });

    expect(comVazio.badges).not.toEqual(comQueda.badges);
  });
});

describe("teto com resto nomeado", () => {
  it("corta em LIMITE_POR_LISTA e DECLARA quantos sobraram", async () => {
    supaSpy.certificados = Array.from({ length: 14 }, (_, i) =>
      certificado({ code: `BNT-${i}` }),
    );

    const payload = await montarVidaNoSite(UID);
    const lista = payload.certificados as { itens: unknown[]; mais: number };
    expect(lista.itens).toHaveLength(LIMITE_POR_LISTA);
    expect(lista.mais).toBe(4);
  });

  it("CONTROLE NEGATIVO: lista dentro do teto não inventa resto", async () => {
    supaSpy.certificados = [certificado()];
    const payload = await montarVidaNoSite(UID);
    expect((payload.certificados as { mais: number }).mais).toBe(0);
  });
});
