/**
 * Verificacao de CARGA dos roadmaps gerados por IA, por aritmetica.
 *
 * Compara a soma de `estimatedHours` de cada roadmap com as horas que a pessoa
 * declarou ter (`hoursPerWeek` x `deadline`). Nao usa juiz nem LLM: e conta.
 *
 * POR QUE E SCRIPT E NAO MEDICAO DE UMA VEZ. A calibracao depende do prompt, e
 * o prompt muda. Uma medicao avulsa responde "estava calibrado naquele dia" e
 * apodrece; um script responde "esta calibrado agora" toda vez que alguem roda.
 *
 * O QUE ELE AFIRMA. Nao so "os que eu olhei estao bons": ele afirma o TOTAL.
 * Toda linha `ready` do banco cai em exatamente uma de tres classes (avaliada,
 * legado sem o campo, ou sem prazo declarado), a soma das tres e conferida
 * contra o total lido, e qualquer divergencia aborta. Roadmap de formato novo
 * que o script nao soube classificar derruba a execucao em vez de sumir da
 * conta.
 *
 * Uso:
 *   npx tsx scripts/checkCargaRoadmap.mts
 *   npx tsx scripts/checkCargaRoadmap.mts --slug=ia-xxxxxxxx
 */
import {
  cargaDoRoadmap,
  RAZAO_MAXIMA,
  RAZAO_MINIMA,
} from "../shared/aiRoadmap/carga";
import type { RoadmapIntake } from "../shared/aiRoadmap";
import type { RoadmapV2 } from "../shared/roadmapV2/types";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function abortar(m: string): never {
  console.error(`\n[carga] ABORTADO: ${m}`);
  process.exit(1);
}

interface Linha {
  slug: string;
  inputs: Partial<RoadmapIntake> | null;
  roadmap: RoadmapV2 | null;
}

async function main() {
  if (!SUPABASE_URL || !SERVICE) {
    abortar("faltam VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente");
  }
  const filtroSlug = process.argv
    .find((a) => a.startsWith("--slug="))
    ?.split("=")[1];

  const url = new URL(`${SUPABASE_URL}/rest/v1/ai_roadmaps`);
  url.searchParams.set("select", "slug,inputs,roadmap");
  url.searchParams.set("status", "eq.ready");
  if (filtroSlug) url.searchParams.set("slug", `eq.${filtroSlug}`);

  const res = await fetch(url, {
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
  });
  if (!res.ok) abortar(`PostgREST respondeu ${res.status}`);
  const linhas = (await res.json()) as Linha[];
  if (linhas.length === 0) abortar("nenhum roadmap ready encontrado");

  const avaliados: Array<{ slug: string; razao: number; ok: boolean }> = [];
  const legado: string[] = [];
  const semPrazo: string[] = [];
  const semIntake: string[] = [];

  for (const l of linhas) {
    if (!l.roadmap || !l.inputs?.hoursPerWeek || !l.inputs?.deadline) {
      semIntake.push(l.slug);
      continue;
    }
    const c = cargaDoRoadmap(l.roadmap, {
      hoursPerWeek: l.inputs.hoursPerWeek,
      deadline: l.inputs.deadline,
    });
    // Legado: NENHUM passo tem o campo numerico. Nao e "carga zero", e ausencia
    // do instrumento. Contar como reprovado poluiria o sinal; contar como
    // aprovado seria falhar passando. Fica numa classe propria, e a classe
    // aparece no relatorio.
    if (c.passosTotais > 0 && c.passosSemHoras === c.passosTotais) {
      legado.push(l.slug);
      continue;
    }
    if (c.razao === null) {
      semPrazo.push(l.slug);
      continue;
    }
    avaliados.push({ slug: l.slug, razao: c.razao, ok: c.calibrado === true });
  }

  const classificados =
    avaliados.length + legado.length + semPrazo.length + semIntake.length;
  if (classificados !== linhas.length) {
    abortar(
      `li ${linhas.length} roadmaps e classifiquei ${classificados}. A diferenca e um formato que este script nao conhece: investigue antes de confiar em qualquer numero acima.`,
    );
  }

  console.log(`[carga] ${linhas.length} roadmaps ready lidos.`);
  console.log(
    `  avaliados: ${avaliados.length} | legado sem estimatedHours: ${legado.length} | sem prazo declarado: ${semPrazo.length} | sem intake utilizavel: ${semIntake.length}`,
  );

  if (avaliados.length === 0) {
    console.log(
      "\n[carga] nenhum roadmap com estimatedHours ainda: nada a verificar.",
    );
    return;
  }

  const fora = avaliados.filter((a) => !a.ok);
  console.log(
    `\n  faixa calibrada: ${RAZAO_MINIMA} a ${RAZAO_MAXIMA} (geradas/disponiveis)`,
  );
  for (const a of [...avaliados].sort((x, y) => y.razao - x.razao)) {
    console.log(
      `    ${a.ok ? "ok  " : "FORA"} ${a.slug}  razao=${a.razao.toFixed(2)}`,
    );
  }

  if (fora.length > 0) {
    abortar(
      `${fora.length} de ${avaliados.length} roadmaps fora da faixa de carga.`,
    );
  }
  console.log(
    `\n[carga] ok: os ${avaliados.length} avaliados cabem no prazo declarado.`,
  );
}

main().catch((e) => abortar(e instanceof Error ? e.message : String(e)));
