import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { parseLinkedinText } from "../../shared/linkedin/parse";
import { runLinkedinChecks } from "./linkedinChecks";
import type { AreaSlug } from "../../shared/areas";
import type { LinkedinLevel, Mercado } from "../../shared/linkedin/schema";

/**
 * GOLDEN FILES do analisador de LinkedIn: trava o comportamento
 * DETERMINISTICO (parse + 27/28 checks + score + faixa) contra fixtures reais.
 *
 * Estes valores esperados descrevem o comportamento de HOJE, INCLUINDO OS BUGS
 * conhecidos. O objetivo NAO e declarar que o resultado esta certo, e detectar
 * qualquer mudanca. Cada valor sabidamente errado esta marcado com
 * "BUG CONHECIDO" e a referencia ao item do relatorio
 * (docs/auditoria-avaliador-linkedin.md e -rodada2.md).
 *
 * Quando a Fase 1 corrigir um desses bugs, o teste QUEBRA de proposito: a
 * atualizacao do valor esperado, removendo o comentario, e a documentacao da
 * correcao. Nunca atualize um esperado sem entender por que ele mudou.
 *
 * A fixture perfil-real-anonimizado.txt e o texto extraido de um PDF real de
 * export do LinkedIn (pdfjs, mesma extracao de client/src/lib/pdfExtract.ts),
 * com nome, e-mail, telefone, URLs, empregadores, instituicoes de ensino e
 * nome de produto trocados por sinteticos. A anonimizacao preserva a estrutura
 * de linhas e os comprimentos que importam para as heuristicas, entao o
 * resultado deterministico e IDENTICO ao do arquivo original (verificado:
 * mesmo score, faixa, contagem de experiencias e conjunto de reprovados).
 */

const FIXTURES = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "__fixtures__",
  "linkedin",
);

interface Cenario {
  fixture: string;
  area: AreaSlug;
  level: LinkedinLevel;
  mercado: Mercado;
  skills: string;
  foto: "sim" | "nao";
  banner: "sim" | "nao";
  openToWork: "sim" | "nao" | "nao-sei";
  conexoes: "ate-50" | "50-100" | "100-500" | "500-mais";
  atividade: "nunca" | "raramente" | "semanal" | "diaria";
}

function analisar(c: Cenario) {
  const profileText = readFileSync(path.join(FIXTURES, c.fixture), "utf8");
  const parsed = parseLinkedinText(profileText);
  const deterministic = runLinkedinChecks({
    parsed,
    profileText,
    area: c.area,
    level: c.level,
    mercado: c.mercado,
    skills: c.skills,
    foto: c.foto,
    banner: c.banner,
    openToWork: c.openToWork,
    conexoes: c.conexoes,
    atividade: c.atividade,
  });
  const reprovados = deterministic.checks
    .filter((check) => !check.aprovado)
    .map((check) => check.id);
  return { parsed, deterministic, reprovados };
}

