// Tipos do dominio da aba Tarefas. Espelham 1:1 as linhas devolvidas por
// server/routes/adminTasks.ts, em snake_case de proposito: o service NAO
// converte para camelCase, entao o que chega da rede e o que a UI le, sem uma
// camada de traducao no meio que possa divergir em silencio.
//
// As unioes de literal (TaskPriority, TaskType, TaskActivityAction) espelham os
// CHECK da migration 20260727160000_create_admin_tasks.sql. Elas descrevem o que
// o server manda HOJE, e nao ha garantia de que o bundle carregado no navegador
// seja o mesmo que o backend no ar (deploy nao e atomico: Vercel e Railway sobem
// separados). Por isso todo mapa indexado por um destes valores tem que passar
// por resolver com fallback neutro, nunca acesso direto: um valor novo derruba a
// pagina inteira em `MAPA[valor].label`. Ver notificationTypeMetaOf em
// client/src/lib/notificationTypeMeta.ts, e a secao de convencoes no CLAUDE.md.

export type TaskPriority = "baixa" | "media" | "alta" | "urgente";

/**
 * 'bug' VOLTOU ao conjunto aceito (migration 20260731040000). Tinha saido
 * porque bug tinha tela propria; a aba Bugs & Erros esta sendo aposentada e os
 * bugs passam a viver no quadro BUG deste modulo.
 */
export type TaskType =
  | "feature"
  | "bug"
  | "melhoria"
  | "debito_tecnico"
  | "tarefa";

/**
 * Quem criou o card. 'sentry' = feed automatico, 'migrated_bug' = veio da
 * migracao do admin_bugs. Espelha o CHECK de admin_tasks.source.
 *
 * Como toda uniao vinda do servidor, passa por resolver com fallback neutro
 * (sourceMetaOf): o bundle no navegador pode ser mais antigo que o backend.
 */
export type TaskSource = "human" | "sentry" | "migrated_bug";

/** Quem arquivou. null quando o card nao esta arquivado. */
export type TaskArchivedSource = "human" | "sentry_sync";

export type TaskActivityAction =
  | "created"
  | "moved"
  | "renamed"
  | "assigned"
  | "unassigned"
  | "priority_changed"
  | "type_changed"
  | "due_date_changed"
  | "label_added"
  | "label_removed"
  | "archived"
  | "unarchived"
  | "completed"
  | "reopened";

