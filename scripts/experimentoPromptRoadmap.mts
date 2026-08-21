/**
 * Experimento controlado de mudanca de prompt de geracao do Roadmap com IA.
 *
 * DESENHO. Uma variavel por vez: o INTAKE e fixo, o prompt e o que muda. Rodar
 * cada persona antes e depois de UMA intervencao isola o efeito dela. Mexer em
 * cinco coisas e ver a nota subir nao diz qual funcionou, e deixa para a fase
 * seguinte um prompt que ninguem entende.
 *
 * POR QUE NAO PASSA PELO CHAT. O caminho completo (conversa + geracao) gastaria
 * ~5 turnos por rodada, e 4 personas x antes/depois x 2 intervencoes = 80
 * turnos, acima da cota dedicada de 60/dia. Alem do custo, o chat introduz um
 * interlocutor como variavel: duas conversas com a mesma persona produzem
 * intakes diferentes. Chamando /generate com intake fixo, a unica coisa que
 * muda entre as rodadas e o prompt, que e exatamente o que o experimento quer
 * medir.
 *
 * AS PERSONAS. Tres com ponto de partida NAO-ZERO (que e o caso que falha, com
 * 1,96 de 5 no baseline) e uma iniciante como CONTROLE: se a nota dela cair, a
 * intervencao quebrou o caso que ja funcionava.
 *
 * ESCREVE em `ai_roadmaps` de producao, sob a conta de teste. Uma linha por
 * geracao. Os ids saem no relatorio para serem excluidos das metricas.
 *
 * Uso:
 *   npx tsx scripts/experimentoPromptRoadmap.mts --rotulo=antes-A
 */
import {
  julgar,
  media,
  DIMS_PERSONALIZACAO,
  DIMS_QUALIDADE,
  metricasComputadas,
} from "./avaliarRoadmapIA.mts";

const API = process.env.SMOKE_API_URL ?? "http://localhost:3100";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const ANON = process.env.VITE_SUPABASE_ANON_KEY ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function abortar(m: string): never {
  console.error(`\n[experimento] ABORTADO: ${m}`);
  process.exit(1);
}

/**
 * As quatro personas, como INTAKE (nao como texto de conversa).
 *
 * O campo que o experimento ataca e `startingPoint`. As tres primeiras declaram
 * conhecimento previo de tipos diferentes: curso em andamento, atuacao
 * profissional, e stack especifica dominada. A quarta declara nada, e existe
 * para provar que a intervencao nao quebra quem comeca do zero.
 */
const PERSONAS: Array<{ nome: string; intake: Record<string, string> }> = [
  // Lista de cursos, sem dizer o nivel. E o formato mais comum: 10 dos 24
  // startingPoint reais citam curso ou plataforma.
  {
    nome: "lista-de-cursos",
    intake: {
      goal: "primeira-vaga",
      hoursPerWeek: "5-10",
      deadline: "6m",
      format: "misto",
      stackFocus: "javascript",
      startingPoint:
        "curso de JavaScript, HTML e CSS da DIO, trilha de front em andamento",
      motivation: "quero sair do administrativo",
      constraints: "trabalho das 9 as 18",
    },
  },
  // Marcador de imprecisao ("basico"), que aparece em 8 dos 24 reais. O modelo
  // precisa decidir o que "basico" libera, e e onde ele erra hoje.
  {
    nome: "basico-impreciso",
    intake: {
      goal: "transicao",
      hoursPerWeek: "10-20",
      deadline: "6m",
      format: "misto",
      stackFocus: "python",
      startingPoint: "Python basico, SQL basico, Power BI basico",
      motivation: "quero mudar de area",
      constraints: "ingles fraco",
    },
  },
  // Curto e institucional, como os mais curtos do corpus real (min 9 chars).
  {
    nome: "curto-institucional",
    intake: {
      goal: "primeira-vaga",
      hoursPerWeek: "10-20",
      deadline: "12m",
      format: "misto",
      startingPoint: "5o semestre de Analise e Desenvolvimento de Sistemas",
      motivation: "quero estagio",
      constraints: "faculdade a noite",
    },
  },
  // CONTROLE 1: declara ZERO. Comecar do zero e o resultado CERTO aqui, e foi
  // este caso que a intervencao A quebrou (5 -> 1).
  {
    nome: "CONTROLE-zero",
    intake: {
      goal: "primeira-vaga",
      hoursPerWeek: "ate-5",
      deadline: "12m",
      format: "misto",
      startingPoint: "nunca programei",
      motivation: "quero mudar de vida",
      constraints: "dois filhos pequenos",
    },
  },
  // CONTROLE 2: startingPoint AUSENTE. Verifica que a instrucao condicional nao
  // faz nada quando nao ha o que classificar. 4 dos 27 roadmaps reais sao assim.
  {
    nome: "CONTROLE-vazio",
    intake: {
      goal: "primeira-vaga",
      hoursPerWeek: "5-10",
      deadline: "6m",
      format: "misto",
      motivation: "quero trabalhar com tecnologia",
    },
  },
];

