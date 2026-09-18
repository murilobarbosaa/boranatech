import {
  CORES_DO_CALENDARIO,
  type CorDoCalendario,
} from "@shared/creatorProfile";

// MARCADOR DE COR DO CREATOR NO CALENDARIO (lote 10c): o par de classes do
// pontinho que representa cada creator na grade e no painel do dia.
//
// MAPA LITERAL, nunca montado em runtime (`bg-${cor}-200` nao existe para o
// Tailwind): o JIT so gera a classe que encontra escrita por extenso no
// codigo, e uma classe montada por template chegaria ao navegador sem CSS
// nenhum, com o marcador invisivel. Mesmo motivo do `FAMILY_CLASSES` do
// tagPalette, de onde vem o `bg-<familia>-200`.
//
// A BORDA DE TINTA (`border-2 border-slate-900`) e o que segura o contraste
// nos dois temas: no claro, um pastel -200 com borda quase preta; no escuro,
// a folha de estilo redefine os tokens sob `.dark`, o `-200` desce para um tom
// escuro da mesma familia e o `slate-900` sobe para claro, entao o pontinho
// continua legivel contra a pagina escura. Amber e yellow sao a excecao
// deliberada do index.css (contexto amarelo): ficam claros no escuro com a
// borda escura, tambem legiveis. Nenhum `dark:` aqui, pelo motivo de sempre:
// aplicaria a inversao duas vezes.
export const MARCADOR_DA_COR: Record<CorDoCalendario, string> = {
  violet: "bg-violet-200 border-2 border-slate-900",
  green: "bg-green-200 border-2 border-slate-900",
  amber: "bg-amber-200 border-2 border-slate-900",
  pink: "bg-pink-200 border-2 border-slate-900",
  orange: "bg-orange-200 border-2 border-slate-900",
  emerald: "bg-emerald-200 border-2 border-slate-900",
  sky: "bg-sky-200 border-2 border-slate-900",
  purple: "bg-purple-200 border-2 border-slate-900",
  fuchsia: "bg-fuchsia-200 border-2 border-slate-900",
  indigo: "bg-indigo-200 border-2 border-slate-900",
  lime: "bg-lime-200 border-2 border-slate-900",
  cyan: "bg-cyan-200 border-2 border-slate-900",
  blue: "bg-blue-200 border-2 border-slate-900",
  rose: "bg-rose-200 border-2 border-slate-900",
  yellow: "bg-yellow-200 border-2 border-slate-900",
};

/**
 * Classes do marcador para uma cor vinda do servidor. Resolver com fallback
 * neutro, como manda a regra de lookup por valor do servidor: cor que este
 * bundle nao conhece (ou ausente, no backend anterior ao lote 10c) desenha o
 * violeta, que e o padrao do banco, em vez de derrubar o calendario.
 */
export function classeDoMarcador(cor: string | null | undefined): string {
  const conhecida = (CORES_DO_CALENDARIO as readonly string[]).includes(
    cor ?? "",
  );
  return MARCADOR_DA_COR[conhecida ? (cor as CorDoCalendario) : "violet"];
}
