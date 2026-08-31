/**
 * Medicao semantica de PERSONALIZACAO dos roadmaps gerados por IA.
 *
 * POR QUE ELE EXISTE. A metrica ingenua foi medida e refutada: intake rico deu
 * 342 chars por passo e intake pobre 289, diferenca puxada por um unico outlier.
 * Comprimento e contagem de passos medem VOLUME, e um roadmap pode ser longo e
 * generico. A pergunta que importa e outra: "este plano e DAQUELA pessoa?".
 *
 * O DESENHO, em duas metades:
 *
 *  1. COMPUTADO, sem IA. Tudo que da para calcular do proprio JSON: carga
 *     declarada contra tempo disponivel, consistencia de unidade, ids de projeto
 *     validos, uso de sub-passos. Perguntar isso a um juiz seria trocar uma
 *     medida exata por uma opiniao cara.
 *  2. JULGADO, com IA. So o que exige ler o texto: o plano leva ao objetivo
 *     declarado? reconhece o que a pessoa ja sabe? usa a stack que ela citou?
 *     considera os obstaculos dela?
 *
 * SEPARACAO DELIBERADA entre PERSONALIZACAO e QUALIDADE. As quatro dimensoes de
 * personalizacao dependem do intake; as tres de qualidade nao. E essa separacao
 * que permite o teste adversario: um roadmap generico mas bem escrito precisa
 * pontuar BAIXO na primeira e ALTO na segunda. Um juiz que sobe as duas junto
 * esta medindo polimento, e nao serve.
 *
 * NAO ESCREVE NADA. Le `ai_roadmaps` e chama a OpenAI. Nenhuma tabela de
 * producao e tocada.
 *
 * Uso:
 *   npx tsx scripts/avaliarRoadmapIA.mts --slug=ia-xxxxxxxx
 *   npx tsx scripts/avaliarRoadmapIA.mts --todos
 *   npx tsx scripts/avaliarRoadmapIA.mts --calibrar
 *   npx tsx scripts/avaliarRoadmapIA.mts --slug=ia-xxxxxxxx --repeticoes=3
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const OPENAI_KEY = process.env.OPENAI_API_KEY ?? "";

// JUIZ SEPARADO DO GERADOR, de proposito. O gerador e gpt-4o-mini; um modelo
// julgando o proprio estilo infla a nota (auto-preferencia e vies documentado em
// juizes LLM). gpt-4o e de familia diferente o suficiente para o veredito nao
// ser auto-elogio, e esta na tabela de precos do projeto.
const JUIZ = "gpt-4o";
const PRECO = { entrada: 2.5 / 1_000_000, saida: 10 / 1_000_000 };

function abortar(m: string): never {
  console.error(`\n[avaliar] ABORTADO: ${m}`);
  process.exit(1);
}

async function rest(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) abortar(`PostgREST ${path}: HTTP ${res.status}`);
  return body as unknown;
}

// ---------------------------------------------------------------------------
// METADE 1: o que se computa, sem IA.
// ---------------------------------------------------------------------------

type Passo = {
  title?: string;
  content?: string;
  estimatedTime?: string;
  project?: string;
  children?: unknown[];
};
type Secao = { title?: string; children?: Passo[] };
type Roadmap = { sections?: Secao[] };
type Intake = Record<string, string | undefined>;

/** Horas de uma string de estimativa, ou null se ela nao for carga em horas. */
export function horasDe(texto: string | undefined): number | null {
  if (!texto) return null;
  const t = texto.toLowerCase();
  // "2 semanas" e DURACAO DE CALENDARIO, nao carga: nao da para somar com horas
  // sem saber quantas horas por semana a pessoa dedica. Devolve null de
  // proposito, e a mistura vira um sinal proprio (ver `unidadeMista`).
  if (/semana|mes|mês/.test(t)) return null;
  const nums = t.match(/\d+(?:[.,]\d+)?/g);
  if (!nums || !/h|hora/.test(t)) return null;
  const vals = nums.map((n) => parseFloat(n.replace(",", ".")));
  // Faixa ("4h a 6h") vira o ponto medio; valor unico vira ele mesmo.
  return vals.length >= 2 ? (vals[0] + vals[1]) / 2 : vals[0];
}

