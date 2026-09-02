/**
 * Paleta do CHIP DE AREA (`tag_class`), e so dela.
 *
 * Substitui as 17 classes `.tag-*` que viviam em `@layer components` do
 * `index.css` com hex cravado (`background-color` solido + `color` quase
 * branco). Hex cravado nao passa por variavel de tema, entao aquelas classes
 * eram identicas nos dois modos, e isso dava dois defeitos ao mesmo tempo:
 *
 *   1. no CLARO, 7 das 17 reprovavam 4,5:1 de texto contra o proprio chip
 *      (pior caso `tag-qa`, 2,84:1). Bug anterior ao modo escuro;
 *   2. no ESCURO, o chip solido quase sumia contra a pagina de /subareas
 *      (`tag-fullstack` 1,80:1, `tag-gestao` 2,05:1, `tag-ia` 2,28:1).
 *
 * O par `bg-<familia>-200` com `text-<familia>-900` resolve os dois: ele
 * atravessa os dois temas sozinho, sem nenhuma variante `dark:`, pelo "contexto
 * pastel" do `index.css`, que no `.dark` casa o elemento PELA CLASSE DE FUNDO,
 * sobe o fundo um degrau e devolve a tinta ao tom original. Medido: 6,94:1 a
 * 8,02:1 no claro e 5,32:1 a 6,57:1 no escuro, nas 15 entradas.
 *
 * E o MESMO par de `areaGridPalette.ts` (a grade de /areas), de proposito: os
 * dois chips sao a mesma peca de interface em telas diferentes, e o contexto
 * pastel so casa NOME LITERAL de classe, entao levar o par para o call site e a
 * unica forma de o chip ficar igual ao badge de /areas no escuro. Uma versao
 * que mantivesse as `.tag-*` no CSS lendo `var(--color-X-200)` NAO casaria o
 * escape, e o chip sairia escuro com tinta clara: resolveria o contraste e
 * criaria uma segunda aparencia para o mesmo tipo de chip.
 *
 * Nao ha borda porque o chip `.tag-*` nunca teve uma. E a unica diferenca de
 * forma em relacao ao `AreaGridPalette`, que precisa de `border` para o quadrado
 * do icone.
 *
 * AS STRINGS SAO LITERAIS DE PROPOSITO. O Tailwind varre a fonte procurando nome
 * de classe; `bg-${familia}-200` montado em runtime nao e emitido no CSS e o
 * chip sairia sem fundo nenhum, sem erro em lugar nenhum.
 */

export type TagPalette = {
  /** Fundo do chip. */
  bg: string;
  /** Tinta do chip. */
  text: string;
};

type TagFamily =
  | "violet"
  | "green"
  | "amber"
  | "pink"
  | "orange"
  | "emerald"
  | "sky"
  | "purple"
  | "fuchsia"
  | "indigo"
  | "lime"
  | "cyan"
  | "blue"
  | "rose"
  | "yellow";

const FAMILY_CLASSES: Record<TagFamily, TagPalette> = {
  violet: { bg: "bg-violet-200", text: "text-violet-900" },
  green: { bg: "bg-green-200", text: "text-green-900" },
  amber: { bg: "bg-amber-200", text: "text-amber-900" },
  pink: { bg: "bg-pink-200", text: "text-pink-900" },
  orange: { bg: "bg-orange-200", text: "text-orange-900" },
  emerald: { bg: "bg-emerald-200", text: "text-emerald-900" },
  sky: { bg: "bg-sky-200", text: "text-sky-900" },
  purple: { bg: "bg-purple-200", text: "text-purple-900" },
  fuchsia: { bg: "bg-fuchsia-200", text: "text-fuchsia-900" },
  indigo: { bg: "bg-indigo-200", text: "text-indigo-900" },
  lime: { bg: "bg-lime-200", text: "text-lime-900" },
  cyan: { bg: "bg-cyan-200", text: "text-cyan-900" },
  blue: { bg: "bg-blue-200", text: "text-blue-900" },
  rose: { bg: "bg-rose-200", text: "text-rose-900" },
  yellow: { bg: "bg-yellow-200", text: "text-yellow-900" },
};