export type TaskBoard = {
  id: string;
  name: string;
  /** Prefixo do ID curto do card (o DEV de DEV-42). Imutavel apos a criacao. */
  key: string;
  slug: string;
  description: string | null;
  color: string;
  position: number;
  next_number: number;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskColumn = {
  id: string;
  board_id: string;
  name: string;
  color: string;
  position: number;
  /** Aviso visual de work in progress. Null = sem limite. Nao bloqueia mover. */
  wip_limit: number | null;
  is_start: boolean;
  is_done: boolean;
  /**
   * Etapa FIXADA: alimentada pelo feed automatico. Nao e excluida, nao entra na
   * reordenacao, nao aceita card manual e nao mostra limite de WIP.
   */
  is_pinned: boolean;
  /** Qual feed cai nesta etapa. 'sentry' hoje; null em etapa comum. */
  intake_source: string | null;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  board_id: string;
  column_id: string;
  /** Sequencial por board, atribuido pelo banco. Com board.key forma DEV-42. */
  number: number;
  title: string;
  /** Markdown puro. */
  description: string | null;
  /** Markdown puro, separado da descricao. */
  notes: string | null;
  position: number;
  priority: TaskPriority;
  type: TaskType;
  assignee_id: string | null;
  created_by: string;
  updated_by: string | null;
  /** AAAA-MM-DD. Coluna `date`, sem fuso: vencimento e um dia, nao um instante. */
  due_date: string | null;
  estimate: number | null;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  source: TaskSource;
  /** ID curto legivel da issue (NODE-EXPRESS-1). Null em card manual. */
  sentry_issue_id: string | null;
  sentry_issue_url: string | null;
  /** Instante do evento que trouxe o card de volta (reabertura ou ressurreicao). */
  sentry_reopen_event_at: string | null;
  /**
   * Quem arquivou. 'human' = SILENCIADO (nao volta nem se o erro acontecer de
   * novo); 'sentry_sync' = podado pelo job (volta na proxima recorrencia). Sao
   * estados diferentes com futuros diferentes, e a tela precisa distinguir.
   */
  archived_source: TaskArchivedSource | null;
};

/** Task como vem no snapshot do board: com o que o card precisa desenhar. */
export type TaskCard = Task & {
  /**
   * Derivado no servidor a partir de sentry_data, que NAO vem no snapshot.
   * Medido: o bloco tem ~918 bytes por card e levaria o array de 17 KB para
   * 38 KB com 22 cards. O card so precisa do booleano; o bloco inteiro vem no
   * detalhe.
   */
  sentry_detalhe_incompleto: boolean;
  label_ids: string[];
  checklist_total: number;
  checklist_done: number;
  comment_count: number;
};

export type TaskLabel = {
  id: string;
  board_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export type TaskComment = {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type TaskChecklistItem = {
  id: string;
  task_id: string;
  content: string;
  is_done: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

export type TaskActivity = {
  id: string;
  task_id: string;
  actor_id: string | null;
  action: TaskActivityAction;
  /** Formato varia por action ({ from, to }, ids de coluna, etc). */
  payload: Record<string, unknown>;
  created_at: string;
};

/** Admin elegivel como responsavel, com o minimo para desenhar o avatar. */
export type TaskAssignee = {
  user_id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

/** Payload unico do carregamento do board. */
export type TaskBoardSnapshot = {
  board: TaskBoard;
  columns: TaskColumn[];
  tasks: TaskCard[];
  labels: TaskLabel[];
  admins: TaskAssignee[];
};

/** Bloco do Sentry, como o servidor persiste em admin_tasks.sentry_data. */
export type SentryDataBloco = {
  coleta: { em: string; completo: boolean; motivo: string | null };
  issue: {
    shortId: string;
    titulo: string;
    culprit: string;
    level: string;
    status: string;
    projeto: string;
    eventos: number;
    usuarios: number;
    primeiroEvento: string;
    ultimoEvento: string;
    permalink: string;
  };
  detalhe: {
    environment: string | null;
    release: string | null;
    url: string | null;
    stack: string | null;
  } | null;
};

export type TaskDetail = {
  task: Task & { sentry_data: SentryDataBloco | null };
  label_ids: string[];
  comments: TaskComment[];
  checklist: TaskChecklistItem[];
  /** Primeira pagina do histórico, do mais novo para o mais velho. */
  activity: TaskActivity[];
  /**
   * Ha mais histórico alem do que veio. O server manda isto explicitamente em
   * vez de deixar a tela supor pelo tamanho da lista: uma pagina cheia e
   * indistinguivel de "acabou exatamente aqui".
   */
  activity_has_more: boolean;
};

/**
 * Onde soltar um card. O cliente aponta os VIZINHOS por id; quem calcula o
 * numero da posicao e o server (server/lib/adminTaskPosition.ts).
 *
 * Os nomes sao relativos a ORDEM VISUAL DEPOIS do movimento, nunca ao estado
 * anterior (ver o mesmo texto em resolveTaskPosition, server/routes/adminTasks.ts):
 *
 *   before_task_id = card que fica ACIMA do movido. null = topo da coluna.
 *   after_task_id  = card que fica ABAIXO do movido. null = fim da coluna.
 *
 * Os dois nulos = coluna vazia, ou "solte no fim".
 */
export type TaskPlacement = {
  before_task_id?: string | null;
  after_task_id?: string | null;
};

/** Monta o ID curto exibido no card e no deep link. */
export function taskShortId(board: Pick<TaskBoard, "key">, task: Pick<Task, "number">) {
  return `${board.key}-${task.number}`;
}