const HORAS_SEMANA: Record<string, number> = {
  "ate-5": 3,
  "5-10": 7.5,
  "10-20": 15,
  "20-mais": 25,
};
const SEMANAS_PRAZO: Record<string, number> = {
  "3m": 13,
  "6m": 26,
  "12m": 52,
  "sem-prazo": 26,
};

export function metricasComputadas(roadmap: Roadmap, intake: Intake) {
  const passos: Passo[] = [];
  for (const s of roadmap.sections ?? [])
    for (const c of s.children ?? []) passos.push(c);

  const emHoras = passos
    .map((p) => horasDe(p.estimatedTime))
    .filter((h): h is number => h !== null);
  const emSemanas = passos.filter((p) =>
    /semana|mes|mês/i.test(p.estimatedTime ?? ""),
  ).length;

  const cargaDeclarada = emHoras.reduce((a, b) => a + b, 0);
  const hSemana = HORAS_SEMANA[intake.hoursPerWeek ?? ""] ?? null;
  const semanas = SEMANAS_PRAZO[intake.deadline ?? ""] ?? null;
  const disponivel =
    hSemana !== null && semanas !== null ? hSemana * semanas : null;

  return {
    passos: passos.length,
    secoes: (roadmap.sections ?? []).length,
    passos_em_horas: emHoras.length,
    passos_em_semanas: emSemanas,
    // UNIDADE MISTA e defeito por si so: somar "4h" com "2 semanas" nao produz
    // numero nenhum, entao o proprio roadmap fica sem carga total legivel.
    unidade_mista: emHoras.length > 0 && emSemanas > 0,
    carga_declarada_h: Math.round(cargaDeclarada),
    carga_disponivel_h: disponivel,
    // >1 = pede mais tempo do que a pessoa tem. <0,5 = plano folgado demais.
    razao_carga: disponivel
      ? Number((cargaDeclarada / disponivel).toFixed(2))
      : null,
    com_project: passos.filter((p) => p.project).length,
    com_subpassos: passos.filter(
      (p) => Array.isArray(p.children) && p.children.length > 0,
    ).length,
    sem_content: passos.filter((p) => !p.content?.trim()).length,
  };
}

// ---------------------------------------------------------------------------
// METADE 2: o juiz.
// ---------------------------------------------------------------------------

const ESCALA = `1 = ausente (o roadmap ignora completamente este aspecto do intake)
2 = mencao superficial (cita, mas nao muda nada no plano)
3 = parcial (afeta uma ou duas secoes, nao o plano todo)
4 = consistente (afeta a estrutura do plano, com uma ou outra lacuna)
5 = central (o plano so faz sentido para ALGUEM COM ESTE INTAKE)`;

const RUBRICA = `Voce avalia se um roadmap de estudos foi feito PARA UMA PESSOA ESPECIFICA.

Escala, identica em todas as dimensoes:
${ESCALA}

DIMENSOES DE PERSONALIZACAO (dependem do intake):
- objetivo: o plano leva ao objetivo declarado em "goal"? Um plano de "primeira-vaga" precisa terminar em empregabilidade (portfolio, entrevista); um de "aprofundar" nao.
- ponto_de_partida: reconhece o que a pessoa JA SABE (campo "startingPoint")? Recomecar do zero o que ela declarou dominar e nota 1, ainda que bem escrito.
- stack: quando "stackFocus" existe, o conteudo usa essa stack concretamente? Se stackFocus estiver vazio, devolva null nesta dimensao.
- obstaculos: o plano considera "constraints" e "motivation"? Quem trabalha em periodo integral precisa de blocos compativeis. Se ambos vazios, devolva null.

DIMENSOES DE QUALIDADE (NAO dependem do intake; julgue o texto por si):
- especificidade: nomeia subtopicos concretos ("closures, event loop, promises") ou fica em "estude os fundamentos"?
- acionabilidade: da para comecar a estudar HOJE so com o que esta escrito?

REGRAS:
- Toda nota exige EVIDENCIA: uma citacao curta e literal do roadmap. Nota sem evidencia e opiniao.
- NAO premie comprimento. Um roadmap longo e generico deve ir mal em personalizacao.
- Julgue personalizacao e qualidade de forma INDEPENDENTE: um texto excelente que serviria para qualquer pessoa tem qualidade alta e personalizacao baixa.
- Nunca infira intake a partir do roadmap. Use so o intake fornecido.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "objetivo",
    "ponto_de_partida",
    "stack",
    "obstaculos",
    "especificidade",
    "acionabilidade",
  ],
  properties: Object.fromEntries(
    [
      "objetivo",
      "ponto_de_partida",
      "stack",
      "obstaculos",
      "especificidade",
      "acionabilidade",
    ].map((d) => [
      d,
      {
        type: ["object", "null"],
        additionalProperties: false,
        required: ["nota", "evidencia", "justificativa"],
        properties: {
          nota: { type: "integer" },
          evidencia: { type: "string" },
          justificativa: { type: "string" },
        },
      },
    ]),
  ),
};

type Dim = { nota: number; evidencia: string; justificativa: string } | null;
export type Veredito = Record<string, Dim>;

function textoDoRoadmap(r: Roadmap): string {
  const linhas: string[] = [];
  for (const s of r.sections ?? []) {
    linhas.push(`## ${s.title ?? "(sem titulo)"}`);
    for (const c of s.children ?? []) {
      linhas.push(
        `- ${c.title ?? ""} [${c.estimatedTime ?? "?"}]: ${(c.content ?? "").slice(0, 400)}`,
      );
    }
  }
  return linhas.join("\n").slice(0, 24000);
}

