import { fetchWithTimeout } from "../http";

// Cotacao PTAX de venda do dolar (API Olinda do Banco Central, publica, sem
// chave e sem dependencia nova: fetch nativo do Node). Fim de semana e
// feriado nao tem cotacao: tenta a data de hoje e recua ate 7 dias corridos,
// uma tentativa por dia, ate achar. Cache em memoria do processo com TTL de
// 12h; falha NAO derruba um cache bom dentro do TTL (o early return serve
// direto do cache); sem cache valido e com falha total, null (o consumidor
// omite a conversao em silencio, indisponibilidade de cambio nao e erro).

const PTAX_BASE_URL =
  "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)";
const PTAX_TIMEOUT_MS = 5_000;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_LOOKBACK_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface UsdBrlRate {
  usdBrl: number;
  // Data da cotacao usada, AAAA-MM-DD (a UI formata para exibicao).
  quoteDate: string;
}

interface RateCache {
  rate: number;
  quoteDate: string;
  fetchedAt: number;
}

let cache: RateCache | null = null;

// So para os testes: zera o cache do modulo entre casos.
export function resetPtaxCacheForTests(): void {
  cache = null;
}

// A API Olinda espera dataCotacao no formato MM-DD-AAAA.
function ptaxDateParam(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}-${day}-${date.getFullYear()}`;
}

function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// Uma tentativa para uma data especifica. Dia sem cotacao (fim de semana,
// feriado) volta com value vazio; qualquer falha de rede/parse vira null.
async function fetchRateForDate(date: Date): Promise<number | null> {
  const url = `${PTAX_BASE_URL}?@dataCotacao='${ptaxDateParam(date)}'&$format=json`;
  try {
    const response = await fetchWithTimeout(
      url,
      {},
      { service: "ptax", timeoutMs: PTAX_TIMEOUT_MS },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      value?: Array<{ cotacaoVenda?: unknown }>;
    };
    const venda = payload.value?.[0]?.cotacaoVenda;
    return typeof venda === "number" && Number.isFinite(venda) && venda > 0
      ? venda
      : null;
  } catch {
    return null;
  }
}

export async function fetchUsdBrlRate(): Promise<UsdBrlRate | null> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return { usdBrl: cache.rate, quoteDate: cache.quoteDate };
  }
  for (let daysBack = 0; daysBack <= MAX_LOOKBACK_DAYS; daysBack += 1) {
    const date = new Date(now - daysBack * DAY_MS);
    const rate = await fetchRateForDate(date);
    if (rate !== null) {
      cache = { rate, quoteDate: isoDate(date), fetchedAt: now };
      return { usdBrl: rate, quoteDate: cache.quoteDate };
    }
  }
  // Falha total sem cache dentro do TTL: nada valido para devolver agora (um
  // cache expirado fica como esta e nao e servido).
  return null;
}
