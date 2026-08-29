import { importWithRetry } from "@/lib/lazyWithRetry";
import type { RoadmapV2 } from "@/lib/roadmapV2/types";

// Carregamento sob demanda do conteudo completo de cada trilha v2, um chunk
// por trilha. Cada entrada importa DIRETO o arquivo da trilha, nunca o index
// agregado (shared/roadmapV2/content/index.ts): import do agregado faria o
// Vite fundir todas as trilhas num chunk so.
//
// Trilha nova exige tres registros: o arquivo da trilha aqui, o import no
// index agregado e regenerar o meta (pnpm gen:roadmap-meta). O pnpm check
// valida a sincronia deste mapa com o agregado (checagem textual das chaves
// em scripts/generateRoadmapMeta.mts). A Fase 3c vai atualizar o guia
// build-next-trilha com esse passo.
//
// MAPA CRU. Retry e telemetria NAO sao escritos aqui dentro: entram de uma vez
// so no envelopamento logo abaixo. Repetir `importWithRetry` em cada uma das
// entradas seria guarda no call site, e a proxima trilha nasceria sem ela no
// primeiro dia em que alguem esquecesse. O formato de cada linha (`slug: () =>`)
// e o que o parser textual de `scripts/generateRoadmapMeta.mts` le, entao ele
// precisa continuar exatamente assim.
//
// SEM NUMERAL de proposito: a contagem de trilhas muda, e comentario que afirma
// numero fica errado no primeiro registro novo sem nada acusar. Quem quer o
// total confere no agregado, e o `pnpm check` ja valida a sincronia nos dois
// sentidos. Este comentario ja carregou "25" quando as entradas eram 30.
const loadersCrus: Record<string, () => Promise<RoadmapV2>> = {
  frontend: () =>
    import("@shared/roadmapV2/content/frontend").then((m) => m.frontend),
  backend: () =>
    import("@shared/roadmapV2/content/backend").then((m) => m.backend),
  fullstack: () =>
    import("@shared/roadmapV2/content/fullstack").then((m) => m.fullstack),
  dados: () => import("@shared/roadmapV2/content/dados").then((m) => m.dados),
  uxui: () => import("@shared/roadmapV2/content/uxui").then((m) => m.uxui),
  "inteligencia-artificial": () =>
    import("@shared/roadmapV2/content/inteligencia-artificial").then(
      (m) => m.inteligenciaArtificial,
    ),
  produto: () =>
    import("@shared/roadmapV2/content/produto").then((m) => m.produto),
  ciberseguranca: () =>
    import("@shared/roadmapV2/content/ciberseguranca").then(
      (m) => m.ciberseguranca,
    ),
  cloud: () => import("@shared/roadmapV2/content/cloud").then((m) => m.cloud),
  gestao: () =>
    import("@shared/roadmapV2/content/gestao").then((m) => m.gestao),
  qa: () => import("@shared/roadmapV2/content/qa").then((m) => m.qa),
  mobile: () =>
    import("@shared/roadmapV2/content/mobile").then((m) => m.mobile),
  devops: () =>
    import("@shared/roadmapV2/content/devops").then((m) => m.devops),
  gamedev: () =>
    import("@shared/roadmapV2/content/gamedev").then((m) => m.gamedev),
  "analise-dados": () =>
    import("@shared/roadmapV2/content/analise-dados").then(
      (m) => m.analiseDados,
    ),
  "engenharia-dados": () =>
    import("@shared/roadmapV2/content/engenharia-dados").then(
      (m) => m.engenhariaDados,
    ),
  "banco-de-dados": () =>
    import("@shared/roadmapV2/content/banco-de-dados").then(
      (m) => m.bancoDeDados,
    ),
  sre: () => import("@shared/roadmapV2/content/sre").then((m) => m.sre),
  infraestrutura: () =>
    import("@shared/roadmapV2/content/infraestrutura").then(
      (m) => m.infraestrutura,
    ),
  "analise-sistemas": () =>
    import("@shared/roadmapV2/content/analise-sistemas").then(
      (m) => m.analiseSistemas,
    ),
  blockchain: () =>
    import("@shared/roadmapV2/content/blockchain").then((m) => m.blockchain),
  iot: () => import("@shared/roadmapV2/content/iot").then((m) => m.iot),
  mainframe: () =>
    import("@shared/roadmapV2/content/mainframe").then((m) => m.mainframe),
  "comecar-do-zero": () =>
    import("@shared/roadmapV2/content/comecar-do-zero").then(
      (m) => m.comecarDoZero,
    ),
  linkedin: () =>
    import("@shared/roadmapV2/content/linkedin").then((m) => m.linkedinTrail),
  "engenharia-software": () =>
    import("@shared/roadmapV2/content/engenharia-software").then(
      (m) => m.engenhariaSoftware,
    ),
  mlops: () => import("@shared/roadmapV2/content/mlops").then((m) => m.mlops),
  suporte: () =>
    import("@shared/roadmapV2/content/suporte").then((m) => m.suporte),
  "tech-writer": () =>
    import("@shared/roadmapV2/content/tech-writer").then((m) => m.techWriter),
  erp: () => import("@shared/roadmapV2/content/erp").then((m) => m.erp),
};

