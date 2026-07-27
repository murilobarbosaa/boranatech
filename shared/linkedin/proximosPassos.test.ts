import { describe, expect, it } from "vitest";

import {
  MAX_ITENS,
  credencialJaNoPerfil,
  recomendarCursos,
  recomendarProjetos,
  tokensDeCredencial,
  type ContextoRecomendacao,
  type CursoPool,
  type ProjetoPool,
} from "./proximosPassos";

const CS50: CursoPool = {
  id: "cs50x",
  titulo: "CS50x: Introdução à Ciência da Computação",
  canal: "Harvard / CS50",
  link: "#",
  areaSlug: "fullstack",
  nivel: "Iniciante",
  descricao: "Curso introdutório de Ciência da Computação de Harvard.",
};

const curso = (over: Partial<CursoPool>): CursoPool => ({
  id: `c-${Math.abs(hash(JSON.stringify(over)))}`,
  titulo: "Curso",
  canal: "Canal",
  link: "#",
  areaSlug: "fullstack",
  nivel: "Iniciante",
  ...over,
});
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

const projeto = (over: Partial<ProjetoPool>): ProjetoPool => ({
  id: `p-${Math.abs(hash(JSON.stringify(over)))}`,
  nome: "Projeto",
  areaSlug: "fullstack",
  nivel: "Iniciante",
  objetivo: "Objetivo",
  ferramentas: [],
  ...over,
});

const ctx = (over: Partial<ContextoRecomendacao> = {}): ContextoRecomendacao => ({
  area: "fullstack",
  nivelUsuario: "pleno",
  lacunas: [],
  textoPerfil: "",
  tecnologiasDaArea: [],
  seed: "seed-fixa",
  isPro: true,
  ...over,
});

describe("ACEITE: nao recomenda o que ja esta no perfil lido", () => {
  it("perfil com Harvard na formacao nao recebe CS50x de Harvard", () => {
    const perfil = "Harvard University | Bachelor's degree, Computer Science";
    expect(credencialJaNoPerfil(CS50, perfil)).toBe("harvard");
    const saida = recomendarCursos([CS50], ctx({ textoPerfil: perfil }));
    expect(saida).toHaveLength(0);
  });

  it("casa tambem pelo codigo do programa, sem o nome da instituicao", () => {
    expect(credencialJaNoPerfil(CS50, "Concluí o CS50 em 2024")).toBe("cs50");
  });

  it("perfil SEM Harvard continua recebendo CS50x", () => {
    // nivelUsuario junior: CS50x e Iniciante, e o alvo de junior e Iniciante.
    const saida = recomendarCursos(
      [CS50],
      ctx({
        nivelUsuario: "junior",
        textoPerfil: "Centro Universitario Alfa | Ciencia da Computacao",
      }),
    );
    expect(saida).toHaveLength(1);
    expect(saida[0].item.id).toBe("cs50x");
  });
});

describe("dedup: o que NAO pode virar token de credencial", () => {
  it("nome de tecnologia no canal nao deduplica", () => {
    // Medido: "javascript.info" e "Django Software Foundation" eram os 2 unicos
    // falsos positivos em 160 pares, os dois por tecnologia dentro do canal.
    const js = curso({ titulo: "JavaScript Moderno", canal: "javascript.info" });
    expect(
      credencialJaNoPerfil(js, "Trabalho com JavaScript", ["JavaScript"]),
    ).toBeNull();
    const dj = curso({
      titulo: "Tutorial oficial do Django",
      canal: "Django Software Foundation",
    });
    expect(credencialJaNoPerfil(dj, "Django e Python", ["Django"])).toBeNull();
  });

  it("palavra generica de instituicao nao deduplica", () => {
    const c = curso({ canal: "Escola Online de Tecnologia" });
    expect(credencialJaNoPerfil(c, "Software Developer | escola")).toBeNull();
  });

  it("sigla de stack no titulo nao deduplica", () => {
    const c = curso({ titulo: "Crie um Site com HTML, CSS e JavaScript", canal: "Fundação Bradesco" });
    expect(tokensDeCredencial(c)).not.toContain("html");
    expect(credencialJaNoPerfil(c, "HTML, CSS e JavaScript")).toBeNull();
  });

  it("instituicao distintiva continua deduplicando", () => {
    const c = curso({ canal: "The Odin Project" });
    expect(tokensDeCredencial(c)).toContain("odin");
    expect(credencialJaNoPerfil(c, "Concluí o The Odin Project")).toBe("odin");
  });
});

