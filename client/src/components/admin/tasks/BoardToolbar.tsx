import { forwardRef, memo } from "react";
import { Filter, Search, Settings2, X } from "lucide-react";

import { BntSelect } from "@/components/shared/BntSelect";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

import {
  LABEL_COLOR_FALLBACK,
  PRIORITY_OPTIONS,
  TYPE_OPTIONS,
  labelClass,
  safeHexColor,
} from "./taskBoardStyles";
import {
  activeFilterCount,
  type DueFilter,
  type GroupBy,
  type OrigemFilter,
  type TaskFilters,
} from "./taskFilters";
import { LAYER_ON_PAGE } from "./taskLayers";
import type { ViewMode } from "./taskViewState";
import type { TaskAssignee, TaskBoard, TaskLabel, TaskPriority, TaskType } from "./types";

// Barra superior do board: quadro, busca, filtros, agrupamento, visao e o toggle
// de arquivadas. Todo controle daqui escreve na URL (ver taskViewState), entao
// qualquer combinacao vira link compartilhavel.

type BoardToolbarProps = {
  boards: TaskBoard[];
  activeBoardId: string | null;
  admins: TaskAssignee[];
  labels: TaskLabel[];
  filters: TaskFilters;
  groupBy: GroupBy;
  view: ViewMode;
  includeArchived: boolean;
  /**
   * `null` = AINDA NAO SE SABE (troca de quadro em curso).
   *
   * Nao e o mesmo que zero, e a diferenca importa: durante a troca a barra fica
   * montada, e tanto o numero do quadro ANTIGO quanto um `0` inventado seriam
   * lidos como contagem verdadeira do quadro novo. Sem saber, a linha vira
   * esqueleto em vez de afirmar um numero.
   */
  visibleCount: number | null;
  totalCount: number | null;
  onSelectBoard: (boardId: string) => void;
  onFiltersChange: (filters: TaskFilters) => void;
  onGroupByChange: (groupBy: GroupBy) => void;
  onViewChange: (view: ViewMode) => void;
  onIncludeArchivedChange: (value: boolean) => void;
  onClearFilters: () => void;
  onManageBoards: () => void;
};

/**
 * Sentinela para o "sem filtro" do select de Vencimento.
 *
 * `DueFilter` usa "" para "qualquer data", e "" e proibido como value de item do
 * Radix Select: ele LANCA de dentro do render. Hoje o BntSelect protege a arvore
 * descartando a opcao invalida (opcoesRenderizaveis), mas descartar resolve o
 * crash e nao o produto: sem esta sentinela a opcao "Qualquer data" simplesmente
 * nao aparece no menu, e quem escolhe "Atrasadas" nao consegue voltar atras pelo
 * proprio select. O warn no console a cada abertura do popover era o aviso.
 *
 * A sentinela mora SO na interface: `filters.due` continua sendo "" | "late" |
 * "week", que e o que vai para a URL e para applyFilters. Traduzir aqui, na
 * borda, e o que impede o valor inventado de vazar para o estado da pagina.
 * Mesmo padrao do "__none__" de VagasDestaque.
 */
/**
 * Origem, na interface, e binaria: automático x manual. O `source` do banco tem
 * tres valores (human, sentry, migrated_bug) e pode ganhar outros, mas quem olha
 * o quadro quer saber se digitou aquilo, nao de qual robo veio.
 */
export const ORIGEM_OPTIONS: Array<{
  value: Exclude<OrigemFilter, "">;
  label: string;
}> = [
  { value: "sentry", label: "Automático" },
  { value: "manual", label: "Manual" },
];

export const DUE_ANY = "__any__";

export const DUE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: DUE_ANY, label: "Qualquer data" },
  { value: "late", label: "Atrasadas" },
  { value: "week", label: "Esta semana" },
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

const chip =
  "rounded-full border-2 border-slate-900 px-2 py-0.5 text-[11px] font-black transition-colors";

/**
 * `ref` chega no input de busca porque o atalho `/` precisa foca-lo de fora, do
 * TasksDashboard, que e quem escuta o teclado da aba inteira.
 */
