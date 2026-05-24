/**
 * Fase 2A — teste da tool resume-render.
 * Reusa o systemPrompt + responseFormat canônicos de aiTools.ts e chama
 * a OpenAI direto (bypassa Express). Valida com o schema Zod.
 *
 * Uso:
 *   pnpm tsx scripts/test-resume-render.ts
 *   pnpm tsx scripts/test-resume-render.ts --only=R1,R3
 *   pnpm tsx scripts/test-resume-render.ts --runs=3   (rodar cada cenário N vezes)
 */

import { config } from "dotenv";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { AI_TOOLS } from "../server/lib/aiTools.ts";
import { CurriculoSchema, type Curriculo } from "../shared/curriculo/schema.ts";

config({ quiet: true });

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(here);

const argv = process.argv.slice(2);
const onlyArg = argv.find((a) => a.startsWith("--only="))?.split("=")[1];
const runsArg = argv.find((a) => a.startsWith("--runs="))?.split("=")[1];
const onlySet = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim().toUpperCase())) : null;
const RUNS = Math.max(1, Math.min(5, parseInt(runsArg ?? "2", 10) || 2));

const tool = AI_TOOLS["resume-render"];
if (!tool) {
  console.error("resume-render não encontrado em AI_TOOLS.");
  process.exit(1);
}
if (!tool.responseFormat) {
  console.error("resume-render sem responseFormat configurado.");
  process.exit(1);
}

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("OPENAI_API_KEY não definida no .env.");
  process.exit(1);
}

interface Turn {
  role: "user" | "assistant";
  content: string;
}

interface RenderCase {
  id: string;
  title: string;
  loginContext: string;
  history: Turn[];
  expected: {
    idioma: "pt-BR" | "en";
    persona: string;
    formatoOneOf: string[];
    expectedNome: string;
    expectedEmail: string;
    expectMencionaTechs: string[];
    expectNoFantasy: string[];
    expectNullableFields?: Array<{ path: string; getValue: (cv: Curriculo) => unknown }>;
  };
}

/* ─────────── cenários ─────────── */

