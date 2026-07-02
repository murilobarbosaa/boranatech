// Fetch com teto de tempo para chamadas de saida (auditoria
// scratch/audit-escalabilidade.txt, secao 3). Dois modos, exclusivos:
//
// timeoutMs: aborta a chamada INTEIRA (connect + headers + corpo). Para
// respostas nao-streaming. O timer NAO e limpo quando os headers chegam:
// segue armado (unref) pra cobrir a leitura do corpo (res.json()/text());
// depois do corpo consumido, o abort tardio e no-op.
//
// headerTimeoutMs: aborta somente se os HEADERS nao chegarem no prazo. Assim
// que a resposta chega o timer e limpo e o corpo (SSE) segue livre, por
// design. O chamador pode passar init.signal proprio pra abortar o stream
// por conta dele: os dois sinais sao encadeados via AbortSignal.any.

export class UpstreamTimeoutError extends Error {
  readonly code = "upstream_timeout";
  readonly service: string;

  constructor(service: string, ms: number) {
    super(`upstream_timeout: ${service} nao respondeu em ${ms}ms`);
    this.name = "UpstreamTimeoutError";
    this.service = service;
  }
}

export function isUpstreamTimeoutError(
  err: unknown,
): err is UpstreamTimeoutError {
  return err instanceof UpstreamTimeoutError;
}

export interface FetchWithTimeoutOpts {
  // Nome do servico (asaas, openai...) pra log e mensagem de erro.
  service: string;
  timeoutMs?: number;
  headerTimeoutMs?: number;
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  opts: FetchWithTimeoutOpts,
): Promise<globalThis.Response> {
  const { service, timeoutMs, headerTimeoutMs } = opts;
  const ms = timeoutMs ?? headerTimeoutMs;
  if (!ms) {
    return fetch(url, init);
  }

  const controller = new AbortController();
  const signal = init.signal
    ? AbortSignal.any([init.signal as AbortSignal, controller.signal])
    : controller.signal;

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ms);
  timer.unref();

  let response: globalThis.Response;
  try {
    response = await fetch(url, { ...init, signal });
  } catch (err) {
    clearTimeout(timer);
    if (timedOut) {
      throw new UpstreamTimeoutError(service, ms);
    }
    throw err;
  }

  if (timeoutMs === undefined) {
    // Modo streaming: headers chegaram dentro do prazo, corpo sem teto.
    clearTimeout(timer);
  }

  return response;
}