describe("golden: perfil real (PDF de export, anonimizado)", () => {
  const cenario: Cenario = {
    fixture: "perfil-real-anonimizado.txt",
    // NIVEL pleno: "over 3 years of experience in Software Development" no Sobre,
    // seis experiencias e cargo de CTO. Nao e defensavel de outro jeito.
    level: "pleno",
    area: "fullstack",
    mercado: "exterior",
    skills:
      "AI Agents, Vector Databases, Retrieval-Augmented Generation, (RAG)",
    foto: "sim",
    banner: "sim",
    openToWork: "sim",
    conexoes: "500-mais",
    atividade: "raramente",
  };

  it("parse: headline, sobre, skills e experiencias", () => {
    const { parsed } = analisar(cenario);

    // CORRIGIDO (Fase 1A): a headline ocupa 2 linhas no PDF e a normalizacao
    // junta pela barra orfa, entao "Node" volta e a barra final some.
    expect(parsed.headline).toBe(
      "Software Developer | Full-Stack Engineer | AI Agent Expert | React | Node",
    );
    expect(parsed.sobre?.length).toBe(1317);

    // CORRIGIDO (Fase 1A): o parentese solto volta a ser continuacao, entao as
    // 3 competencias reais contam como 3, sem o fragmento "(RAG)".
    expect(parsed.skillsPdf).toEqual([
      "AI Agents",
      "Vector Databases",
      "Retrieval-Augmented Generation (RAG)",
    ]);

    // CORRIGIDO (Fase 3-preparo): a coluna lateral termina no bloco de
    // identidade, nao no proximo cabecalho. Antes `certificacoes` vinha com
    // "Joana Teste", a headline inteira e "Greater São Paulo Area" dentro,
    // porque a proxima ancora reconhecida depois de Certifications e Summary.
    expect(parsed.certificacoes).toEqual([
      "Google Cloud: Introduction to Docker",
      "Algorithms and Programming Logic",
      "ITIL® v3",
      "Fundamentals of the General Data",
      "Protection Law (LGPD)",
      "HTML/CSS",
    ]);
    for (const linha of parsed.certificacoes) {
      expect(linha).not.toContain("Joana");
      expect(linha).not.toContain("Full-Stack Engineer");
      expect(linha).not.toContain("São Paulo Area");
    }
    expect(parsed.formacao).toEqual([
      "Centro Universitario Alfa",
      "Bachelor's degree, Computer Science   · (January 2023 - 2026)",
      "Universidade Beta",
      "Computer Science   · (January 2025 - November 2026)",
    ]);

    expect(parsed.experiencias).toHaveLength(6);

    // CORRIGIDO (Fase 1B, B.2 e B.5): titulo e so o cargo. A empresa saiu para
    // campo proprio e o bullet da experiencia anterior nao entra mais aqui.
    expect(parsed.experiencias.map((e) => e.titulo)).toEqual([
      "CTO & Co-founder",
      "Artificial Intelligence Engineer",
      "Generative AI Consultant/Support Analyst",
      "Intern",
      // CORRIGIDO (Fase 1B, B.4): a duracao do grupo agrupado saiu do titulo.
      "Software Engineer/QA Engineer",
      "Software Engineer/Full-Stack Developer",
    ]);

    // CORRIGIDO (Fase 1B + 1B-bis, B.4): a empresa fica no bloco a que pertence,
    // e no formato agrupado ela e propagada para todos os cargos aninhados. Os
    // dois ultimos sao o mesmo grupo "Beta Edtech", que o PDF escreve uma vez so.
    expect(parsed.experiencias.map((e) => e.empresa)).toEqual([
      "Startup Alfa",
      "NexoRH",
      "Botvia",
      "OGF - Orgao Governamental Federal",
      "Beta Edtech",
      "Beta Edtech",
    ]);

    // CORRIGIDO (Fase 1B, B.1): a experiencia de CTO nao tem descricao no PDF,
    // e agora ela vem VAZIA em vez de engolir o cabecalho da seguinte. Este era
    // o motivo de nenhum check enxergar a experiencia sem descricao.
    expect(parsed.experiencias[0].descricao).toBe("");
    // CORRIGIDO (Fase 1B, B.3): a linha de localizacao nao entra mais na
    // descricao. Cada queda de comprimento em relacao a Fase 1A e exatamente
    // isso mais a cauda do vizinho que saiu.
    expect(parsed.experiencias.map((e) => e.descricao.length)).toEqual([
      0, 1422, 823, 717, 789, 786,
    ]);
    // CORRIGIDO (Fase 1B, B.4): a empresa nao esta mais na descricao alheia.
    expect(parsed.experiencias[3].descricao).not.toContain("Beta Edtech");
    // CORRIGIDO (Fase 1B, B.3): nenhuma descricao comeca por localizacao.
    expect(parsed.experiencias[2].descricao.startsWith("Campinas")).toBe(false);
  });

  it("checks e score", () => {
    const { deterministic, reprovados } = analisar(cenario);

    // 75 -> 75 (REGUA V2), e o empate esconde duas forcas opostas do mesmo
    // tamanho: `exp-descricoes` passou a REPROVAR, porque a experiencia 1 (CTO)
    // tem descricao vazia e o agregado antigo escondia isso; e a cobertura
    // essencial passou a APROVAR, porque o corte da area fullstack virou 6 em
    // vez de 50% de 22.
    expect(deterministic.score).toBe(75);
    expect(deterministic.faixa).toBe("forte");
    // mercado exterior: sem termos-bilingues, com headline/sobre em ingles.
    expect(deterministic.checks).toHaveLength(28);

    expect(reprovados).toEqual([
      // CORRIGIDO (Fase 1A): headline-stack saiu daqui. Reprovava porque
      // "Node" era truncado pelo line-wrap; a headline sempre citou React E
      // Node. Era a origem da critica falsa "a headline nao menciona
      // tecnologias" e da recomendacao de Next.js e Tailwind.
      "sobre-cta",
      // REGUA V2: veredito por experiencia. A de numero 1 nao tem descricao
      // propria, e o agregado antigo (soma >= 100) escondia isso.
      "exp-descricoes",
      // CORRIGIDO (regua v2): `cobertura-keywords-area` saiu daqui. O corte
      // deixou de ser 50% de TODAS as tecnologias da area e virou
      // min(6, ceil(pool/2)), que em fullstack (pool 22) da 6.
      "cobertura-keywords-otima",
      "skills-quantidade",
      "skills-cobertura",
      "skills-quantidade-otima",
      "atividade",
    ]);

    // BUG CONHECIDO (rodada2 F.2a): "JavaScript" e contado sem a palavra
    // existir no perfil. O alias "js" casa dentro de "Node.js", porque o
    // lookbehind de containsTerm nao bloqueia o ponto.
    expect(deterministic.keywordsEncontradas).toContain("JavaScript");
    expect(
      readFileSync(path.join(FIXTURES, cenario.fixture), "utf8"),
    ).not.toMatch(/javascript/i);

    // BUG CONHECIDO (rodada2 F.2b): tecnologias escritas no perfil que a regua
    // da area ignora por nao estarem no TECH_AREA_MAP de fullstack.
    for (const ausente of ["Redis", "Linux", "Cypress", "Jest", "Qdrant"]) {
      expect(deterministic.keywordsEncontradas).not.toContain(ausente);
    }

    // FASE 3: comprimento da descricao por experiencia. So numeros, e sao
    // exatamente os mesmos que o parse ja afirma acima. Existe para a proxima
    // simulacao de "checks por item" ser exata em vez de intervalar.
    expect(deterministic.experienciasDescricaoTamanhos).toEqual([
      0, 1422, 823, 717, 789, 786,
    ]);
    expect(deterministic.experienciasDescricaoTamanhos).toHaveLength(
      deterministic.experienciasContagem,
    );

    // FASE 2A: decomposicao por campo. Nao entra em check nenhum, e a prova
    // disso e que o score acima continua 75. Ela responde a pergunta que a
    // cobertura agregada nao respondia: "adicionar ONDE?".
    const campos = deterministic.keywordsCampos ?? [];
    expect(campos).toHaveLength(22);
    const porTermo = (t: string) => campos.find((k) => k.termo === t)!;
    // React esta na headline, no Sobre e nas experiencias, e falta so nas
    // competencias coladas. Antes a UI so sabia dizer "esta no perfil".
    expect(porTermo("React").presenteEm).toEqual([
      "headline",
      "sobre",
      "experiencias",
    ]);
    expect(porTermo("React").faltaEm).toEqual(["competencias"]);
    // Docker aparece so no Sobre: falta nas competencias E na headline.
    expect(porTermo("Docker").presenteEm).toEqual(["sobre"]);
    expect(porTermo("Docker").faltaEm).toEqual(["competencias", "headline"]);
    // Sem evidencia nenhuma: nao recebe destino. Mandar escrever na headline
    // uma tecnologia que a pessoa nao demonstrou seria pedir para mentir.
    expect(porTermo("GraphQL").comprovado).toBe(false);
    expect(porTermo("GraphQL").presenteEm).toEqual([]);
    expect(porTermo("GraphQL").faltaEm).toEqual([]);
    // O conjunto dos comprovados e exatamente keywordsEncontradas.
    expect(
      campos
        .filter((k) => k.comprovado)
        .map((k) => k.termo)
        .sort(),
    ).toEqual([...deterministic.keywordsEncontradas].sort());

    // skillsContagem conta as competencias COLADAS no formulario, que neste
    // cenario ainda sao a string antiga com "(RAG)" separado. O prefill do
    // client passa a entregar 3 (ver skillsPdf acima), entao uma analise nova
    // real informa 3.
    expect(deterministic.skillsContagem).toBe(4);
  });
});