export const BoardToolbar = memo(
  forwardRef<HTMLInputElement, BoardToolbarProps>(function BoardToolbarBase(
    {
      boards,
      activeBoardId,
      admins,
      labels,
      filters,
      groupBy,
      view,
      includeArchived,
      visibleCount,
      totalCount,
      onSelectBoard,
      onFiltersChange,
      onGroupByChange,
      onViewChange,
      onIncludeArchivedChange,
      onClearFilters,
      onManageBoards,
    },
    searchRef,
  ) {
    if (boards.length === 0) return null;
    const activeCount = activeFilterCount(filters);

    return (
      // MESMO ESPELHO DO CABECALHO da secao (Admin.tsx, commit 14): `80rem`
      // espelha o teto do `.container` (index.css:174, max-width: 1280px). Se um
      // mudar, o outro acompanha. Sao o mesmo numero em dois lugares porque o
      // Tailwind nao le o CSS custom, e este comentario e o que amarra os dois.
      //
      // Cabecalho e toolbar ficam na REGUA DA PAGINA; so o quadro fica solto. No
      // modo largo a linha esparramava na tela inteira ancorada a esquerda,
      // enquanto o titulo logo acima ja estava centrado, e as duas reguas
      // brigavam na mesma tela.
      //
      // Incondicional, como no cabecalho: fora do modo escapado a secao ja esta
      // dentro do contêiner, entao um teto igual ao dele nao aperta nada. Menos
      // uma ramificacao para manter em sincronia.
      <div
        data-testid="tasks-toolbar"
        className="w-full space-y-2.5 lg:mx-auto lg:max-w-[80rem]"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[13rem]">
            <label htmlFor="tasks-board-select" className={labelClass}>
              Quadro
            </label>
            <div className="flex gap-1.5">
              <BntSelect
                id="tasks-board-select"
                size="sm"
                accent="gold"
                fullWidth
                value={activeBoardId ?? ""}
                onValueChange={onSelectBoard}
                options={boards.map((board) => ({
                  value: board.id,
                  label: `${board.key} · ${board.name}`,
                }))}
              />
              <button
                type="button"
                onClick={onManageBoards}
                aria-label="Gerenciar quadros"
                title="Criar, renomear, arquivar ou excluir quadros"
                className="inline-flex h-9 shrink-0 items-center rounded-xl border-2 border-slate-900 bg-white px-2.5 text-slate-900 shadow-[2px_2px_0_#0f172a]"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* TETO na busca, a UNICA diferenca em relacao a disposicao historica.
              `max-w-2xl` (42rem) desde 30/08: um degrau abaixo do 3xl que a
              rodada anterior trouxe, pedido da Ana depois de ver o conjunto
              centrado. O `flex-1` continua, entao ela cresce ate esse ponto e
              para, em vez de esticar com a fileira inteira no monitor largo. */}
          <div
            data-testid="tasks-toolbar-busca"
            className="min-w-[13rem] max-w-2xl flex-1"
          >
            <label htmlFor="tasks-search" className={labelClass}>
              Busca
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                id="tasks-search"
                ref={searchRef}
                value={filters.query}
                placeholder="Título ou descrição.  /  para focar"
                aria-label="Buscar tarefas"
                onChange={(event) =>
                  onFiltersChange({ ...filters, query: event.target.value })
                }
                className="h-9 w-full rounded-xl border-2 border-slate-900 bg-white pl-8 pr-8 text-sm font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              />
              {filters.query ? (
                <button
                  type="button"
                  aria-label="Limpar busca"
                  onClick={() => onFiltersChange({ ...filters, query: "" })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="min-w-[9.5rem]">
            <label htmlFor="tasks-group" className={labelClass}>
              Agrupar por
            </label>
            <BntSelect
              id="tasks-group"
              size="sm"
              accent="gold"
              value={groupBy}
              onValueChange={(value) => onGroupByChange(value as GroupBy)}
              options={[
                { value: "column", label: "Etapa" },
                { value: "assignee", label: "Responsável" },
                { value: "priority", label: "Prioridade" },
              ]}
            />
          </div>

          <Popover>
            <PopoverTrigger
              aria-label="Filtros"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-white px-3 text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a]"
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros
              {activeCount > 0 ? (
                <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FFB800] px-1 text-[10px] font-black text-slate-950">
                  {activeCount}
                </span>
              ) : null}
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className={`${LAYER_ON_PAGE} w-72 space-y-3 rounded-xl border-2 border-slate-900 bg-white p-3 shadow-[4px_4px_0_#0f172a]`}
            >
              <div>
                <p className={labelClass}>Responsável</p>
                <div className="flex flex-wrap gap-1">
                  {admins.map((admin) => {
                    const on = filters.assigneeIds.includes(admin.user_id);
                    return (
                      <button
                        key={admin.user_id}
                        type="button"
                        onClick={() =>
                          onFiltersChange({
                            ...filters,
                            assigneeIds: toggle(filters.assigneeIds, admin.user_id),
                          })
                        }
                        className={`${chip} ${on ? "bg-slate-950 text-white" : "bg-white text-slate-700"}`}
                      >
                        {admin.name ?? admin.email ?? admin.user_id}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className={labelClass}>Etiquetas</p>
                <div className="flex flex-wrap gap-1">
                  {labels.map((label) => {
                    const on = filters.labelIds.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() =>
                          onFiltersChange({
                            ...filters,
                            labelIds: toggle(filters.labelIds, label.id),
                          })
                        }
                        className={`${chip} ${on ? "ring-2 ring-slate-900 ring-offset-1" : ""}`}
                        style={{
                          backgroundColor: safeHexColor(
                            label.color,
                            LABEL_COLOR_FALLBACK,
                          ),
                        }}
                      >
                        {label.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className={labelClass}>Prioridade</p>
                <div className="flex flex-wrap gap-1">
                  {PRIORITY_OPTIONS.map((option) => {
                    const on = filters.priorities.includes(option.value as TaskPriority);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          onFiltersChange({
                            ...filters,
                            priorities: toggle(
                              filters.priorities,
                              option.value as TaskPriority,
                            ),
                          })
                        }
                        className={`${chip} ${on ? "bg-slate-950 text-white" : "bg-white text-slate-700"}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className={labelClass}>Tipo</p>
                <div className="flex flex-wrap gap-1">
                  {TYPE_OPTIONS.map((option) => {
                    const on = filters.types.includes(option.value as TaskType);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          onFiltersChange({
                            ...filters,
                            types: toggle(filters.types, option.value as TaskType),
                          })
                        }
                        className={`${chip} ${on ? "bg-slate-950 text-white" : "bg-white text-slate-700"}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className={labelClass}>Origem</p>
                <div className="flex flex-wrap gap-1">
                  {ORIGEM_OPTIONS.map((option) => {
                    const on = filters.origem === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          onFiltersChange({
                            ...filters,
                            // Clicar no que ja esta ativo LIMPA. Sem isso o
                            // filtro binario vira uma armadilha: nao ha terceiro
                            // botao para voltar a "tudo".
                            origem: on ? "" : option.value,
                          })
                        }
                        className={`${chip} ${on ? "bg-slate-950 text-white" : "bg-white text-slate-700"}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="tasks-due" className={labelClass}>
                  Vencimento
                </label>
                <BntSelect
                  id="tasks-due"
                  size="sm"
                  accent="gold"
                  fullWidth
                  value={filters.due === "" ? DUE_ANY : filters.due}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      due: value === DUE_ANY ? "" : (value as DueFilter),
                    })
                  }
                  options={DUE_OPTIONS}
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-black text-slate-700">
                <input
                  type="checkbox"
                  checked={filters.mine}
                  onChange={(event) =>
                    onFiltersChange({ ...filters, mine: event.target.checked })
                  }
                  className="h-4 w-4 rounded border-2 border-slate-900 accent-[#FFB800]"
                />
                Criadas por mim
              </label>

              <label className="flex items-center gap-2 text-xs font-black text-slate-700">
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(event) => onIncludeArchivedChange(event.target.checked)}
                  className="h-4 w-4 rounded border-2 border-slate-900 accent-[#FFB800]"
                />
                Mostrar arquivadas
              </label>

              {activeCount > 0 ? (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="w-full rounded-full border-2 border-slate-900 bg-white px-2 py-1 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a]"
                >
                  Limpar filtros
                </button>
              ) : null}
            </PopoverContent>
          </Popover>

          <div className="flex gap-1 rounded-full border-2 border-slate-900 bg-white p-0.5 shadow-[2px_2px_0_#0f172a]">
            {(["board", "lista"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onViewChange(option)}
                className={`rounded-full px-3 py-1 text-[11px] font-black uppercase transition-colors ${
                  view === option
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {option === "board" ? "Board" : "Lista"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
          {totalCount === null ? (
            // Contagem desconhecida durante a troca de quadro: forma no lugar do
            // numero, sem texto novo para traduzir ou revisar.
            <Skeleton className="h-3 w-24 bg-slate-200" />
          ) : (
            <span>
              {activeCount > 0
                ? `${visibleCount} de ${totalCount} tarefa${totalCount === 1 ? "" : "s"}`
                : `${totalCount} tarefa${totalCount === 1 ? "" : "s"}`}
            </span>
          )}
          {includeArchived ? (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-700">
              incluindo arquivadas
            </span>
          ) : null}
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 text-[11px] text-violet-700 hover:text-violet-900"
            >
              <X className="h-3 w-3" />
              limpar
            </button>
          ) : null}
        </div>
      </div>
    );
  }),
);
