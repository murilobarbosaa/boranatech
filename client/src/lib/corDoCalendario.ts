import {
  CORES_DO_CALENDARIO,
  type CorDoCalendario,
} from "@shared/creatorProfile";

// MARCADOR DE COR DO CREATOR NO CALENDARIO (lote 10c; tom cheio desde o 10d):
// o par de classes do pontinho que representa cada creator na grade e no
// painel do dia.
//
// MAPA LITERAL, nunca montado em runtime (`bg-${cor}-500` nao existe para o
// Tailwind): o JIT so gera a classe que encontra escrita por extenso no
// codigo, e uma classe montada por template chegaria ao navegador sem CSS
// nenhum, com o marcador invisivel. Mesmo motivo do `FAMILY_CLASSES` do
// tagPalette.
//
// TOM CHEIO (`-500`), e nao o pastel `-200` do lote 10c: num circulo de 10 px
// com borda, o pastel lia como circulo vazio, e um marcador ciano passava por
// "roxo padrao". O `-500` tem L medido entre 0,55 e 0,75 (violet 0,606,
// emerald 0,696, cyan 0,715) e a folha de estilo NAO o redefine sob `.dark`
// (os `-500` sao iguais nos dois blocos), entao ele vale nos dois temas sem
// `dark:` nenhum. A borda de tinta (`border-2 border-slate-900`) vira clara no
// escuro pela paleta gerada e segura o contorno.
export const MARCADOR_DA_COR: Record<CorDoCalendario, string> = {
  violet: "bg-violet-500 border-2 border-slate-900",
  blue: "bg-blue-500 border-2 border-slate-900",
  cyan: "bg-cyan-500 border-2 border-slate-900",
  emerald: "bg-emerald-500 border-2 border-slate-900",
  orange: "bg-orange-500 border-2 border-slate-900",
  rose: "bg-rose-500 border-2 border-slate-900",
  fuchsia: "bg-fuchsia-500 border-2 border-slate-900",
};

/**
 * Classes do marcador para uma cor vinda do servidor. Resolver com fallback
 * neutro, como manda a regra de lookup por valor do servidor: cor que este
 * bundle nao conhece (ou ausente, no backend anterior) desenha o violeta, que
 * e o padrao do banco, em vez de derrubar o calendario.
 */
export function classeDoMarcador(cor: string | null | undefined): string {
  const conhecida = (CORES_DO_CALENDARIO as readonly string[]).includes(
    cor ?? "",
  );
  return MARCADOR_DA_COR[conhecida ? (cor as CorDoCalendario) : "violet"];
}