async function token() {
  const uid =
    process.env.SMOKE_USER_ID ?? "6a9063c4-2bcb-4432-8a75-70fccc676851";
  const u = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, {
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
  }).then((r) => r.json() as Promise<{ email?: string }>);
  if (!u.email) abortar("nao consegui o e-mail da conta de teste");
  const link = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "magiclink", email: u.email }),
  }).then((r) => r.json() as Promise<{ hashed_token?: string }>);
  const s = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", token_hash: link.hashed_token }),
  }).then((r) => r.json() as Promise<{ access_token?: string }>);
  if (!s.access_token) abortar("verify falhou");
  return s.access_token;
}

async function gerar(tok: string, intake: Record<string, string>) {
  const res = await fetch(`${API}/api/roadmaps-ia/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tok}`,
    },
    body: JSON.stringify(intake),
  });
  if (!res.ok || !res.body) abortar(`/generate HTTP ${res.status}`);
  const texto = await res.text();
  const slug = /"slug":"(ia-[a-z0-9]+)"/.exec(texto)?.[1];
  const falhas = (texto.match(/"type":"section_failed"/g) ?? []).length;
  const erro = /"type":"error","message":"([^"]+)"/.exec(texto)?.[1];
  if (!slug) abortar(`sem slug na resposta${erro ? `: ${erro}` : ""}`);
  return { slug, falhas, erro };
}

async function carregar(slug: string) {
  const r = (await fetch(
    `${SUPABASE_URL}/rest/v1/ai_roadmaps?slug=eq.${slug}&select=slug,inputs,roadmap,status`,
    { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } },
  ).then((x) => x.json())) as Array<{
    slug: string;
    inputs: Record<string, string>;
    roadmap: unknown;
    status: string;
  }>;
  return r[0];
}

async function main() {
  const rotulo = process.argv
    .find((a) => a.startsWith("--rotulo="))
    ?.split("=")[1];
  if (!rotulo)
    abortar("passe --rotulo=antes-A (identifica a rodada no arquivo de saida)");

  const tok = await token();
  const saida: unknown[] = [];
  let custoJuiz = 0;

  for (const p of PERSONAS) {
    process.stdout.write(`\n[${rotulo}] ${p.nome}: gerando... `);
    const { slug, falhas, erro } = await gerar(tok, p.intake);
    const linha = await carregar(slug);
    process.stdout.write(`${slug} (${linha.status})`);
    if (falhas) process.stdout.write(` [${falhas} secao(oes) falharam]`);
    if (erro) process.stdout.write(` [erro: ${erro}]`);

    const { veredito, custo } = await julgar(p.intake, linha.roadmap as never);
    custoJuiz += custo;
    const comp = metricasComputadas(linha.roadmap as never, p.intake);
    const P = media(veredito, DIMS_PERSONALIZACAO);
    const Q = media(veredito, DIMS_QUALIDADE);
    const notas = [...DIMS_PERSONALIZACAO, ...DIMS_QUALIDADE]
      .map((d) => `${d.slice(0, 4)}=${veredito[d]?.nota ?? "-"}`)
      .join(" ");
    console.log(`\n   P=${P} Q=${Q} | ${notas}`);
    console.log(
      `   evidencia(ponto_de_partida): ${veredito.ponto_de_partida?.evidencia?.slice(0, 150) ?? "-"}`,
    );
    saida.push({
      rotulo,
      persona: p.nome,
      slug,
      status: linha.status,
      secoes_falhas: falhas,
      P,
      Q,
      veredito,
      computado: comp,
    });
    // Ritmo: o juiz e gpt-4o e a conta tem 30k TPM.
    await new Promise((r) => setTimeout(r, 10_000));
  }

  const arq = `experimento-${rotulo}.json`;
  await import("node:fs").then((fs) =>
    fs.writeFileSync(arq, JSON.stringify(saida, null, 2)),
  );
  console.log(
    `\n[experimento] ${PERSONAS.length} geracoes | juiz US$ ${custoJuiz.toFixed(4)} | saida em ${arq}`,
  );
}

main().catch((e) => abortar(e instanceof Error ? e.message : String(e)));