export async function julgar(intake: Intake, roadmap: Roadmap) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: JUIZ,
      temperature: 0,
      messages: [
        { role: "system", content: RUBRICA },
        {
          role: "user",
          content: `INTAKE DA PESSOA:\n${JSON.stringify(intake, null, 2)}\n\nROADMAP GERADO:\n${textoDoRoadmap(roadmap)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "avaliacao", strict: true, schema: SCHEMA },
      },
    }),
  });
  const d = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens: number; completion_tokens: number };
    error?: { message: string };
  };
  // RATE LIMIT. A conta tem 30k TPM em gpt-4o e cada avaliacao consome ~7k, entao
  // uma rodada dos 29 estoura o teto por volta do decimo. Espera o tempo que a
  // propria OpenAI informa e tenta de novo, em vez de abortar a rodada inteira.
  if (d.error?.message?.includes("Rate limit")) {
    const seg = /try again in ([\d.]+)s/.exec(d.error.message);
    const espera = Math.ceil((seg ? parseFloat(seg[1]) : 20) * 1000) + 2000;
    console.log(`   [rate limit] aguardando ${Math.round(espera / 1000)}s...`);
    await new Promise((r) => setTimeout(r, espera));
    return julgar(intake, roadmap);
  }
  if (d.error) abortar(`OpenAI: ${d.error.message}`);
  const conteudo = d.choices?.[0]?.message?.content;
  if (!conteudo) abortar("juiz nao devolveu conteudo");
  const custo =
    (d.usage?.prompt_tokens ?? 0) * PRECO.entrada +
    (d.usage?.completion_tokens ?? 0) * PRECO.saida;
  return { veredito: JSON.parse(conteudo) as Veredito, custo };
}

export function media(v: Veredito, dims: string[]): number | null {
  const notas = dims
    .map((d) => v[d]?.nota)
    .filter((n): n is number => typeof n === "number");
  return notas.length
    ? Number((notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2))
    : null;
}

export const DIMS_PERSONALIZACAO = [
  "objetivo",
  "ponto_de_partida",
  "stack",
  "obstaculos",
];
// `escrita` FOI REMOVIDA em 2026-08-04. No baseline dos 27 ela deu 4 em 27 de
// 27, variancia zero: nao discriminava nada e so diluia o composto. Medido:
// tirando ela, a amplitude do composto de qualidade sobe de 1,33 para 2,00.
// Dimensao que nao varia nao e dimensao, e ruido caro.
export const DIMS_QUALIDADE = ["especificidade", "acionabilidade"];

// ---------------------------------------------------------------------------

async function carregar(slug?: string) {
  const filtro = slug ? `&slug=eq.${slug}` : "";
  return (await rest(
    `ai_roadmaps?status=eq.ready&select=slug,inputs,roadmap${filtro}&order=slug`,
  )) as Array<{ slug: string; inputs: Intake; roadmap: Roadmap }>;
}

function linha(
  slug: string,
  v: Veredito,
  m: ReturnType<typeof metricasComputadas>,
) {
  const p = media(v, DIMS_PERSONALIZACAO);
  const q = media(v, DIMS_QUALIDADE);
  const notas = [...DIMS_PERSONALIZACAO, ...DIMS_QUALIDADE]
    .map((d) => `${d.slice(0, 4)}=${v[d]?.nota ?? "-"}`)
    .join(" ");
  return `${slug}  P=${p ?? "-"} Q=${q ?? "-"} | ${notas} | carga=${m.razao_carga ?? "-"} mista=${m.unidade_mista ? "S" : "n"}`;
}

// ---------------------------------------------------------------------------
// CALIBRACAO. Um juiz que da 4 para tudo e inutil; estes quatro casos existem
// para PROVAR que ele discrimina, e nao para confirmar que ele funciona.
// ---------------------------------------------------------------------------

// Roadmap generico BEM ESCRITO: subtopicos concretos, progressao logica, texto
// limpo, e nenhuma referencia a intake nenhum. Serve para qualquer pessoa que
// queira aprender programacao, que e exatamente o defeito. Se o juiz der nota
// alta em personalizacao aqui, ele esta medindo polimento.
const GENERICO_BEM_ESCRITO: Roadmap = {
  sections: [
    {
      title: "Fundamentos de programacao",
      children: [
        {
          title: "Tipos, variaveis e escopo",
          estimatedTime: "4h a 6h",
          content:
            "Estude tipos primitivos, coercao, escopo lexico e hoisting. Escreva 10 exercicios pequenos que imprimam o resultado de comparacoes entre tipos diferentes e explique cada saida.",
        },
        {
          title: "Estruturas de controle",
          estimatedTime: "4h a 6h",
          content:
            "Condicionais, lacos e early return. Reescreva tres funcoes aninhadas usando guardas no topo e compare a legibilidade.",
        },
        {
          title: "Funcoes e closures",
          estimatedTime: "4h a 6h",
          content:
            "Parametros, retorno, funcoes de primeira classe e closures. Implemente um contador com estado privado e explique por que o estado sobrevive entre chamadas.",
        },
      ],
    },
    {
      title: "Estruturas de dados",
      children: [
        {
          title: "Arrays e metodos de ordem superior",
          estimatedTime: "4h a 6h",
          content:
            "map, filter e reduce. Resolva cinco transformacoes de lista sem usar laco explicito e meca a diferenca de legibilidade.",
        },
        {
          title: "Objetos e mapas",
          estimatedTime: "4h a 6h",
          content:
            "Chaves, iteracao e quando um Map e melhor que um objeto. Implemente um indice invertido de palavras para um texto.",
        },
      ],
    },
    {
      title: "Versionamento e colaboracao",
      children: [
        {
          title: "Git no dia a dia",
          estimatedTime: "4h a 6h",
          content:
            "commit, branch, merge e resolucao de conflito. Crie um conflito de proposito em dois branches e resolva-o a mao.",
        },
        {
          title: "Revisao de codigo",
          estimatedTime: "2 horas",
          content:
            "Leia tres pull requests abertos de um projeto open source e escreva um comentario util em cada um.",
        },
      ],
    },
  ],
};

async function calibrar() {
  const todos = await carregar();
  const porSlug = (s: string) => {
    const r = todos.find((x) => x.slug === s);
    if (!r) abortar(`slug ${s} nao encontrado`);
    return r;
  };
  const rico = porSlug("ia-b9ec1b72");
  const outro = porSlug("ia-1a882fce");
  const degradado = porSlug("ia-c209bae0");

  const casos: Array<{
    nome: string;
    intake: Intake;
    roadmap: Roadmap;
    espera: string;
  }> = [
    {
      nome: "1 correto      ",
      intake: rico.inputs,
      roadmap: rico.roadmap,
      espera: "P alta",
    },
    {
      nome: "2 trocado      ",
      intake: outro.inputs,
      roadmap: rico.roadmap,
      espera: "P baixa",
    },
    // ADVERSARIO contra intake AVANCADO, nao contra o iniciante. Na primeira
    // iteracao este caso usava o intake de `ia-b9ec1b72` ("startingPoint:
    // iniciante") e o juiz deu ponto_de_partida=4, corretamente, porque um
    // roadmap que comeca em tipos e variaveis DE FATO serve para um iniciante.
    // O caso nao testava nada: generico e "bom para iniciante" coincidem. Contra
    // alguem que ja estuda Angular e React, comecar em "tipos primitivos" e
    // ignorar o ponto de partida, e ai o adversario morde.
    {
      nome: "3 adversario   ",
      intake: outro.inputs,
      roadmap: GENERICO_BEM_ESCRITO,
      espera: "P baixa, Q alta",
    },
    {
      nome: "4 degradado    ",
      intake: degradado.inputs,
      roadmap: degradado.roadmap,
      // NAO e caso-controle: e uma HIPOTESE minha, que o juiz existe para
      // testar. Chamei `ia-c209bae0` de "geracao degradada" olhando 5 secoes e
      // 205 chars por passo, que sao exatamente as metricas de VOLUME que este
      // instrumento foi construido para substituir. Se o juiz discordar, quem
      // estava errado era o rotulo.
      espera: "hipotese a testar",
    },
  ];

  let custo = 0;
  console.log(
    "caso            P     Q     | detalhe                                   | esperado",
  );
  for (const c of casos) {
    const { veredito, custo: k } = await julgar(c.intake, c.roadmap);
    custo += k;
    const p = media(veredito, DIMS_PERSONALIZACAO);
    const q = media(veredito, DIMS_QUALIDADE);
    const det = [...DIMS_PERSONALIZACAO, ...DIMS_QUALIDADE]
      .map((d) => `${d.slice(0, 4)}=${veredito[d]?.nota ?? "-"}`)
      .join(" ");
    console.log(
      `${c.nome} ${String(p).padEnd(5)} ${String(q).padEnd(5)} | ${det.padEnd(41)} | ${c.espera}`,
    );
  }
  console.log(`\n[calibrar] custo US$ ${custo.toFixed(4)}`);
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY)
    abortar("VITE_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes.");
  if (!OPENAI_KEY) abortar("OPENAI_API_KEY ausente.");

  const arg = (n: string) =>
    process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
  const slug = arg("slug");
  const reps = parseInt(arg("repeticoes") ?? "1", 10);
  const todos = process.argv.includes("--todos");

  if (process.argv.includes("--calibrar")) {
    await calibrar();
    return;
  }
  if (!slug && !todos)
    abortar("passe --slug=ia-xxxxxxxx, --todos ou --calibrar");

  const linhas = await carregar(slug);
  if (!linhas.length)
    abortar(`nenhum roadmap ready${slug ? ` com slug ${slug}` : ""}`);

  let custoTotal = 0;
  const saida: unknown[] = [];
  for (const r of linhas) {
    const m = metricasComputadas(r.roadmap, r.inputs);
    for (let i = 0; i < reps; i += 1) {
      const { veredito, custo } = await julgar(r.inputs, r.roadmap);
      // Ritmo deliberado: sem isto a rodada bate no TPM e a espera fica maior
      // que o tempo economizado.
      await new Promise((res) => setTimeout(res, 12_000));
      custoTotal += custo;
      console.log(linha(r.slug + (reps > 1 ? `#${i + 1}` : ""), veredito, m));
      saida.push({
        slug: r.slug,
        repeticao: i + 1,
        campos_intake: Object.keys(r.inputs).length,
        personalizacao: media(veredito, DIMS_PERSONALIZACAO),
        qualidade: media(veredito, DIMS_QUALIDADE),
        veredito,
        computado: m,
      });
    }
  }
  console.log(
    `\n[avaliar] ${linhas.length} roadmap(s) x ${reps} | custo US$ ${custoTotal.toFixed(4)}`,
  );
  await import("node:fs").then((fs) =>
    fs.writeFileSync(
      arg("saida") ?? "avaliacao-saida.json",
      JSON.stringify(saida, null, 2),
    ),
  );
  console.log("[avaliar] resultado bruto gravado (use --saida=caminho.json)");
}

if (process.argv[1]?.includes("avaliarRoadmapIA")) {
  main().catch((e) => abortar(e instanceof Error ? e.message : String(e)));
}
