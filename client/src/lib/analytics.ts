import posthog from "posthog-js";

import { getPlanPriceCents } from "@shared/planPricing";
import { CONTAGEM_INDISPONIVEL } from "@shared/linkedin/readQualitative";
// `import type`: `pdfExtract` puxa `pdfjs-dist`, que nem carrega fora do
// navegador. O tipo e apagado na compilacao e este modulo segue leve.
import type { PdfErrorCode } from "./pdfExtract";

// Funil de conversao instrumentado no client (PostHog). Nomes de evento e
// propriedades centralizados aqui para nao divergirem entre CTAs e gates.
// A identidade da jornada (posthog.identify/reset) ja vive em AuthContext.

export function planPriceCents(planCode: string): number {
  return getPlanPriceCents(planCode) ?? 0;
}

// Clique para assinar, ANTES do redirect para a Stripe.
export function captureCheckoutStarted(props: {
  plan_code: string;
  price_cents: number;
  source_path: string;
  cta_id: string;
}): void {
  posthog.capture("checkout_started", props);
}

// Volta da Stripe sem completar (cancel_url).
export function captureCheckoutAbandoned(props: { plan_code: string }): void {
  posthog.capture("checkout_abandoned", props);
}

// Assinatura confirmada na pagina de sucesso.
export function captureSubscriptionCompleted(props: {
  plan_code: string;
  price_cents: number;
  provider: string;
}): void {
  posthog.capture("subscription_completed", props);
}

// Usuario free bate num gate/paywall de recurso Pro.
export function captureProGateHit(props: {
  feature: string;
  path: string;
}): void {
  posthog.capture("pro_gate_hit", props);
}

// Origem normalizada de um signup ou gate-hit. Valor de baixa cardinalidade
// derivado do path: o path cru (ex: /areas/dados/engenheiro-dados) explodiria o
// numero de valores distintos no PostHog e inviabilizaria o funil. "unknown"
// (sem dado de origem) e distinto de "other" (origem conhecida, fora de areas):
// no baseline sao coisas diferentes ("nao consegui atribuir" vs "veio de outro
// lugar").
export type ContentSource =
  | "area_detail"
  | "subarea_detail"
  | "other"
  | "unknown";

const SIGNUP_SOURCE_STORAGE_KEY = "bnt_signup_source";
// Janela de validade da origem persistida pro OAuth. Cobre o round-trip pro
// provedor com folga (segundos a poucos minutos) e expira logo depois pra um
// cadastro-OAuth abandonado nao contaminar um signup posterior nao relacionado.
const SIGNUP_SOURCE_TTL_MS = 15 * 60_000;

function safePathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