const CASES: RenderCase[] = [
  {
    id: "R1",
    title: "Estudante PT (Maria, 2 ano CC, primeiro estágio)",
    loginContext: "[dados do cadastro] Nome: Maria Souza, Email: maria.souza@email.com, Gênero: feminino",
    history: [
      { role: "assistant", content: "Oi! Sou o Natechinho, mentor de carreira do BoraNaTech. Vou te ajudar a montar um currículo do zero. Em que momento da carreira tu tá?" },
      { role: "user", content: "tô no 2º ano de ciência da computação e nunca trabalhei, quero meu primeiro estágio" },
      { role: "assistant", content: "Massa, Maria! Estágio é uma ótima porta. Qual área tu quer seguir, dev, design, dados ou outra?" },
      { role: "user", content: "desenvolvimento web, gosto de frontend" },
      { role: "assistant", content: "Show, então vou montar em português e no formato Híbrido, que destaca tuas habilidades e projetos mesmo sem experiência formal. Me conta um pouco da tua formação: o que tu tá estudando além da faculdade?" },
      { role: "user", content: "tô fazendo Ciência da Computação na UFRJ desde 2024, e fiz um curso da Alura de React no ano passado" },
      { role: "assistant", content: "Boa! Me conta um ou dois projetos que tu fez. Que tipo, que tecnologia." },
      { role: "user", content: "fiz um clone do Spotify em React e TypeScript, com integração na API do Deezer. E uma calculadora simples em HTML, CSS e JS pra um trabalho da faculdade." },
      { role: "assistant", content: "Show! Quais habilidades técnicas tu quer destacar?" },
      { role: "user", content: "JavaScript, TypeScript, React, HTML, CSS, Git" },
      { role: "assistant", content: "Tu fala mais algum idioma além do português?" },
      { role: "user", content: "inglês intermediário" },
      { role: "assistant", content: "Beleza, Maria, vamos pro resumão. Currículo em português, formato Híbrido, persona Estudante, alvo estágio em frontend. Formação: CC na UFRJ desde 2024 + curso de React na Alura. Projetos: clone do Spotify e calculadora. Habilidades: JavaScript, TypeScript, React, HTML, CSS, Git. Idiomas: inglês intermediário. Tá tudo certo? Posso gerar?" },
      { role: "user", content: "tá tudo certo, pode gerar" },
      { role: "assistant", content: "Vou montar agora, leva uns segundinhos.\n\n[[CURRICULO_READY]]" },
    ],
    expected: {
      idioma: "pt-BR",
      persona: "estudante",
      formatoOneOf: ["hibrido"],
      expectedNome: "Maria Souza",
      expectedEmail: "maria.souza@email.com",
      expectMencionaTechs: ["React", "TypeScript"],
      expectNoFantasy: ["Empresa Exemplo", "exemplo@", "01/01/2020", "lorem"],
    },
  },
  {
    id: "R2",
    title: "Júnior PT (Lucas Silva, dev backend BR, fluxo C8 completo)",
    loginContext: "[dados do cadastro] Nome: Lucas Silva, Email: lucas.silva@email.com, Gênero: masculino",
    history: [
      { role: "assistant", content: "Oi, Lucas! Sou o Natechinho. Vou te ajudar a montar um currículo do zero. Em que momento da carreira tu tá?" },
      { role: "user", content: "tô buscando minha primeira vaga, terminei bootcamp de programação ano passado" },
      { role: "assistant", content: "Massa, Lucas! Qual área tu quer seguir e qual nível de vaga tu tá mirando?" },
      { role: "user", content: "quero ser dev backend, alvo empresas BR, currículo em português, vaga júnior" },
      { role: "assistant", content: "Boa! Currículo em PT e formato Híbrido pra ti, porque destaca habilidades e projetos. Tu tem algum contato extra além do email do cadastro?" },
      { role: "user", content: "(11) 98765-4321, github.com/lucassilva, São Paulo SP, sem LinkedIn ainda" },
      { role: "assistant", content: "Anotado. Agora me conta sua formação." },
      { role: "user", content: "Bootcamp Full Stack na Rocketseat 2024-2025 e ensino médio completo em 2020 na ETEC Itaquera" },
      { role: "assistant", content: "Beleza. Tu tem experiência formal ou só projetos?" },
      { role: "user", content: "Não tenho experiência formal ainda, só projetos" },
      { role: "assistant", content: "Sem problema. Me conta os projetos." },
      { role: "user", content: "Projeto 1: API REST em Node.js com PostgreSQL pra controle de gastos pessoais, deploy na Railway. Projeto 2: clone simples do Twitter feito durante o bootcamp com React no front e Express no back" },
      { role: "assistant", content: "Show. Quais habilidades?" },
      { role: "user", content: "JavaScript, TypeScript, Node.js, React, PostgreSQL, Git, Docker básico" },
      { role: "assistant", content: "E idiomas?" },
      { role: "user", content: "Inglês intermediário, leio bem mas falo travado" },
      { role: "assistant", content: "Resumão: Lucas Silva, dev backend júnior, currículo em PT, formato Híbrido, persona Estudante (sem experiência formal), formação Bootcamp Rocketseat + ETEC, 2 projetos (API REST e clone Twitter), habilidades JS/TS/Node/React/PostgreSQL/Git/Docker, inglês intermediário. Posso gerar?" },
      { role: "user", content: "pode gerar" },
      { role: "assistant", content: "Vou montar agora, leva uns segundinhos.\n\n[[CURRICULO_READY]]" },
    ],
    expected: {
      idioma: "pt-BR",
      persona: "estudante",
      formatoOneOf: ["hibrido"],
      expectedNome: "Lucas Silva",
      expectedEmail: "lucas.silva@email.com",
      expectMencionaTechs: ["Node.js", "PostgreSQL", "React"],
      expectNoFantasy: ["Empresa Exemplo", "exemplo@", "Acme"],
    },
  },
  {
    id: "R3",
    title: "Experiente EN (Carlos, Senior Big Tech, conversa em PT mas alvo Google)",
    loginContext: "[dados do cadastro] Nome: Carlos Mendes, Email: carlos.mendes@email.com, Gênero: masculino",
    history: [
      { role: "assistant", content: "Oi, Carlos! Sou o Natechinho. Em que momento da carreira tu tá?" },
      { role: "user", content: "preciso refazer meu CV pra aplicar pra Google em Mountain View, sou dev há 8 anos" },
      { role: "assistant", content: "Massa, Carlos! Google em Mountain View é alvo de peso, vou montar em inglês e no formato Harvard. Qual posição lá?" },
      { role: "user", content: "Senior Software Engineer no time de infra" },
      { role: "assistant", content: "Show. Algum contato extra além do email do cadastro?" },
      { role: "user", content: "+55 11 99888-7766, linkedin.com/in/carlos-mendes, github.com/cmendes, São Paulo SP" },
      { role: "assistant", content: "Anotado. Me conta a formação." },
      { role: "user", content: "Bacharelado em Engenharia da Computação na USP, formado em 2017" },
      { role: "assistant", content: "Boa. Agora as experiências, uma por vez. Última empresa?" },
      { role: "user", content: "Nubank, Staff Engineer no time de Plataforma, de 2021 até hoje. Liderei migração do orquestrador de jobs pra Kubernetes, reduzi custos de infra em 30% e melhorei o p99 das filas de 500ms pra 80ms" },
      { role: "assistant", content: "E antes?" },
      { role: "user", content: "iFood, Senior Backend Engineer, 2018 a 2021. Trabalhei no time de pagamentos, escalei o sistema de boleto pra processar 5x mais transações. Stack: Kotlin, AWS, Kafka." },
      { role: "assistant", content: "Mais alguma?" },
      { role: "user", content: "ThoughtWorks, Software Engineer, 2017 a 2018. Consultoria pra clientes financeiros, trabalhei principalmente com Java e microservices." },
      { role: "assistant", content: "Projetos pessoais relevantes?" },
      { role: "user", content: "tenho um blog técnico em https://carlos.dev e contribuo pro projeto open source rufus-rs (CLI em Rust). Mas pro currículo Big Tech, foca nas experiências mesmo." },
      { role: "assistant", content: "Habilidades técnicas?" },
      { role: "user", content: "Kotlin, Java, Go, Rust, Kubernetes, AWS, Kafka, PostgreSQL, Redis, Terraform, observability tools (Grafana, Prometheus)" },
      { role: "assistant", content: "Idiomas?" },
      { role: "user", content: "Português nativo, inglês fluente, espanhol intermediário" },
      { role: "assistant", content: "Resumão: Carlos Mendes, Senior Software Engineer alvo Google Mountain View, currículo em INGLÊS, formato Harvard, persona Experiente. Formação: Eng Comp USP 2017. 3 experiências (Nubank, iFood, ThoughtWorks), 1 projeto OSS (rufus-rs). Habilidades sólidas em backend e cloud. Idiomas: PT nativo, EN fluente, ES intermediário. Posso gerar?" },
      { role: "user", content: "manda ver" },
      { role: "assistant", content: "Vou montar agora, leva uns segundinhos.\n\n[[CURRICULO_READY]]" },
    ],
    expected: {
      idioma: "en",
      persona: "experiente",
      formatoOneOf: ["harvard", "hibrido"],
      expectedNome: "Carlos Mendes",
      expectedEmail: "carlos.mendes@email.com",
      expectMencionaTechs: ["Kubernetes", "Kotlin"],
      expectNoFantasy: ["Empresa Exemplo", "Acme Corp", "lorem"],
    },
  },
  {
    /**
     * Reproduz o caso que originalmente disparou o 502: a pessoa fornece
     * empresa+cargo mas resiste em dar o período; menciona uma formação
     * mas resiste em dar instituição/período. Antes da Fase 3.1, isso
     * quebrava o Zod (.min(1) em periodo/instituicao). Agora deve passar
     * com null nesses campos, sem invenção.
     */
    id: "R4",
    title: "Júnior PT com campos qualificadores faltando (reproduz 502 da Fase 3)",
    loginContext: "[dados do cadastro] Nome: Joana Lima, Email: joana.lima@email.com, Gênero: feminino",
    history: [
      { role: "assistant", content: "Oi, Joana! Sou o Natechinho. Em que momento da carreira tu tá?" },
      { role: "user", content: "tô buscando vaga de dev backend júnior, alvo BR" },
      { role: "assistant", content: "Show. Currículo em português, formato Híbrido então. Tu tem contato extra além do email?" },
      { role: "user", content: "só o email mesmo, sem telefone" },
      { role: "assistant", content: "Beleza, sem problema. Me conta tua formação." },
      { role: "user", content: "fiz alguns cursos de programação online" },
      { role: "assistant", content: "Legal. E foi em qual plataforma, tipo Alura, Udemy, Coursera?" },
      { role: "user", content: "não lembro direito, era um pacote misturado" },
      { role: "assistant", content: "Tranquilo. E quando foi isso, mais ou menos?" },
      { role: "user", content: "sei lá, faz uns anos, prefiro não cravar data" },
      { role: "assistant", content: "Beleza, sem data então. Tu tem experiência profissional?" },
      { role: "user", content: "trabalhei na Acme Solutions como Desenvolvedora Backend Júnior" },
      { role: "assistant", content: "Massa. E quando foi, datas ou anos só?" },
      { role: "user", content: "deixa em branco, não quero falar do período" },
      { role: "assistant", content: "Tranquilo. Conta um pouco do que tu fazia lá." },
      { role: "user", content: "trabalhei com Node.js e PostgreSQL no time de produto, mexi com API REST" },
      { role: "assistant", content: "Boa. Tem projetos pessoais ou só essa experiência?" },
      { role: "user", content: "sem projetos pessoais por enquanto" },
      { role: "assistant", content: "Quais tuas habilidades técnicas?" },
      { role: "user", content: "Node.js, PostgreSQL, JavaScript, Git, API REST" },
      { role: "assistant", content: "E idiomas?" },
      { role: "user", content: "só português" },
      { role: "assistant", content: "Resumão: Joana Lima, dev backend júnior, currículo em PT, formato Híbrido. Formação: cursos de programação online (sem instituição e período preenchidos). Experiência: Desenvolvedora Backend Júnior na Acme Solutions (sem período). Habilidades: Node.js, PostgreSQL, JS, Git, API REST. Posso gerar?" },
      { role: "user", content: "pode gerar" },
      { role: "assistant", content: "Vou montar agora, leva uns segundinhos.\n\n[[CURRICULO_READY]]" },
    ],
    expected: {
      idioma: "pt-BR",
      persona: "junior",
      formatoOneOf: ["hibrido"],
      expectedNome: "Joana Lima",
      expectedEmail: "joana.lima@email.com",
      expectMencionaTechs: ["Node.js", "PostgreSQL"],
      // Crítico: garantir que campos faltantes saíram como null, NÃO inventados.
      expectNoFantasy: ["Empresa Exemplo", "Udemy", "Coursera", "Alura", "2020", "2021", "2022", "2023"],
      expectNullableFields: [
        { path: "experiencias[0].periodo", getValue: (cv) => cv.experiencias[0]?.periodo },
        { path: "formacao[0].instituicao", getValue: (cv) => cv.formacao[0]?.instituicao },
        { path: "formacao[0].periodo", getValue: (cv) => cv.formacao[0]?.periodo },
      ],
    },
  },
];

