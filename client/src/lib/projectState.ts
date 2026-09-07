import type { ProjetoCatalogo } from "@shared/projects/catalog";
import type { ProjetoTipoEntrega } from "@shared/projects/v2/types";

// Estado de um projeto para a pessoa que esta olhando.
//
// Desde o lote 04 os cinco valores sao produzidos: `entregue` e `verificado`
// vem da entrega (project_submissions), `concluido` da autodeclaracao
// (user_progress) e `verificado` tambem pode vir da validacao por IA
// (project_validations), que e o `validado` do input.
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
  /** Status da entrega, quando existe. */
  entrega?: "entregue" | "verificado" | null;
};

// Ordem deliberada: validado ganha de concluido, e concluido ganha de etapa
// marcada. Quem terminou e teve o repositorio aprovado nao pode aparecer como
// "em andamento" so porque deixou uma etapa desmarcada.
export function deriveProjectState({
  done,
  etapas,
  validado,
  entrega,
}: ProjectStateInput): ProjectState {
  if (validado || entrega === "verificado") return "verificado";
  if (entrega === "entregue") return "entregue";
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
  entrega?: (id: string) => "entregue" | "verificado" | null;
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
      entrega: ctx.entrega?.(p.id) ?? null,
    });
    // "Concluidos" inclui entregue e verificado: quem entregou tambem
    // terminou, e some-los do filtro seria esconder os casos melhores.
    if (filtro === "concluidos")
      return (
        estado === "concluido" ||
        estado === "entregue" ||
        estado === "verificado"
      );
    return estado === "em_andamento";
  });
}

// Rotulo humano do tipo de entrega, para a linha de fatos do cabecalho.
// So "Site no ar + repositorio" veio do mockup aprovado; os outros cinco sao
// texto novo.
// TODO(Ana): rotulos de tipo de entrega, menos repo_deploy
const TIPO_ENTREGA_LABELS: Record<ProjetoTipoEntrega, string> = {
  repo_deploy: "Site no ar + repositório",
  repo: "Repositório",
  figma: "Arquivo no Figma",
  notebook: "Notebook",
  documento: "Documento",
  dashboard: "Dashboard",
};

/**
 * Resolver de INFORMACAO, nao de apresentacao: o tipo de entrega decide o que
 * a pessoa precisa produzir. Um fallback neutro aqui devolveria um rotulo
 * plausivel e errado, entao lanca nomeando o valor (mesma regra do
 * TIER_WEIGHTS no CLAUDE.md). O `Record` fechado ja faz o tsc reprovar um
 * tipo novo sem rotulo; isto cobre o valor que chega em runtime.
 */
export function labelTipoEntrega(tipo: ProjetoTipoEntrega): string {
  const label = TIPO_ENTREGA_LABELS[tipo];
  if (!label) throw new Error(`tipo de entrega sem rotulo: ${tipo}`);
  return label;
}