/**
 * O mapa que o resto do app consome, com retry e telemetria por construcao.
 *
 * API PUBLICA INALTERADA: mesmo nome, mesmo tipo, mesma forma de chamar. Quem
 * usa (`RoadmapsV2.tsx`) nao muda uma linha, e continua com o proprio estado de
 * erro e o retry manual, porque `importWithRetry` reporta e RELANCA em vez de
 * recarregar a pagina.
 *
 * O `chunk` que vai para o Sentry e o SLUG da trilha, nao o nome do arquivo:
 * arquivo tem hash que muda a cada deploy e criaria uma tag nova por build,
 * enquanto o slug responde a pergunta util, que e se a falha e sempre na mesma
 * trilha (conteudo quebrado) ou em qualquer uma (skew de deploy).
 */
export const roadmapLoaders: Record<string, () => Promise<RoadmapV2>> =
  Object.fromEntries(
    Object.entries(loadersCrus).map(([slug, carregar]) => [
      slug,
      () => importWithRetry(carregar, slug),
    ]),
  );

/**
 * Janela de silencio do PREFETCH depois de uma falha, por slug.
 *
 * O comentario antigo daqui dizia que "import() repetido e cacheado pelo
 * runtime, entao chamar de novo e barato". Isso vale para o import RESOLVIDO, e
 * so para ele: o modulo entra no registro e a segunda chamada devolve a mesma
 * promessa. Import REJEITADO nao e memoizado, entao cada hover no mesmo card
 * refazia a tentativa inteira, com o retry de `importWithRetry` por dentro, e
 * emitia mais um `chunk_import_failed`. Com `onMouseEnter` e `onFocus` nos dois
 * sitios da listagem, passar o mouse por um card quebrado inflava a faceta por
 * slug no Sentry e fazia uma trilha parecer muito pior que a vizinha por conta
 * do movimento do mouse, nao do defeito.
 *
 * 30 segundos: a rajada que se quer colapsar acontece em SEGUNDOS (ida e volta
 * do ponteiro sobre o mesmo card, tab entrando e saindo do foco), e meio minuto
 * cobre isso com folga. Nao mais que isso porque quem volta depois de um tempo
 * merece uma tentativa especulativa nova, e o custo de errar para menos e
 * pequeno: o CLIQUE nao passa por esta janela.
 */
const PREFETCH_SILENCIO_APOS_FALHA_MS = 30_000;

/** Prefetches em voo, para nao disparar dois downloads do mesmo chunk. */
const prefetchEmVoo = new Set<string>();

/** Instante da ultima falha de prefetch por slug. Sucesso nao entra aqui. */
const prefetchFalhouEm = new Map<string, number>();

/**
 * Dispara o download do chunk da trilha sem esperar o resultado (hover/focus na
 * listagem). Erro e ignorado porque a pagina de detalhe tem o proprio estado de
 * erro com retry.
 *
 * O DEDUP MORA AQUI, e nao em `roadmapLoaders`, de proposito. `RoadmapsV2.tsx`
 * chama `roadmapLoaders[slug]()` direto no CLIQUE, que e a carga de verdade: ali
 * a pessoa pediu, e uma segunda tentativa imediata e exatamente o comportamento
 * certo. Uma janela dentro do mapa seria herdada pelo clique e transformaria
 * "tentar de novo" em "esperar meio minuto sem explicacao". Especulacao se
 * segura; pedido explicito, nao.
 */
export function prefetchRoadmap(slug: string): void {
  const loader = roadmapLoaders[slug];
  if (!loader) return;
  if (prefetchEmVoo.has(slug)) return;

  const ultimaFalha = prefetchFalhouEm.get(slug);
  if (
    ultimaFalha !== undefined &&
    Date.now() - ultimaFalha < PREFETCH_SILENCIO_APOS_FALHA_MS
  ) {
    return;
  }

  prefetchEmVoo.add(slug);
  void loader().then(
    () => {
      prefetchEmVoo.delete(slug);
      // Resolveu: o runtime memoiza daqui para a frente, entao nao ha o que
      // silenciar. Limpa a marca para nao carregar falha velha.
      prefetchFalhouEm.delete(slug);
    },
    () => {
      prefetchEmVoo.delete(slug);
      prefetchFalhouEm.set(slug, Date.now());
    },
  );
}