/* ─────────── runner ─────────── */

interface RunResult {
  ok: boolean;
  reason?: string;
  curriculo?: Curriculo;
  raw?: string;
  zodErrors?: unknown;
  jsonParseError?: string;
  httpError?: string;
  ms: number;
  inputTokens?: number;
  outputTokens?: number;
}

async function runRender(c: RenderCase): Promise<RunResult> {
  const start = Date.now();
  const messages = [
    { role: "system", content: tool.systemPrompt },
    { role: "system", content: c.loginContext },
    ...c.history,
  ];
  const body = {
    model: tool.model,
    temperature: tool.temperature,
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: tool.responseFormat!.name,
        strict: true,
        schema: tool.responseFormat!.jsonSchema,
      },
    },
  };
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return { ok: false, reason: "fetch_error", httpError: String(err), ms: Date.now() - start };
  }

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      reason: "http_error",
      httpError: `${res.status}: ${text.slice(0, 400)}`,
      ms: Date.now() - start,
    };
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const raw = data.choices?.[0]?.message?.content ?? "";
  const inputTokens = data.usage?.prompt_tokens ?? 0;
  const outputTokens = data.usage?.completion_tokens ?? 0;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return {
      ok: false,
      reason: "json_parse_failed",
      jsonParseError: String(err),
      raw,
      ms: Date.now() - start,
      inputTokens,
      outputTokens,
    };
  }

  const zodResult = CurriculoSchema.safeParse(parsed);
  if (!zodResult.success) {
    return {
      ok: false,
      reason: "zod_validation_failed",
      zodErrors: zodResult.error.issues,
      raw,
      ms: Date.now() - start,
      inputTokens,
      outputTokens,
    };
  }

  return {
    ok: true,
    curriculo: zodResult.data,
    raw,
    ms: Date.now() - start,
    inputTokens,
    outputTokens,
  };
}