/**
 * Familia por valor de `tag_class`, que e a chave persistida em `areas`.
 *
 * SAO 15, E SAO EXATAMENTE OS 15 QUE EXISTEM NO BANCO. Conferido nos dois
 * sentidos contra producao: das 87 tabelas expostas pelo PostgREST so `areas`
 * tem a coluna `tag_class`, e as 26 linhas dela usam 15 valores distintos, sem
 * nulo. O mesmo conjunto aparece em `client/src/lib/data.ts`, que e a fonte
 * canonica e o que alimenta `server/scripts/seed-content.ts`.
 *
 * DUAS CLASSES FORAM REMOVIDAS NA MIGRACAO, e o motivo fica aqui para ninguem
 * recriar: `.tag-engenharia-dados` e `.tag-sre` existiam no CSS e NENHUMA area
 * as referenciava. Nao eram sobra de area removida (as areas `engenharia-dados`
 * e `sre` existem), eram classes escritas POR SLUG, especulativamente, enquanto
 * o dado dessas areas aponta para `tag-dados` e `tag-devops`. Ficaram 17 regras
 * para 15 valores por dois anos sem ninguem notar. Mapa de 15 que bate com o
 * banco se confere de relance; mapa de 17 com 2 mortas ensina a proxima pessoa a
 * inventar a decima oitava.
 *
 * A FAMILIA VEM DA COR QUE A CLASSE JA TINHA, nao de gosto novo. Cada hex antigo
 * era uma cor do Tailwind v3 (o texto batia exato: `#fffbeb` e `amber-50`,
 * `#eef2ff` e `indigo-50`, e assim por diante), entao a familia de origem foi
 * lida da propria fonte. Nove entradas mantiveram a familia; seis precisaram sair
 * porque quatro familias tinham mais de uma tag em cima:
 *
 *   violet   frontend (600) | ia (700) | fullstack (800)
 *   green    backend (700, 4 areas) | seguranca (800, 2 areas)
 *   amber    dados (600, 4 areas) | automacao-industrial (600, 1 area)
 *   fuchsia  produto (600) | gamedev (700)
 *
 * Criterio de desempate, nesta ordem: fica com a familia quem tem o tom -600
 * (o tom de identidade da familia); no empate, quem e usado por mais areas.
 * Quem sai vai para a familia LIVRE mais proxima em matiz. Por isso `ia` virou
 * purple (vizinho de violet), `fullstack` virou blue (era o violet mais
 * profundo dos tres), `seguranca` virou emerald e `gamedev` virou rose.
 *
 * `qa` e a unica excecao a esse criterio: nao tinha colisao (era yellow-600
 * sozinho) e mesmo assim saiu de yellow, por decisao de produto. Amarelo e ambar
 * sao os tons de AVISO nesta interface (`--bnt-alert-amber`, as caixas do
 * AttentionPanel e do HealthBand), e um chip de "QA / Testes de Software" em
 * amarelo pastel le como alerta em vez de rotulo. Foi para lime, a familia livre
 * mais proxima, e o yellow que ela liberou foi para `automacao-industrial`, que
 * precisava sair de amber de qualquer forma.
 *
 * `red` e `teal` ficaram LIVRES. `red` de proposito: e o tom de erro da
 * interface e nao deve virar rotulo de area.
 */
const TAG_FAMILY: Record<string, TagFamily> = {
  "tag-frontend": "violet",
  "tag-backend": "green",
  "tag-dados": "amber",
  "tag-uxui": "pink",
  "tag-mobile": "orange",
  "tag-seguranca": "emerald",
  "tag-cloud": "sky",
  "tag-ia": "purple",
  "tag-produto": "fuchsia",
  "tag-gestao": "indigo",
  "tag-qa": "lime",
  "tag-devops": "cyan",
  "tag-fullstack": "blue",
  "tag-gamedev": "rose",
  "tag-automacao-industrial": "yellow",
};

/**
 * Neutro para `tag_class` que o mapa nao conhece. Nao e caso hipotetico:
 * `tag_class` esta na allowlist de escrita de `areas` em
 * `server/routes/admin.ts`, entao a API aceita qualquer string, e uma area nova
 * cadastrada chega aqui antes de qualquer deploy.
 *
 * Degrada em vez de lancar porque o valor e de APRESENTACAO: um chip cinza com o
 * nome da area legivel e um chip certo com a cor errada. Hoje o caso nao
 * degrada, PIORA: `SubAreaDetalhe` faz `cn(..., area.tagClass)` sem resolver
 * nenhum, e valor desconhecido renderiza um chip sem estilo, em silencio.
 *
 * E o MESMO neutro de `areaGridPalette.ts`, para os dois resolvers degradarem
 * igual (14,49:1 no claro, 11,08:1 no escuro).
 */
const NEUTRO: TagPalette = {
  bg: "bg-slate-200",
  text: "text-slate-900",
};

export function tagPaletteOf(tagClass: string | null | undefined): TagPalette {
  const family = tagClass ? TAG_FAMILY[tagClass] : undefined;
  return family ? FAMILY_CLASSES[family] : NEUTRO;
}

/** Atalho para o call site, que sempre quer as duas classes juntas. */
export function tagChipClasses(tagClass: string | null | undefined): string {
  const p = tagPaletteOf(tagClass);
  return `${p.bg} ${p.text}`;
}
