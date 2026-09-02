/**
 * Paleta da GRADE de /areas (client/src/pages/Areas.tsx), e so dela.
 *
 * Nao e o `colorSystem.ts` (aquele e accent semantico por ROTA, e a rota /areas
 * inteira ja e "discovery"), nem o `pageAccentUi.ts` (accent de pagina, 10
 * familias). Este mapa existe porque a grade precisa de uma cor POR CARD, e sao
 * 44 cards: nenhum dos dois sistemas existentes tem granularidade para isso, e
 * forcar qualquer um deles colapsaria 44 cards em 9 ou 10 cores.
 *
 * O que ele substitui: `AREA_ACCENT` + `getAreaAccent`, que devolviam um hex
 * cravado, aplicado em `style` inline. Hex inline nao passa por variavel de
 * tema, entao 43 dos 44 cards ficavam abaixo de 4,5:1 no modo escuro (e 8 ja
 * falhavam no claro). Medicao em docs/dark-mode-item-c-proposta.md.
 *
 * POR QUE CLASSE E NAO HEX: o par `bg-<familia>-200` com `text-<familia>-900`
 * atravessa os dois temas sozinho, sem nenhuma variante `dark:`. Quem faz isso
 * e o "contexto pastel" do index.css: no `.dark` ele casa o elemento pela
 * classe de fundo, sobe o fundo um degrau (o -200 sai como -300) e devolve a
 * tinta do texto ao tom original. Medido: 6,81:1 a 8,02:1 no claro e 5,01:1 a
 * 6,69:1 no escuro, nas 17 familias.
 *
 * AS STRINGS SAO LITERAIS DE PROPOSITO. O Tailwind varre a fonte procurando
 * nome de classe; `bg-${familia}-200` montado em runtime nao e emitido no CSS e
 * o card sairia sem fundo nenhum, sem erro em lugar nenhum.
 *
 * A borda e -700, e o tom foi escolhido por medicao, nao por gosto: -300 daria
 * 1,00:1 contra o proprio fundo no modo escuro (borda literalmente invisivel,
 * porque o contexto pastel faz o -200 sair justamente como -300). -700 e o
 * primeiro tom que passa 3:1 nos dois temas (3,85:1 claro, 3,07:1 escuro).
 */

export type AreaGridPalette = {
  /** Fundo do badge de habilidade e do quadrado do icone. */
  bg: string;
  /** Texto do badge e cor do icone. */
  text: string;
  /** Borda do quadrado do icone. */
  border: string;
};

type AreaGridFamily =
  | "violet"
  | "sky"
  | "emerald"
  | "orange"
  | "blue"
  | "rose"
  | "lime"
  | "fuchsia"
  | "teal"
  | "red"
  | "indigo"
  | "amber"
  | "green"
  | "purple"
  | "cyan"
  | "yellow"
  | "pink";

const FAMILY_CLASSES: Record<AreaGridFamily, AreaGridPalette> = {
  violet: {
    bg: "bg-violet-200",
    text: "text-violet-900",
    border: "border-violet-700",
  },
  sky: { bg: "bg-sky-200", text: "text-sky-900", border: "border-sky-700" },
  emerald: {
    bg: "bg-emerald-200",
    text: "text-emerald-900",
    border: "border-emerald-700",
  },
  orange: {
    bg: "bg-orange-200",
    text: "text-orange-900",
    border: "border-orange-700",
  },
  blue: { bg: "bg-blue-200", text: "text-blue-900", border: "border-blue-700" },
  rose: { bg: "bg-rose-200", text: "text-rose-900", border: "border-rose-700" },
  lime: { bg: "bg-lime-200", text: "text-lime-900", border: "border-lime-700" },
  fuchsia: {
    bg: "bg-fuchsia-200",
    text: "text-fuchsia-900",
    border: "border-fuchsia-700",
  },
  teal: { bg: "bg-teal-200", text: "text-teal-900", border: "border-teal-700" },
  red: { bg: "bg-red-200", text: "text-red-900", border: "border-red-700" },
  indigo: {
    bg: "bg-indigo-200",
    text: "text-indigo-900",
    border: "border-indigo-700",
  },
  amber: {
    bg: "bg-amber-200",
    text: "text-amber-900",
    border: "border-amber-700",
  },
  green: {
    bg: "bg-green-200",
    text: "text-green-900",
    border: "border-green-700",
  },
  purple: {
    bg: "bg-purple-200",
    text: "text-purple-900",
    border: "border-purple-700",
  },
  cyan: { bg: "bg-cyan-200", text: "text-cyan-900", border: "border-cyan-700" },
  yellow: {
    bg: "bg-yellow-200",
    text: "text-yellow-900",
    border: "border-yellow-700",
  },
  pink: { bg: "bg-pink-200", text: "text-pink-900", border: "border-pink-700" },
};

