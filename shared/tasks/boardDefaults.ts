// Etapas e etiquetas com que um quadro novo nasce.
//
// FONTE UNICA. Este arquivo e a definicao viva, usada pelo
// POST /api/admin/crm/boards para semear todo quadro criado pela interface.
//
// O bloco de seed da migration 20260727160000_create_admin_tasks.sql tem os
// MESMOS valores, e nao da para ele importar daqui (e SQL). Duas copias divergem
// no primeiro ajuste, e a divergencia seria invisivel: o quadro DEV nasceria de
// um jeito num banco restaurado do zero e os quadros criados pela UI de outro.
//
// A contramedida nao e disciplina, e teste: `boardDefaults.test.ts` le o SQL da
// migration, extrai as tuplas e compara com o que esta aqui, afirmando TAMBEM os
// totais (5 etapas, 6 etiquetas). Se o parser encolher e ler zero linhas, a
// assercao de total derruba o teste em vez de passar em silencio.
//
// Ao mudar qualquer coisa aqui: o SQL da migration NAO deve ser editado (ela ja
// rodou em producao e migration aplicada nao se reescreve). O teste vai ficar
// vermelho, e ai a decisao e deliberada: ou uma migration nova alinha o seed
// historico, ou o teste passa a comparar contra a lista congelada. Ficar vermelho
// e o ponto.

export type DefaultColumn = {
  name: string;
  color: string;
  is_start: boolean;
  is_done: boolean;
};

export type DefaultLabel = {
  name: string;
  color: string;
};

/**
 * Ordem importa: a posicao de cada etapa e derivada do indice
 * ((i + 1) * 1000), igual ao passo do adminTaskPosition.
 */
export const DEFAULT_BOARD_COLUMNS: DefaultColumn[] = [
  { name: "Backlog", color: "#94A3B8", is_start: true, is_done: false },
  { name: "A Fazer", color: "#38BDF8", is_start: false, is_done: false },
  { name: "Em Progresso", color: "#FFB800", is_start: false, is_done: false },
  { name: "Em Revisao", color: "#C4B5FD", is_start: false, is_done: false },
  { name: "Concluido", color: "#34D399", is_start: false, is_done: true },
];

export const DEFAULT_BOARD_LABELS: DefaultLabel[] = [
  { name: "Frontend", color: "#38BDF8" },
  { name: "Backend", color: "#34D399" },
  { name: "Banco", color: "#F59E0B" },
  { name: "UI/UX", color: "#C4B5FD" },
  { name: "Urgente", color: "#F43F5E" },
  { name: "Infra", color: "#64748B" },
];

/** Passo entre posicoes, o mesmo do server/lib/adminTaskPosition.ts. */
export const DEFAULT_COLUMN_STEP = 1000;