describe("golden: perfis sinteticos", () => {
  const cenarios: Array<{
    nome: string;
    cenario: Cenario;
    headline: string | null;
    experiencias: number;
    score: number;
    faixa: string;
    nChecks: number;
    reprovados: string[];
  }> = [
    {
      nome: "A) senior tech completo",
      cenario: {
        fixture: "perfil-a-senior.txt",
        // NIVEL pleno: "Desenvolvedora Full-stack Senior", 3 anos na atual mais 2 anos
        // e 10 meses na anterior. Nao e defensavel de outro jeito.
        level: "pleno",
        area: "fullstack",
        mercado: "brasil",
        skills:
          "React, TypeScript, Node.js, Next.js, PostgreSQL, Docker, AWS, Git, Jest, Cypress, Tailwind CSS, GraphQL",
        foto: "sim",
        banner: "sim",
        openToWork: "sim",
        conexoes: "500-mais",
        atividade: "semanal",
      },
      headline:
        "Desenvolvedora Full-stack Sênior | React, TypeScript, Node.js, AWS | Construindo produtos SaaS escaláveis",
      experiencias: 2,
      // CORRIGIDO (regua v2): o perfil exemplar deixou de travar em 82 e chega
      // a 90, primeira ocupacao real da faixa Magnetico. Antes era
      // os 3 checks de cobertura sao inatingiveis. Teto medido: 85 no Brasil.
      score: 97,
      faixa: "magnetico",
      nChecks: 27,
      reprovados: [
        "termos-bilingues",
        // CORRIGIDO (pre-deploy): `skills-cobertura` saiu daqui. Ele pedia 50%
        // de TODA a pool da area nas competencias coladas (11 em fullstack) e
        // aprovava 0 das 107. Agora pede o corte da variante C limitado pelo
        // que o perfil comprova.
        "skills-quantidade-otima",
      ],
    },
    {
      nome: "B) junior com perfil raso",
      cenario: {
        fixture: "perfil-b-junior-raso.txt",
        level: "estagio",
        area: "frontend",
        mercado: "brasil",
        skills: "HTML, CSS, JavaScript",
        foto: "nao",
        banner: "nao",
        openToWork: "nao-sei",
        conexoes: "ate-50",
        atividade: "nunca",
      },
      headline:
        "Estudante de Análise e Desenvolvimento de Sistemas | Em busca de oportunidade",
      experiencias: 1,
      score: 26,
      faixa: "inicio",
      nChecks: 27,
      reprovados: [
        "headline-cargo-alvo",
        "headline-stack",
        "headline-sem-cliche",
        "sobre-existe",
        "sobre-gancho",
        "sobre-stack",
        "sobre-cta",
        "sobre-tamanho",
        "exp-verbos-acao",
        "exp-tecnologias",
        "exp-resultados",
        "cargo-em-experiencia",
        "cobertura-keywords-area",
        "cobertura-keywords-otima",
        "termos-bilingues",
        "skills-quantidade",
        "skills-quantidade-otima",
        "foto-profissional",
        "banner-personalizado",
        "open-to-work",
        "conexoes",
        "atividade",
      ],
    },
    {
      nome: "C) nao-tech em transicao para dados",
      cenario: {
        fixture: "perfil-c-nao-tech.txt",
        // NIVEL transicao: cinco anos em administrativo e a area alvo e analise de
        // dados. E o caso canonico de transicao. DEFENSAVEL DE DOIS JEITOS: pela
        // senioridade na area ANTIGA seria "pleno", e ai a regua endureceria; a regra
        // escrita em reguaV2 e explicita que quem troca de area e iniciante NA AREA
        // NOVA, e esta fixture e o teste dessa regra.
        level: "transicao",
        area: "analise-dados",
        mercado: "brasil",
        skills: "Excel, Power BI, SQL, TOTVS, Conciliacao bancaria",
        foto: "sim",
        banner: "nao",
        openToWork: "sim",
        conexoes: "100-500",
        atividade: "raramente",
      },
      headline:
        "Analista Administrativa | Gestão de Processos e Rotinas Financeiras",
      experiencias: 2,
      // BUG CONHECIDO (rodada1, vies estrutural): perfil bem escrito de quem
      // esta EM TRANSICAO e medido pela aderencia a area que ainda nao tem.
      score: 56,
      faixa: "em-construcao",
      nChecks: 27,
      reprovados: [
        "headline-cargo-alvo",
        "headline-stack",
        "sobre-gancho",
        "sobre-stack",
        "exp-tecnologias",
        "cargo-em-experiencia",
        "cobertura-keywords-area",
        "cobertura-keywords-otima",
        "termos-bilingues",
        "skills-quantidade",
        "skills-quantidade-otima",
        "banner-personalizado",
        "atividade",
      ],
    },
    {
      nome: "D) perfil em ingles, sem competencias coladas",
      cenario: {
        fixture: "perfil-d-ingles.txt",
        // NIVEL pleno: "Backend Engineer" desde 2021 com escala de 4 milhoes de
        // transacoes diarias. Nao e defensavel de outro jeito.
        level: "pleno",
        area: "backend",
        mercado: "exterior",
        skills: "",
        foto: "sim",
        banner: "nao",
        openToWork: "nao-sei",
        conexoes: "100-500",
        atividade: "raramente",
      },
      headline: "Backend Engineer | Go, Kubernetes, Distributed Systems",
      experiencias: 1,
      // BUG CONHECIDO (rodada1 achado #1 + #8): 72 com ZERO competencias
      // informadas e 3% de cobertura, mais que perfis bem mais completos em
      // outros mercados. Os 2 checks essenciais de ingles compensam.
      score: 72,
      faixa: "forte",
      nChecks: 28,
      reprovados: [
        "sobre-tamanho",
        "cobertura-keywords-area",
        "cobertura-keywords-otima",
        "skills-quantidade",
        "skills-cobertura",
        "skills-quantidade-otima",
        "banner-personalizado",
        "open-to-work",
        "atividade",
      ],
    },
    {
      nome: "E) PDF de 10+ paginas (rodape vira metrica)",
      cenario: {
        fixture: "perfil-e-paginado.txt",
        // NIVEL pleno: "janeiro de 2020 - Present, 5 anos". Foi atribuido junior por
        // engano na primeira passagem e corrigido: 5 anos nao e junior, e a diferenca
        // importa porque este cenario testa `exp-resultados`, que a regua leve nao
        // afrouxa mas o limiar de descricao por experiencia sim.
        level: "pleno",
        area: "backend",
        mercado: "brasil",
        skills: "Python, Django, PostgreSQL, Docker",
        foto: "sim",
        banner: "nao",
        openToWork: "sim",
        conexoes: "100-500",
        atividade: "semanal",
      },
      headline: "Desenvolvedor Back-end | Python, Django",
      experiencias: 1,
      // 69 -> 68: exp-resultados deixou de ser aprovado pelo rodape.
      score: 73,
      faixa: "forte",
      nChecks: 27,
      reprovados: [
        "headline-tamanho",
        // REGUA V2: perfil-e virou pleno (5 anos), entao o Sobre passa a ser
        // medido pela regua padrao (500) em vez da leve (300), e reprova.
        "sobre-tamanho",
        "exp-resultados",
        "cobertura-keywords-area",
        "cobertura-keywords-otima",
        "termos-bilingues",
        "skills-quantidade",
        "skills-quantidade-otima",
        "banner-personalizado",
      ],
    },
  ];

  for (const caso of cenarios) {
    it(`${caso.nome}: parse, checks e score`, () => {
      const { parsed, deterministic, reprovados } = analisar(caso.cenario);
      expect(parsed.headline).toBe(caso.headline);
      expect(parsed.experiencias).toHaveLength(caso.experiencias);
      expect(deterministic.checks).toHaveLength(caso.nChecks);
      expect(deterministic.score).toBe(caso.score);
      expect(deterministic.faixa).toBe(caso.faixa);
      expect(reprovados).toEqual(caso.reprovados);
    });
  }

  // skillsParaAdicionarAgora e SUBTRACAO DE CONJUNTOS feita em codigo:
  // keywordsEncontradas menos o que ja esta nas competencias coladas. Saiu do
  // modelo na v3 porque pedir aritmetica a um LLM produzia invencao (o perfil
  // raso ganhava Git, Figma e TypeScript que nao existem no perfil).
  it("skillsParaAdicionarAgora: so o que o perfil comprova e nao esta cadastrado", () => {
    // Perfil real: as competencias coladas sao de IA (AI Agents, RAG...), entao
    // TUDO que o texto comprova esta fora delas.
    const real = analisar({
      fixture: "perfil-real-anonimizado.txt",
      level: "pleno",
      area: "fullstack",
      mercado: "exterior",
      skills:
        "AI Agents, Vector Databases, Retrieval-Augmented Generation, (RAG)",
      foto: "sim",
      banner: "sim",
      openToWork: "sim",
      conexoes: "500-mais",
      atividade: "raramente",
    });
    expect(real.deterministic.skillsParaAdicionarAgora).toEqual([
      "JavaScript",
      "TypeScript",
      "React",
      "Node.js",
      "PostgreSQL",
      "Docker",
    ]);
    // Nunca sugere o que nao esta em keywordsEncontradas.
    for (const tech of real.deterministic.skillsParaAdicionarAgora ?? []) {
      expect(real.deterministic.keywordsEncontradas).toContain(tech);
    }
  });

  it("skillsParaAdicionarAgora: LISTA VAZIA quando tudo ja esta cadastrado", () => {
    // Perfil raso: o texto so evidencia HTML, CSS e JavaScript, e as tres ja
    // estao nas competencias coladas. Vazio e a resposta correta, e era
    // exatamente aqui que o modelo inventava.
    const raso = analisar({
      fixture: "perfil-b-junior-raso.txt",
      level: "estagio",
      area: "frontend",
      mercado: "brasil",
      skills: "HTML, CSS, JavaScript",
      foto: "nao",
      banner: "nao",
      openToWork: "nao-sei",
      conexoes: "ate-50",
      atividade: "nunca",
    });
    expect(raso.deterministic.keywordsEncontradas).toEqual([
      "HTML",
      "CSS",
      "JavaScript",
    ]);
    expect(raso.deterministic.skillsParaAdicionarAgora).toEqual([]);
  });

  it("skillsParaAdicionarAgora: sem competencias coladas, tudo que o perfil prova entra", () => {
    const ingles = analisar({
      fixture: "perfil-d-ingles.txt",
      // NIVEL pleno: "Backend Engineer" desde 2021 com escala de 4 milhoes de
      // transacoes diarias. Nao e defensavel de outro jeito.
      level: "pleno",
      area: "backend",
      mercado: "exterior",
      skills: "",
      foto: "sim",
      banner: "nao",
      openToWork: "nao-sei",
      conexoes: "100-500",
      atividade: "raramente",
    });
    expect(ingles.deterministic.skillsParaAdicionarAgora).toEqual(
      ingles.deterministic.keywordsEncontradas,
    );
  });

  // CORRIGIDO (Fase 1A). Era o BUG CONHECIDO rodada2 B.8: "Page 10 of 12" tem
  // um numero de 2 digitos e RESULT_RE (/\b\d{2,}\b/) o aceitava como metrica,
  // entao um PDF de 10+ paginas ganhava "Descricoes com numeros e resultados"
  // de graca. O rodape agora sai na normalizacao, antes do parse, e o teste
  // inverteu de sinal: com ou sem o rodape no arquivo, o resultado e o mesmo.
  it("E) rodape de paginacao NAO aprova mais exp-resultados", () => {
    const cenario = cenarios[4].cenario;
    const comRodape = analisar(cenario);
    expect(
      comRodape.deterministic.checks.find((c) => c.id === "exp-resultados")
        ?.aprovado,
    ).toBe(false);
    expect(comRodape.reprovados).toContain("exp-resultados");

    // Mesmo texto sem o rodape: resultado IDENTICO, prova de que o rodape
    // deixou de influenciar a nota.
    const profileText = readFileSync(
      path.join(FIXTURES, cenario.fixture),
      "utf8",
    )
      .split("\n")
      .filter((linha) => !/^Page\s+\d+\s+of\s+\d+\s*$/.test(linha.trim()))
      .join("\n");
    const parsed = parseLinkedinText(profileText);
    const semRodape = runLinkedinChecks({
      parsed,
      profileText,
      area: cenario.area,
      level: cenario.level,
      mercado: cenario.mercado,
      skills: cenario.skills,
      foto: cenario.foto,
      banner: cenario.banner,
      openToWork: cenario.openToWork,
      conexoes: cenario.conexoes,
      atividade: cenario.atividade,
    });
    expect(
      semRodape.checks.find((c) => c.id === "exp-resultados")?.aprovado,
    ).toBe(false);
    expect(semRodape.score).toBe(comRodape.deterministic.score);
    expect(semRodape.score).toBe(73);
  });
});
