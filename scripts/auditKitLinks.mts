// Confere os links do kit dos modulos v2 de projeto. Usa rede, entao fica
// FORA do `pnpm check` e do CI: um site fora do ar por cinco minutos nao pode
// reprovar um commit que nao mexeu nele.
//
// Uso:
//   pnpm audit:kit-links               todos os modulos v2
//   pnpm audit:kit-links --ids=a,b,c   so esses
//
// Classificacao de cada link:
//   ok            2xx no mesmo host (se a URL final mudou, o destino aparece)
//   redirecionado 2xx, mas a URL final esta em OUTRO host
//   bloqueado     403 ou 429: pode ser anti-bot, entao e duvidoso, nao morto
//   morto         outro 4xx ou 5xx, erro de DNS, recusa ou timeout
//
// Sai 1 se houver morto. Bloqueado e redirecionado nao reprovam: pedem olho
// humano, e reprovar por eles faria o script ser ignorado.
import { PROJETOS_V2 } from "../shared/projects/v2/all";

const TIMEOUT_MS = 10_000;
const PAUSA_MESMO_HOST_MS = 1_000;

type Classe = "ok" | "redirecionado" | "bloqueado" | "morto";
type Resultado = { classe: Classe; detalhe: string };

function lerIds(): Set<string> | null {
  const arg = process.argv.find((a) => a.startsWith("--ids="));
  if (!arg) return null;
  const ids = arg
    .slice("--ids=".length)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const conhecidos = new Set(PROJETOS_V2.map((d) => d.id));
  const desconhecidos = ids.filter((id) => !conhecidos.has(id));
  // Id errado aborta em vez de ser ignorado: ignorar auditaria menos do que
  // foi pedido e reportaria sucesso sobre a parte que sobrou.
  if (desconhecidos.length > 0) {
    console.error(
      `[audit:kit-links] ids sem modulo v2: ${desconhecidos.join(", ")}`,
    );
    process.exit(2);
  }
  return new Set(ids);
}

const ultimoAcesso = new Map<string, number>();

async function esperarVezDoHost(host: string): Promise<void> {
  const ultimo = ultimoAcesso.get(host);
  if (ultimo !== undefined) {
    const falta = ultimo + PAUSA_MESMO_HOST_MS - Date.now();
    if (falta > 0) await new Promise((r) => setTimeout(r, falta));
  }
  ultimoAcesso.set(host, Date.now());
}

async function conferir(url: string): Promise<Resultado> {
  const host = new URL(url).host;
  await esperarVezDoHost(host);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "Mozilla/5.0 (bora-na-tech kit audit)" },
    });
    await res.body?.cancel();
    const final = res.url || url;
    if (res.status === 403 || res.status === 429)
      return { classe: "bloqueado", detalhe: `HTTP ${res.status}` };
    if (res.status < 200 || res.status >= 300)
      return { classe: "morto", detalhe: `HTTP ${res.status}` };
    if (new URL(final).host !== host)
      return { classe: "redirecionado", detalhe: `destino ${final}` };
    return {
      classe: "ok",
      detalhe:
        final === url ? `HTTP ${res.status}` : `HTTP ${res.status}, ${final}`,
    };
  } catch (err) {
    const causa =
      err instanceof Error
        ? err.name === "TimeoutError"
          ? `timeout de ${TIMEOUT_MS / 1000} s`
          : err.cause instanceof Error
            ? err.cause.message
            : err.message
        : String(err);
    return { classe: "morto", detalhe: causa };
  }
}

const ids = lerIds();
const modulos = PROJETOS_V2.filter((d) => !ids || ids.has(d.id));

const linhas: Array<{
  modulo: string;
  titulo: string;
  url: string;
  resultado: Resultado;
}> = [];
// A mesma URL em dois modulos e conferida uma vez so.
const cache = new Map<string, Resultado>();
let itensSemUrl = 0;

for (const d of modulos) {
  for (const item of d.kit ?? []) {
    if (!item.url) {
      itensSemUrl += 1;
      continue;
    }
    let resultado = cache.get(item.url);
    if (!resultado) {
      resultado = await conferir(item.url);
      cache.set(item.url, resultado);
    }
    linhas.push({
      modulo: d.id,
      titulo: item.titulo,
      url: item.url,
      resultado,
    });
  }
}

console.log("modulo | item | url | classificacao | detalhe");
for (const l of linhas)
  console.log(
    `${l.modulo} | ${l.titulo} | ${l.url} | ${l.resultado.classe} | ${l.resultado.detalhe}`,
  );

const contagem = (c: Classe) =>
  linhas.filter((l) => l.resultado.classe === c).length;
console.log(
  `\n${modulos.length} modulos, ${linhas.length} links (${cache.size} distintos), ${itensSemUrl} itens sem url. ` +
    `ok ${contagem("ok")}, redirecionado ${contagem("redirecionado")}, bloqueado ${contagem("bloqueado")}, morto ${contagem("morto")}.`,
);

if (contagem("morto") > 0) process.exit(1);