/* ─────────── verificações semânticas ─────────── */

interface SemanticCheck {
  label: string;
  pass: boolean;
  detail?: string;
}

function runSemanticChecks(c: RenderCase, cv: Curriculo): SemanticCheck[] {
  const out: SemanticCheck[] = [];
  out.push({
    label: `Idioma bate (${c.expected.idioma})`,
    pass: cv.idioma === c.expected.idioma,
    detail: `obtido=${cv.idioma}`,
  });
  out.push({
    label: `Persona bate (${c.expected.persona})`,
    pass: cv.persona === c.expected.persona,
    detail: `obtido=${cv.persona}`,
  });
  out.push({
    label: `Formato em ${c.expected.formatoOneOf.join("|")}`,
    pass: c.expected.formatoOneOf.includes(cv.formato),
    detail: `obtido=${cv.formato}`,
  });
  out.push({
    label: `Nome do cadastro usado`,
    pass: cv.dadosPessoais.nome.trim() === c.expected.expectedNome,
    detail: `obtido=${cv.dadosPessoais.nome}`,
  });
  out.push({
    label: `Email do cadastro usado`,
    pass: cv.dadosPessoais.email.trim() === c.expected.expectedEmail,
    detail: `obtido=${cv.dadosPessoais.email}`,
  });

  const habStr = cv.habilidades.join(" ").toLowerCase();
  for (const tech of c.expected.expectMencionaTechs) {
    out.push({
      label: `Habilidades mencionam "${tech}"`,
      pass: habStr.includes(tech.toLowerCase()),
    });
  }

  const everything = JSON.stringify(cv).toLowerCase();
  for (const fantasy of c.expected.expectNoFantasy) {
    out.push({
      label: `Sem fantasia "${fantasy}"`,
      pass: !everything.includes(fantasy.toLowerCase()),
    });
  }

  if (c.expected.expectNullableFields) {
    for (const f of c.expected.expectNullableFields) {
      const value = f.getValue(cv);
      const isNull = value === null;
      out.push({
        label: `Campo nullable "${f.path}" veio null (não inventado)`,
        pass: isNull,
        detail: isNull ? "null" : `obtido=${JSON.stringify(value)}`,
      });
    }
  }

  if (c.expected.idioma === "en") {
    const enFields = collectEnFields(cv);
    for (const f of enFields) {
      const leak = portugueseLeak(f.value);
      out.push({
        label: `EN sem vazamento de PT em ${f.path}`,
        pass: !leak,
        detail: leak
          ? `marcadores: ${leak.markers.join(", ")} | valor="${f.value.slice(0, 80)}"`
          : `"${f.value.slice(0, 80)}"`,
      });
    }
  }

  if (c.expected.idioma === "pt-BR") {
    const resumoLower = cv.resumoProfissional.toLowerCase();
    const looksPortuguese = /[ãáâéêíóôúç]|\b(com|para|que|dos|das|tem|tenho|busco|interesse)\b/.test(resumoLower);
    out.push({
      label: `Resumo profissional escrito em português`,
      pass: looksPortuguese,
      detail: `resumo[:120]="${cv.resumoProfissional.slice(0, 120)}..."`,
    });
  }

  return out;
}