// Classifica um path (tipicamente o returnTo que o RequireAuth injeta) na origem
// de conteudo. Ausencia de path -> unknown; /areas/:slug -> area_detail;
// /areas/:parent/:subarea -> subarea_detail; qualquer outro path conhecido
// (incluindo a listagem /areas) -> other.
export function classifyContentSource(
  path: string | null | undefined,
): ContentSource {
  if (!path) return "unknown";
  const clean = (path.startsWith("http") ? safePathname(path) : path).split(
    /[?#]/,
  )[0];
  const seg = clean.split("/").filter(Boolean);
  if (seg[0] !== "areas") return "other";
  if (seg.length >= 3) return "subarea_detail";
  if (seg.length === 2) return "area_detail";
  return "other";
}

// Origem do signup a partir do returnTo na URL atual. Usado no fluxo de e-mail,
// que dispara ainda na pagina /cadastro?returnTo=..., com a URL intacta. Sem
// returnTo -> unknown.
export function signupSourceFromUrl(): ContentSource {
  if (typeof window === "undefined") return "unknown";
  const returnTo = new URLSearchParams(window.location.search).get("returnTo");
  return classifyContentSource(returnTo);
}

// OAuth perde o returnTo no round-trip pro provedor (o redirectTo volta pra
// /perfil). A origem e persistida no clique do botao social (ainda em /cadastro)
// e consumida no SIGNED_IN de criacao de conta. Guarda um timestamp pra expirar
// (SIGNUP_SOURCE_TTL_MS) e nao mis-atribuir um cadastro abandonado.
export function rememberSignupSource(source: ContentSource): void {
  try {
    localStorage.setItem(
      SIGNUP_SOURCE_STORAGE_KEY,
      JSON.stringify({ source, ts: Date.now() }),
    );
  } catch {
    // localStorage indisponivel: signup OAuth cai em source=unknown.
  }
}

function consumeSignupSource(): ContentSource {
  try {
    const raw = localStorage.getItem(SIGNUP_SOURCE_STORAGE_KEY);
    if (!raw) return "unknown";
    localStorage.removeItem(SIGNUP_SOURCE_STORAGE_KEY);
    const { source, ts } = JSON.parse(raw) as {
      source?: unknown;
      ts?: unknown;
    };
    if (typeof ts !== "number" || Date.now() - ts > SIGNUP_SOURCE_TTL_MS) {
      return "unknown";
    }
    return source === "area_detail" ||
      source === "subarea_detail" ||
      source === "other"
      ? source
      : "unknown";
  } catch {
    return "unknown";
  }
}

// Anon bate no muro de conteudo (area/subarea) e e redirecionado pro cadastro.
// Espelha captureProGateHit: mede quantos visitantes o gate empurra hoje.
export function captureContentGateHit(props: {
  feature: "area_detail" | "subarea_detail";
  path: string;
}): void {
  posthog.capture("content_gate_hit", props);
}

// Clique no CTA de suporte pelo WhatsApp (canal exclusivo Pro). source distingue
// de onde partiu: a tela de sucesso do checkout ou o card persistente no perfil.
export function captureWhatsappSupportClicked(props: {
  source: "checkout_success" | "perfil";
}): void {
  posthog.capture("whatsapp_support_clicked", props);
}

// --- Cadastro (user_signed_up) -------------------------------------------------
// user_signed_up e a base do funil de conversao do admin. Precisa disparar UMA
// vez por conta criada, em QUALQUER metodo (email/senha e OAuth). O bug de
// producao: o cadastro via Google (76% da base) nunca disparava, porque o retorno
// do OAuth so emite SIGNED_IN, sem um evento dedicado de "conta criada".

type SupabaseUserLike = {
  id: string;
  created_at?: string;
  last_sign_in_at?: string | null;
  app_metadata?: { provider?: string };
};

// Janela para tratar um sign-in como CRIACAO de conta. No signup o Supabase seta
// created_at e last_sign_in_at praticamente no mesmo instante (mesma transacao);
// em logins seguintes last_sign_in_at avanca horas/dias. Gap pequeno => primeiro
// sign-in (criacao). 60s cobre latencia de escrita/relogio com folga, e e muito
// menor que qualquer intervalo real ate um novo login.
const SIGNUP_WINDOW_MS = 60_000;

// Cadastro por email/senha. Ja disparava no signUp; agora carrega method e a
// origem (returnTo classificado), pra atribuir signups a paginas de conteudo.
export function captureUserSignedUpForEmail(
  source: ContentSource = "unknown",
): void {
  posthog.capture("user_signed_up", { method: "email", source });
}

// Cadastro via OAuth (Google). Chamado em TODO SIGNED_IN, mas so dispara quando a
// conta acabou de ser criada, nunca em login de usuario existente. Dois sinais
// combinados para NAO inflar:
//  1) created_at ~ last_sign_in_at (< janela): independe de storage e bloqueia
//     contas antigas mesmo apos limpar cookies (created_at fica no passado);
//  2) dedup por uid em localStorage: evita disparo duplo pelos multiplos eventos
//     de auth do callback OAuth ou por reload dentro da janela.
// O fluxo email/senha ja dispara no signUp; aqui so provedores OAuth (provider
// diferente de "email"), que e exatamente o buraco.
export function captureUserSignedUpForOAuth(user: SupabaseUserLike): void {
  const provider = user.app_metadata?.provider ?? "";
  if (!provider || provider === "email") return;

  const created = user.created_at ? Date.parse(user.created_at) : NaN;
  if (!Number.isFinite(created)) return;
  const lastSignIn = user.last_sign_in_at
    ? Date.parse(user.last_sign_in_at)
    : NaN;
  // Prefere last_sign_in_at (mesmo relogio do server que created_at, sem skew);
  // so cai em now() se ausente (raro). Conta antiga => gap enorme => nao dispara.
  const reference = Number.isFinite(lastSignIn) ? lastSignIn : Date.now();
  if (Math.abs(reference - created) > SIGNUP_WINDOW_MS) return;

  const dedupKey = `bnt_signup_captured:${user.id}`;
  try {
    if (localStorage.getItem(dedupKey)) return;
    localStorage.setItem(dedupKey, "1");
  } catch {
    // localStorage indisponivel: segue sem dedup persistente. O sinal de
    // created_at ja evita reincidencia fora da janela.
  }
  posthog.capture("user_signed_up", {
    method: provider,
    source: consumeSignupSource(),
  });
}

// ---------------------------------------------------------------------------
// Funil do Roadmap com IA.
//
// POR QUE EXISTE. O beco sem saida do chat de intake (teto de mensagens menor
// que o roteiro, sem botao de gerar depois de estourar) ficou 17 dias em
// producao sem ninguem ver, e so foi achado por DISTRIBUICAO ESTATISTICA: seis
// conversas terminando em exatamente 12 turnos e nenhuma em 11. Nao havia
// evento nenhum entre "abriu a pagina" e "roadmap gerado", entao a queda no meio
// era invisivel.
//
// Cardinalidade: `motivo` e sempre um CODIGO de um conjunto fechado, nunca texto
// livre, e nada aqui carrega fala do usuario.
// ---------------------------------------------------------------------------

// Primeiro turno da conversa (abertura ou rascunho restaurado).
export function captureRoadmapChatIniciado(props: {
  retomado_de_rascunho: boolean;
}): void {
  posthog.capture("roadmap_ia_chat_iniciado", props);
}

// Momento em que o intake fica completo o bastante para gerar. E o degrau que
// faltava: sem ele nao da para distinguir "desistiu no meio da conversa" de
// "conversou tudo e nao conseguiu gerar".
export function captureRoadmapCanGenerate(props: {
  turnos: number;
  via_formulario: boolean;
}): void {
  posthog.capture("roadmap_ia_can_generate", props);
}

// Conversa interrompida antes de dar para gerar. `motivo` e o kind do bloqueio.
export function captureRoadmapChatBloqueado(props: {
  motivo: string;
  can_generate: boolean;
  turnos: number;
}): void {
  posthog.capture("roadmap_ia_chat_bloqueado", props);
}

export function captureRoadmapGeracaoIniciada(props: {
  via_formulario: boolean;
}): void {
  posthog.capture("roadmap_ia_geracao_iniciada", props);
}

export function captureRoadmapGeracaoConcluida(props: {
  secoes_falhas: number;
  parcial: boolean;
}): void {
  posthog.capture("roadmap_ia_geracao_concluida", props);
}

// `motivo` classificado: codigo de bloqueio pre-SSE (rate_limited,
// generation_in_progress, pro_required...) ou "stream_error"/"conexao_caiu".
export function captureRoadmapGeracaoFalhou(props: { motivo: string }): void {
  posthog.capture("roadmap_ia_geracao_falhou", props);
}

// ---------------------------------------------------------------------------
// FUNIL DO ANALISADOR DE LINKEDIN (Fase 3, lote 4)
//
// O que faltava: o funil so tinha os dois degraus do MEIO. `linkedin_headline_review`
// dispara quando o texto CHEGA e `linkedin_analysis_submitted` quando a analise
// e PEDIDA, mas nada media a entrada (quantas pessoas nem conseguem extrair o
// PDF) nem a saida (quantas recebem resultado). Sem as pontas, "quantos usuarios
// batem em PDF escaneado ou com senha" nao era uma pergunta respondivel, era um
// palpite.
//
// PRIVACIDADE, e ela nao e negociavel aqui: nenhuma property carrega texto do
// usuario, nome de arquivo, headline, trecho, prompt ou resposta do modelo. So
// entram enums de uniao FECHADA, booleans e contagens. Ha teste permanente
// varrendo todas as chamadas com marcadores plantados.
//
// CARDINALIDADE: os dois desfechos sao conjuntos fechados e pequenos. Em
// especial, a mensagem de erro do servidor NUNCA vira property: ela e texto
// livre (a rota devolve frases inteiras), e mandar isso ao PostHog explodiria os
// valores distintos alem de vazar conteudo que ninguem auditou.
// ---------------------------------------------------------------------------

export const EVENTO_EXTRACAO = "linkedin_pdf_extracao";
export const EVENTO_DESFECHO = "linkedin_analysis_result";

/**
 * Desfecho da extracao do PDF: os estados de falha da entrada MAIS o sucesso.
 *
 * `PdfErrorCode` e IMPORTADO de `./pdfExtract`, e nao redigitado: a uniao de la
 * e a fonte unica, e um estado novo de entrada precisa aparecer aqui por
 * construcao. O teste de totalidade compara os dois conjuntos e quebra se
 * divergirem.
 *
 * `import type` de proposito: `pdfExtract` importa `pdfjs-dist` no topo, que
 * nem carrega fora do navegador (falta `DOMMatrix`). O tipo e apagado na
 * compilacao, entao este modulo continua leve e testavel sem dublar a lib.
 */
export type DesfechoExtracao =
  | PdfErrorCode
  | "ok"
  /**
   * O PDF abriu e trouxe texto, mas o texto NAO e um perfil do LinkedIn (o
   * `parseLinkedinText(...).usable` reprovou). Estado proprio, e nao reuso de
   * `too_little_text`: "nao ha texto" e "ha texto de outra coisa" pedem
   * mensagens e acoes diferentes, e somar os dois esconderia justamente quantas
   * pessoas estao enviando o arquivo errado. E o mesmo veredito que a rota da
   * em `unreadable_text`, do lado do cliente.
   */
  | "perfil_nao_reconhecido";

/**
 * Os dois desfechos de extracao que NAO vem de `PdfErrorCode`. Existe como
 * constante para o teste de totalidade poder afirmar o conjunto inteiro
 * (`PDF_ERROR_CODES` mais estes dois) sem nenhuma lista escrita a mao no teste.
 */
export const DESFECHOS_EXTRACAO_EXTRAS = [
  "ok",
  "perfil_nao_reconhecido",
] as const;

/**
 * Chegada de PDF, em TODA saida: uma captura por arquivo escolhido, com o
 * desfecho nomeado. `ok` inclusive, porque taxa de falha sem o denominador nao
 * e taxa, e um numero absoluto de falhas nao diz se o fluxo esta ruim.
 */
export function captureLinkedinExtracao(props: {
  desfecho: DesfechoExtracao;
}): void {
  posthog.capture(EVENTO_EXTRACAO, props);
}

/**
 * DESFECHOS DA ANALISE, conjunto fechado.
 *
 * Os codigos em MAIUSCULA sao os que `client/src/lib/linkedinClient.ts` lanca,
 * normalizados para minuscula aqui; `sucesso` e `warm_empty` sao os dois
 * desfechos bons, e `erro_generico` e o balde EXPLICITO do que nao foi
 * reconhecido.
 *
 * Por que a granularidade para no que o CLIENTE distingue: a rota tem mais
 * codigos do que isto (`unreadable_text` e `unreadable_profile` sao dois, e
 * `analysis_truncated` e `upstream_error` tambem), mas `linkedinClient`
 * classifica por STATUS HTTP antes de ler o corpo, entao os pares colapsam
 * antes de chegar aqui. Instrumentar uma distincao que o cliente nao possui
 * produziria uma property sempre com o mesmo valor, o que e pior que nao ter:
 * pareceria medicao. O caminho para separa-los passa por `linkedinClient`, e
 * esta registrado no relatorio do lote.
 */
export const LINKEDIN_DESFECHOS_ANALISE = [
  "sucesso",
  "warm_empty",
  "unreadable",
  "invalid_request",
  "rate_limited",
  "linkedin_busy",
  "pro_required",
  "login_required",
  "timeout",
  "network",
  "erro_generico",
] as const;

export type DesfechoAnalise = (typeof LINKEDIN_DESFECHOS_ANALISE)[number];

/**
 * Codigos que `linkedinClient` lanca, mapeados para o desfecho instrumentado.
 *
 * `RATE_LIMITED` fica de fora deste mapa porque ele chega com PREFIXO
 * (`RATE_LIMITED: <mensagem do servidor>`) e e tratado a parte, justamente para
 * a mensagem nao vazar junto.
 */
const DESFECHO_POR_CODIGO: Record<string, DesfechoAnalise> = {
  UNREADABLE: "unreadable",
  INVALID_REQUEST: "invalid_request",
  LINKEDIN_BUSY: "linkedin_busy",
  PRO_REQUIRED: "pro_required",
  LOGIN_REQUIRED: "login_required",
  TIMEOUT: "timeout",
  NETWORK: "network",
  ANALYSIS_FAILED: "erro_generico",
};

/**
 * FAIL-CLOSED, e aqui isso e uma decisao de PRIVACIDADE, nao so de robustez.
 *
 * A ultima linha de `linkedinClient` lanca `body.error?.message`, ou seja a
 * frase que a rota escreveu. Qualquer coisa fora do conjunto conhecido vira
 * `erro_generico` e a mensagem e DESCARTADA. Um `desfecho: mensagem` seria a
 * forma mais facil de vazar texto de servidor para a telemetria, e cardinalidade
 * infinita de brinde.
 */
export function classificarDesfechoDeErro(mensagem: string): DesfechoAnalise {
  if (mensagem.startsWith("RATE_LIMITED")) return "rate_limited";
  return DESFECHO_POR_CODIGO[mensagem] ?? "erro_generico";
}

/**
 * Fim da analise, em TODA saida.
 *
 * `nota_incompleta` e `violacoes_total` so existem quando houve resultado; nos
 * ramos de erro vao como `null` e como o estado nomeado de indisponivel, nunca
 * como `false` e `0`. Zero e uma medicao ("rodou e nao violou nada"), e usa-lo
 * para "nao rodou" e o colapso que o resto desta base ja pagou caro para
 * evitar.
 */
export function captureLinkedinDesfecho(props: {
  desfecho: DesfechoAnalise;
  nota_incompleta: boolean | null;
  violacoes_total: number | typeof CONTAGEM_INDISPONIVEL;
}): void {
  posthog.capture(EVENTO_DESFECHO, props);
}
