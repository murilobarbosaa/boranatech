import type { ProjetoCatalogo } from "@shared/projects/catalog";

// Estado de um projeto para a pessoa que esta olhando.
//
// Os cinco valores da spec ja estao no tipo, mas `entregue` e `verificado`
// ainda NAO sao produzidos por deriveProjectState: eles dependem da entrega
// com link e da verificacao automatica, que sao o lote 04. Deixar o tipo
// completo desde agora evita que a UI seja escrita assumindo quatro estados e
// precise ser reaberta; deixar de produzi-los evita inventar um estado que
// nada sustenta.
export type ProjectState =
  | "nao_iniciado"
  | "em_andamento"
  | "concluido"
  | "entregue"
  | "verificado";

export type ProjectStateInput = {
  done: boolean;
  etapas: Record<string, string>;
  validado: boolean;
};

// Ordem deliberada: validado ganha de concluido, e concluido ganha de etapa
// marcada. Quem terminou e teve o repositorio aprovado nao pode aparecer como
// "em andamento" so porque deixou uma etapa desmarcada.
export function deriveProjectState({
  done,
  etapas,
  validado,
}: ProjectStateInput): ProjectState {
  if (validado) return "verificado";
  if (done) return "concluido";
  if (Object.keys(etapas).length > 0) return "em_andamento";
  return "nao_iniciado";
}

// Valores do filtro de estado da pagina. `pro` nao e um estado do projeto, e
// um recorte de catalogo; mora aqui porque e a mesma caixa de selecao.
export type ProjectStateFilter =
  | "todos"
  | "em_andamento"
  | "concluidos"
  | "pro";

export type FiltroEstadoCtx = {
  done: (id: string) => boolean;
  etapas: (id: string) => Record<string, string>;
  validado: (id: string) => boolean;
};

// Funcao pura para ser testavel sem montar a pagina.
export function filtrarPorEstado<T extends Pick<ProjetoCatalogo, "id" | "pro">>(
  items: T[],
  filtro: ProjectStateFilter,
  ctx: FiltroEstadoCtx,
): T[] {
  if (filtro === "todos") return items;
  if (filtro === "pro") return items.filter((p) => p.pro === true);
  return items.filter((p) => {
    const estado = deriveProjectState({
      done: ctx.done(p.id),
      etapas: ctx.etapas(p.id),
      validado: ctx.validado(p.id),
    });
    // "Concluidos" inclui o verificado: quem teve o projeto aprovado tambem o
    // concluiu, e some-lo do filtro seria esconder o caso melhor.
    if (filtro === "concluidos")
      return estado === "concluido" || estado === "verificado";
    return estado === "em_andamento";
  });
}