/**
 * Coleta os campos de texto que deveriam estar em inglês quando idioma="en".
 * Não inclui nomes próprios (empresa, instituição, tecnologias) porque esses
 * ficam no idioma original mesmo no currículo em inglês.
 */
function collectEnFields(cv: Curriculo): Array<{ path: string; value: string }> {
  const fields: Array<{ path: string; value: string }> = [];
  fields.push({ path: "objetivo.cargo", value: cv.objetivo.cargo });
  fields.push({ path: "objetivo.area", value: cv.objetivo.area });
  fields.push({ path: "objetivo.nivel", value: cv.objetivo.nivel });
  fields.push({ path: "resumoProfissional", value: cv.resumoProfissional });
  cv.formacao.forEach((f, i) => {
    fields.push({ path: `formacao[${i}].curso`, value: f.curso });
    if (f.status) fields.push({ path: `formacao[${i}].status`, value: f.status });
  });
  cv.experiencias.forEach((e, i) => {
    e.responsabilidades.forEach((r, j) => {
      fields.push({ path: `experiencias[${i}].responsabilidades[${j}]`, value: r });
    });
    e.conquistas.forEach((q, j) => {
      fields.push({ path: `experiencias[${i}].conquistas[${j}]`, value: q });
    });
  });
  cv.projetos.forEach((p, i) => {
    // descricao agora é nullable (Fase 3.1). Pula null pra não quebrar
    // o portugueseLeak; o teste de não-invenção cobre o caso null.
    if (p.descricao) fields.push({ path: `projetos[${i}].descricao`, value: p.descricao });
  });
  cv.idiomas.forEach((id, i) => {
    fields.push({ path: `idiomas[${i}].idioma`, value: id.idioma });
    fields.push({ path: `idiomas[${i}].nivel`, value: id.nivel });
  });
  return fields;
}

