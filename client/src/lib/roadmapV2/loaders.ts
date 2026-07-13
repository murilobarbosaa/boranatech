import type { RoadmapV2 } from "@/lib/roadmapV2/types";

// Carregamento sob demanda do conteudo completo de cada trilha v2, um chunk
// por trilha. Cada entrada importa DIRETO o arquivo da trilha, nunca o index
// agregado (shared/roadmapV2/content/index.ts): import do agregado faria o
// Vite fundir as 25 trilhas num chunk so.
//
// Trilha nova exige tres registros: o arquivo da trilha aqui, o import no
// index agregado e regenerar o meta (pnpm gen:roadmap-meta). O pnpm check
// valida a sincronia deste mapa com o agregado (checagem textual das chaves
// em scripts/generateRoadmapMeta.mts). A Fase 3c vai atualizar o guia
// build-next-trilha com esse passo.
export const roadmapLoaders: Record<string, () => Promise<RoadmapV2>> = {
  frontend: () =>
    import("@shared/roadmapV2/content/frontend").then((m) => m.frontend),
  backend: () =>
    import("@shared/roadmapV2/content/backend").then((m) => m.backend),
  fullstack: () =>
    import("@shared/roadmapV2/content/fullstack").then((m) => m.fullstack),
  dados: () => import("@shared/roadmapV2/content/dados").then((m) => m.dados),
  uxui: () => import("@shared/roadmapV2/content/uxui").then((m) => m.uxui),
  ia: () => import("@shared/roadmapV2/content/ia").then((m) => m.ia),
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

// Dispara o download do chunk da trilha sem esperar o resultado (hover/focus
// na listagem). import() repetido e cacheado pelo runtime, entao chamar de
// novo e barato; erro aqui e ignorado porque a pagina de detalhe tem o
// proprio estado de erro com retry.
export function prefetchRoadmap(slug: string): void {
  const loader = roadmapLoaders[slug];
  if (!loader) return;
  void loader().catch(() => {});
}