describe("coerencia de nivel", () => {
  const pool = (n: number, nivel: string) =>
    Array.from({ length: n }, (_, i) =>
      curso({ id: `${nivel}-${i}`, titulo: `Curso ${nivel} ${i}`, nivel }),
    );

  it("pleno recebe Intermediario", () => {
    const saida = recomendarCursos(
      [...pool(5, "Iniciante"), ...pool(5, "Intermediário"), ...pool(5, "Avançado")],
      ctx({ nivelUsuario: "pleno" }),
    );
    expect(saida.map((s) => s.item.nivel)).toEqual([
      "Intermediário",
      "Intermediário",
      "Intermediário",
    ]);
  });

  it("junior recebe Iniciante, nunca Avancado no mesmo bloco", () => {
    const saida = recomendarCursos(
      [...pool(5, "Iniciante"), ...pool(5, "Avançado")],
      ctx({ nivelUsuario: "junior" }),
    );
    expect(new Set(saida.map((s) => s.item.nivel))).toEqual(new Set(["Iniciante"]));
  });

  it("transicao conta como Iniciante, por senior que a pessoa seja na area antiga", () => {
    const saida = recomendarCursos(
      [...pool(5, "Iniciante"), ...pool(5, "Intermediário")],
      ctx({ nivelUsuario: "transicao" }),
    );
    expect(new Set(saida.map((s) => s.item.nivel))).toEqual(new Set(["Iniciante"]));
  });

  it("so ha material ABAIXO do alvo: completa para baixo, bloco vazio seria pior", () => {
    const saida = recomendarCursos(pool(5, "Iniciante"), ctx({ nivelUsuario: "pleno" }));
    expect(saida).toHaveLength(3);
    expect(new Set(saida.map((s) => s.item.nivel))).toEqual(new Set(["Iniciante"]));
    expect(saida[0].motivo).toContain("degrau vizinho");
  });

  it("faltando material no nivel alvo, completa com UM degrau acima e diz isso", () => {
    const saida = recomendarCursos(
      [...pool(1, "Iniciante"), ...pool(5, "Intermediário"), ...pool(5, "Avançado")],
      ctx({ nivelUsuario: "junior" }),
    );
    expect(saida.map((s) => s.item.nivel)).toEqual([
      "Iniciante",
      "Intermediário",
      "Intermediário",
    ]);
    // Nunca pula um degrau: Iniciante jamais divide bloco com Avancado.
    expect(saida.map((s) => s.item.nivel)).not.toContain("Avançado");
    expect(saida[1].motivo).toContain("degrau vizinho");
  });
});

describe("relevancia: lacuna da analise pontua acima de nivel", () => {
  it("dentro do nivel, quem cobre lacuna vem primeiro", () => {
    // NIVEL E PARTICAO, RELEVANCIA E ORDEM DENTRO DELA. A comparacao so faz
    // sentido entre itens do mesmo degrau: um curso Iniciante nao ultrapassa um
    // Intermediario para um Pleno so por cobrir lacuna, senao a coerencia de
    // nivel viraria sugestao em vez de regra.
    const comLacuna = curso({
      id: "com-lacuna",
      titulo: "GraphQL do zero",
      nivel: "Intermediário",
    });
    const semLacuna = curso({ id: "sem-lacuna", titulo: "Outro", nivel: "Intermediário" });
    const saida = recomendarCursos(
      [semLacuna, comLacuna],
      ctx({ nivelUsuario: "pleno", lacunas: ["GraphQL"] }),
    );
    expect(saida[0].item.id).toBe("com-lacuna");
    expect(saida[0].cobre).toEqual(["GraphQL"]);
    expect(saida[0].motivo).toContain("ausente no seu perfil");
  });

  it("projeto pontua pelas ferramentas", () => {
    const saida = recomendarProjetos(
      [
        projeto({ id: "a", nome: "A", nivel: "Intermediário", ferramentas: ["Next.js", "Supabase"] }),
        projeto({ id: "b", nome: "B", nivel: "Intermediário", ferramentas: ["jQuery"] }),
      ],
      ctx({ lacunas: ["Next.js", "Supabase"] }),
    );
    expect(saida[0].item.id).toBe("a");
    expect(saida[0].cobre).toEqual(["Next.js", "Supabase"]);
  });

  it("sem lacuna coberta, o motivo fala de nivel e nao inventa relacao", () => {
    const saida = recomendarCursos([curso({ nivel: "Intermediário" })], ctx());
    expect(saida[0].cobre).toEqual([]);
    expect(saida[0].motivo).toContain("alinhado ao momento de carreira");
    expect(saida[0].motivo).not.toContain("ausente");
  });

  it("projeto pro nao e oferecido a quem nao assina", () => {
    const pool = [projeto({ id: "pro", nivel: "Intermediário", pro: true })];
    expect(recomendarProjetos(pool, ctx({ isPro: false }))).toHaveLength(0);
    expect(recomendarProjetos(pool, ctx({ isPro: true }))).toHaveLength(1);
  });
});

describe("variacao entre analises: estavel, nunca aleatoria", () => {
  const pool = Array.from({ length: 12 }, (_, i) =>
    curso({ id: `c${i}`, titulo: `Curso ${i}`, nivel: "Intermediário" }),
  );

  it("mesma semente, mesma saida, sempre", () => {
    const a = recomendarCursos(pool, ctx({ seed: "analise-1" }));
    const b = recomendarCursos(pool, ctx({ seed: "analise-1" }));
    expect(a.map((x) => x.item.id)).toEqual(b.map((x) => x.item.id));
  });

  it("sementes diferentes podem dar itens diferentes", () => {
    const a = recomendarCursos(pool, ctx({ seed: "analise-1" }));
    const b = recomendarCursos(pool, ctx({ seed: "analise-2" }));
    expect(a.map((x) => x.item.id)).not.toEqual(b.map((x) => x.item.id));
  });

  it("a semente NUNCA promove item menos relevante DENTRO do nivel", () => {
    // O sorteio so decide empate. Com um curso cobrindo lacuna, ele e o
    // primeiro em qualquer semente.
    const comLacuna = curso({ id: "alvo", titulo: "GraphQL na pratica", nivel: "Intermediário" });
    for (const seed of ["s1", "s2", "s3", "s4", "s5"]) {
      const saida = recomendarCursos(
        [...pool, comLacuna],
        ctx({ seed, lacunas: ["GraphQL"] }),
      );
      expect(saida[0].item.id).toBe("alvo");
    }
  });

  it("nunca devolve mais que o teto", () => {
    expect(recomendarCursos(pool, ctx()).length).toBeLessThanOrEqual(MAX_ITENS);
  });
});