/**
 * Heurística sem lib: pega marcadores fortes de português que não existem
 * em inglês corriqueiro. Retorna a lista de marcadores encontrados, ou null
 * se o texto parece limpo.
 *
 * Tolera nomes próprios e palavras emprestadas (Github, Docker, etc) porque
 * elas não disparam os marcadores.
 */
function portugueseLeak(text: string): { markers: string[] } | null {
  if (!text) return null;
  const markers: string[] = [];
  const lower = text.toLowerCase();

  // 1. Caracteres acentuados típicos de PT que não aparecem em palavras EN comuns.
  const accents = lower.match(/[ãõçáâéêíóôúà]/g);
  if (accents && accents.length > 0) {
    markers.push(`acentos:${[...new Set(accents)].join("")}`);
  }

  // 2. Palavras-função e termos de currículo que SÓ aparecem em PT.
  const ptWords = [
    "concluído",
    "concluida",
    "em andamento",
    "trancado",
    "português",
    "inglês",
    "espanhol",
    "francês",
    "alemão",
    "italiano",
    "nativo",
    "fluente",
    "intermediário",
    "intermediario",
    "avançado",
    "avancado",
    "básico",
    "basico",
    "sênior",
    "senior júnior",
    "júnior",
    "junior pleno",
    "pleno",
    "estágio",
    "estagio",
    "trainee",
    "bacharelado",
    "ensino médio",
    "ensino medio",
    "graduação",
    "graduacao",
    "ciência da computação",
    "ciencia da computacao",
    "engenharia da computação",
    "engenharia da computacao",
    "sistemas de informação",
    "sistemas de informacao",
    "análise e desenvolvimento de sistemas",
  ];
  for (const word of ptWords) {
    if (lower.includes(word)) markers.push(`palavra:"${word}"`);
  }

  // 3. Verbos PT comuns em bullets de currículo que NÃO existem em EN.
  const ptVerbs = [
    "desenvolvi",
    "implementei",
    "liderei",
    "trabalhei",
    "atuei",
    "responsável por",
    "responsavel por",
    "criei",
    "construí",
    "construi",
    "gerenciei",
    "reduzi",
    "melhorei",
    "escalei",
    "migrei",
  ];
  for (const verb of ptVerbs) {
    if (lower.includes(verb)) markers.push(`verbo:"${verb}"`);
  }

  // 4. Palavras-função PT muito comuns que quase nunca aparecem soltas em EN.
  // Usa \b pra não dar match em parte de palavra.
  const ptStopwords = ["\\bpara\\b", "\\bcomo\\b", "\\bcom\\b", "\\bdas\\b", "\\bdos\\b", "\\bque\\b"];
  for (const sw of ptStopwords) {
    if (new RegExp(sw, "i").test(lower)) markers.push(`stopword:${sw.replace(/\\b/g, "")}`);
  }

  return markers.length > 0 ? { markers: [...new Set(markers)] } : null;
}

