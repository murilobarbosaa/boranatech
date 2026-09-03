import { areasTI } from "@/lib/data";

// Resolvers de rotulo de area e subarea dos projetos, extraidos de
// client/src/pages/Projetos.tsx. Vivem aqui porque o teste que trava o
// invariante do catalogo (projectAreaGroup.test.ts) precisa deles sem montar
// a pagina, e porque a normalizacao do ?area= da URL passou a ser regra de
// dado, nao de render.
//
// Regra do CLAUDE.md: lookup por valor que vem de fora passa por resolver com
// fallback DENTRO da funcao, nunca acesso direto ao mapa no call site. Aqui o
// valor vem do catalogo (que e codigo, nao servidor), mas o fallback protege a
// pagina contra um slug novo que ninguem cadastrou em areasTI.

// Rotulos de area-mae que nao existem em areasTI. `carreira` e a unica: e um
// agrupamento editorial de projetos de carreira, nao uma area de TI.
//
// A chave `fullstack: "Full Stack"` que morava aqui era CODIGO MORTO: areasTI
// ja tem o slug `fullstack` com o nome "Full-stack", e o areasTI.find abaixo
// resolve antes de chegar no mapa. Removida.
const SPECIAL_LABELS: Record<string, string> = {
  carreira: "Carreira",
};

// Rotulo da area-mae de um projeto. Fallback "Outras areas" para slug que
// nao esteja em areasTI nem nos especiais; o teste garante que nao acontece.
export function labelForProjectArea(
  areaSlug: string | null | undefined,
): string {
  if (!areaSlug) return "Geral";
  return (
    areasTI.find((a) => a.slug === areaSlug)?.nome ??
    SPECIAL_LABELS[areaSlug] ??
    "Outras áreas"
  );
}

// Rotulo da subarea, ou null quando o projeto nao tem subarea ou ela nao
// existe sob a area-mae. Exigir que seja filha do areaSlug e deliberado: uma
// subarea resolvida a partir de outra area seria um rotulo certo sobre o
// vinculo errado.
export function labelForProjectSubarea(
  areaSlug: string | null | undefined,
  subareaSlug: string | undefined,
): string | null {
  if (!areaSlug || !subareaSlug) return null;
  const area = areasTI.find((a) => a.slug === areaSlug);
  return area?.subareas?.find((s) => s.slug === subareaSlug)?.nome ?? null;
}

// Normaliza o valor de ?area= da URL: slug de area-mae volta igual; slug de
// subarea vira a area-mae; qualquer outra coisa volta igual (a pagina ja
// trata o caso de filtro sem resultado).
export function normalizeProjectAreaParam(value: string): string {
  if (areasTI.some((a) => a.slug === value)) return value;
  const pai = areasTI.find((a) =>
    (a.subareas ?? []).some((s) => s.slug === value),
  );
  return pai?.slug ?? value;
}
