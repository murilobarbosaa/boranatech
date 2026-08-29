// Dialeto visual da aba Tarefas. As constantes abaixo sao COPIA das do
// o antigo BugsDashboard.tsx (removido na Fase 5), de proposito e nao por preguica: o modulo
// tem que parecer nativo do admin, e o jeito de garantir isso e usar exatamente
// as mesmas strings, nao aproximacoes.
//
// Admin e light-only. Nenhuma variante dark aqui, igual ao resto do painel.

export const inputClass =
  "w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
export const labelClass =
  "mb-1 block text-xs font-black uppercase tracking-wide text-slate-600";
export const primaryButtonClass =
  "rounded-full border-2 border-slate-900 bg-[var(--brand-yellow)] px-4 py-2 text-sm font-black text-slate-950 shadow-[2px_2px_0_var(--bnt-shadow)] transition-all hover:shadow-[3px_3px_0_var(--bnt-shadow)] disabled:opacity-50 disabled:shadow-none";
export const secondaryButtonClass =
  "rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)] transition-all hover:shadow-[3px_3px_0_var(--bnt-shadow)] disabled:opacity-50 disabled:shadow-none";
export const rowActionClass =
  "rounded-full border-2 border-slate-900 bg-white px-2.5 py-1 text-xs font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)] transition-all hover:shadow-[3px_3px_0_var(--bnt-shadow)] disabled:opacity-50";
export const badgeClass =
  "inline-flex items-center rounded-full border-2 border-slate-900 px-2 py-0.5 text-[11px] font-black uppercase";
export const emptyBlockClass =
  "rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-center text-xs font-black text-slate-400";

/**
 * Moldura da coluna do board: largura, borda, cantos, sombra e eixo do flex.
 *
 * O esqueleto de carregamento e a coluna real usam esta MESMA string de
 * proposito, para nunca divergirem: quando os dados chegam, a coluna de verdade
 * ocupa o mesmo espaco e a tela nao salta.
 *
 * Mora aqui, e nao em BoardColumn.tsx, porque o Admin.tsx importa o esqueleto
 * de forma estatica para o fallback do Suspense: puxar a constante do
 * BoardColumn levaria o TaskCard e o dnd-kit inteiros para o chunk do Admin,
 * desfazendo o lazy do modulo de tarefas.
 *
 * FUNDO fica de fora porque na coluna real ele e ESTADO (alvo de drop, acima do
 * WIP); o repouso e `bg-slate-50`, e e esse que o esqueleto usa.
 */
export const columnShellClass =
  "flex w-[85vw] shrink-0 snap-start flex-col rounded-3xl border-2 border-slate-900 p-3 shadow-[3px_3px_0_var(--bnt-shadow)] transition-colors sm:w-[19rem]";

// ---------------------------------------------------------------------------
// Resolvers de valor vindo do servidor
// ---------------------------------------------------------------------------
// TODO acesso direto a estes mapas. Prioridade e tipo sao CHECK no banco, e o
// bundle carregado no navegador pode ser mais antigo que o backend no ar (Vercel
// e Railway sobem separados). `PRIORITY_META[task.priority].label` com um valor
// novo derruba a aba inteira; os resolvers abaixo degradam para um rotulo neutro.
// Mesmo padrao de notificationTypeMetaOf em client/src/lib/notificationTypeMeta.ts.

import type { TaskPriority, TaskType } from "./types";

export type BadgeMeta = { label: string; badge: string };

const PRIORITY_META: Record<TaskPriority, BadgeMeta> = {
  baixa: { label: "Baixa", badge: "bg-slate-100 text-slate-700" },
  media: { label: "Média", badge: "bg-amber-100 text-amber-800" },
  alta: { label: "Alta", badge: "bg-orange-200 text-orange-900" },
  urgente: { label: "Urgente", badge: "bg-rose-600 text-white" },
};

const TYPE_META: Record<TaskType, BadgeMeta> = {
  feature: { label: "Feature", badge: "bg-violet-100 text-violet-800" },
  bug: { label: "Bug", badge: "bg-rose-100 text-rose-800" },
  melhoria: { label: "Melhoria", badge: "bg-sky-100 text-sky-800" },
  debito_tecnico: { label: "Débito técnico", badge: "bg-amber-100 text-amber-900" },
  tarefa: { label: "Tarefa", badge: "bg-slate-100 text-slate-700" },
};

/**
 * Tipos que saíram do conjunto aceito mas continuam RENDERIZAVEIS.
 *
 * VAZIO no momento: `bug` era o unico morador e voltou ao conjunto aceito
 * (migration 20260731040000), entao subiu para TYPE_META. O mapa e o elo do meio
 * de typeMetaOf continuam de pe de proposito, e nao por inercia: eles sao o
 * mecanismo que separa "valor que NUNCA existiu" (cai no neutro) de "valor que
 * existiu e saiu do menu" (mantem o rotulo). Um card antigo ou uma linha de
 * histórico dizendo "mudou o tipo para X" nao pode virar "Outro" so porque o
 * menu mudou. Aposentar um tipo no futuro e mover a entrada para ca, e o
 * caminho ja esta pronto e testado.
 */
const TYPE_META_HISTORICO: Record<string, BadgeMeta> = {};

const NEUTRAL_META: BadgeMeta = {
  label: "Outro",
  badge: "bg-slate-100 text-slate-600",
};

export function priorityMetaOf(value: string): BadgeMeta {
  return PRIORITY_META[value as TaskPriority] ?? NEUTRAL_META;
}

export function typeMetaOf(value: string): BadgeMeta {
  return (
    TYPE_META[value as TaskType] ?? TYPE_META_HISTORICO[value] ?? NEUTRAL_META
  );
}

/** Opcoes para os selects, derivadas dos mapas (fonte unica). */
export const PRIORITY_OPTIONS = (
  Object.keys(PRIORITY_META) as TaskPriority[]
).map((value) => ({ value, label: PRIORITY_META[value].label }));

export const TYPE_OPTIONS = (Object.keys(TYPE_META) as TaskType[]).map(
  (value) => ({ value, label: TYPE_META[value].label }),
);

/**
 * Cor de coluna e de etiqueta vem do banco como hex livre. Valor fora do formato
 * NAO pode virar `style={{ background: lixo }}`, entao o fallback e explicito.
 */
export function safeHexColor(value: string | null | undefined, fallback: string) {
  return value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
}

export const COLUMN_COLOR_FALLBACK = "#94A3B8";
export const LABEL_COLOR_FALLBACK = "#C4B5FD";

/** Paleta oferecida no menu de cor da etapa. Hexes do design system. */
export const COLUMN_COLOR_CHOICES = [
  { value: "#94A3B8", label: "Cinza" },
  { value: "#38BDF8", label: "Azul" },
  { value: "#FFB800", label: "Amarelo" },
  { value: "#C4B5FD", label: "Violeta" },
  { value: "#34D399", label: "Verde" },
  { value: "#F43F5E", label: "Vermelho" },
];