/* ─────────── relatório ─────────── */

function fmtMs(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function buildReport(allResults: Array<{ scenario: RenderCase; runs: RunResult[]; checks: SemanticCheck[][] }>) {
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push(`# Fase 2A — Relatório de Teste: resume-render`);
  lines.push("");
  lines.push(`> **Modelo:** \`${tool.model}\` · **Temperature:** ${tool.temperature} · **Rodadas por cenário:** ${RUNS} · **Gerado em:** ${now}`);
  lines.push("");

  /* sumário transversal */
  let total = 0;
  let zodOk = 0;
  let jsonOk = 0;
  let httpOk = 0;
  let semOk = 0;
  let semTotal = 0;
  for (const r of allResults) {
    for (let i = 0; i < r.runs.length; i++) {
      total++;
      const run = r.runs[i];
      if (run.reason !== "fetch_error" && run.reason !== "http_error") httpOk++;
      if (run.reason !== "json_parse_failed" && run.reason !== "fetch_error" && run.reason !== "http_error") jsonOk++;
      if (run.ok) zodOk++;
      for (const c of r.checks[i] || []) {
        semTotal++;
        if (c.pass) semOk++;
      }
    }
  }
  lines.push(`## Sumário`);
  lines.push("");
  lines.push(`| Métrica | Resultado |`);
  lines.push(`|---|---|`);
  lines.push(`| Rodadas executadas | ${total} |`);
  lines.push(`| HTTP 200 da OpenAI | ${httpOk}/${total} ${httpOk === total ? "✅" : "❌"} |`);
  lines.push(`| JSON parse OK | ${jsonOk}/${total} ${jsonOk === total ? "✅" : "❌"} |`);
  lines.push(`| Zod validation OK | ${zodOk}/${total} ${zodOk === total ? "✅" : "❌"} |`);
  lines.push(`| Checks semânticos | ${semOk}/${semTotal} ${semOk === semTotal ? "✅" : `⚠️ (${semTotal - semOk} falharam)`} |`);
  lines.push("");

  for (const r of allResults) {
    lines.push(`---`);
    lines.push("");
    lines.push(`## ${r.scenario.id} · ${r.scenario.title}`);
    lines.push("");
    lines.push(`**Login context:** \`${r.scenario.loginContext}\``);
    lines.push("");
    for (let i = 0; i < r.runs.length; i++) {
      const run = r.runs[i];
      lines.push(`### Rodada ${i + 1} (${fmtMs(run.ms)}, in=${run.inputTokens ?? "?"}t, out=${run.outputTokens ?? "?"}t)`);
      lines.push("");
      if (!run.ok) {
        lines.push(`❌ **Falhou:** ${run.reason}`);
        if (run.httpError) lines.push(`HTTP: \`${run.httpError}\``);
        if (run.jsonParseError) lines.push(`JSON parse error: \`${run.jsonParseError}\``);
        if (run.zodErrors) {
          lines.push(`Zod issues:`);
          lines.push("```json");
          lines.push(JSON.stringify(run.zodErrors, null, 2).slice(0, 1500));
          lines.push("```");
        }
        if (run.raw) {
          lines.push(`Raw (primeiros 600 chars):`);
          lines.push("```");
          lines.push(run.raw.slice(0, 600));
          lines.push("```");
        }
        lines.push("");
        continue;
      }
      lines.push(`Schema válido ✅`);
      lines.push("");
      const checks = r.checks[i] || [];
      lines.push(`**Checks semânticos:**`);
      lines.push("");
      lines.push(`| Check | Resultado |`);
      lines.push(`|---|---|`);
      for (const c of checks) {
        const icon = c.pass ? "✅" : "❌";
        lines.push(`| ${c.label} | ${icon}${c.detail ? ` (${c.detail})` : ""} |`);
      }
      lines.push("");
      lines.push(`<details><summary>JSON do currículo</summary>`);
      lines.push("");
      lines.push("```json");
      lines.push(JSON.stringify(run.curriculo, null, 2));
      lines.push("```");
      lines.push("");
      lines.push(`</details>`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

/* ─────────── main ─────────── */

async function main() {
  const targets = onlySet
    ? CASES.filter((c) => onlySet.has(c.id.toUpperCase()))
    : CASES;

  console.log(`▶ resume-render · modelo=${tool.model} · runs=${RUNS} · cenários=${targets.map((c) => c.id).join(",")}`);

  const allResults: Array<{ scenario: RenderCase; runs: RunResult[]; checks: SemanticCheck[][] }> = [];

  for (const c of targets) {
    process.stdout.write(`  ${c.id} ${c.title}\n`);
    const runs: RunResult[] = [];
    const checks: SemanticCheck[][] = [];
    for (let i = 0; i < RUNS; i++) {
      process.stdout.write(`    rodada ${i + 1}/${RUNS} …`);
      const r = await runRender(c);
      runs.push(r);
      if (r.ok && r.curriculo) {
        const sc = runSemanticChecks(c, r.curriculo);
        checks.push(sc);
        const pass = sc.filter((x) => x.pass).length;
        process.stdout.write(` ok (${pass}/${sc.length} checks, ${fmtMs(r.ms)})\n`);
      } else {
        checks.push([]);
        process.stdout.write(` ❌ ${r.reason} (${fmtMs(r.ms)})\n`);
      }
    }
    allResults.push({ scenario: c, runs, checks });
  }

  const report = buildReport(allResults);
  const outDir = `${repoRoot}/docs`;
  await mkdir(outDir, { recursive: true });
  const outPath = `${outDir}/curriculo-pro-fase-2a-relatorio.md`;
  await writeFile(outPath, report, "utf-8");
  console.log(`\n📄 relatório: ${outPath.replace(repoRoot + "/", "")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
