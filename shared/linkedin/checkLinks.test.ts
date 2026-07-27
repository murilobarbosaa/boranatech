import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { resolveCheckPassos } from "./checkLinks";
import { LINKEDIN_CHECK_CATALOG } from "./schema";

/**
 * O "Resolver agora" foi removido na Fase 2A: ele devolvia
 * https://www.linkedin.com/in/me para os 28 checks editáveis, a MESMA URL para
 * todos, prometendo levar ao lugar do problema e largando a pessoa na porta de
 * entrada. No lugar entrou o caminho em passos.
 */

const FONTE = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "checkLinks.ts"),
  "utf8",
);

describe("resolveCheckPassos (linkedin)", () => {
  it("TODO check do catalogo tem passos, inclusive os dois que nao editam o perfil", () => {
    for (const entry of LINKEDIN_CHECK_CATALOG) {
      const passos = resolveCheckPassos(entry.id);
      expect(passos, `check sem passos: ${entry.id}`).not.toBeNull();
      expect(passos!.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("conexoes e atividade, que antes nao tinham nada, agora tem caminho", () => {
    expect(resolveCheckPassos("conexoes")?.[0]).toContain("Minha rede");
    expect(resolveCheckPassos("atividade")?.[0]).toContain("página inicial");
  });

  it("os passos levam ao campo certo, nao a um lugar generico", () => {
    expect(resolveCheckPassos("headline-cargo-alvo")?.join(" ")).toContain(
      "Editar apresentação",
    );
    expect(resolveCheckPassos("sobre-cta")?.join(" ")).toContain("seção Sobre");
    expect(resolveCheckPassos("exp-descricoes")?.join(" ")).toContain(
      "seção Experiência",
    );
    expect(resolveCheckPassos("skills-quantidade")?.join(" ")).toContain(
      "Adicionar competências",
    );
    expect(resolveCheckPassos("foto-profissional")?.join(" ")).toContain(
      "sua foto",
    );
    expect(resolveCheckPassos("banner-personalizado")?.join(" ")).toContain(
      "faixa de capa",
    );
    expect(resolveCheckPassos("open-to-work")?.join(" ")).toContain(
      "Abrir para",
    );
  });

  it("id desconhecido devolve null, nunca adivinha caminho", () => {
    expect(resolveCheckPassos("id_desconhecido")).toBeNull();
    expect(resolveCheckPassos("repo_readme_present")).toBeNull();
    expect(resolveCheckPassos("")).toBeNull();
  });

  it("nenhuma URL sobrou em codigo executavel do modulo", () => {
    // Guard contra reintroduzir link nao verificado. Voltar com deep link exige
    // verificar com conta na mao e mudar este teste de proposito.
    expect(FONTE).not.toMatch(/^(?!\s*\/\/).*https?:\/\//m);
  });

  it("o botao Resolver agora nao existe mais na UI", () => {
    const secao = readFileSync(
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "..",
        "..",
        "client",
        "src",
        "components",
        "linkedin",
        "SectionReport.tsx",
      ),
      "utf8",
    );
    // "Resolver agora" so pode sobreviver dentro do comentario que explica a
    // remocao, nunca como rotulo renderizado.
    const semComentarios = secao
      .split("\n")
      .filter((linha) => !linha.trim().startsWith("//"))
      .join("\n");
    expect(semComentarios).not.toContain("Resolver agora");
    expect(secao).not.toContain("resolveCheckActionUrl");
    expect(secao).toContain("Onde resolver isso");
  });
});