/**
 * Familia por NOME do card, nao por posicao. A chave e o mesmo `nome` que o
 * `getAreaAccent` antigo usava, entao a migracao nao muda o que identifica um
 * card.
 *
 * Por nome e nao por indice porque as 26 areas principais vem do Supabase
 * ordenadas por `sort_order` (server/routes/content.ts): com atribuicao por
 * posicao, reordenar areas no admin trocaria a cor dos cards em producao, sem
 * ninguem tocar em codigo.
 *
 * A ATRIBUICAO E CICLICA pelas 17 familias, na ordem de renderizacao original
 * (26 principais, 4 complementares, 14 pouco conhecidas). Isso garante por
 * construcao as duas propriedades pedidas: 10 familias com 3 cards e 7 com 2
 * (nenhuma com 1, nenhuma com 4 ou mais), e nenhum par de cards vizinhos com a
 * mesma familia. A ordem so decidiu a atribuicao uma vez, na geracao; daqui
 * para a frente o mapa e a fonte, e reordenar nao muda cor nenhuma.
 *
 * A ciclagem nao sabe semantica: "Cloud Computing" saiu vermelho e
 * "Ciberseguranca" saiu teal. Trocar e passada editorial neste mapa, desde que
 * o teto de 3 cards por familia seja respeitado.
 */
const AREA_GRID_FAMILY: Record<string, AreaGridFamily> = {
  // areasTI (catalogo principal, 26)
  "Front-end": "violet",
  "Back-end": "sky",
  "Full-stack": "emerald",
  "Desenvolvimento de Software": "orange",
  "Ciência de Dados": "blue",
  "UX/UI Design": "rose",
  "Inteligência Artificial": "lime",
  "Produto Digital": "fuchsia",
  Cibersegurança: "teal",
  "Cloud Computing": "red",
  "Gestão de Projetos Tech": "indigo",
  "QA / Testes de Software": "amber",
  "Desenvolvimento Mobile": "green",
  DevOps: "purple",
  DevSecOps: "cyan",
  "Game Dev": "yellow",
  "Análise de Dados / BI": "pink",
  "Engenharia de Dados": "violet",
  "Banco de Dados / DBA": "sky",
  "SRE (Site Reliability Engineering)": "emerald",
  "Suporte e Infraestrutura / Redes": "orange",
  "Análise de Sistemas": "blue",
  "Blockchain / Web3": "rose",
  "IoT / Sistemas Embarcados": "lime",
  Mainframe: "fuchsia",
  "Automação Industrial": "teal",

  // areasComplementares (4)
  "Suporte e Helpdesk": "red",
  "Arquitetura de Software e Tech Lead": "indigo",
  "Agilidade e Scrum Master": "amber",
  "Automação e RPA": "green",

  // areasPoucoConhecidas (14)
  "DevRel / Developer Advocate": "purple",
  "Technical Writer": "cyan",
  "Especialista em Acessibilidade (a11y)": "yellow",
  "Visão Computacional": "pink",
  "Processamento de Linguagem Natural (PLN)": "violet",
  MLOps: "sky",
  "Engenharia de Plataforma": "emerald",
  FinOps: "orange",
  "Perícia Digital / Forense": "blue",
  "Sistemas Embarcados / Robótica": "rose",
  "Localização / i18n": "lime",
  Bioinformática: "fuchsia",
  "Computação no Agronegócio": "teal",
  "Computação Quântica": "red",
};

/**
 * Neutro para area que ainda nao esta no mapa. As 26 principais vem do banco, e
 * uma area nova cadastrada no admin chega aqui antes de qualquer deploy, entao
 * este caso e rotina e nao excecao.
 *
 * Degrada em vez de lancar porque o valor e de APRESENTACAO: um card cinza com
 * o texto legivel e um card certo com a cor errada; um throw no render do
 * cliente derrubaria a grade inteira por causa de uma cor.
 */
const NEUTRO: AreaGridPalette = {
  bg: "bg-slate-200",
  text: "text-slate-900",
  border: "border-slate-700",
};

export function areaGridPaletteOf(nome: string): AreaGridPalette {
  const family = AREA_GRID_FAMILY[nome];
  return family ? FAMILY_CLASSES[family] : NEUTRO;
}
