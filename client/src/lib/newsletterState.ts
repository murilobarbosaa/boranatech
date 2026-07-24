import { apiUrl } from "@/lib/api";

// Estado de captura da newsletter, cacheado por CARGA de app. O GET
// /api/newsletter/state reflete só flags de ambiente do servidor (captura
// ligada + secret + base URL); ignora o request, NÃO depende do usuário logado
// e só muda em redeploy. O Footer (que consome isto) remonta a cada navegação
// porque o Layout vive dentro de cada página, então sem cache cada navegação
// dispararia um request novo. Aqui a chamada acontece uma vez e os mounts
// seguintes recebem o valor guardado. Por não depender do usuário, não há
// invalidação em login/logout; e nenhum fluxo do app altera este estado (o
// signup não liga/desliga a captura), então não há invalidação por mutação.

export type NewsletterCaptureStatus = "on" | "off";

let cached: NewsletterCaptureStatus | null = null;
let inFlight: Promise<NewsletterCaptureStatus> | null = null;

async function fetchState(): Promise<NewsletterCaptureStatus> {
  const res = await fetch(apiUrl("/api/newsletter/state"));
  if (!res.ok) throw new Error("newsletter state indisponível");
  const data = (await res.json()) as { status?: string };
  // Fail-closed no front: só "on" explícito liga o form (igual ao Footer antes).
  return data.status === "on" ? "on" : "off";
}

// Resolve o estado: valor cacheado quando já resolvido; dedupa a chamada em voo
// (dois mounts simultâneos = 1 request); em erro NÃO cacheia (limpa o inFlight)
// pra permitir retry no próximo mount, em vez de fixar "off" pra sempre.
export function getNewsletterState(): Promise<NewsletterCaptureStatus> {
  if (cached !== null) return Promise.resolve(cached);
  if (inFlight) return inFlight;
  inFlight = fetchState()
    .then((status) => {
      cached = status;
      inFlight = null;
      return status;
    })
    .catch((err) => {
      inFlight = null;
      throw err;
    });
  return inFlight;
}

// Leitura síncrona do cache (null se ainda não resolvido). Deixa o Footer semear
// o estado inicial sem flash de "loading" nos mounts após a primeira carga.
export function peekNewsletterState(): NewsletterCaptureStatus | null {
  return cached;
}

// Limpa o cache. Usado nos testes; e disponível caso algum fluxo futuro passe a
// alterar o estado (hoje nenhum altera).
export function resetNewsletterStateCache(): void {
  cached = null;
  inFlight = null;
}
